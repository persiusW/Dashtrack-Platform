
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

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
    console.log('Step 1: Checking if user already exists...');
    
    // Check if user exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    if (existingUser) {
      console.log('User already exists with ID:', existingUser.id);
      console.log('Deleting existing user first...');
      
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      if (deleteError) {
        console.error('Error deleting existing user:', deleteError);
        process.exit(1);
      }
      console.log('Existing user deleted successfully');
    }

    console.log('\nStep 2: Creating auth user...');
    
    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      process.exit(1);
    }

    if (!authData?.user) {
      console.error('No user data returned');
      process.exit(1);
    }

    console.log('✅ Auth user created with ID:', authData.user.id);

    console.log('\nStep 3: Creating user record...');
    
    // Create user record
    const { error: userError } = await supabaseAdmin.from('users').insert([
      {
        id: authData.user.id,
        organization_id: orgId,
        role: 'client_manager',
      },
    ]);

    if (userError) {
      console.error('User record error:', userError);
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      process.exit(1);
    }

    console.log('✅ User record created');

    console.log('\nStep 4: Creating profile record...');
    
    // Create profile
    const { error: profileError } = await supabaseAdmin.from('profiles').insert([
      {
        id: authData.user.id,
        email: email,
        full_name: fullName,
      },
    ]);

    if (profileError) {
      console.error('Profile error (non-fatal):', profileError);
    } else {
      console.log('✅ Profile created');
    }

    console.log('\n🎉 SUCCESS! Test user created:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   User ID:', authData.user.id);
    console.log('   Organization ID:', orgId);
    console.log('   Role: client_manager');
    console.log('\nYou can now sign in at: http://localhost:3000');

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

createTestUser();
