import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';

const createOrgSchema = z.object({
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  plan: z.enum(['free', 'pro', 'enterprise']).default('free'),
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
    const supabase = createServerClient({ req, res });

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

    const { data: existingUser } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (existingUser?.organization_id) {
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

    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        organization_id: org.id,
        role: 'client_manager',
      });

    if (userError) {
      console.error('User link error:', userError);
      await supabase.from('organizations').delete().eq('id', org.id);
      return res.status(400).json({ 
        ok: false, 
        error: 'Failed to link user to organization', 
        details: userError.message 
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
