-- Migration 5: Data Retention Cron Job

-- Ensure pg_cron extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user if needed
GRANT USAGE ON SCHEMA cron TO postgres;

-- (Optional) Recompute daily metrics before deleting old clicks.
-- This function can be expanded with more complex logic.
CREATE OR REPLACE FUNCTION public.recompute_recent_daily_metrics()
RETURNS void AS $$
BEGIN
  -- This is a placeholder for a more complex re-computation logic
  -- if needed. For now, we assume metrics are computed on the fly
  -- or via another process.
  RAISE NOTICE 'Daily metrics re-computation hook executed.';
END;
$$ LANGUAGE plpgsql;

-- Schedule the cleanup job to run monthly
-- Deletes clicks older than 30 days. Runs on the 1st of every month at 3 AM UTC.
SELECT cron.schedule(
  'monthly-click-cleanup',
  '0 3 1 * *', -- At 03:00 on day-of-month 1.
  $$
    -- First, run any pre-deletion logic if necessary
    SELECT public.recompute_recent_daily_metrics();
    
    -- Then, delete old click data
    DELETE FROM public.clicks WHERE created_at &lt; now() - interval '30 days';
  $$
);

-- To unschedule the job:
-- SELECT cron.unschedule('monthly-click-cleanup');

-- To view scheduled jobs:
-- SELECT * FROM cron.job;