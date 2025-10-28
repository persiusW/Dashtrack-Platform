import { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/integrations/supabase/types";

// The handler for creating an organization.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Create Supabase client with user session
    const supabase = createPagesServerClient<Database>({ req, res });

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({
        ok: false,
        error: "NOT_AUTHENTICATED",
        details: "You must be logged in to create an organization",
      });
    }

    const { organizationName } = req.body;

    // Validate organization name
    if (!organizationName || typeof organizationName !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Invalid organization name",
        details: "Organization name is required and must be a string",
      });
    }

    if (organizationName.trim().length < 2) {
      return res.status(400).json({
        ok: false,
        error: "Invalid organization name",
        details: "Organization name must be at least 2 characters long",
      });
    }

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: organizationName.trim(), plan: "free" })
      .select("id")
      .single();

    if (orgError) {
      console.error("Organization creation error:", orgError);
      return res.status(400).json({
        ok: false,
        error: "Failed to create organization",
        details: orgError.message,
      });
    }

    // Add a null check for the created organization
    if (!org) {
      return res.status(500).json({
        ok: false,
        error: "Failed to create organization",
        details: "Organization was not created successfully, no ID returned.",
      });
    }

    // Link user to organization
    const { error: userLinkError } = await supabase.from("users").upsert({
      id: user.id,
      organization_id: org.id,
      role: "client_manager",
    });

    if (userLinkError) {
      console.error("User-organization link error:", userLinkError);
      // Rollback: delete the organization
      await supabase.from("organizations").delete().eq("id", org.id);
      return res.status(500).json({
        ok: false,
        error: "Failed to link user to organization",
        details: userLinkError.message,
      });
    }

    return res.status(200).json({
      ok: true,
      organization_id: org.id,
      message: "Organization created successfully",
    });
  } catch (error: any) {
    console.error("Unexpected error in organization creation:", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
      details: error.message,
    });
  }
}