import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const name = String(body?.name || "").trim();

  if (!name) {
    return NextResponse.json({ ok: false, error: "Organization name required" }, { status: 400 });
  }

  // Insert organization using the session-scoped client (no service-role)
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .insert({ name, plan: "free" })
    .select("id, name")
    .single();

  if (orgErr || !org) {
    return NextResponse.json(
      { ok: false, error: orgErr?.message || "Failed to create organization" },
      { status: 400 }
    );
  }

  // Ensure a profile row exists/updates for this user (stop mutating public.users)
  const { error: profileErr } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      email: user.email ?? null,
      full_name: (user.user_metadata as any)?.full_name ?? null
    });

  if (profileErr) {
    return NextResponse.json({ ok: false, error: profileErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, organization: org });
}
