import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const supabase = createServerClient({ req, res });
    
    const parsed = signupSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json(
        { ok: false, error: "Validation failed", details: parsed.error.flatten() }
      );
    }

    const { email, password, fullName } = parsed.data;

    // Sign up the user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split("@")[0],
        },
      },
    });

    if (error) {
      return res.status(400).json(
        { ok: false, error: error.message }
      );
    }

    if (!data.user) {
      return res.status(500).json(
        { ok: false, error: "User creation failed" }
      );
    }

    return res.status(200).json({
      ok: true,
      userId: data.user.id,
      email: data.user.email,
      message: "Signup successful. Please check your email to confirm your account.",
      needsEmailConfirmation: !data.session,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json(
      { ok: false, error: "Internal server error" }
    );
  }
}
