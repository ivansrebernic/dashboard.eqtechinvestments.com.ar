-- Create portfolio performance snapshot system
-- This creates the tables needed for storing historical portfolio performance data

-- Create snapshot configurations table for managing snapshot intervals
CREATE TABLE public.snapshot_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE, -- NULL means global config
  interval_hours INTEGER NOT NULL CHECK (interval_hours > 0), -- 6, 24, 168 (weekly), etc.
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Ensure only one config per portfolio (or one global config)
  UNIQUE(portfolio_id, interval_hours)
);

-- Create portfolio performance snapshots table
CREATE TABLE public.portfolio_performance_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Core performance metrics
  weighted_return_percentage NUMERIC(10,4) NOT NULL, -- The calculated weighted return
  total_change_24h NUMERIC(10,4), -- Overall 24h change percentage
  asset_count INTEGER NOT NULL CHECK (asset_count >= 0),
  
  -- Top and worst performers
  top_performer_symbol TEXT,
  top_performer_change NUMERIC(10,4),
  worst_performer_symbol TEXT,
  worst_performer_change NUMERIC(10,4),
  
  -- Complete snapshot data as JSON for flexibility and debugging
  snapshot_data JSONB NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX idx_snapshot_configurations_portfolio_id ON public.snapshot_configurations(portfolio_id);
CREATE INDEX idx_snapshot_configurations_enabled ON public.snapshot_configurations(enabled);
CREATE INDEX idx_snapshot_configurations_last_run ON public.snapshot_configurations(last_run_at);

CREATE INDEX idx_portfolio_snapshots_portfolio_id ON public.portfolio_performance_snapshots(portfolio_id);
CREATE INDEX idx_portfolio_snapshots_calculated_at ON public.portfolio_performance_snapshots(calculated_at DESC);
CREATE INDEX idx_portfolio_snapshots_portfolio_time ON public.portfolio_performance_snapshots(portfolio_id, calculated_at DESC);

-- Enable RLS on both tables
ALTER TABLE public.snapshot_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_performance_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS policies - Admin only for configurations, read access for authenticated users on snapshots
CREATE POLICY "Admin only access to snapshot configurations" ON public.snapshot_configurations
  FOR ALL USING (public.is_admin());

CREATE POLICY "Authenticated users can read snapshots" ON public.portfolio_performance_snapshots
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage snapshots" ON public.portfolio_performance_snapshots
  FOR ALL USING (public.is_admin());

-- Create trigger for auto-updating updated_at on configurations
CREATE TRIGGER handle_snapshot_configurations_updated_at
  BEFORE UPDATE ON public.snapshot_configurations
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.snapshot_configurations TO authenticated;
GRANT SELECT ON public.portfolio_performance_snapshots TO authenticated;
GRANT ALL ON public.portfolio_performance_snapshots TO authenticated;

-- Create function to get portfolios that need snapshots
CREATE OR REPLACE FUNCTION public.get_portfolios_needing_snapshots()
RETURNS TABLE(
  portfolio_id UUID,
  portfolio_name TEXT,
  interval_hours INTEGER,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_due TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as portfolio_id,
    p.name as portfolio_name,
    sc.interval_hours,
    sc.last_run_at,
    (sc.last_run_at + (sc.interval_hours || ' hours')::INTERVAL) as next_run_due
  FROM public.portfolios p
  LEFT JOIN public.snapshot_configurations sc ON p.id = sc.portfolio_id
  WHERE sc.enabled = true
    AND (
      sc.last_run_at IS NULL 
      OR sc.last_run_at + (sc.interval_hours || ' hours')::INTERVAL <= now()
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to update last run timestamp
CREATE OR REPLACE FUNCTION public.update_snapshot_last_run(
  p_portfolio_id UUID,
  p_interval_hours INTEGER
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.snapshot_configurations 
  SET 
    last_run_at = now(),
    updated_at = now()
  WHERE portfolio_id = p_portfolio_id 
    AND interval_hours = p_interval_hours;
END;
$$ LANGUAGE plpgsql;