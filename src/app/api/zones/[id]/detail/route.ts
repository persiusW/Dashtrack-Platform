import { NextRequest, NextResponse } from "next/server";
import { getRouteUserAndOrg, zoneInOrg } from "@/lib/org";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { user, orgId, supa } = await getRouteUserAndOrg();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!orgId) return NextResponse.json({ ok: false, error: "No organization" }, { status: 400 });

  const zoneId = id;
  const allowed = await zoneInOrg(supa as any, zoneId, orgId);
  if (!allowed) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { data: zone } = await (supa as any)
    .from("zones")
    .select("id, name, activation_id, organization_id, district_id")
    .eq("id", zoneId)
    .maybeSingle();

  if (!zone) return NextResponse.json({ ok: false, error: "Zone not found" }, { status: 404 });

  const { data: defaultLinkRaw } = await (supa as any)
    .from("tracked_links")
    .select("id, slug, description, destination_strategy, single_url, fallback_url, is_default")
    .eq("zone_id", zoneId)
    .eq("is_default", true)
    .maybeSingle();

  const normalizedDefault = defaultLinkRaw
    ? {
        id: defaultLinkRaw.id,
        slug: defaultLinkRaw.slug,
        description: defaultLinkRaw.description ?? null,
        redirect_url:
          defaultLinkRaw.destination_strategy === "single"
            ? defaultLinkRaw.single_url || ""
            : defaultLinkRaw.fallback_url || "",
        is_default: true,
      }
    : null;

  const { data: agents } = await (supa as any)
    .from("agents")
    .select("id, name, created_at")
    .eq("zone_id", zoneId)
    .order("created_at", { ascending: false });

  const agentIds = Array.isArray(agents) ? agents.map((a) => a.id) : [];
  const linksByAgent: Record<string, any[]> = {};

  if (agentIds.length) {
    const { data: agentLinks } = await (supa as any)
      .from("tracked_links")
      .select("id, agent_id, slug, description, destination_strategy, single_url, fallback_url, created_at")
      .in("agent_id", agentIds);

    for (const l of agentLinks ?? []) {
      const k = (l as any).agent_id as string;
      (linksByAgent[k] ||= []).push({
        id: (l as any).id,
        agent_id: (l as any).agent_id,
        slug: (l as any).slug,
        description: (l as any).description ?? null,
        redirect_url:
          (l as any).destination_strategy === "single"
            ? (l as any).single_url || ""
            : (l as any).fallback_url || "",
        created_at: (l as any).created_at,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    zone,
    defaultLink: normalizedDefault,
    agents: (agents ?? []).map((a: any) => ({ ...a, links: linksByAgent[a.id] || [] })),
  });
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const zoneId = id;
  const { user, orgId, supa } = await getRouteUserAndOrg();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!orgId) return NextResponse.json({ ok: false, error: "No organization" }, { status: 400 });

  const allowed = await zoneInOrg(supa as any, zoneId, orgId);
  if (!allowed) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({} as any));
  const desc = typeof body?.description === "string" ? body.description.trim() : "Zone default link";

  const { data: zone } = await (supa as any)
    .from("zones")
    .select("activation_id, organization_id, id")
    .eq("id", zoneId)
    .maybeSingle();
  if (!zone) return NextResponse.json({ ok: false, error: "Zone not found" }, { status: 404 });

  const { data: act } = await (supa as any)
    .from("activations")
    .select("default_redirect_url")
    .eq("id", zone.activation_id)
    .maybeSingle();

  const { data: existingRaw } = await (supa as any)
    .from("tracked_links")
    .select("id, slug, description, destination_strategy, single_url, fallback_url, is_default")
    .eq("zone_id", zoneId)
    .eq("is_default", true)
    .maybeSingle();

  if (existingRaw) {
    const link = {
      id: existingRaw.id,
      slug: existingRaw.slug,
      description: existingRaw.description ?? null,
      redirect_url:
        existingRaw.destination_strategy === "single"
          ? existingRaw.single_url || ""
          : existingRaw.fallback_url || "",
      is_default: true,
    };
    return NextResponse.json({ ok: true, link });
  }

  const { customAlphabet } = await import("nanoid");
  const nano = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);

  const insertPayload = {
    organization_id: orgId,
    activation_id: zone.activation_id,
    zone_id: zoneId,
    agent_id: null,
    slug: nano(),
    destination_strategy: "single",
    single_url: act?.default_redirect_url || "",
    description: desc,
    is_default: true,
    is_active: true,
  };

  const { data: created, error } = await (supa as any)
    .from("tracked_links")
    .insert(insertPayload)
    .select("id, slug, description, destination_strategy, single_url, fallback_url, is_default")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  const link = {
    id: created.id,
    slug: created.slug,
    description: created.description ?? null,
    redirect_url: created.destination_strategy === "single" ? created.single_url || "" : created.fallback_url || "",
    is_default: true,
  };

  return NextResponse.json({ ok: true, link });
}
