
# DashTrack Backend Documentation

## Overview

DashTrack is a multi-tenant SaaS backend built on Supabase for intelligent link tracking and campaign management. It features comprehensive row-level security, automated data retention, and public agent statistics.

## Database Architecture

### Core Tables

1. **organizations** - Tenant root entities
   - `id` (UUID, PK)
   - `name` (TEXT)
   - `plan` (TEXT: free/starter/professional/enterprise)
   - `created_at`, `updated_at`

2. **users** - Extends auth.users with organizational roles
   - `id` (UUID, PK, references auth.users)
   - `organization_id` (UUID, FK to organizations)
   - `role` (TEXT: admin/client_manager/zone_supervisor/external_agent)
   - `created_at`, `updated_at`

3. **activations** - Marketing campaigns
   - `id` (UUID, PK)
   - `organization_id` (UUID, FK)
   - `name`, `description`, `type` (single/multi)
   - `start_at`, `end_at`, `status` (draft/live/paused/ended)
   - `default_landing_url`
   - `created_at`, `updated_at`

4. **zones** - Geographic tracking areas
   - `id` (UUID, PK)
   - `organization_id`, `activation_id` (UUIDs, FKs)
   - `name`, `address`, `lat`, `lng`
   - `zone_stand_link_id` (UUID, FK to tracked_links)
   - `created_at`, `updated_at`

5. **agents** - External staff with public stats
   - `id` (UUID, PK)
   - `organization_id` (UUID, FK)
   - `name`, `phone`, `email`, `active`
   - `public_stats_token` (TEXT, unique) - for public stats access
   - `created_at`, `updated_at`

6. **zone_agents** - Agent zone assignments
   - `id` (UUID, PK)
   - `organization_id`, `zone_id`, `agent_id` (UUIDs, FKs)
   - UNIQUE constraint on (zone_id, agent_id)
   - `created_at`, `updated_at`

7. **tracked_links** - Smart redirect URLs
   - `id` (UUID, PK)
   - `organization_id`, `activation_id`, `zone_id`, `agent_id` (UUIDs, FKs)
   - `slug` (TEXT, unique)
   - `destination_strategy` (single/smart)
   - `single_url`, `ios_url`, `android_url`, `fallback_url`
   - `notes`, `is_active`
   - `created_at`, `updated_at`

8. **clicks** - High-volume event tracking
   - `id` (BIGSERIAL, PK)
   - `organization_id`, `activation_id`, `zone_id`, `agent_id`, `tracked_link_id`
   - `ip` (INET), `user_agent`, `referrer`, `device_type`
   - `is_bot` (BOOLEAN)
   - `created_at` (no updated_at - immutable events)

9. **daily_metrics** - Aggregated statistics
   - `id` (BIGSERIAL, PK)
   - `organization_id`, `tracked_link_id` (UUIDs, FKs)
   - `date` (DATE)
   - `clicks`, `uniques`, `valid_clicks` (INT)
   - UNIQUE constraint on (tracked_link_id, date)
   - `created_at`, `updated_at`

## Security Model

### Row-Level Security (RLS)

All tables have RLS enabled with the following policy structure:

#### Organization Isolation
```sql
-- Helper function extracts org_id from JWT
auth.user_organization_id() -> UUID

-- Standard policy pattern
WHERE organization_id = auth.user_organization_id() OR auth.is_admin()
```

#### Role-Based Access

- **admin**: Full access across all organizations
- **client_manager**: Full CRUD within own organization
- **zone_supervisor**: Read all, write zones/agents/links within own org
- **external_agent**: No direct database access (use public APIs)

#### Special Policies

**Clicks table**: Allows anonymous inserts for tracking endpoints
```sql
CREATE POLICY "Anonymous can insert clicks"
  ON clicks FOR INSERT TO anon WITH CHECK (true);
```

**Public agent stats**: Function-based access without authentication
```sql
SELECT * FROM get_agent_public_stats('token_here');
```

### Storage Bucket Security

**Bucket: `qr` (private)**

Policies:
- Read: Authenticated users in same organization
- Write: client_manager and zone_supervisor roles only
- Public access: Via signed URLs generated server-side

## Environment Configuration

### Required JWT Claims

Your Supabase Auth must include these custom claims in the JWT:

```json
{
  "organization_id": "uuid-here",
  "role": "client_manager"
}
```

