
import type { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createPagesServerClient({ req, res });

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  try {
    let body: any = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const access_token: string | undefined = body?.access_token;
    const refresh_token: string | undefined = body?.refresh_token;

    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) return res.status(400).json({ ok: false, error: error.message });
      return res.status(200).json({ ok: true, mode: "setSession" });
    }

    await supabase.auth.getSession();
    return res.status(200).json({ ok: true, mode: "touch" });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Auth callback failed" });
  }
}
  