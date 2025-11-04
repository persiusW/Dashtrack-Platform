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

  // Prefer profiles.organization_id
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr) {
    return NextResponse.json({ ok: false, error: profErr.message }, { status: 400 });
  }

  let orgId: string | null = profile?.organization_id ?? null;

  // Fallback: organizations owned by this user
  if (!orgId) {
    const { data: ownedOrg, error: ownErr } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ownErr) {
      return NextResponse.json({ ok: false, error: ownErr.message }, { status: 400 });
    }
    orgId = ownedOrg?.id ?? null;
  }

  if (!orgId) {
    return NextResponse.json(
      { ok: false, error: "No organization linked or owned by this user" },
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

  return NextResponse.json({ ok: true, name });
}