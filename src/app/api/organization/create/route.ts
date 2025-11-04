import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = (body?.name || "").trim();
  if (!name) return NextResponse.json({ ok:false, error:"Organization name required" }, { status: 400 });

  // 1) Create org; DB default/trigger sets owner_user_id = auth.uid()
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .insert({ name, plan: "free" })
    .select("id, name")
    .single();

  if (orgErr) {
    return NextResponse.json({ ok:false, error: orgErr.message }, { status: 400 });
  }

  // 2) Link profile to org
  const { error: profErr } = await supabase
    .from("profiles")
    .update({ organization_id: org.id })
    .eq("id", user.id);

  if (profErr) {
    return NextResponse.json({ ok:false, error: profErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok:true, organization: org });
}
