
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const createOrgSchema = z.object({
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
  plan: z.enum(["free", "pro", "enterprise"]).default("free"),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated. Please log in first." },
        { status: 401 }
      );
    }

    // Validate request body
    const body = await req.json().catch(() => ({}));
    const parsed = createOrgSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { organizationName, plan } = parsed.data;

    // Check if user already has an organization
    const { data: existingUser } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (existingUser?.organization_id) {
      return NextResponse.json(
        { ok: false, error: "User already belongs to an organization" },
        { status: 400 }
      );
    }

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: organizationName,
        plan: plan,
      })
      .select("id, name, plan")
      .single();

    if (orgError) {
      console.error("Organization creation error:", orgError);
      return NextResponse.json(
        { ok: false, error: "Failed to create organization", details: orgError.message },
        { status: 400 }
      );
    }

    // Link user to organization with client_manager role
    const { error: userError } = await supabase
      .from("users")
      .upsert({
        id: user.id,
        organization_id: org.id,
        role: "client_manager",
      });

    if (userError) {
      console.error("User link error:", userError);
      // Try to clean up the organization if user link fails
      await supabase.from("organizations").delete().eq("id", org.id);
      return NextResponse.json(
        { ok: false, error: "Failed to link user to organization", details: userError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      organization: {
        id: org.id,
        name: org.name,
        plan: org.plan,
      },
      message: "Organization created successfully",
    });
  } catch (error) {
    console.error("Create organization error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
