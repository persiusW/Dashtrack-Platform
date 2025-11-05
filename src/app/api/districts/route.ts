
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status:401 });

  const body = await req.json();
  const name = (body?.name || "").trim();
  const activation_id = (body?.activation_id || "").trim();
  if (!name || !activation_id)
    return NextResponse.json({ ok:false, error:"name and activation_id required" }, { status:400 });

  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).maybeSingle();
  const organization_id = profile?.organization_id;
  if (!organization_id) return NextResponse.json({ ok:false, error:"No organization" }, { status:400 });

  const { data: d, error } = await supabase
    .from("districts")
    .insert({ name, activation_id, organization_id })
    .select("id, name")
    .single();
  if (error) return NextResponse.json({ ok:false, error: error.message }, { status:400 });

  return NextResponse.json({ ok:true, district: d });
}
  