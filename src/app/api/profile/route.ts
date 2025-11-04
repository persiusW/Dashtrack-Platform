import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  let organization = null as null | { id: string; name: string };
  if (profile?.organization_id) {
    const { data: org } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", profile.organization_id)
      .maybeSingle();
    organization = org ?? null;
  }

  const email = user.email ?? profile?.email ?? null;
  return NextResponse.json({
    ok: true,
    data: { email, full_name: profile?.full_name ?? "", organization }
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const full_name = (body?.full_name || "").trim();
  if (!full_name) return NextResponse.json({ ok: false, error: "Name required" }, { status: 400 });

  const { error } = await supabase.from("profiles").update({ full_name }).eq("id", user.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  await supabase.auth.updateUser({ data: { full_name } });
  return NextResponse.json({ ok: true });
}
