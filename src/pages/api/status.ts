import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Create a client with anon key (for session-based operations)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({
        error: "Missing Supabase configuration",
        env: {
          NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: !!supabaseAnonKey,
          SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          NODE_ENV: process.env.NODE_ENV,
        },
      });
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

    const env = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV,
    };

    // Try to call whoami() RPC
    const { data: whoami, error: whoamiErr } = await supabase.rpc("whoami");

    // Tiny read test (no PII)
    const { error: readErr } = await supabase
      .from("organizations")
      .select("id")
      .limit(1);

    return res.status(200).json({
      env,
      timestamp: new Date().toISOString(),
      whoami,
      whoamiErr: whoamiErr?.message || null,
      readOk: !readErr,
      readErr: readErr?.message || null,
      message: "Status endpoint is working correctly",
    });
  } catch (error: any) {
    console.error("Status endpoint error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
