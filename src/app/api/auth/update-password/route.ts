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
  const current_password: string | undefined = body?.current_password;
  const new_password: string | undefined = body?.new_password;

  if (!current_password || !new_password) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  const email = user.email;
  if (!email) {
    return NextResponse.json({ ok: false, error: "Email not available for this account" }, { status: 400 });
  }

  const { error: verifyErr } = await supabase.auth.signInWithPassword({
    email,
    password: current_password,
  });

  if (verifyErr) {
    return NextResponse.json(
      { ok: false, error: "Current password is incorrect" },
      { status: 400 }
    );
  }

  const { error: upErr } = await supabase.auth.updateUser({ password: new_password });
  if (upErr) {
    return NextResponse.json({ ok: false, error: upErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
