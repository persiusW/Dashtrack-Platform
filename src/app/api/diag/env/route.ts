import { NextResponse } from "next/server";

export async function GET() {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const srv = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return NextResponse.json({
    ok: true,
    NEXT_PUBLIC_SUPABASE_URL_present: !!u,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_present: !!anon,
    SUPABASE_SERVICE_ROLE_KEY_present: !!srv,
    // basic sanity checks
    url_starts_with_https: u.startsWith("https://"),
    anon_looks_like_jwt: anon.split(".").length === 3,
    service_key_present_len: srv.length,
  });
}
