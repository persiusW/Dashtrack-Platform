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
  });
}

export async function POST() {
  const supa = createRouteHandlerClient({ cookies });

  const name = `diag-${Date.now()}`;

  const { data: ins, error: insErr } = await supa
    .from("organizations")
    .insert({ name, plan: "free" })
    .select("id, name")
    .single();

  if (insErr) {
    return NextResponse.json({ ok: false, stage: "insert", error: insErr.message }, { status: 400 });
  }

  const { error: delErr } = await supa.from("organizations").delete().eq("id", ins.id);
  if (delErr) {
    return NextResponse.json({ ok: false, stage: "delete", error: delErr.message, inserted: ins }, { status: 400 });
  }

  return NextResponse.json({ ok: true, roundtrip: ins });
}
