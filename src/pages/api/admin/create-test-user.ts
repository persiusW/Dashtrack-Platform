
import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const orgId = "a0c3c006-af91-413c-8627-cb69a05f93b5";
    const email = "test@example.com";
    const password = "password123";
    const fullName = "Test User";

    console.log("Creating test user with email:", email);

    // Create auth user with Supabase Admin API
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

    if (authError) {
      console.error("Auth error:", authError);
      return res.status(400).json({
        error: "Failed to create auth user",
        details: authError.message,
      });
    }

    if (!authData?.user) {
      return res.status(500).json({ error: "No user data returned" });
    }

    console.log("Auth user created:", authData.user.id);

    // Create user record
    const { error: userError } = await supabaseAdmin.from("users").insert([
      {
        id: authData.user.id,
        organization_id: orgId,
        role: "client_manager",
      },
    ]);

    if (userError) {
      console.error("User record error:", userError);
      // Rollback auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({
        error: "Failed to create user record",
        details: userError.message,
      });
    }

    console.log("User record created");

    // Create profile record
    const { error: profileError } = await supabaseAdmin.from("profiles").insert([
      {
        id: authData.user.id,
        email: email,
        full_name: fullName,
      },
    ]);

    if (profileError) {
      console.error("Profile error:", profileError);
    } else {
      console.log("Profile created");
    }

    return res.status(200).json({
      success: true,
      message: "Test user created successfully",
      userId: authData.user.id,
      organizationId: orgId,
      email: email,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
