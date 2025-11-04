
import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createPagesServerClient({ req, res });

    const env = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV || "",
    };

    const { data: sessionData } = await supabase.auth.getSession();
    const { data: userData } = await supabase.auth.getUser();

    // Cookies presence
    const access = req.cookies["sb-access-token"];
    const refresh = req.cookies["sb-refresh-token"];

    // Tiny, safe read
    const { error: readErr } = await supabase.from("organizations").select("id").limit(1);

    res.status(200).json({
      timestamp: new Date().toISOString(),
      env,
      session_present: !!sessionData?.session,
      user_present: !!userData?.user,
      user_id: userData?.user?.id ?? null,
      user_email: userData?.user?.email ?? null,
      whoami: null,
      whoamiErr: null,
      userOrgInfo: null,
      readOk: !readErr,
      readErr: readErr?.message ?? null,
      cookies_present: {
        sb_access_token: !!access,
        sb_refresh_token: !!refresh,
      },
    });
  } catch (e) {
    res.status(200).json({
      timestamp: new Date().toISOString(),
      env: {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        NODE_ENV: process.env.NODE_ENV || "",
      },
      session_present: false,
      user_present: false,
      user_id: null,
      user_email: null,
      whoami: null,
      whoamiErr: "diag-failed",
      userOrgInfo: null,
      readOk: false,
      readErr: "diag-failed",
      cookies_present: {
        sb_access_token: false,
        sb_refresh_token: false,
      },
    });
  }
}
  