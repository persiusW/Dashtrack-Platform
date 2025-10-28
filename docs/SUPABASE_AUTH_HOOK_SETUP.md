# Supabase Auth Hook Configuration

## ✅ Test User Created Successfully!

A test user has been created for you to log in:
- **Email:** test@example.com
- **Password:** password123
- **Organization:** Test Organization
- **Role:** client_manager

You can now log in at `/app/overview` with these credentials!

---

## Problem: "Database error querying schema" during login

### Root Cause
The error occurs due to a circular dependency:
1. Custom JWT claims need `organization_id` and `role` from the `users` table
2. The `users` table has RLS policies that check JWT claims
3. During token generation, the claims don't exist yet, causing RLS to block the query

### Solution: Configure Custom Access Token Hook

#### Step 1: Check Current Configuration
Go to your Supabase Dashboard:
1. Navigate to **Authentication** > **Hooks**
2. Check if there's a "Custom Access Token" hook configured
3. If yes, note the function name

#### Step 2: Use the Correct Hook Function
We've created a `SECURITY DEFINER` function that bypasses RLS:
- Function name: `public.custom_access_token_hook`
- This function safely queries the `users` table without triggering RLS

#### Step 3: Configure in Supabase Dashboard

**Option A: If you have a custom hook configured**
1. Go to **Authentication** > **Hooks**
2. Under "Custom Access Token", select `public.custom_access_token_hook`
3. Save

**Option B: If no hook is configured (RECOMMENDED FOR NOW)**
1. **DO NOT configure any custom access token hook yet**
2. Instead, we'll fetch user data after successful login in the application
3. This avoids the circular dependency entirely

### Current Recommended Approach

For now, **REMOVE** any custom access token hook configuration:
1. Go to Supabase Dashboard > Authentication > Hooks
2. If "Custom Access Token" has a function selected, clear it
3. Save

Then, in your application:
- After successful login, fetch user data from the `users` table
- Store `organization_id` and `role` in the session or app state
- Use these values for authorization checks

### Alternative: Temporary RLS Policy Fix

If you want JWT claims to work, we need to modify the RLS policies to handle the case where claims don't exist yet during token generation:

```sql
-- Update RLS policies to allow auth admin to query during token generation
-- This is safe because SECURITY DEFINER functions already bypass RLS
```

## Next Steps

1. **Check Supabase Dashboard** for any configured auth hooks
2. **Remove any custom access token hooks** temporarily
3. **Try logging in again** - it should work now
4. Later, we can properly configure the hook once RLS is adjusted
