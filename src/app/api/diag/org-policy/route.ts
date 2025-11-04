import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  const supa = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ ok:false, error:"Unauthorized" }, { status: 401 });

  const name = `diag-${Date.now()}`;
  const { data, error } = await supa.from("organizations").insert({ name, plan: "free" }).select("id, name").single();
  if (error) return NextResponse.json({ ok:false, error: error.message }, { status: 400 });

  const admin = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } });
  await admin.from("organizations").delete().eq("id", data.id);

  return NextResponse.json({ ok:true, inserted_then_deleted: data });
}
