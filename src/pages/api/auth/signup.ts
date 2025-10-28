import { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Email validation regex - more permissive
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password, fullName, organizationName } = req.body;

    // Log the incoming request (without password)
    console.log("Signup request received:", {
      email: email,
      emailLength: email?.length,
      passwordLength: password?.length,
      fullName: fullName,
      organizationName: organizationName,
    });

    // Validate required fields
    if (!email || !password || !fullName || !organizationName) {
      return res.status(400).json({ 
        error: "Missing required fields",
        details: {
          email: !email,
          password: !password,
          fullName: !fullName,
          organizationName: !organizationName,
        }
      });
    }

    // Trim and validate email
    const trimmedEmail = email.trim().toLowerCase();
    console.log("Trimmed email:", trimmedEmail);

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({ 
        error: "Invalid email format. Please use a valid email address like user@example.com" 
      });
    }

    // Validate password length and characters
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check for any whitespace in password that might cause issues
    if (password.trim() !== password) {
      return res.status(400).json({ error: "Password cannot start or end with whitespace" });
    }

    // Validate names are not just whitespace
    if (!fullName.trim()) {
      return res.status(400).json({ error: "Full name cannot be empty" });
    }

    if (!organizationName.trim()) {
      return res.status(400).json({ error: "Organization name cannot be empty" });
    }

    console.log("All validations passed, starting signup process...");

    // Step 1: Create organization (using service role to bypass RLS)
    console.log("Step 1: Creating organization...");
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert([{ name: organizationName.trim(), plan: "free" }])
      .select()
      .single();

    if (orgError) {
      console.error("Organization creation error:", {
        message: orgError.message,
        code: orgError.code,
        details: orgError.details,
        hint: orgError.hint,
      });
      return res.status(500).json({ 
        error: "Failed to create organization",
        details: orgError.message 
      });
    }

    console.log("Organization created successfully:", orgData.id);

    // Step 2: Create auth user
    console.log("Step 2: Creating auth user with email:", trimmedEmail);
    
    const createUserPayload = {
      email: trimmedEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim(),
      },
    };

    console.log("Auth payload (without password):", {
      email: createUserPayload.email,
      email_confirm: createUserPayload.email_confirm,
      user_metadata: createUserPayload.user_metadata,
    });

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser(createUserPayload);

    if (authError) {
      console.error("Auth user creation error:", {
        message: authError.message,
        status: authError.status,
        code: authError.code,
        name: authError.name,
      });
      
      // Rollback: delete the organization if user creation fails
      console.log("Rolling back organization creation...");
      await supabaseAdmin.from("organizations").delete().eq("id", orgData.id);
      
      // Provide more specific error message
      let errorMessage = authError.message;
      if (authError.message.includes("pattern")) {
        errorMessage = "Email or password format is invalid. Email must be a valid email address and password must be at least 6 characters.";
      } else if (authError.message.includes("already registered")) {
        errorMessage = "An account with this email already exists. Please sign in instead.";
      }
      
      return res.status(400).json({ 
        error: errorMessage,
        details: authError.message 
      });
    }

    if (!authData?.user) {
      console.error("No user data returned from auth creation");
      console.log("Rolling back organization creation...");
      await supabaseAdmin.from("organizations").delete().eq("id", orgData.id);
      return res.status(500).json({ error: "Failed to create user account - no user data returned" });
    }

    console.log("Auth user created successfully:", authData.user.id);

    // Step 3: Create user record in users table (using service role)
    console.log("Step 3: Creating user record in users table...");
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
      console.error("User record creation error:", {
        message: userError.message,
        code: userError.code,
        details: userError.details,
      });
      // Rollback: delete auth user and organization
      console.log("Rolling back auth user and organization creation...");
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      await supabaseAdmin.from("organizations").delete().eq("id", orgData.id);
      return res.status(500).json({ 
        error: "Failed to create user record",
        details: userError.message 
      });
    }

    console.log("User record created successfully in users table");

    // Step 4: Create profile record (using service role)
    console.log("Step 4: Creating profile record...");
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: authData.user.id,
          email: trimmedEmail,
          full_name: fullName.trim(),
        },
      ]);

    if (profileError) {
      console.error("Profile creation error:", {
        message: profileError.message,
        code: profileError.code,
      });
      // Note: Profile is less critical, so we don't rollback everything
      // but we should log it for monitoring
      console.warn("Continuing despite profile creation failure - this is non-critical");
    } else {
      console.log("Profile created successfully");
    }

    console.log("✅ Signup completed successfully for:", trimmedEmail);

    return res.status(200).json({
      message: "Account created successfully",
      userId: authData.user.id,
      organizationId: orgData.id,
    });
  } catch (error: any) {
    console.error("❌ Unexpected signup error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return res.status(500).json({ 
      error: "Internal server error during signup",
      details: error.message 
    });
  }
}
