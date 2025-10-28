import { NextApiRequest, NextApiResponse } from "next";
import { createPagesServerClient } from "@supabase/ssr";
import { Database } from "@/integrations/supabase/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = createPagesServerClient<Database>({ req, res });

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

    if (!organizationName || typeof organizationName !== "string" || organizationName.trim().length < 2) {
      return res.status(400).json({
        ok: false,
        error: "Invalid organization name",
        details: "Organization name must be at least 2 characters long",
      });
    }

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: organizationName.trim() }) // plan defaults to 'free'; owner_user_id handled by policies/defaults
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

    if (!org) {
      return res.status(500).json({
        ok: false,
        error: "Failed to create organization",
        details: "Organization was not created successfully, no ID returned.",
      });
    }

    const { error: userLinkError } = await supabase.from("users").upsert({
      id: user.id,
      organization_id: org.id,
      role: "client_manager",
    });

    if (userLinkError) {
      console.error("User-organization link error:", userLinkError);
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