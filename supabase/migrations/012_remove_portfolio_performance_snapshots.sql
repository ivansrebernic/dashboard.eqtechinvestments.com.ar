-- Remove portfolio performance snapshot system
-- This removes the scheduled snapshot functionality and related tables

-- Drop foreign key constraint first
ALTER TABLE public.portfolio_performance_snapshots 
DROP CONSTRAINT IF EXISTS portfolio_performance_snapshots_portfolio_id_fkey;

-- Drop the portfolio performance snapshots table
DROP TABLE IF EXISTS public.portfolio_performance_snapshots;

-- Drop the cron job logs table  
DROP TABLE IF EXISTS public.cron_job_logs;

-- Remove any functions related to snapshot creation (if they exist)
DROP FUNCTION IF EXISTS public.create_portfolio_snapshot();
DROP FUNCTION IF EXISTS public.create_all_portfolio_snapshots();
DROP FUNCTION IF EXISTS public.call_create_snapshots_edge_function();
DROP FUNCTION IF EXISTS public.trigger_snapshot_creation();
DROP FUNCTION IF EXISTS public.trigger_snapshot_creation_service();

-- Remove any cron jobs (if they exist in pg_cron extension)
-- This is safe to run even if pg_cron is not installed
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.unschedule('create_portfolio_snapshots');
    END IF;
EXCEPTION 
    WHEN OTHERS THEN
        -- Ignore errors if cron job doesn't exist
        NULL;
END $$;