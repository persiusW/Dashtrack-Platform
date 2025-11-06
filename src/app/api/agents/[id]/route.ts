import { NextRequest, NextResponse } from "next/server";
import { getRouteUserAndOrg, agentInOrg } from "@/lib/org";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { user, orgId, supa } = await getRouteUserAndOrg();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!orgId) return NextResponse.json({ ok: false, error: "No organization" }, { status: 400 });

  const allowed = await agentInOrg(supa, id, orgId);
  if (!allowed) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({} as any));
  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.notes === "string") patch.notes = body.notes.trim();
  if (typeof body.phone === "string") patch.phone = body.phone.trim();
  if (typeof body.email === "string") patch.email = body.email.trim();
  if (typeof body.active === "boolean") patch.active = body.active;
  if (typeof body.zone_id === "string") patch.zone_id = body.zone_id;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, error: "No changes" }, { status: 400 });
  }

  const { error } = await supa.from("agents").update(patch).eq("id", id).eq("organization_id", orgId);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { user, orgId, supa } = await getRouteUserAndOrg();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!orgId) return NextResponse.json({ ok: false, error: "No organization" }, { status: 400 });

  const allowed = await agentInOrg(supa, id, orgId);
  if (!allowed) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { error } = await supa.from("agents").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
