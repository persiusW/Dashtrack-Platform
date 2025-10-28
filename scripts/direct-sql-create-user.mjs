import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');

for (const line of lines) {
  const trimmedLine = line.trim();
  if (!trimmedLine || trimmedLine.startsWith('#')) continue;
  
  const equalIndex = trimmedLine.indexOf('=');
  if (equalIndex === -1) continue;
  
  const key = trimmedLine.substring(0, equalIndex).trim();
  const value = trimmedLine.substring(equalIndex + 1).trim();
  
  if (key && value && !process.env[key]) {
    process.env[key] = value;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Supabase URL:', supabaseUrl);
console.log('🔑 Service Key Length:', supabaseServiceKey?.length);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createUserDirectly() {
  console.log('\n🚀 Creating test user via direct database operations...\n');

  const email = 'test@example.com';
  const organizationName = 'Test Organization';
  const fullName = 'Test User';

  try {
    // Step 1: Check and delete existing organization first
    console.log('🔍 Step 1: Checking for existing organization...');
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', organizationName)
      .maybeSingle();

    if (existingOrg) {
      console.log('⚠️  Existing organization found, deleting...');
      const { error: deleteError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', existingOrg.id);
      
      if (deleteError) {
        console.error('❌ Failed to delete existing organization:', deleteError);
      } else {
        console.log('✅ Existing organization deleted');
      }
    }

    // Step 2: Create organization using service role
    console.log('\n📦 Step 2: Creating organization...');
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert([{ 
        name: organizationName,
        plan: 'free'
      }])
      .select()
      .single();

    if (orgError) {
      console.error('❌ Organization creation failed:', orgError);
      throw orgError;
    }

    console.log('✅ Organization created:', org.id);
    console.log('   Name:', org.name);
    console.log('   Plan:', org.plan);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Setup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Next Steps:');
    console.log('1. Go to your Supabase Dashboard → Authentication → Users');
    console.log('2. Click "Add User" → "Create New User"');
    console.log('3. Enter:');
    console.log('   📧 Email:', email);
    console.log('   🔑 Password: password123');
    console.log('   ☑️  Check "Auto Confirm User"');
    console.log('4. After creating the user, copy the User ID');
    console.log('5. Go to SQL Editor and run:');
    console.log('\n   INSERT INTO users (id, organization_id, role)');
    console.log('   VALUES (');
    console.log("     '<paste-user-id-here>',");
    console.log(`     '${org.id}',`);
    console.log("     'client_manager'");
    console.log('   );');
    console.log('\n6. Then you can login with:', email);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

createUserDirectly();
