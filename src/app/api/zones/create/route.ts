import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const name: string = String(body?.name || "").trim();
  const district_id: string = String(body?.district_id || "").trim();

  if (!name) return NextResponse.json({ ok: false, error: "Zone name required" }, { status: 400 });
  if (!district_id) return NextResponse.json({ ok: false, error: "district_id required" }, { status: 400 });

  // Resolve district to get organization_id and activation_id
  const { data: district, error: dErr } = await supabase
    .from("districts")
    .select("id, activation_id, organization_id")
    .eq("id", district_id)
    .maybeSingle();

  if (dErr) return NextResponse.json({ ok: false, error: dErr.message }, { status: 400 });
  if (!district?.id) return NextResponse.json({ ok: false, error: "District not found" }, { status: 404 });

  // Insert zone attached to district and activation/org
  const { data: zone, error: zErr } = await supabase
    .from("zones")
    .insert({
      name,
      organization_id: (district as any).organization_id,
      activation_id: (district as any).activation_id,
      district_id: district.id,
    } as any)
    .select("id, name")
    .single();

  if (zErr) return NextResponse.json({ ok: false, error: zErr.message }, { status: 400 });

  return NextResponse.json({ ok: true, zone });
}