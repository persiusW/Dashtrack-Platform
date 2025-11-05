import { NextRequest, NextResponse } from "next/server";
import { getRouteUserAndOrg } from "@/lib/org";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, orgId, supa } = await getRouteUserAndOrg();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!orgId) return NextResponse.json({ ok: false, error: "No organization" }, { status: 400 });

  const { data: link } = await supa
    .from("tracked_links")
    .select("id, organization_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!link || link.organization_id !== orgId) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const patch: Record<string, string> = {};

  if (typeof body.description === "string") patch.description = body.description.trim();
  if (typeof body.redirect_url === "string") patch.redirect_url = body.redirect_url.trim();

  const { error } = await supa.from("tracked_links").update(patch).eq("id", params.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { user, orgId, supa } = await getRouteUserAndOrg();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!orgId) return NextResponse.json({ ok: false, error: "No organization" }, { status: 400 });

  const { data: link } = await supa
    .from("tracked_links")
    .select("id, organization_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!link || link.organization_id !== orgId) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supa.from("tracked_links").delete().eq("id", params.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
