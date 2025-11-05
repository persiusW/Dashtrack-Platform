import { NextResponse } from "next/server";
import { getRouteUserAndOrg } from "@/lib/org";

export async function GET() {
  const { user, orgId, supa } = await getRouteUserAndOrg();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!orgId) {
    return NextResponse.json({ ok: true, items: [] });
  }

  const { data, error } = await supa
    .from("activations")
    .select("id, name, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, items: data || [] });
}
