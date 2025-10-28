import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies[name];
        },
        set(name: string, value: string, options: CookieOptions) {
          res.appendHeader("Set-Cookie", serializeCookie(name, value, options));
        },
        remove(name: string, options: CookieOptions) {
          res.appendHeader("Set-Cookie", serializeCookie(name, "", options));
        },
      },
    }
  );

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
  };

  const { data: sessionData } = await supabase.auth.getSession();
  const { data: userData } = await supabase.auth.getUser();

  const { data: whoami, error: whoamiErr } = await supabase.rpc("whoami");

  const { error: readErr } = await supabase
    .from("organizations")
    .select("id")
    .limit(1);

  let userOrgInfo = null;
  if (userData?.user) {
    const { data: userRecord } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", userData.user.id)
      .single();
    userOrgInfo = userRecord;
  }

  return res.status(200).json({
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
      "sb-access-token": !!req.cookies["sb-access-token"],
      "sb-refresh-token": !!req.cookies["sb-refresh-token"],
    }
  });
}

// Helper from @supabase/ssr
function serializeCookie(name: string, value: string, options: CookieOptions) {
  const stringValue =
    typeof value === 'object' ? 'j:' + JSON.stringify(value) : String(value);

  if ('maxAge' in options) {
    options.expires = new Date(Date.now() + options.maxAge * 1000);
  }

  return [
    name + '=' + encodeURIComponent(stringValue),
    options.expires ? 'Expires=' + options.expires.toUTCString() : '',
    options.path ? 'Path=' + options.path : '',
    options.domain ? 'Domain=' + options.domain : '',
    options.sameSite ? 'SameSite=' + options.sameSite : '',
    options.secure ? 'Secure' : '',
    options.httpOnly ? 'HttpOnly' : '',
  ]
    .filter(Boolean)
    .join('; ');
}