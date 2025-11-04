
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function PATCH(req: NextRequest) {
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
    return NextResponse.json(
      { ok: false, error: "Organization name required" },
      { status: 400 }
    );
  }

  // Resolve organization_id from users mapping (canonical in this codebase)
  const { data: userRow, error: userErr } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (userErr) {
    return NextResponse.json({ ok: false, error: userErr.message }, { status: 400 });
  }

  const orgId = userRow?.organization_id || null;
  if (!orgId) {
    return NextResponse.json(
      { ok: false, error: "No organization linked to this user" },
      { status: 400 }
    );
  }

  const { error: upErr } = await supabase
    .from("organizations")
    .update({ name })
    .eq("id", orgId);

  if (upErr) {
    return NextResponse.json({ ok: false, error: upErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
  