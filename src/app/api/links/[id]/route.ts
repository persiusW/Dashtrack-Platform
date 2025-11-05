import { NextRequest, NextResponse } from "next/server";
import { getRouteUserAndOrg } from "@/lib/org";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { user, orgId, supa } = await getRouteUserAndOrg();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!orgId) return NextResponse.json({ ok: false, error: "No organization" }, { status: 400 });

  const { data: link } = await supa
    .from("tracked_links")
    .select("id, organization_id")
    .eq("id", id)
    .maybeSingle();

  if (!link || (link as any).organization_id !== orgId) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({} as any));
  const patch: Record<string, unknown> = {};

  if (typeof body.description === "string") patch.description = body.description.trim();
  if (typeof body.redirect_url === "string") {
    patch.destination_strategy = "single";
    patch.single_url = body.redirect_url.trim();
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, error: "No changes" }, { status: 400 });
  }

  const { error } = await supa.from("tracked_links").update(patch).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { user, orgId, supa } = await getRouteUserAndOrg();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!orgId) return NextResponse.json({ ok: false, error: "No organization" }, { status: 400 });

  const { data: link } = await supa
    .from("tracked_links")
    .select("id, organization_id")
    .eq("id", id)
    .maybeSingle();

  if (!link || link.organization_id !== orgId) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supa.from("tracked_links").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
