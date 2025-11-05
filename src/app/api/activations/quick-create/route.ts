
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { customAlphabet } from "nanoid";

const nano = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const name: string = String(body?.name || "").trim();
  const zonesCount: number = Math.max(1, Math.min(5, Number(body?.zones ?? 1)));
  const agentsPerZone: number = Math.max(1, Math.min(50, Number(body?.agentsPerZone ?? 1)));
  const redirect_url: string = String(body?.redirect_url || "").trim();

  if (!name) return NextResponse.json({ ok: false, error: "Activation name required" }, { status: 400 });
  if (!redirect_url) return NextResponse.json({ ok: false, error: "Default redirect URL required" }, { status: 400 });

  // Resolve organization_id (profile first, then owned org fallback + auto-link)
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();
  if (profErr) {
    return NextResponse.json({ ok: false, error: `profiles load: ${profErr.message}` }, { status: 400 });
  }

  let organization_id: string | null = (profile as any)?.organization_id ?? null;

  if (!organization_id) {
    const { data: ownedOrg, error: ownErr } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (ownErr) {
      return NextResponse.json({ ok: false, error: `org fallback: ${ownErr.message}` }, { status: 400 });
    }
    if (ownedOrg?.id) {
      organization_id = ownedOrg.id;
      // best-effort link (do not fail overall flow if this update fails)
      await supabase.from("profiles").update({ organization_id }).eq("id", user.id);
    }
  }

  if (!organization_id) {
    return NextResponse.json({ ok: false, error: "No organization. Create one in Settings first." }, { status: 400 });
  }

  // Create activation
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
  if (actErr) return NextResponse.json({ ok:false, error:`activation insert: ${actErr.message}` }, { status:400 });

  // 5) create default district
  const { data: district, error: dErr } = await supabase
    .from("districts")
    .insert({ organization_id, activation_id: act.id, name: "Ungrouped" })
    .select("id")
    .single();
  if (dErr) return NextResponse.json({ ok:false, error:`district insert: ${dErr.message}` }, { status:400 });

  // 6) zones (attach to default district)
  const zonesPayload = Array.from({ length: zonesCount }).map((_, i) => ({
    organization_id, activation_id: act.id, name: `Zone ${i+1}`, district_id: district.id
  }));
  const { data: zones, error: zErr } = await supabase
    .from("zones").insert(zonesPayload).select("id, name, district_id");
  if (zErr) return NextResponse.json({ ok:false, error:`zones insert: ${zErr.message}` }, { status:400 });

  // 7) agents + links (same as your current code; keep zone_id usage if you have it,
  // OR if you use zone_agents join table, keep that logic accordingly)
  for (const z of zones || []) {
    // Create org-scoped agents; we use zone_agents for assignment
    const agentsPayload = Array.from({ length: agentsPerZone }).map((_, j) => ({
      organization_id, name: `Agent ${j+1}`, active: true, public_stats_token: nano()
    }));
    const { data: agents, error: aErr } = await supabase
      .from("agents").insert(agentsPayload).select("id");
    if (aErr) return NextResponse.json({ ok:false, error:`agents insert: ${aErr.message}` }, { status:400 });

    // Assign agents to zone via join table
    const zoneAgentsPayload = (agents || []).map(a => ({
      organization_id, zone_id: z.id, agent_id: a.id
    }));
    const { error: zaErr } = await supabase.from("zone_agents").insert(zoneAgentsPayload);
    if (zaErr) return NextResponse.json({ ok:false, error:`zone_agents insert: ${zaErr.message}` }, { status:400 });

    // Create tracked links for each agent
    const linksPayload = (agents || []).map(a => ({
      organization_id, activation_id: act.id, zone_id: z.id, agent_id: a.id,
      slug: nano(), destination_strategy: "single", single_url: redirect_url, fallback_url: redirect_url, is_active: true,
      notes: `${z.name} — agent link`
    }));
    const { error: lErr } = await supabase.from("tracked_links").insert(linksPayload);
    if (lErr) return NextResponse.json({ ok:false, error:`links insert: ${lErr.message}` }, { status:400 });
  }

  return NextResponse.json({ ok:true, activation_id: act.id });
}
