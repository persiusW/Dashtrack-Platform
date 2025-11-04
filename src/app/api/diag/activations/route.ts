import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
  const supa = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supa.auth.getSession();

  return NextResponse.json({
    ok: true,
    has_session: !!session,
    user_id: session?.user?.id ?? null,
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
  });
}

export async function POST() {
  const supa = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supa.auth.getSession();
  if (!session) {
    return NextResponse.json({ ok: false, stage: "session", error: "No active session" }, { status: 401 });
  }

  const name = `diag-activation-${Date.now()}`;
  const { data: ins, error: insErr } = await supa
    .from("activations")
    .insert({ name, status: "live" })
    .select("id, name")
    .single();

  if (insErr) {
    return NextResponse.json({
      ok: false,
      stage: "insert",
      error: insErr.message,
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    }, { status: 400 });
  }

  const { error: delErr } = await supa.from("activations").delete().eq("id", ins.id);
  if (delErr) {
    return NextResponse.json({
      ok: false,
      stage: "delete",
      error: delErr.message,
      inserted: ins,
    }, { status: 400 });
  }

  return NextResponse.json({ ok: true, roundtrip: ins });
}
