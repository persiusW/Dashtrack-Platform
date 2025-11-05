import { NextRequest, NextResponse } from "next/server";
import { getRouteUserAndOrg, zoneInOrg } from "@/lib/org";

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { user, orgId, supa } = await getRouteUserAndOrg();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!orgId) return NextResponse.json({ ok: false, error: "No organization" }, { status: 400 });

  const { id: zoneId } = await context.params;
  const allowed = await zoneInOrg(supa as any, zoneId, orgId);
  if (!allowed) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { data: zone } = await (supa as any)
    .from("zones")
    .select("id, name, activation_id, organization_id, district_id")
    .eq("id", zoneId)
    .maybeSingle();

  if (!zone) return NextResponse.json({ ok: false, error: "Zone not found" }, { status: 404 });

  const { data: defaultLink } = await (supa as any)
    .from("tracked_links")
    .select("id, slug, description, redirect_url, is_default")
    .eq("zone_id", zoneId)
    .eq("is_default", true)
    .maybeSingle();

  const { data: agents } = await (supa as any)
    .from("agents")
    .select("id, name, created_at")
    .eq("zone_id", zoneId)
    .order("created_at", { ascending: false });

  const agentIds = Array.isArray(agents) ? agents.map(a => a.id) : [];
  const linksByAgent: Record<string, any[]> = {};

  if (agentIds.length) {
    const { data: agentLinks } = await (supa as any)
      .from("tracked_links")
      .select("id, agent_id, slug, description, redirect_url, created_at")
      .in("agent_id", agentIds);

    for (const l of agentLinks ?? []) {
      const k = (l as any).agent_id as string;
      (linksByAgent[k] ||= []).push(l);
    }
  }

  return NextResponse.json({
    ok: true,
    zone,
    defaultLink: defaultLink || null,
    agents: (agents ?? []).map((a: any) => ({ ...a, links: linksByAgent[a.id] || [] }))
  });
}
