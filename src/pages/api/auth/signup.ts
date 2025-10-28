import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Create admin client with service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password, fullName, organizationName } = req.body;

  // Validate required fields
  if (!email || !password || !fullName || !organizationName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    // Step 1: Create organization (using service role to bypass RLS)
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert([{ name: organizationName, plan: "free" }])
      .select()
      .single();

    if (orgError) {
      console.error("Organization creation error:", orgError);
      return res.status(500).json({ error: "Failed to create organization: " + orgError.message });
    }

    // Step 2: Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for development; set to false for production with email verification
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      console.error("Auth user creation error:", authError);
      // Rollback: delete the organization if user creation fails
      await supabaseAdmin.from("organizations").delete().eq("id", orgData.id);
      return res.status(500).json({ error: "Failed to create user: " + authError.message });
    }

    // Step 3: Create user record in users table (using service role)
    const { error: userError } = await supabaseAdmin
      .from("users")
      .insert([
        {
          id: authData.user.id,
          organization_id: orgData.id,
          role: "client_manager",
        },
      ]);

    if (userError) {
      console.error("User record creation error:", userError);
      // Rollback: delete auth user and organization
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      await supabaseAdmin.from("organizations").delete().eq("id", orgData.id);
      return res.status(500).json({ error: "Failed to create user record: " + userError.message });
    }

    // Step 4: Create profile record (using service role)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: authData.user.id,
          email,
          full_name: fullName,
        },
      ]);

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Note: Profile is less critical, so we don't rollback everything
      // but we should log this for monitoring
    }

    return res.status(200).json({
      message: "Account created successfully",
      userId: authData.user.id,
      organizationId: orgData.id,
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
