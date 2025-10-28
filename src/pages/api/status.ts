import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/integrations/supabase/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // createRouteHandlerClient is for server-side usage. It will not expose secrets to the client.
  const supabase = createRouteHandlerClient&lt;Database&gt;({ cookies });

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
  };

  const { data: sessionData, error: sessionErr } =
    await supabase.auth.getSession();
  const { data: userData, error: userErr } = await supabase.auth.getUser();

  // DB whoami()
  const { data: whoami, error: whoamiErr } = await supabase.rpc("whoami");

  // Tiny read test (no PII) using the user's session
  const { error: readErr } = await supabase
    .from("organizations")
    .select("id")
    .limit(1);

  return NextResponse.json({
    env,
    ts: new Date().toISOString(),
    session_present: !!sessionData?.session,
    sessionErr: sessionErr?.message || null,
    user_present: !!userData?.user,
    userErr: userErr?.message || null,
    whoami,
    whoamiErr: whoamiErr?.message || null,
    readOk: !readErr,
    readErr: readErr?.message || null,
  });
}
