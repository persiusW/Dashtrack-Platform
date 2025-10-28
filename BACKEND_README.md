
# DashTrack Backend Architecture

## Overview

DashTrack is a multi-tenant SaaS platform built on Supabase with comprehensive Row-Level Security (RLS) policies, designed for tracking agent activations across multiple zones with detailed analytics.

## Tech Stack

- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth (Email/Password + Google OAuth)
- **Storage**: Supabase Storage (for QR codes)
- **Functions**: Supabase Edge Functions (for serverless operations)
- **Frontend**: Next.js 15 (Page Router)

---

## Database Schema

### Core Tables

#### organizations
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client_manager', 'zone_supervisor', 'external_agent')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### activations
```sql
CREATE TABLE activations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'single' CHECK (type IN ('single', 'multi')),
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'paused', 'ended')),
  default_landing_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### zones
```sql
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  activation_id UUID NOT NULL REFERENCES activations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  zone_stand_link_id UUID REFERENCES tracked_links(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### agents
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  active BOOLEAN DEFAULT TRUE,
  public_stats_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### zone_agents
```sql
CREATE TABLE zone_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(zone_id, agent_id)
);
```

#### tracked_links
```sql
CREATE TABLE tracked_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  activation_id UUID NOT NULL REFERENCES activations(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  slug TEXT UNIQUE NOT NULL,
  destination_strategy TEXT DEFAULT 'smart' CHECK (destination_strategy IN ('single', 'smart')),
  single_url TEXT,
  ios_url TEXT,
  android_url TEXT,
  fallback_url TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### clicks
```sql
CREATE TABLE clicks (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  activation_id UUID NOT NULL REFERENCES activations(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  tracked_link_id UUID NOT NULL REFERENCES tracked_links(id) ON DELETE CASCADE,
  ip INET,
  user_agent TEXT,
  referrer TEXT,
  device_type TEXT,
  is_bot BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### daily_metrics
```sql
CREATE TABLE daily_metrics (
  id BIGSERIAL PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tracked_link_id UUID NOT NULL REFERENCES tracked_links(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clicks INT DEFAULT 0,
  uniques INT DEFAULT 0,
  valid_clicks INT DEFAULT 0,
  UNIQUE(tracked_link_id, date)
);
```

---

## Indexes

```sql
-- Organizations
CREATE INDEX idx_organizations_name ON organizations(name);

-- Users
CREATE INDEX idx_users_org_role ON users(organization_id, role);

-- Activations
CREATE INDEX idx_activations_org_status ON activations(organization_id, status, start_at);

-- Zones
CREATE INDEX idx_zones_activation ON zones(activation_id, name);

-- Agents
CREATE INDEX idx_agents_org_active ON agents(organization_id, active);
CREATE INDEX idx_agents_public_token ON agents(public_stats_token);

-- Tracked Links
CREATE INDEX idx_tracked_links_org ON tracked_links(organization_id, activation_id, zone_id, agent_id);
CREATE INDEX idx_tracked_links_slug ON tracked_links(slug);

-- Clicks
CREATE INDEX idx_clicks_org_activation ON clicks(organization_id, activation_id, zone_id, agent_id, tracked_link_id);
CREATE INDEX idx_clicks_created_at ON clicks(created_at DESC);
CREATE INDEX idx_clicks_tracked_link ON clicks(tracked_link_id, created_at DESC);

-- Daily Metrics
CREATE INDEX idx_daily_metrics_org ON daily_metrics(organization_id, tracked_link_id, date);
```

---

## Row-Level Security (RLS)

### Multi-Tenant Security Model

All tables have RLS enabled with policies that enforce organization-level isolation:

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
```

### JWT Claims Structure

The JWT token includes custom claims:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "organization_id": "org-uuid",
  "role": "client_manager"
}
```

### Standard RLS Policies

For most tables, the policy pattern is:

```sql
-- Example for activations table
CREATE POLICY "Users can view their org's activations"
  ON activations FOR SELECT
  USING (
    organization_id = (current_setting('request.jwt.claims')::json->>'organization_id')::uuid
    OR
    (current_setting('request.jwt.claims')::json->>'role')::text = 'admin'
  );

CREATE POLICY "Users can insert their org's activations"
  ON activations FOR INSERT
  WITH CHECK (
    organization_id = (current_setting('request.jwt.claims')::json->>'organization_id')::uuid
  );

CREATE POLICY "Users can update their org's activations"
  ON activations FOR UPDATE
  USING (
    organization_id = (current_setting('request.jwt.claims')::json->>'organization_id')::uuid
  );

CREATE POLICY "Users can delete their org's activations"
  ON activations FOR DELETE
  USING (
    organization_id = (current_setting('request.jwt.claims')::json->>'organization_id')::uuid
  );
```

### Special Policies

#### Clicks (Anonymous Insert)

Clicks can be inserted anonymously (for tracking purposes):

```sql
CREATE POLICY "Allow anonymous click inserts"
  ON clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their org's clicks"
  ON clicks FOR SELECT
  USING (
    organization_id = (current_setting('request.jwt.claims')::json->>'organization_id')::uuid
    OR
    (current_setting('request.jwt.claims')::json->>'role')::text = 'admin'
  );
```

#### Admin Bypass

Admins can access all organizations:

```sql
-- This is included in all SELECT policies:
OR (current_setting('request.jwt.claims')::json->>'role')::text = 'admin'
```

---

## Storage

### QR Code Bucket

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('qr', 'qr', false);

-- Storage policy: authenticated users from same org can read
CREATE POLICY "Authenticated users can view QR codes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'qr' 
    AND auth.uid() IS NOT NULL
  );

-- Insert policy: authenticated users can upload
CREATE POLICY "Authenticated users can upload QR codes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'qr' 
    AND auth.uid() IS NOT NULL
  );
```

### QR Code URL Generation

For agents (who don't log in), generate signed URLs:

```typescript
const { data, error } = await supabase
  .storage
  .from('qr')
  .createSignedUrl(`agents/${agentId}.png`, 3600); // 1 hour expiry
```

---

## Data Retention

### Automated Cleanup (Cron Job)

Install pg_cron extension and create monthly cleanup:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule monthly cleanup (runs on 1st of each month at 2 AM)
SELECT cron.schedule(
  'monthly-click-cleanup',
  '0 2 1 * *',
  $$
    DELETE FROM clicks 
    WHERE created_at < now() - interval '30 days';
  $$
);
```

### Manual Cleanup

```sql
-- Delete clicks older than 30 days
DELETE FROM clicks WHERE created_at < now() - interval '30 days';

-- Recompute daily metrics (optional)
INSERT INTO daily_metrics (organization_id, tracked_link_id, date, clicks, uniques)
SELECT 
  organization_id,
  tracked_link_id,
  DATE(created_at) as date,
  COUNT(*) as clicks,
  COUNT(DISTINCT ip) as uniques
FROM clicks
WHERE DATE(created_at) >= CURRENT_DATE - interval '30 days'
GROUP BY organization_id, tracked_link_id, DATE(created_at)
ON CONFLICT (tracked_link_id, date) 
DO UPDATE SET 
  clicks = EXCLUDED.clicks,
  uniques = EXCLUDED.uniques;
```

---

## Public Agent Stats

### Security Approach

Agents don't log in but need to view their stats. Solution:

1. Each agent has a unique `public_stats_token` (UUID)
2. Create a SQL view or RPC that accepts this token
3. The view returns aggregate data only (no PII, no IPs)

### SQL View Example

```sql
CREATE OR REPLACE FUNCTION get_agent_stats(token TEXT)
RETURNS TABLE (
  agent_name TEXT,
  total_clicks BIGINT,
  last_7_days_clicks BIGINT,
  daily_data JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.name,
    COUNT(c.id)::BIGINT as total_clicks,
    COUNT(c.id) FILTER (WHERE c.created_at >= now() - interval '7 days')::BIGINT as last_7_days,
    jsonb_agg(
      jsonb_build_object(
        'date', DATE(c.created_at),
        'clicks', COUNT(*)
      )
      ORDER BY DATE(c.created_at)
    ) FILTER (WHERE c.created_at >= now() - interval '7 days') as daily_data
  FROM agents a
  LEFT JOIN clicks c ON c.agent_id = a.id
  WHERE a.public_stats_token = token
  GROUP BY a.id, a.name;
END;
$$;
```

### Usage in Frontend

```typescript
const { data, error } = await supabase
  .rpc('get_agent_stats', { token: publicStatsToken });
```

---

## Authentication Flow

### JWT Claims Setup

After a user logs in, retrieve their organization_id and role, then update the JWT:

```typescript
// On login success
const { data: userData } = await supabase
  .from('users')
  .select('organization_id, role')
  .eq('id', user.id)
  .single();

// Store in session or context
// The JWT automatically includes user.id
// Custom claims are set server-side in Supabase Auth hooks
```

### Supabase Auth Hooks (Server-Side)

To inject `organization_id` and `role` into JWT claims:

```sql
-- Create a database function to be called by Auth hooks
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  claims jsonb;
  user_org_id uuid;
  user_role text;
BEGIN
  -- Fetch organization_id and role
  SELECT organization_id, role INTO user_org_id, user_role
  FROM public.users
  WHERE id = (event->>'user_id')::uuid;

  claims := event->'claims';

  IF user_org_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{organization_id}', to_jsonb(user_org_id::text));
  END IF;

  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
  END IF;

  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- Note: Configure this function in Supabase Dashboard > Auth > Hooks
-- Hook type: "Custom Access Token"
```

---

## Environment Variables

### Required Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin Configuration
ADMIN_BYPASS_ORG_IDS=uuid1,uuid2,uuid3

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Setting Up Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase project credentials
3. Add admin organization IDs (comma-separated)

---

## Seed Data

### Sample Seed Script

```sql
-- Create organization
INSERT INTO organizations (id, name, plan)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Demo Corp', 'pro');

-- Create user
INSERT INTO users (id, organization_id, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'demo@example.com'),
  '550e8400-e29b-41d4-a716-446655440000',
  'client_manager'
);

-- Create activation
INSERT INTO activations (id, organization_id, name, status, default_landing_url)
VALUES (
  '660e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440000',
  'Summer Campaign 2024',
  'live',
  'https://example.com/landing'
);

-- Create zone
INSERT INTO zones (id, organization_id, activation_id, name, address)
VALUES (
  '770e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440000',
  '660e8400-e29b-41d4-a716-446655440000',
  'Downtown Store',
  '123 Main St, City, State'
);

-- Create agent
INSERT INTO agents (id, organization_id, name, email, public_stats_token)
VALUES (
  '880e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440000',
  'John Smith',
  'john@example.com',
  'agent-token-' || gen_random_uuid()::text
);

-- Create tracked link
INSERT INTO tracked_links (organization_id, activation_id, zone_id, agent_id, slug, single_url)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '660e8400-e29b-41d4-a716-446655440000',
  '770e8400-e29b-41d4-a716-446655440000',
  '880e8400-e29b-41d4-a716-446655440000',
  'summer-downtown-john',
  'https://example.com/product'
);

-- Create sample clicks
INSERT INTO clicks (organization_id, activation_id, zone_id, agent_id, tracked_link_id, ip, device_type)
SELECT 
  '550e8400-e29b-41d4-a716-446655440000',
  '660e8400-e29b-41d4-a716-446655440000',
  '770e8400-e29b-41d4-a716-446655440000',
  '880e8400-e29b-41d4-a716-446655440000',
  (SELECT id FROM tracked_links WHERE slug = 'summer-downtown-john'),
  '192.168.1.' || (random() * 255)::int,
  CASE WHEN random() < 0.5 THEN 'mobile' ELSE 'desktop' END
FROM generate_series(1, 100);
```

---

## API Endpoints (Edge Functions)

### Click Tracking Endpoint

```typescript
// supabase/functions/track-click/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

serve(async (req) => {
  const { slug } = await req.json();
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Get tracked link
  const { data: link } = await supabase
    .from('tracked_links')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!link) {
    return new Response(JSON.stringify({ error: "Link not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Record click
  await supabase.from('clicks').insert({
    organization_id: link.organization_id,
    activation_id: link.activation_id,
    zone_id: link.zone_id,
    agent_id: link.agent_id,
    tracked_link_id: link.id,
    ip: req.headers.get('x-forwarded-for') || 'unknown',
    user_agent: req.headers.get('user-agent') || 'unknown',
  });

  // Redirect to destination
  const destination = link.single_url || link.fallback_url;
  
  return new Response(null, {
    status: 302,
    headers: { "Location": destination },
  });
});
```

---

## Deployment Checklist

- [ ] Create Supabase project
- [ ] Run all migration files in order
- [ ] Enable RLS on all tables
- [ ] Create RLS policies
- [ ] Set up Auth hooks for JWT claims
- [ ] Create storage bucket and policies
- [ ] Set up pg_cron for data retention
- [ ] Configure environment variables
- [ ] Deploy Edge Functions
- [ ] Test authentication flow
- [ ] Test multi-tenancy isolation
- [ ] Verify public agent stats page
- [ ] Set up monitoring and alerts

---

## Support

For issues or questions, please refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- Project issue tracker

---

© 2025 DashTrack. All rights reserved.
