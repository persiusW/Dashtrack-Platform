
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status:401 });

  const body = await req.json();
  const name = (body?.name || "").trim();
  if (!name) return NextResponse.json({ ok:false, error:"name required" }, { status:400 });

  const { error } = await supabase.from("districts").update({ name }).eq("id", params.id);
  if (error) return NextResponse.json({ ok:false, error: error.message }, { status:400 });

  return NextResponse.json({ ok:true });
}
  