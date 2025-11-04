import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { customAlphabet } from "nanoid";

const nanoSlug = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);
const nanoToken = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 21);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: `Method ${req.method} Not Allowed` });
  }

  const supabase = createPagesServerClient({ req, res });

  try {
    // Parse body safely
    let body: any = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const name = String(body?.name || "").trim();
    const zonesCount = Math.max(1, Math.min(5, Number(body?.zones ?? 1)));
    const agentsPerZone = Math.max(1, Math.min(50, Number(body?.agentsPerZone ?? 1)));
    const redirect_url = String(body?.redirect_url || "").trim();

    if (!name) return res.status(400).json({ ok: false, error: "Activation name required" });
    if (!redirect_url) return res.status(400).json({ ok: false, error: "Default redirect URL required" });

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    // Resolve organization_id from users table; fallback to JWT app_metadata if present
    let organization_id: string | null = null;

    const { data: userRow } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (userRow?.organization_id) {
      organization_id = userRow.organization_id;
    } else if ((user as any)?.app_metadata?.organization_id) {
      organization_id = (user as any).app_metadata.organization_id as string;
    }

    if (!organization_id) {
      return res.status(400).json({ ok: false, error: "No organization" });
    }

    // 1) Create activation
    const { data: act, error: actErr } = await supabase
      .from("activations")
      .insert({
        name,
        organization_id,
        default_landing_url: redirect_url,
        status: "live",
      })
      .select("id")
      .single();

    if (actErr || !act) {
      return res
        .status(500)
        .json({ ok: false, error: actErr?.message || "Failed to create activation" });
    }

    // 2) Create zones
    const zonesPayload = Array.from({ length: zonesCount }).map((_, i) => ({
      organization_id,
      activation_id: act.id,
      name: `Zone ${i + 1}`,
    }));

    const { data: zones, error: zErr } = await supabase
      .from("zones")
      .insert(zonesPayload)
      .select("id, name");

    if (zErr || !zones) {
      return res
        .status(500)
        .json({ ok: false, error: zErr?.message || "Failed to create zones" });
    }

    // 3) For each zone: create agents, assign to zone, create tracked links
    for (const z of zones) {
      // 3a) Create agents
      const agentsPayload = Array.from({ length: agentsPerZone }).map((_, j) => ({
        organization_id,
        name: `Agent ${j + 1}`,
        public_stats_token: nanoToken(),
        active: true,
      }));

      const { data: agents, error: aErr } = await supabase
        .from("agents")
        .insert(agentsPayload)
        .select("id");

      if (aErr || !agents) {
        return res
          .status(500)
          .json({ ok: false, error: aErr?.message || "Failed to create agents" });
      }

      // 3b) Assign agents to the zone
      const zoneAgentsPayload = agents.map((a) => ({
        organization_id,
        zone_id: z.id,
        agent_id: a.id,
      }));

      const { error: zaErr } = await supabase.from("zone_agents").insert(zoneAgentsPayload);
      if (zaErr) {
        return res
          .status(500)
          .json({ ok: false, error: zaErr.message || "Failed to assign agents to zone" });
      }

      // 3c) Create tracked links per agent with unique slugs
      const linksPayload = agents.map((a) => ({
        organization_id,
        activation_id: act.id,
        zone_id: z.id,
        agent_id: a.id,
        slug: nanoSlug(),
        destination_strategy: "single",
        single_url: redirect_url,
        fallback_url: redirect_url,
        is_active: true,
        notes: `${z.name} — agent link`,
      }));

      const { error: lErr } = await supabase.from("tracked_links").insert(linksPayload);
      if (lErr) {
        // If a unique slug collision happens, retry once with fresh slugs
        if ((lErr as any)?.code === "23505") {
          const retryPayload = agents.map((a) => ({
            organization_id,
            activation_id: act.id,
            zone_id: z.id,
            agent_id: a.id,
            slug: nanoSlug(),
            destination_strategy: "single",
            single_url: redirect_url,
            fallback_url: redirect_url,
            is_active: true,
            notes: `${z.name} — agent link`,
          }));
          const { error: retryErr } = await supabase.from("tracked_links").insert(retryPayload);
          if (retryErr) {
            return res
              .status(500)
              .json({ ok: false, error: retryErr.message || "Failed to create tracked links" });
          }
        } else {
          return res
            .status(500)
            .json({ ok: false, error: lErr.message || "Failed to create tracked links" });
        }
      }
    }

    return res.status(200).json({ ok: true, activation_id: act.id });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Internal server error" });
  }
}
