
# JWT Custom Claims Setup Guide

## Overview

This guide walks you through setting up custom JWT claims in Supabase to enable multi-tenant Row-Level Security (RLS). By the end, your JWT tokens will automatically include `organization_id` and `role` claims that power the RLS policies.

---

## Why Custom JWT Claims?

**Problem**: Supabase's default JWT only includes `sub` (user ID) and `email`. Our RLS policies need `organization_id` and `role` to enforce multi-tenant isolation.

**Solution**: Use Supabase Auth Hooks to inject custom claims into the JWT during token generation.

---

## Step-by-Step Setup

### Step 1: Create the Database Function

This function will be called by Supabase Auth to customize the JWT token.

1. Open your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query and paste the following:

```sql
-- Create the custom access token hook function
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_org_id uuid;
  user_role text;
BEGIN
  -- Fetch organization_id and role from users table
  SELECT organization_id, role INTO user_org_id, user_role
  FROM public.users
  WHERE id = (event->>'user_id')::uuid;

  -- Get the existing claims from the event
  claims := event->'claims';

  -- Add organization_id to claims if found
  IF user_org_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{organization_id}', to_jsonb(user_org_id::text));
  ELSE
    -- If no organization found, you might want to handle this case
    -- For now, we'll just not add the claim
    NULL;
  END IF;

  -- Add role to claims if found
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
  ELSE
    -- Default role if none found (optional)
    claims := jsonb_set(claims, '{role}', to_jsonb('user'));
  END IF;

  -- Update the event with modified claims
  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;
```

4. Click **Run** to create the function

### Step 2: Grant Permissions

The Auth service needs permission to execute this function:

```sql
-- Grant necessary permissions to supabase_auth_admin
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Revoke from other roles for security
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
```

### Step 3: Configure the Auth Hook

1. In Supabase Dashboard, go to **Authentication** > **Hooks**
2. Click on **Add Hook** or edit existing hooks
3. Select **Custom Access Token** from the hook type dropdown
4. Enter the function name: `custom_access_token_hook`
5. Click **Save**

### Step 4: Test the Setup

#### Create a Test User

If you haven't already, create a test user and assign them to an organization:

```sql
-- First, sign up a user through your app or Supabase Dashboard
-- Then run this to assign them to an organization:

-- Create a test organization
INSERT INTO organizations (name, plan)
VALUES ('Test Organization', 'pro')
RETURNING id;

-- Note the organization ID, then assign the user
-- Replace 'USER_UUID' with actual user ID from auth.users
-- Replace 'ORG_UUID' with the organization ID from above
INSERT INTO users (id, organization_id, role)
VALUES (
  'USER_UUID'::uuid,
  'ORG_UUID'::uuid,
  'client_manager'
);
```

#### Verify JWT Claims

1. Log in with your test user through your Next.js app
2. Check the session in your browser console:

```typescript
import { supabase } from '@/integrations/supabase/client';

// In browser console or a component
const { data: { session } } = await supabase.auth.getSession();
console.log('JWT Claims:', session?.user);
```

3. You should see output like:

```json
{
  "sub": "user-uuid-here",
  "email": "user@example.com",
  "organization_id": "org-uuid-here",
  "role": "client_manager",
  ...
}
```

---

## Troubleshooting

### Claims Not Appearing

**Problem**: JWT doesn't include custom claims after login.

**Solutions**:
1. **Refresh the session**: Log out and log back in
2. **Check function execution**: Verify the function exists:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'custom_access_token_hook';
   ```
3. **Check permissions**: Ensure `supabase_auth_admin` has execute permission
4. **Check hook configuration**: Verify in Dashboard > Authentication > Hooks

### Wrong Organization/Role

**Problem**: Claims show incorrect organization_id or role.

**Solutions**:
1. **Check users table**: Verify data is correct:
   ```sql
   SELECT id, organization_id, role FROM users WHERE id = 'USER_UUID';
   ```
2. **Re-login**: JWT is generated at login time, so changes require re-authentication

### RLS Policies Not Working

**Problem**: Users can't access data even with correct claims.

**Solutions**:
1. **Verify RLS is enabled**:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```
2. **Check policy syntax**: Ensure policies reference claims correctly:
   ```sql
   (current_setting('request.jwt.claims')::json->>'organization_id')::uuid
   ```
3. **Test with service role**: Use Supabase Dashboard SQL Editor to test queries

### Function Returns NULL

**Problem**: Hook function returns NULL instead of modified event.

**Solutions**:
1. **Check user exists**: Ensure user record exists in `users` table before login
2. **Handle missing data**: Update function to provide defaults:
   ```sql
   -- Add to function before RETURN
   IF user_org_id IS NULL THEN
     RAISE NOTICE 'User % has no organization', (event->>'user_id')::uuid;
   END IF;
   ```

---

## Advanced Configuration

### Multiple Roles Support

If a user can have multiple roles, modify the function:

```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  claims jsonb;
  user_org_id uuid;
  user_roles text[];
BEGIN
  -- Fetch organization_id and collect all roles
  SELECT 
    u.organization_id,
    ARRAY_AGG(ur.role) INTO user_org_id, user_roles
  FROM public.users u
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id
  WHERE u.id = (event->>'user_id')::uuid
  GROUP BY u.organization_id;

  claims := event->'claims';

  IF user_org_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{organization_id}', to_jsonb(user_org_id::text));
  END IF;

  IF user_roles IS NOT NULL THEN
    claims := jsonb_set(claims, '{roles}', to_jsonb(user_roles));
  END IF;

  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;
```

