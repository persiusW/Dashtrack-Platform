
# JWT Claims Configuration Guide

## Overview

DashTrack uses Supabase Auth with custom JWT claims for multi-tenant isolation. This guide explains how to configure the required claims.

## Required Claims

Every authenticated user must have these claims in their JWT:

```json
{
  "organization_id": "uuid-of-users-organization",
  "role": "client_manager"
}
```

### Claim Definitions

- **organization_id**: UUID linking user to their organization (enables RLS filtering)
- **role**: User's permission level within the organization

### Valid Roles

1. **admin** - Global admin, access to all organizations
2. **client_manager** - Full access within own organization
3. **zone_supervisor** - Manages zones and agents within own organization
4. **external_agent** - Limited access, primarily for mobile app use

## Implementation Methods

### Method 1: Database Trigger (Recommended)

Automatically set claims when new users sign up:

```sql
-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Get or create default organization
  SELECT id INTO default_org_id 
  FROM organizations 
  WHERE name = 'Default Organization' 
  LIMIT 1;
  
  IF default_org_id IS NULL THEN
    INSERT INTO organizations (name, plan)
    VALUES ('Default Organization', 'free')
    RETURNING id INTO default_org_id;
  END IF;
  
  -- Insert user record
  INSERT INTO public.users (id, organization_id, role)
  VALUES (new.id, default_org_id, 'client_manager');
  
  -- Update JWT claims in auth.users
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'organization_id', default_org_id::text,
      'role', 'client_manager'
    )
  WHERE id = new.id;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();
```

### Method 2: Admin Dashboard

Manually set claims in Supabase Dashboard:

1. Go to **Authentication → Users**
2. Click on a user
3. Scroll to **User Metadata**
4. Add custom claim in `raw_app_meta_data`:

```json
{
  "organization_id": "your-org-uuid",
  "role": "client_manager"
}
```

5. Save changes

### Method 3: Management API

Use Supabase Management API to set claims programmatically:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Requires service role key
);

async function setUserClaims(userId: string, orgId: string, role: string) {
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: {
      organization_id: orgId,
      role: role
    }
  });
  
  if (error) {
    console.error("Error setting claims:", error);
    return false;
  }
  
  return true;
}

// Usage
await setUserClaims(
  "user-uuid-here",
  "org-uuid-here", 
  "client_manager"
);
```

### Method 4: Edge Function

Set claims during custom signup flow:

```typescript
// supabase/functions/signup/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { email, password, organizationName } = await req.json();
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  
  // Create organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: organizationName, plan: "free" })
    .select()
    .single();
  
  if (orgError) throw orgError;
  
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      organization_id: org.id,
      role: "client_manager"
    }
  });
  
  if (authError) throw authError;
  
  // Create user record
  await supabase.from("users").insert({
    id: authData.user.id,
    organization_id: org.id,
    role: "client_manager"
  });
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
});
```

## Accessing Claims in Code

### Client-Side (Browser)

```typescript
import { supabase } from "@/integrations/supabase/client";

// Get current user's claims
const { data: { session } } = await supabase.auth.getSession();

if (session?.user) {
  const organizationId = session.user.app_metadata.organization_id;
  const role = session.user.app_metadata.role;
  
  console.log("User org:", organizationId);
  console.log("User role:", role);
}
```

### Server-Side (API Routes)

```typescript
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const orgId = user.app_metadata.organization_id;
  const role = user.app_metadata.role;
  
  // Use claims for authorization logic
  if (role === "admin") {
    // Allow access to all data
  } else {
    // Restrict to organization_id
  }
}
```

### Database Functions

Claims are automatically available in Postgres:

```sql
-- Helper function (already created in migrations)
CREATE OR REPLACE FUNCTION auth.user_organization_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'organization_id')::uuid,
    NULL
  );
$$ LANGUAGE SQL STABLE;

-- Usage in policies
CREATE POLICY "Users see own org data"
  ON activations FOR SELECT
  USING (organization_id = auth.user_organization_id());
```

## Testing Claims

### Verify Claims Are Set

```typescript
import { supabase } from "@/integrations/supabase/client";

async function checkClaims() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.log("No active session");
    return;
  }
  
  console.log("User ID:", session.user.id);
  console.log("Email:", session.user.email);
  console.log("Claims:", session.user.app_metadata);
  
  // Check required claims
  const hasOrgId = !!session.user.app_metadata.organization_id;
  const hasRole = !!session.user.app_metadata.role;
  
  console.log("Has organization_id:", hasOrgId);
  console.log("Has role:", hasRole);
  
  return hasOrgId && hasRole;
}
```

### Test RLS Enforcement

```sql
-- Set session to simulate user
SET request.jwt.claims = '{"sub": "user-uuid", "organization_id": "org-uuid", "role": "client_manager"}';

-- This should only return data for specified org
SELECT * FROM activations;

-- Reset
RESET request.jwt.claims;
```

## Troubleshooting

### Issue: RLS blocks all queries

**Cause**: JWT claims not set correctly

**Solution**: 
1. Check user's `raw_app_meta_data` in Supabase Dashboard
2. Verify claims are strings, not objects
3. Ensure UUID format is correct
4. Check trigger is enabled and executing

### Issue: Users can see other organizations' data

**Cause**: RLS policies not enforcing properly

**Solution**:
1. Verify RLS is enabled: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;`
2. Check policies exist: `SELECT * FROM pg_policies WHERE schemaname = 'public';`
3. Test with SQL injection: `SET request.jwt.claims = '...'`

### Issue: Claims not available in JWT

**Cause**: Using `user_metadata` instead of `app_metadata`

**Solution**: Always use `app_metadata` for security-related claims. User metadata can be modified by clients.

## Security Best Practices

1. **Never store organization_id in user_metadata** - It can be modified by client
2. **Always use app_metadata** - Only modifiable server-side
3. **Validate role values** - Check against enum before setting
4. **Audit claim changes** - Log all modifications to claims
5. **Use service role key carefully** - Only in secure server environments
6. **Refresh tokens regularly** - Claims are baked into JWT at issue time

## Migration Checklist

- [ ] Create trigger function for new users
- [ ] Enable trigger on auth.users
- [ ] Set claims for existing users
- [ ] Test RLS with different roles
- [ ] Verify claims in client application
- [ ] Document organization assignment process
- [ ] Create admin tool for claim management

---

**Last Updated**: 2025-10-28
