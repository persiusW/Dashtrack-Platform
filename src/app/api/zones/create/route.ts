import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status:401 });

  const body = await req.json();
  const name = (body?.name||"").trim();
  const district_id = (body?.district_id||"").trim();
  if (!name || !district_id) return NextResponse.json({ ok:false, error:"name and district_id required" }, { status:400 });

  const { data: d } = await supabase
    .from("districts").select("id, activation_id, organization_id").eq("id", district_id).maybeSingle();
  if (!d) return NextResponse.json({ ok:false, error:"District not found" }, { status:400 });

  const { data: z, error } = await supabase
    .from("zones")
    .insert({ name, district_id: d.id, activation_id: d.activation_id, organization_id: d.organization_id })
    .select("id")
    .single();
  if (error) return NextResponse.json({ ok:false, error: error.message }, { status:400 });

  return NextResponse.json({ ok:true, zone: z });
}
