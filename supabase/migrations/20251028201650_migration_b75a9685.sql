DROP FUNCTION IF EXISTS whoami();

CREATE OR REPLACE FUNCTION whoami()
RETURNS jsonb AS $$
BEGIN
  RETURN jsonb_build_object(
    'uid', auth.uid(),
    'role', auth.role(),
    'claims', current_setting('request.jwt.claims', true)::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION whoami() TO authenticated;
GRANT EXECUTE ON FUNCTION whoami() TO anon;