
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
    return NextResponse.json(
      { ok: false, error: "Organization name required" },
      { status: 400 }
    );
  }

  // Create organization with owner_user_id set to current user (helps pass common RLS policies)
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .insert({ name, plan: "free", owner_user_id: user.id })
    .select("id, name")
    .single();

  if (orgErr || !org) {
    return NextResponse.json(
      { ok: false, error: orgErr?.message || "Failed to create organization" },
      { status: 400 }
    );
  }

  // Link the user to the organization in the users table (this codebase stores organization_id here)
  const { error: userLinkErr } = await supabase
    .from("users")
    .upsert({ id: user.id, organization_id: org.id, role: "client_manager" });

  if (userLinkErr) {
    return NextResponse.json(
      { ok: false, error: userLinkErr.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, organization: org });
}
  