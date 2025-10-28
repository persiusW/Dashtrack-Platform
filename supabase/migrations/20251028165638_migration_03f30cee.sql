-- Drop existing function and recreate with correct return type
DROP FUNCTION IF EXISTS public_agent_stats(TEXT, DATE, DATE);

CREATE OR REPLACE FUNCTION public_agent_stats(
  p_public_stats_token TEXT,
  p_from_date DATE DEFAULT NULL,
  p_to_date DATE DEFAULT NULL
)
RETURNS TABLE(
  agent_id UUID,
  agent_name TEXT,
  total_clicks BIGINT,
  total_valid_clicks BIGINT,
  daily_stats JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_agent_id UUID;
  v_org_id UUID;
  v_from_date DATE;
  v_to_date DATE;
BEGIN
  -- Get agent by public stats token
  SELECT a.id, a.organization_id INTO v_agent_id, v_org_id
  FROM agents a
  WHERE a.public_stats_token = p_public_stats_token;

  IF v_agent_id IS NULL THEN
    RAISE EXCEPTION 'Invalid public stats token';
  END IF;

  -- Set default date range (last 7 days if not provided)
  v_from_date := COALESCE(p_from_date, CURRENT_DATE - INTERVAL '7 days');
  v_to_date := COALESCE(p_to_date, CURRENT_DATE);

  -- Return aggregated stats
  RETURN QUERY
  SELECT
    v_agent_id as agent_id,
    a.name as agent_name,
    COUNT(c.id) FILTER (WHERE c.created_at::date BETWEEN v_from_date AND v_to_date) as total_clicks,
    COUNT(c.id) FILTER (WHERE c.created_at::date BETWEEN v_from_date AND v_to_date AND c.is_bot = false) as total_valid_clicks,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'date', dm.date,
          'clicks', dm.clicks,
          'valid_clicks', dm.valid_clicks,
          'uniques', dm.uniques
        ) ORDER BY dm.date
      ) FILTER (WHERE dm.date BETWEEN v_from_date AND v_to_date),
      '[]'::jsonb
    ) as daily_stats
  FROM agents a
  LEFT JOIN tracked_links tl ON tl.agent_id = v_agent_id
  LEFT JOIN clicks c ON c.agent_id = v_agent_id
  LEFT JOIN daily_metrics dm ON dm.tracked_link_id = tl.id
  WHERE a.id = v_agent_id
  GROUP BY a.id, a.name;
END;
$$;