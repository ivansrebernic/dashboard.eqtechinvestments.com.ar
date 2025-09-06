-- Setup cron job for portfolio snapshots every 6 hours
-- This migration creates a scheduled job that calls the create-all-snapshots Edge Function

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the portfolio snapshots job to run every 6 hours
-- Cron expression: '0 */6 * * *' means run at minute 0 of every 6th hour
-- This will run at: 00:00, 06:00, 12:00, 18:00 UTC daily
SELECT cron.schedule(
    'portfolio-snapshots-6h', -- job name
    '0 */6 * * *', -- every 6 hours at minute 0
    $$
    SELECT
      net.http_post(
          url := 'https://obetvwitblwconqnxlxi.supabase.co/functions/v1/create-all-snapshots',
          body := '{}'::jsonb,
          params := '{}'::jsonb,
          headers := jsonb_build_object(
            'Content-Type', 'application/json'
          ),
          timeout_milliseconds := 60000
      );
    $$
);