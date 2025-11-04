import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-only

export async function GET() {
  const supa = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supa.auth.getUser();

  const admin = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } });

  const { data: defRows, error: defErr } = await admin
    .from("pg_attrdef")
    .select(`
      adrelid,
      adnum,
      adbin
    `)
    .limit(1);

  const { data: defaultsInfo } = await admin
    .from("information_schema.columns")
    .select("column_default")
    .eq("table_schema", "public")
    .eq("table_name", "organizations")
    .eq("column_name", "owner_user_id")
    .maybeSingle();

  const { data: policies } = await admin
    .from("pg_policies")
    .select("policyname, cmd, roles, permissive, qual, with_check")
    .eq("schemaname", "public")
    .eq("tablename", "organizations");

  return NextResponse.json({
    ok: true,
    user_id: user?.id ?? null,
    owner_user_id_default: defaultsInfo?.column_default ?? null,
    policies: policies ?? [],
  });
}

export async function POST(req: NextRequest) {
  const supa = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status: 401 });

  const name = `diag-${Date.now()}`;

  const { data: ins, error: insErr } = await supa
    .from("organizations")
    .insert({ name, plan: "free" })
    .select("id, name, owner_user_id")
    .single();

  if (insErr) {
    return NextResponse.json({ ok:false, error: insErr.message }, { status: 400 });
  }

  const admin = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } });
  await admin.from("organizations").delete().eq("id", ins.id);

  return NextResponse.json({ ok:true, inserted: ins, cleaned: true });
}