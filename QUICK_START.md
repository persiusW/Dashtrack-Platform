# DashTrack Quick Start Guide

## 🚀 Getting Started

This guide will help you set up your first test user and start using DashTrack.

## Prerequisites

- Supabase project connected to this application
- Access to Supabase Dashboard

## Step 1: Create Test User in Supabase Dashboard

Since the service role key authentication is currently having issues, we'll create the test user manually through the Supabase Dashboard:

### 1.1 Create Auth User

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **oznnxfrbrimslfwnwwpu**
3. Navigate to **Authentication → Users**
4. Click **"Add User"** → **"Create New User"**
5. Enter the following details:
   - **Email:** `test@example.com`
   - **Password:** `password123`
   - **☑️ Check "Auto Confirm User"** (important!)
6. Click **"Create User"**
7. **Copy the User ID** that appears (you'll need this in the next step)

### 1.2 Link User to Organization

1. In Supabase Dashboard, navigate to **SQL Editor**
2. Click **"New Query"**
3. Paste the following SQL (replace `<USER_ID>` with the ID you copied):

```sql
-- Insert user record linking to Test Organization
INSERT INTO users (id, organization_id, role)
VALUES (
  '<USER_ID>',  -- Replace with the actual User ID from step 1.1
  '2aa07f2f-3a86-4961-9103-e6a9050a2885',  -- Test Organization ID
  'client_manager'
);
```

4. Click **"Run"** to execute the query

## Step 2: Login to DashTrack

1. Open the DashTrack application
2. Use these credentials:
   - **Email:** `test@example.com`
   - **Password:** `password123`
3. You should now be logged in as a Client Manager

## Test Organization Details

- **Organization Name:** Test Organization
- **Organization ID:** `2aa07f2f-3a86-4961-9103-e6a9050a2885`
- **Plan:** Free

## Troubleshooting

### "Invalid login credentials" error

**Cause:** The user wasn't created with "Auto Confirm User" checked, or the users table entry is missing.

**Solution:**
1. Go to Supabase Dashboard → Authentication → Users
2. Find `test@example.com` and click the three dots → "Send confirmation email" OR delete and recreate with "Auto Confirm User" checked
3. Verify the users table entry exists (run the SQL from Step 1.2 again)

### "Database error querying schema" error

**Cause:** The users table entry exists but there's a mismatch in the user ID.

**Solution:**
1. Get the correct User ID from Supabase Dashboard → Authentication → Users
2. Update the users table:
```sql
UPDATE users 
SET id = '<CORRECT_USER_ID>'
WHERE organization_id = '2aa07f2f-3a86-4961-9103-e6a9050a2885';
```

### "Invalid API key" during signup

**Cause:** The Supabase service role key needs to be refreshed.

**Solution:**
1. Click "Fetch API Keys" in the Supabase integration settings
2. Try signup again

## Next Steps

Once logged in, you can:

1. **Create an Activation** (`/app/activations`)
   - Set up your first marketing campaign
   - Define activation dates and landing URLs

2. **Add Zones** (within an activation)
   - Create geographical zones for tracking
   - Assign zone-specific links

3. **Register Agents** (`/app/activations/[id]/agents`)
   - Add team members who will distribute materials
   - Each agent gets a unique tracking link

4. **Generate Tracked Links** (`/app/links`)
   - Create QR codes for print materials
   - Set up smart device-specific redirects

5. **View Analytics** (`/app/overview`)
   - Monitor clicks and engagement
   - Filter by date range, activation, or zone

## User Roles

- **admin**: Full system access, can manage all organizations
- **client_manager**: Manage activations, zones, agents, and links within their organization
- **zone_supervisor**: View and manage specific zones (limited access)
- **external_agent**: No login access; agents view their stats via public link

## Support

If you encounter issues:
1. Check the Supabase Dashboard for user confirmation status
2. Verify the users table entry exists and matches the auth.users ID
3. Check browser console for detailed error messages
4. Restart the Next.js server: `pm2 restart all`

---

**Last Updated:** 2025-10-28