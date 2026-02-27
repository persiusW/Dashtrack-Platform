import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const createOrgSchema = z.object({
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']).default('free'),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies[name];
          },
          set(name: string, value: string, options: CookieOptions) {
            res.appendHeader("Set-Cookie", serializeCookie(name, value, options));
          },
          remove(name: string, options: CookieOptions) {
            res.appendHeader("Set-Cookie", serializeCookie(name, "", options));
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({
        ok: false,
        error: 'Not authenticated. Please log in first.'
      });
    }

    const parsed = createOrgSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: parsed.error.flatten()
      });
    }

    const { organizationName, plan } = parsed.data;

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (existingProfile?.organization_id) {
      return res.status(400).json({
        ok: false,
        error: 'User already belongs to an organization'
      });
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: organizationName, plan: plan })
      .select('id, name, plan')
      .single();

    if (orgError) {
      console.error('Organization creation error:', orgError);
      return res.status(400).json({
        ok: false,
        error: 'Failed to create organization',
        details: orgError.message
      });
    }

    // Stop mutating public.users. Ensure a profile row exists for this user.
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email ?? null,
        full_name: (user.user_metadata as any)?.full_name ?? null
      });

    if (profileError) {
      console.error("Profile upsert error:", profileError);
      await supabase.from("organizations").delete().eq("id", org.id);
      return res.status(400).json({
        ok: false,
        error: "Failed to ensure profile",
        details: profileError.message
      });
    }

    return res.status(200).json({
      ok: true,
      organization: {
        id: org.id,
        name: org.name,
        plan: org.plan,
      },
      message: 'Organization created successfully',
    });
  } catch (error) {
    console.error('Create organization error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
}

function serializeCookie(name: string, value: string, options: CookieOptions) {
  const stringValue =
    typeof value === 'object' ? 'j:' + JSON.stringify(value) : String(value);

  if (typeof options.maxAge === 'number') {
    options.expires = new Date(Date.now() + options.maxAge * 1000);
  }

  return [
    name + '=' + encodeURIComponent(stringValue),
    options.expires ? 'Expires=' + options.expires.toUTCString() : '',
    options.path ? 'Path=' + options.path : '',
    options.domain ? 'Domain=' + options.domain : '',
    options.sameSite ? 'SameSite=' + options.sameSite : '',
    options.secure ? 'Secure' : '',
    options.httpOnly ? 'HttpOnly' : '',
  ]
    .filter(Boolean)
    .join('; ');
}