### Caching Optimization

For high-traffic apps, consider caching user data:

```sql
-- Create a materialized view for faster lookups
CREATE MATERIALIZED VIEW user_claims_cache AS
SELECT id, organization_id, role
FROM users;

CREATE UNIQUE INDEX ON user_claims_cache(id);

-- Refresh periodically (set up a cron job)
REFRESH MATERIALIZED VIEW CONCURRENTLY user_claims_cache;

-- Use in hook function
SELECT organization_id, role INTO user_org_id, user_role
FROM public.user_claims_cache
WHERE id = (event->>'user_id')::uuid;
```

### Audit Logging

Add logging to track token generation:

```sql
CREATE TABLE auth_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  event_type TEXT,
  claims JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- In hook function, add before RETURN:
INSERT INTO auth_logs (user_id, event_type, claims)
VALUES (
  (event->>'user_id')::uuid,
  'custom_access_token',
  claims
);
```

---

## Security Best Practices

### 1. Principle of Least Privilege

Only grant necessary permissions:

```sql
-- Good: Specific grant to auth service
GRANT EXECUTE ON FUNCTION custom_access_token_hook TO supabase_auth_admin;

-- Bad: Granting to all authenticated users
GRANT EXECUTE ON FUNCTION custom_access_token_hook TO authenticated;
```

### 2. Input Validation

Always validate user input in your hook:

```sql
-- Check event structure
IF event IS NULL OR event->>'user_id' IS NULL THEN
  RAISE EXCEPTION 'Invalid event structure';
END IF;
```

### 3. Error Handling

Gracefully handle errors:

```sql
BEGIN
  -- Your logic here
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in custom_access_token_hook: %', SQLERRM;
    -- Return original event without modifications
    RETURN event;
END;
```

### 4. Sensitive Data

Never include sensitive data in JWT claims:

```sql
-- Bad: Including passwords or API keys
claims := jsonb_set(claims, '{password}', to_jsonb(user_password));

-- Good: Only include identifiers and non-sensitive metadata
claims := jsonb_set(claims, '{organization_id}', to_jsonb(user_org_id));
```

---

## Integration with RLS

Once JWT claims are configured, your RLS policies can reference them:

```sql
-- Example: Activations table policy
CREATE POLICY "Users can view their org's activations"
ON activations FOR SELECT
USING (
  organization_id = (current_setting('request.jwt.claims')::json->>'organization_id')::uuid
  OR
  (current_setting('request.jwt.claims')::json->>'role')::text = 'admin'
);
```

### How It Works

1. User logs in through Next.js app
2. Supabase Auth calls `custom_access_token_hook`
3. Function fetches user's `organization_id` and `role` from database
4. These values are injected into JWT claims
5. JWT is returned to client and stored in session
6. On every database request, RLS policies read claims via `current_setting('request.jwt.claims')`
7. Policies filter results based on `organization_id` match

---

## Monitoring and Maintenance

### Check Hook Execution

Monitor hook performance:

```sql
-- View function execution stats (if pg_stat_statements enabled)
SELECT 
  calls,
  total_exec_time,
  mean_exec_time,
  stddev_exec_time
FROM pg_stat_statements
WHERE query LIKE '%custom_access_token_hook%';
```

### Update Hook Function

When updating the function:

1. Test changes in a development environment first
2. Use `CREATE OR REPLACE FUNCTION` to update atomically
3. Monitor error rates after deployment
4. Have a rollback plan ready

### Regular Audits

Periodically verify:
- [ ] Hook is still configured in Dashboard
- [ ] Function permissions are correct
- [ ] Users table data is accurate
- [ ] No orphaned users without organizations
- [ ] JWT token size remains reasonable (<4KB)

---

## Common Integration Patterns

### Next.js Middleware

Access claims in your middleware:

```typescript
// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Access custom claims
  const organizationId = session.user.organization_id;
  const role = session.user.role;

  // Route protection based on role
  if (req.nextUrl.pathname.startsWith('/app/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/app/overview', req.url));
  }

  return res;
}

export const config = {
  matcher: '/app/:path*',
};
```

### React Context

Use claims in your React components:

```typescript
// src/contexts/AuthContext.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setOrganizationId(session?.user?.organization_id ?? null);
      setRole(session?.user?.role ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setOrganizationId(session?.user?.organization_id ?? null);
      setRole(session?.user?.role ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, organizationId, role }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## Testing Checklist

Before deploying to production:

- [ ] Function created successfully
- [ ] Permissions granted correctly
- [ ] Hook configured in Dashboard
- [ ] Test user can log in
- [ ] JWT includes `organization_id` claim
- [ ] JWT includes `role` claim
- [ ] RLS policies work with claims
- [ ] Admin users can access all organizations
- [ ] Non-admin users are restricted to their organization
- [ ] Claims update when user role changes (after re-login)
- [ ] Claims work across all database tables
- [ ] No performance degradation
- [ ] Error handling works correctly

---

## Support Resources

- [Supabase Auth Hooks Documentation](https://supabase.com/docs/guides/auth/auth-hooks)
- [PostgreSQL SECURITY DEFINER Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [JWT Claims Best Practices](https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-token-claims)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## Conclusion

With custom JWT claims properly configured, your multi-tenant application now has:

✅ Automatic organization-level isolation  
✅ Role-based access control  
✅ Secure, performant data access  
✅ Admin bypass capabilities  
✅ Foundation for advanced features  

Remember to monitor your hook function's performance and keep security best practices in mind as your application grows.

---

© 2025 DashTrack. All rights reserved.
