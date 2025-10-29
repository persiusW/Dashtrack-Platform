import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: "Supabase credentials not configured",
      });
    }

    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test 1: Check if we can reach Supabase at all
    const { data: healthCheck, error: healthError } = await supabase
      .from("organizations")
      .select("count")
      .limit(0);

    if (healthError) {
      return res.status(500).json({
        success: false,
        error: "Cannot connect to Supabase",
        details: healthError.message,
        hint: "Your Supabase project might be paused. Check your Supabase dashboard.",
      });
    }

    // Test 2: Try to sign in with a test request (will fail but should connect)
    const { error: authTestError } = await supabase.auth.signInWithPassword({
      email: "test@test.com",
      password: "wrongpassword",
    });

    // We expect this to fail with "Invalid login credentials", not a network error
    const authWorking = authTestError?.message === "Invalid login credentials";

    return res.status(200).json({
      success: true,
      supabaseUrl,
      databaseReachable: !healthError,
      authEndpointReachable: authWorking,
      message: authWorking
        ? "✅ Supabase connection is working!"
        : "⚠️ Database OK but Auth endpoint may have issues",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Unexpected error testing Supabase",
      details: error.message,
    });
  }
}
