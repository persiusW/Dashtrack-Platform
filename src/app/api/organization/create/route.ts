import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));
  const name = (body?.name || "").trim();

  if (!name) {
    return NextResponse.json({ ok: false, error: "Organization name required" }, { status: 400 });
  }

  // Create a Supabase service-role client (bypasses RLS)
  const admin = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Insert new organization via service role
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({ name, plan: "free" })
    .select("id, name")
    .single();

  if (orgErr || !org) {
    return NextResponse.json({ ok: false, error: orgErr?.message || "Failed to create organization" }, { status: 400 });
  }

  // Link this organization to the user's profile
  const { error: profErr } = await supabase
    .from("profiles")
    .update({ organization_id: org.id })
    .eq("id", user.id);

  if (profErr) {
    const code = (profErr as any)?.code || "";
    const msg = (profErr as any)?.message || "";
    const noColumn =
      code === "42703" ||
      /column .*organization_id.* does not exist/i.test(msg);
    if (!noColumn) {
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }
    // Otherwise, ignore and proceed. Organization linkage is ensured via users mapping below.
  }

  // Ensure app-level users mapping exists with role and org linkage (bypass RLS using service role)
  const { error: userUpsertErr } = await admin
    .from("users")
    .upsert({ id: user.id, organization_id: org.id, role: "client_manager" });

  if (userUpsertErr) {
    return NextResponse.json({ ok: false, error: userUpsertErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, organization: org });
}
