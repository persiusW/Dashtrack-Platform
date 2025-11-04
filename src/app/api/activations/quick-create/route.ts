import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { customAlphabet } from "nanoid";

const nanoSlug = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);
const nanoToken = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 21);

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const name = String(body?.name || "").trim();
  const zonesCount = Math.max(1, Math.min(5, Number(body?.zones ?? 1)));
  const agentsPerZone = Math.max(1, Math.min(50, Number(body?.agentsPerZone ?? 1)));
  const redirect_url = String(body?.redirect_url || "").trim();

  if (!name) return NextResponse.json({ ok: false, error: "Activation name required" }, { status: 400 });
  if (!redirect_url) return NextResponse.json({ ok: false, error: "Default redirect URL required" }, { status: 400 });

  let organization_id: string | null = null;

  // Prefer users table; fallback to JWT app_metadata if available
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
    return NextResponse.json({ ok: false, error: "No organization" }, { status: 400 });
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
    return NextResponse.json(
      { ok: false, error: actErr?.message || "Failed to create activation" },
      { status: 500 }
    );
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
    return NextResponse.json(
      { ok: false, error: zErr?.message || "Failed to create zones" },
      { status: 500 }
    );
  }

  // 3) For each zone, create agents, link them to the zone, and create tracked_links
  for (const z of zones) {
    // Create agents for this zone
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
      return NextResponse.json(
        { ok: false, error: aErr?.message || "Failed to create agents" },
        { status: 500 }
      );
    }

    // Map agents to the zone
    const zoneAgentsPayload = agents.map((a) => ({
      organization_id,
      zone_id: z.id,
      agent_id: a.id,
    }));

    const { error: zaErr } = await supabase.from("zone_agents").insert(zoneAgentsPayload);
    if (zaErr) {
      return NextResponse.json(
        { ok: false, error: zaErr.message || "Failed to assign agents to zone" },
        { status: 500 }
      );
    }

    // Create tracked links for each agent
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
      return NextResponse.json(
        { ok: false, error: lErr.message || "Failed to create tracked links" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true, activation_id: act.id });
}
