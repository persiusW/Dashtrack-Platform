# Manual Test User Setup Guide

## Overview

This guide provides step-by-step instructions for manually creating a test user when automated scripts fail due to API key issues.

## Current Status

- ✅ Test Organization exists (ID: `2aa07f2f-3a86-4961-9103-e6a9050a2885`)
- ❌ Auth user needs to be created manually
- ❌ Users table entry needs to be created manually

## Step-by-Step Instructions

### Step 1: Create User in Supabase Auth

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Users**
4. Click **"Add User"** button
5. Select **"Create New User"**
6. Fill in the form:
   ```
   Email: test@example.com
   Password: password123
   Auto Confirm User: ✓ (MUST be checked!)
   ```
7. Click **"Create User"**
8. **IMPORTANT:** Copy the generated User ID (UUID format)

### Step 2: Link User to Organization

1. Go to **SQL Editor** in Supabase Dashboard
2. Create a new query
3. Paste this SQL (replace `<USER_ID_FROM_STEP_1>` with actual ID):

```sql
-- Link the auth user to Test Organization
INSERT INTO users (id, organization_id, role)
VALUES (
  '<USER_ID_FROM_STEP_1>',
  '2aa07f2f-3a86-4961-9103-e6a9050a2885',
  'client_manager'
);
```

4. Click **"Run"** to execute

### Step 3: Verify Setup

Run this query to confirm everything is set up correctly:

```sql
-- Verify user setup
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  users.organization_id,
  users.role,
  org.name as organization_name
FROM auth.users u
JOIN users ON users.id = u.id
JOIN organizations org ON org.id = users.organization_id
WHERE u.email = 'test@example.com';
```

Expected output:
```
id: <UUID>
email: test@example.com
email_confirmed_at: <timestamp>
organization_id: 2aa07f2f-3a86-4961-9103-e6a9050a2885
role: client_manager
organization_name: Test Organization
```

### Step 4: Test Login

1. Go to the DashTrack login page
2. Enter credentials:
   - Email: `test@example.com`
   - Password: `password123`
3. Click **"Sign In"**
4. You should be redirected to `/app/overview`

## Troubleshooting

### Issue: "Invalid login credentials"

**Causes:**
- User wasn't confirmed (Auto Confirm wasn't checked)
- Password was typed incorrectly during creation

**Solutions:**
1. Check user confirmation status in Dashboard → Authentication → Users
2. If not confirmed, click the three dots next to the user → "Send confirmation email"
3. Or delete the user and recreate with "Auto Confirm User" checked

### Issue: "Database error querying schema"

**Causes:**
- Users table entry doesn't exist
- User ID mismatch between auth.users and users table

**Solutions:**
1. Run the verification query from Step 3
2. If no results, the users table entry is missing - run Step 2 again
3. If User ID mismatches, delete the wrong entry and create the correct one:

```sql
-- Delete incorrect entry
DELETE FROM users WHERE organization_id = '2aa07f2f-3a86-4961-9103-e6a9050a2885';

-- Insert correct entry with proper User ID
INSERT INTO users (id, organization_id, role)
VALUES ('<CORRECT_USER_ID>', '2aa07f2f-3a86-4961-9103-e6a9050a2885', 'client_manager');
```

### Issue: Can't access certain pages after login

**Cause:** Role or organization_id not properly set in session

**Solution:**
1. Check the middleware logs in browser console
2. Verify the users table entry has correct role and organization_id
3. Try logging out and logging back in to refresh the session

## Why Manual Setup?

The automated user creation scripts are failing with "Invalid API key" errors despite having the correct service role key. This appears to be a Supabase project-level configuration issue. The manual approach bypasses the API and works directly through the dashboard UI, which has different authentication mechanisms.

## Alternative: Fix API Key Issues

If you want to fix the root cause and enable automated user creation:

1. Go to Supabase Dashboard → Settings → API
2. Click "Reset service role key" (⚠️ this will break existing service integrations temporarily)
3. Copy the new service role key
4. Update `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=<new_service_role_key>
   ```
5. Restart the application: `pm2 restart all`
6. Try the automated script again: `node scripts/create-test-user.mjs`

---

**Note:** This manual process is a temporary workaround. Once the API key issue is resolved, you can use the automated scripts in the `scripts/` directory.