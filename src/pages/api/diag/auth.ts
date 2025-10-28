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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Check environment variables
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!supabaseAnonKey,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV,
    };

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({
        error: "Missing Supabase configuration",
        env,
      });
    }

    // Create client with anon key
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

    // Try to get session from request cookies
    // In Pages Router, we need to manually handle cookies
    const authHeader = req.headers.authorization;
    const cookieHeader = req.headers.cookie;

    // Parse session from cookies if available
    let sessionToken = null;
    if (cookieHeader) {
      const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      // Look for Supabase auth token in cookies
      sessionToken = cookies["sb-access-token"] || cookies["supabase-auth-token"];
    }

    // Get session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    // Get user
    const { data: userData, error: userError } = await supabase.auth.getUser();

    // Try whoami() RPC
    const { data: whoami, error: whoamiErr } = await supabase.rpc("whoami");

    // Try basic read
    const { data: orgData, error: readErr } = await supabase
      .from("organizations")
      .select("id")
      .limit(1);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      env,
      auth: {
        hasAuthHeader: !!authHeader,
        hasCookieHeader: !!cookieHeader,
        hasSessionToken: !!sessionToken,
        sessionPresent: !!sessionData?.session,
        sessionError: sessionError?.message || null,
        userPresent: !!userData?.user,
        userError: userError?.message || null,
        userId: userData?.user?.id || null,
        userEmail: userData?.user?.email || null,
      },
      database: {
        whoami,
        whoamiError: whoamiErr?.message || null,
        readOk: !readErr,
        readError: readErr?.message || null,
        orgCount: orgData?.length || 0,
      },
      cookies: cookieHeader ? "Present (hidden for security)" : "None",
    });
  } catch (error: any) {
    console.error("Auth diag error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
