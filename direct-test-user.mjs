
import { createClient } from '@supabase/supabase-js';

// Hardcode the values directly from .env.local to bypass any caching
const supabaseUrl = 'https://oznnxfrbrimslfwnwwpu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96bm54ZnJicmltc2xmd253d3B1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY2MTA0MiwiZXhwIjoyMDc3MjM3MDQyfQ.L3g6FkZBUvN8eQPCtwLTwRQRALe8L-yCQSCkQU5h1mw';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTestUser() {
  const orgId = 'a6335fda-a939-4f6f-a67e-d47587d07f1c';
  const email = 'test@example.com';
  const password = 'password123';
  const fullName = 'Test User';

  try {
    console.log('🚀 Creating test user with DIRECT credentials...\n');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('🏢 Organization ID:', orgId);
    console.log('');

    // Check if user exists
    console.log('Step 1: Checking for existing user...');
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      process.exit(1);
    }
    
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    if (existingUser) {
      console.log('⚠️  Found existing user, deleting first...');
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      console.log('✅ Existing user deleted\n');
    } else {
      console.log('✅ No existing user found\n');
    }

    // Create auth user
    console.log('Step 2: Creating auth user...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      process.exit(1);
    }

    console.log('✅ Auth user created:', authData.user.id, '\n');

    // Create user record
    console.log('Step 3: Creating user record in database...');
    const { error: userError } = await supabaseAdmin.from('users').insert([
      {
        id: authData.user.id,
        organization_id: orgId,
        role: 'client_manager',
      },
    ]);

    if (userError) {
      console.error('❌ User record error:', userError.message);
      console.log('Rolling back auth user...');
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      process.exit(1);
    }

    console.log('✅ User record created\n');

    // Create profile
    console.log('Step 4: Creating profile...');
    const { error: profileError } = await supabaseAdmin.from('profiles').insert([
      {
        id: authData.user.id,
        email: email,
        full_name: fullName,
      },
    ]);

    if (profileError) {
      console.log('⚠️  Profile error (non-fatal):', profileError.message);
    } else {
      console.log('✅ Profile created');
    }

    console.log('\n🎉 SUCCESS!\n');
    console.log('═══════════════════════════════════════');
    console.log('📧 Email:          ', email);
    console.log('🔑 Password:       ', password);
    console.log('👤 User ID:        ', authData.user.id);
    console.log('🏢 Organization ID:', orgId);
    console.log('👔 Role:           ', 'client_manager');
    console.log('═══════════════════════════════════════');
    console.log('\n✨ Sign in at: http://localhost:3000\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

createTestUser();
