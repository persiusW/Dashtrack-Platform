
import type { NextApiRequest, NextApiResponse } from "next";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies[name];
          },
          set(name: string, value: string, options: CookieOptions) {
            res.setHeader("Set-Cookie", serializeCookie(name, value, options));
          },
          remove(name: string, options: CookieOptions) {
            res.setHeader("Set-Cookie", serializeCookie(name, "", options));
          },
        },
      }
    );

    // This call refreshes the session and writes cookies.
    await supabase.auth.getSession();

    // Respond OK for any method (POST preferred)
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: "Auth callback failed" });
  }
}

function serializeCookie(name: string, value: string, options: CookieOptions) {
  const stringValue =
    typeof value === "object" ? "j:" + JSON.stringify(value) : String(value);

  if (typeof options.maxAge === "number") {
    options.expires = new Date(Date.now() + options.maxAge * 1000);
  }

  return [
    name + "=" + encodeURIComponent(stringValue),
    options.expires ? "Expires=" + options.expires.toUTCString() : "",
    options.path ? "Path=" + options.path : "",
    options.domain ? "Domain=" + options.domain : "",
    options.sameSite ? "SameSite=" + options.sameSite : "",
    options.secure ? "Secure" : "",
    options.httpOnly ? "HttpOnly" : "",
  ]
    .filter(Boolean)
    .join("; ");
}
  