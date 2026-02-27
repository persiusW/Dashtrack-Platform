
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = createPagesServerClient({ req, res });

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
        return res.status(500).json({ error: "Session error", details: sessionError });
    }

    if (!session) {
        return res.status(401).json({ error: "No session found" });
    }

    const user = session.user;

    const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    const { data: profileRecord, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    return res.status(200).json({
        auth_user: {
            id: user.id,
            email: user.email,
        },
        public_user: userRecord,
        public_profile: profileRecord,
        is_admin: userRecord?.role === 'admin'
    });
}
