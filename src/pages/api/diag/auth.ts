
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
  };

  const { data: sessionData } = await supabase.auth.getSession();
  const { data: userData } = await supabase.auth.getUser();

  // Call whoami() function
  const { data: whoami, error: whoamiErr } = await supabase.rpc("whoami");

  // Test basic read access
  const { error: readErr } = await supabase
    .from("organizations")
    .select("id")
    .limit(1);

  // If authenticated, get user's organization info
  let userOrgInfo = null;
  if (userData?.user) {
    const { data: userRecord } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", userData.user.id)
      .single();
    userOrgInfo = userRecord;
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    env,
    session_present: !!sessionData?.session,
    user_present: !!userData?.user,
    user_id: userData?.user?.id || null,
    user_email: userData?.user?.email || null,
    whoami,
    whoamiErr: whoamiErr?.message || null,
    userOrgInfo,
    readOk: !readErr,
    readErr: readErr?.message || null,
    cookies_present: {
      sb_access_token: req.cookies.has("sb-access-token"),
      sb_refresh_token: req.cookies.has("sb-refresh-token"),
    }
  });
}
