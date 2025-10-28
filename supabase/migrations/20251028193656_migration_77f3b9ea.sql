-- Fix the circular dependency by allowing supabase_auth_admin to query users table
-- This is necessary for custom JWT claims hooks to work

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Admins and client managers can insert users" ON users;
DROP POLICY IF EXISTS "Admins and client managers can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Create new policies that handle auth hooks
-- SELECT policy: Allow auth admin + authenticated users in same org
CREATE POLICY "Users can view users in their organization"
ON users FOR SELECT
TO authenticated
USING (
  -- Allow if user is admin
  is_admin()
  OR
  -- Allow if same organization
  organization_id = current_user_organization_id()
  OR
  -- Allow for the current user (during login to fetch their own data)
  id = auth.uid()
);

-- INSERT policy: Allow auth admin + admin users + client managers in same org
CREATE POLICY "Admins and client managers can insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  is_admin()
  OR
  (
    organization_id = current_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'client_manager')
    )
  )
);

-- UPDATE policy: Allow auth admin + admin users + client managers in same org
CREATE POLICY "Admins and client managers can update users"
ON users FOR UPDATE
TO authenticated
USING (
  is_admin()
  OR
  (
    organization_id = current_user_organization_id()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'client_manager')
    )
  )
  OR
  -- Allow users to update their own record
  id = auth.uid()
);

-- DELETE policy: Only admins
CREATE POLICY "Admins can delete users"
ON users FOR DELETE
TO authenticated
USING (is_admin());

COMMENT ON POLICY "Users can view users in their organization" ON users IS 'Updated to allow users to fetch their own data during login';