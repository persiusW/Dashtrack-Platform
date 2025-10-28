
import type { NextApiRequest, NextApiResponse } from "next";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { activationId, fromDate, toDate } = req.query;

    if (!activationId || !fromDate || !toDate) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const { data: metrics, error } = await supabase
      .from("daily_metrics")
      .select(`
        date,
        clicks,
        valid_clicks,
        uniques,
        tracked_links!inner (
          zone_id,
          zones (
            name
          )
        )
      `)
      .eq("tracked_links.activation_id", activationId)
      .gte("date", fromDate)
      .lte("date", toDate)
      .not("tracked_links.zone_id", "is", null)
      .order("date", { ascending: true });

    if (error) throw error;

    const aggregated = new Map<string, { date: string; zone: string; clicks: number; uniques: number; valid_clicks: number }>();

    metrics?.forEach((metric: any) => {
      const zoneName = metric.tracked_links?.zones?.name || "Unknown Zone";
      const key = `${metric.date}_${zoneName}`;
      
      if (aggregated.has(key)) {
        const existing = aggregated.get(key)!;
        existing.clicks += metric.clicks;
        existing.valid_clicks += metric.valid_clicks;
        existing.uniques += metric.uniques;
      } else {
        aggregated.set(key, {
          date: metric.date,
          zone: zoneName,
          clicks: metric.clicks,
          valid_clicks: metric.valid_clicks,
          uniques: metric.uniques
        });
      }
    });

    const csvRows = [
      ["Date", "Zone", "Clicks", "Uniques", "Valid Clicks"],
      ...Array.from(aggregated.values()).map(row => [
        row.date,
        row.zone,
        row.clicks.toString(),
        row.uniques.toString(),
        row.valid_clicks.toString()
      ])
    ];

    const csv = csvRows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="zones-report-${activationId}.csv"`);
    res.status(200).send(csv);
  } catch (error: any) {
    console.error("CSV export error:", error);
    res.status(500).json({ error: error.message || "Failed to generate CSV" });
  }
}
