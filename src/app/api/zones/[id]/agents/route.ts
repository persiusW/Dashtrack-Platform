import { NextRequest, NextResponse } from "next/server";
import { getRouteUserAndOrg, zoneInOrg } from "@/lib/org";
import { customAlphabet } from "nanoid";

const nano = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { user, orgId, supa } = await getRouteUserAndOrg();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!orgId) return NextResponse.json({ ok: false, error: "No organization" }, { status: 400 });

  const { id: zoneId } = await context.params;
  const allowed = await zoneInOrg(supa as any, zoneId, orgId);
  if (!allowed) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({} as any));
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ ok: false, error: "Agent name required" }, { status: 400 });

  const { data: zone } = await (supa as any)
    .from("zones")
    .select("activation_id, organization_id, id")
    .eq("id", zoneId)
    .maybeSingle();

  if (!zone) return NextResponse.json({ ok: false, error: "Zone not found" }, { status: 404 });

  const { data: act } = await (supa as any)
    .from("activations")
    .select("default_landing_url, default_redirect_url")
    .eq("id", zone.activation_id)
    .maybeSingle();

  const { data: agent, error: aErr } = await (supa as any)
    .from("agents")
    .insert({ organization_id: orgId, activation_id: zone.activation_id, zone_id: zoneId, name })
    .select("id, name, created_at")
    .single();

  if (aErr) return NextResponse.json({ ok: false, error: aErr.message }, { status: 400 });

  const redirect = (act?.default_landing_url || act?.default_redirect_url || "").trim();

  const { data: link, error: lErr } = await (supa as any)
    .from("tracked_links")
    .insert({
      organization_id: orgId,
      activation_id: zone.activation_id,
      zone_id: zoneId,
      agent_id: agent.id,
      slug: nano(),
      redirect_url: redirect,
      description: `${name} — agent link`,
      is_default: false
    })
    .select("id, slug, description, redirect_url")
    .single();

  if (lErr) return NextResponse.json({ ok: false, error: lErr.message }, { status: 400 });

  return NextResponse.json({ ok: true, agent, link });
}
