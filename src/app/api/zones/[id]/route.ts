import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getRouteUserAndOrg, zoneInOrg } from "@/lib/org";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status:401 });

  const body = await req.json().catch(() => ({} as any));
  const district_id = body?.district_id ?? null;

  const { error } = await supabase.from("zones").update({ district_id }).eq("id", id);
  if (error) return NextResponse.json({ ok:false, error: error.message }, { status:400 });

  return NextResponse.json({ ok:true });
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { user, orgId, supa } = await getRouteUserAndOrg();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!orgId) return NextResponse.json({ ok: false, error: "No organization" }, { status: 400 });
  if (!(await zoneInOrg(supa, id, orgId))) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

  const { error } = await supa.from("zones").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
