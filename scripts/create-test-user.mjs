import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read .env.local file
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('URL:', supabaseUrl);
  console.error('Service Key:', supabaseServiceKey ? 'Present' : 'Missing');
  process.exit(1);
}

console.log('🔧 Using Supabase URL:', supabaseUrl);
console.log('🔑 Service Key Length:', supabaseServiceKey.length);

// Create Supabase admin client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function createTestUser() {
  console.log('\n🚀 Starting test user creation...\n');

  const email = 'test@example.com';
  const password = 'password123';
  const fullName = 'Test User';
  const organizationName = 'Test Organization';

  try {
    // Step 1: Check if user already exists and clean up if needed
    console.log('🔍 Checking for existing user...');
    const { data: existingAuthUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingAuthUsers?.users?.find(u => u.email === email);
    
    if (existingUser) {
      console.log('⚠️  User already exists, deleting...');
      await supabase.auth.admin.deleteUser(existingUser.id);
      console.log('✅ Old user deleted');
    }

    // Step 2: Create user in Auth FIRST
    console.log('\n👤 Step 1: Creating user in auth.users...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (authError) {
      console.error('❌ Auth user creation failed:', authError);
      throw authError;
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Step 3: Create organization using service role (bypasses RLS)
    console.log('\n📦 Step 2: Creating organization with service role...');
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert([{ 
        name: organizationName, 
        plan: 'free',
        owner_user_id: authData.user.id
      }])
      .select()
      .single();

    if (orgError) {
      console.error('❌ Organization creation failed:', orgError);
      console.error('Full error:', JSON.stringify(orgError, null, 2));
      
      // Clean up auth user if org creation fails
      console.log('🧹 Cleaning up auth user...');
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw orgError;
    }

    console.log('✅ Organization created:', org.id);

    // Step 4: Create user record with organization link
    console.log('\n🔗 Step 3: Linking user to organization...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        organization_id: org.id,
        role: 'client_manager'
      }])
      .select()
      .single();

    if (userError) {
      console.error('❌ User record creation failed:', userError);
      console.error('Full error:', JSON.stringify(userError, null, 2));
      throw userError;
    }

    console.log('✅ User linked to organization');

    // Success summary
    console.log('\n✨ Test user created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 User ID:', authData.user.id);
    console.log('🏢 Organization:', organizationName);
    console.log('🆔 Org ID:', org.id);
    console.log('🎭 Role: client_manager');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ You can now login at /app/overview with these credentials!\n');

  } catch (error) {
    console.error('\n❌ Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();