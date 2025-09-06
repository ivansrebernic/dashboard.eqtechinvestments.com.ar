-- Add default snapshot configurations
-- This creates initial configurations for portfolio snapshots

-- Create a global configuration for 24-hour snapshots (applies to all portfolios)
INSERT INTO public.snapshot_configurations (
  portfolio_id,        -- NULL for global config
  interval_hours,
  enabled
) VALUES (
  NULL,               -- Global configuration
  24,                 -- Every 24 hours
  true                -- Enabled
);

-- Example: Create specific configuration for a portfolio (6-hour intervals)
-- Uncomment and replace with actual portfolio ID if needed
-- INSERT INTO public.snapshot_configurations (
--   portfolio_id,
--   interval_hours,
--   enabled
-- ) VALUES (
--   'your-portfolio-uuid-here',  -- Specific portfolio ID
--   6,                           -- Every 6 hours
--   true                         -- Enabled
-- );

-- You can add multiple configurations with different intervals:
-- INSERT INTO public.snapshot_configurations (
--   portfolio_id,
--   interval_hours,
--   enabled
-- ) VALUES 
-- (NULL, 6, true),   -- Global 6-hour snapshots
-- (NULL, 168, true); -- Global weekly snapshots (168 hours)