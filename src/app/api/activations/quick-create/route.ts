
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { customAlphabet } from "nanoid";

const nanoSlug = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);
const nanoToken = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 21);

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
  if (actErr || !act) {
    return NextResponse.json({ ok: false, error: `activation insert: ${actErr?.message || "no row returned"}` }, { status: 400 });
  }

  // Create zones
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
    return NextResponse.json({ ok: false, error: `zones insert: ${zErr?.message || "no rows returned"}` }, { status: 400 });
  }

  // Create agents + zone assignments + links
  for (const z of zones) {
    // Agents (org-scoped); token used for public stats page
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
      return NextResponse.json({ ok: false, error: `agents insert: ${aErr?.message || "no rows returned"}` }, { status: 400 });
    }

    // Zone assignments
    const zoneAgentsPayload = agents.map((a: any) => ({
      organization_id,
      zone_id: z.id,
      agent_id: a.id,
    }));
    const { error: zaErr } = await supabase.from("zone_agents").insert(zoneAgentsPayload);
    if (zaErr) {
      return NextResponse.json({ ok: false, error: `zone_agents insert: ${zaErr.message}` }, { status: 400 });
    }

    // Tracked links per agent
    const linksPayload = agents.map((a: any) => ({
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
      return NextResponse.json({ ok: false, error: `links insert: ${lErr.message}` }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, activation_id: act.id });
}
  