#### Setting JWT Claims

In Supabase Dashboard → Authentication → Users → Select User → Custom Claims:

```sql
-- Example: Set claims when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, organization_id, role)
  VALUES (new.id, 'org-uuid-here', 'client_manager');
  
  -- Set JWT claims
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || 
    jsonb_build_object(
      'organization_id', 'org-uuid-here',
      'role', 'client_manager'
    )
  WHERE id = new.id;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Environment Variables

Required in your application `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# For server-side click tracking API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

## Data Retention & Automation

### Automated Cleanup (Monthly)

Runs on the 1st of each month at 2:00 AM UTC:
```sql
DELETE FROM clicks WHERE created_at < now() - interval '30 days';
```

### Daily Metrics Computation

Runs daily at 1:00 AM UTC (before cleanup):
```sql
SELECT recompute_daily_metrics();
```

Aggregates clicks into daily_metrics for long-term storage before deletion.

## API Endpoints to Implement

### Public Endpoints (No Auth)

1. **Click Tracking**
   - `POST /api/track/:slug`
   - Records click, redirects to destination
   - Uses service role key for insert

2. **Agent Stats**
   - `GET /api/agents/:token/stats`
   - Public read-only stats via token
   - Uses `get_agent_public_stats()` function

3. **QR Code Access**
   - `GET /api/qr/:agent_id`
   - Returns signed URL for agent QR image
   - Time-limited access

### Authenticated Endpoints

4. **Dashboard APIs**
   - `GET /api/dashboard/overview` - Org-wide metrics
   - `GET /api/activations` - List campaigns
   - `GET /api/zones` - List zones
   - `GET /api/agents` - List agents
   - Standard CRUD for all entities

5. **Analytics**
   - `GET /api/analytics/clicks` - Detailed click data
   - `GET /api/analytics/metrics` - Daily aggregates
   - `GET /api/analytics/export` - CSV/JSON export

## Seed Data

A complete test organization is seeded with:
- Organization: "Acme Corporation" (Professional plan)
- Activation: "Summer Campaign 2025" (Live, multi-zone)
- Zone: "Downtown Store" (with coordinates)
- Agent: "John Doe" (with public stats token)
- Tracked Link: Smart redirect with platform detection
- Sample Clicks: 4 test events

Agent stats token can be retrieved:
```sql
SELECT public_stats_token FROM agents WHERE name = 'John Doe';
```

## Next Steps

1. **Implement Frontend Dashboard**
   - Authentication flow
   - Organization management
   - Campaign creation and monitoring
   - Zone and agent management

2. **Build Agent Portal**
   - Public stats page using token
   - QR code display
   - No authentication required

3. **Create Tracking API**
   - Click recording endpoint
   - Smart redirect logic (iOS/Android detection)
   - Bot filtering

4. **Add Analytics Views**
   - Real-time dashboards
   - Export functionality
   - Custom date ranges

5. **QR Code Generation**
   - Dynamic QR generation
   - Storage in `qr` bucket
   - Signed URL generation

## Testing

### Verify RLS Policies

```sql
-- Test as authenticated user
SET request.jwt.claims = '{"organization_id": "00000000-0000-0000-0000-000000000001", "role": "client_manager"}';
SELECT * FROM activations; -- Should see only org's data

-- Test admin bypass
SET request.jwt.claims = '{"role": "admin"}';
SELECT * FROM organizations; -- Should see all orgs
```

### Test Public Agent Stats

```bash
curl "https://your-project.supabase.co/rest/v1/rpc/get_agent_public_stats" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"token": "agent-token-here"}'
```

### Verify Storage Policies

1. Upload QR code as client_manager
2. Generate signed URL
3. Access from unauthenticated client
4. Confirm 60s expiration

## Maintenance

### Monitor Cron Jobs

```sql
-- Check scheduled jobs
SELECT * FROM cron.job;

-- Check job run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### Database Health

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor click volume
SELECT COUNT(*), DATE(created_at) 
FROM clicks 
GROUP BY DATE(created_at) 
ORDER BY DATE(created_at) DESC 
LIMIT 7;
```

## Support

For questions or issues:
- Supabase Docs: https://supabase.com/docs
- GitHub Issues: [Your Repository]
- Email: support@dashtrack.io

---

**Copyright © 2025 DashTrack. All rights reserved.**
