-- Migration 2 (Fixed): Row Level Security (RLS) Policies
-- Create helper functions in public schema instead of auth schema

-- Enable RLS on all organization-scoped tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

-- Helper function to get organization_id from JWT (public schema)
CREATE OR REPLACE FUNCTION public.current_user_organization_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'organization_id')::uuid,
    NULL
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Helper function to check if user is admin (public schema)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'role') = 'admin',
    false
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Admins can view all organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (id = public.current_user_organization_id());

CREATE POLICY "Admins can insert organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update all organizations"
  ON organizations FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete organizations"
  ON organizations FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Users policies
CREATE POLICY "Users can view users in their organization"
  ON users FOR SELECT
  TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.is_admin());

CREATE POLICY "Admins and client managers can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() OR 
    (organization_id = public.current_user_organization_id() AND 
     EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'client_manager')))
  );

CREATE POLICY "Admins and client managers can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    public.is_admin() OR 
    (organization_id = public.current_user_organization_id() AND 
     EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'client_manager')))
  );

CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Activations policies
CREATE POLICY "Users can view activations in their organization"
  ON activations FOR SELECT
  TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.is_admin());

CREATE POLICY "Client managers can insert activations"
  ON activations FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_user_organization_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'client_manager'))
  );

CREATE POLICY "Client managers can update activations"
  ON activations FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.current_user_organization_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'client_manager'))
  );

CREATE POLICY "Client managers can delete activations"
  ON activations FOR DELETE
  TO authenticated
  USING (
    organization_id = public.current_user_organization_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'client_manager'))
  );

-- Zones policies
CREATE POLICY "Users can view zones in their organization"
  ON zones FOR SELECT
  TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.is_admin());

CREATE POLICY "Managers can insert zones"
  ON zones FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_user_organization_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'client_manager', 'zone_supervisor'))
  );

CREATE POLICY "Managers can update zones"
  ON zones FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.current_user_organization_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'client_manager', 'zone_supervisor'))
  );

CREATE POLICY "Managers can delete zones"
  ON zones FOR DELETE
  TO authenticated
  USING (
    organization_id = public.current_user_organization_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'client_manager', 'zone_supervisor'))
  );

-- Agents policies
CREATE POLICY "Users can view agents in their organization"
  ON agents FOR SELECT
  TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.is_admin());

CREATE POLICY "Managers can insert agents"
  ON agents FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_user_organization_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'client_manager', 'zone_supervisor'))
  );

CREATE POLICY "Managers can update agents"
  ON agents FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.current_user_organization_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'client_manager', 'zone_supervisor'))
  );

CREATE POLICY "Managers can delete agents"
  ON agents FOR DELETE
  TO authenticated
  USING (
    organization_id = public.current_user_organization_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'client_manager', 'zone_supervisor'))
  );

-- Zone agents policies
CREATE POLICY "Users can view zone_agents in their organization"
  ON zone_agents FOR SELECT
  TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.is_admin());

CREATE POLICY "Managers can insert zone_agents"
  ON zone_agents FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_user_organization_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'client_manager', 'zone_supervisor'))
  );

CREATE POLICY "Managers can delete zone_agents"
  ON zone_agents FOR DELETE
  TO authenticated
  USING (
    organization_id = public.current_user_organization_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'client_manager', 'zone_supervisor'))
  );

-- Tracked links policies
CREATE POLICY "Users can view tracked_links in their organization"
  ON tracked_links FOR SELECT
  TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.is_admin());

CREATE POLICY "Managers can insert tracked_links"
  ON tracked_links FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = public.current_user_organization_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'client_manager', 'zone_supervisor'))
  );

CREATE POLICY "Managers can update tracked_links"
  ON tracked_links FOR UPDATE
  TO authenticated
  USING (
    organization_id = public.current_user_organization_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'client_manager', 'zone_supervisor'))
  );

CREATE POLICY "Managers can delete tracked_links"
  ON tracked_links FOR DELETE
  TO authenticated
  USING (
    organization_id = public.current_user_organization_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'client_manager', 'zone_supervisor'))
  );

-- Clicks policies (special: allow anonymous inserts for tracking)
CREATE POLICY "Users can view clicks in their organization"
  ON clicks FOR SELECT
  TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.is_admin());

CREATE POLICY "Service role can insert clicks"
  ON clicks FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Anonymous can insert clicks"
  ON clicks FOR INSERT
  TO anon
  WITH CHECK (true);

-- Daily metrics policies
CREATE POLICY "Users can view daily_metrics in their organization"
  ON daily_metrics FOR SELECT
  TO authenticated
  USING (organization_id = public.current_user_organization_id() OR public.is_admin());

CREATE POLICY "Service role can manage daily_metrics"
  ON daily_metrics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);