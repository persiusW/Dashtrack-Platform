import type { NextApiRequest, NextApiResponse } from "next";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { Database } from "@/integrations/supabase/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => req.cookies[name],
          set: () => {},
          remove: () => {},
        },
      }
    );
    
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { activationId, fromDate, toDate } = req.query;

    if (!activationId || typeof activationId !== "string" || !fromDate || !toDate) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const { data: metrics, error } = await supabase
      .from("activation_zone_report")
      .select(`*`)
      .eq("activation_id", activationId)
      .gte("date", fromDate as string)
      .lte("date", toDate as string)
      .order("date", { ascending: true });

    if (error) throw error;
    
    const csvRows = [
      ["Date", "Zone", "Clicks", "Uniques", "Valid Clicks"],
      ...(metrics || []).map(row => [
        row.date || "",
        row.zone_name || "Unknown Zone",
        (row.clicks || 0).toString(),
        (row.unique_links || 0).toString(),
        (row.valid_clicks || 0).toString()
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