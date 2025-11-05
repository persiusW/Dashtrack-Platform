import { NextRequest, NextResponse } from "next/server";
import { getRouteUserAndOrg } from "@/lib/org";
import { customAlphabet } from "nanoid";

const nano = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);
const nanoToken = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 21);

export async function POST(req: NextRequest) {
  const { user, orgId, supa } = await getRouteUserAndOrg();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!orgId) return NextResponse.json({ ok: false, error: "No organization" }, { status: 400 });

  const body = await req.json().catch(() => ({} as any));
  const name = String(body?.name || "").trim();
  const redirect_url = String(body?.redirect_url || "").trim();
  const zones = Array.isArray(body?.zones) ? body.zones : [];
  // zones: [{ name: string, agents: string[] }]

  if (!name) return NextResponse.json({ ok: false, error: "Activation name required" }, { status: 400 });
  if (!redirect_url) return NextResponse.json({ ok: false, error: "Default redirect URL required" }, { status: 400 });
  if (!zones.length) return NextResponse.json({ ok: false, error: "At least one zone required" }, { status: 400 });

  // 1) Create activation
  const { data: act, error: actErr } = await supa
    .from("activations")
    .insert({ name, organization_id: orgId, default_landing_url: redirect_url, status: "live" })
    .select("id")
    .single();
  if (actErr || !act) return NextResponse.json({ ok: false, error: `activation: ${actErr?.message || "Failed"}` }, { status: 400 });

  // 2) Default district
  const { data: district, error: dErr } = await supa
    .from("districts")
    .insert({ organization_id: orgId, activation_id: act.id, name: "Ungrouped" })
    .select("id")
    .single();
  if (dErr || !district) return NextResponse.json({ ok: false, error: `district: ${dErr?.message || "Failed"}` }, { status: 400 });

  // 3) Create zones + agents + zone assignments + links
  for (const z of zones) {
    const zName = String(z?.name || "").trim();
    if (!zName) continue;

    // 3a) Zone
    const { data: zone, error: zErr } = await supa
      .from("zones")
      .insert({ organization_id: orgId, activation_id: act.id, district_id: district.id, name: zName })
      .select("id, name")
      .single();
    if (zErr || !zone) return NextResponse.json({ ok: false, error: `zone: ${zErr?.message || "Failed"}` }, { status: 400 });

    // 3b) Agents (org-scoped), generate tokens
    const agentNames = Array.isArray(z?.agents) ? z.agents : [];
    const cleanAgentNames = agentNames.map((n: any) => String(n || "").trim()).filter(Boolean);

    if (cleanAgentNames.length) {
      const agentsPayload = cleanAgentNames.map((agentName: string) => ({
        organization_id: orgId,
        name: agentName,
        active: true,
        public_stats_token: nanoToken()
      }));

      const { data: agents, error: aErr } = await supa
        .from("agents")
        .insert(agentsPayload)
        .select("id");
      if (aErr) return NextResponse.json({ ok: false, error: `agents: ${aErr.message}` }, { status: 400 });

      // 3c) Assign agents to zone (zone_agents)
      const zoneAgentsPayload = (agents || []).map((a: any) => ({
        organization_id: orgId,
        zone_id: zone.id,
        agent_id: a.id
      }));
      if (zoneAgentsPayload.length) {
        const { error: zaErr } = await supa.from("zone_agents").insert(zoneAgentsPayload);
        if (zaErr) return NextResponse.json({ ok: false, error: `zone_agents: ${zaErr.message}` }, { status: 400 });
      }

      // 3d) Tracked links per agent
      const linksPayload = (agents || []).map((a: any) => ({
        organization_id: orgId,
        activation_id: act.id,
        zone_id: zone.id,
        agent_id: a.id,
        slug: nano(),
        destination_strategy: "single",
        single_url: redirect_url,
        fallback_url: redirect_url,
        is_active: true,
        notes: `${zone.name} — agent link`
      }));
      if (linksPayload.length) {
        const { error: lErr } = await supa.from("tracked_links").insert(linksPayload);
        if (lErr) return NextResponse.json({ ok: false, error: `links: ${lErr.message}` }, { status: 400 });
      }
    }
  }

  return NextResponse.json({ ok: true, activation_id: act.id });
}
