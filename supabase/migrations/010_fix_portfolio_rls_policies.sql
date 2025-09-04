-- Fix portfolio RLS policies to allow basic users read access
-- while maintaining admin-only access for modifications

-- Drop existing overly restrictive policies
DROP POLICY IF EXISTS "Admin only access to portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Admin only access to portfolio_holdings" ON public.portfolio_holdings;
DROP POLICY IF EXISTS "Admins can manage portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Admins can manage holdings" ON public.portfolio_holdings;

-- Create new granular RLS policies for portfolios table
-- All authenticated users can read portfolios
CREATE POLICY "Authenticated users can read portfolios" ON public.portfolios
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can create, update, or delete portfolios
CREATE POLICY "Admins can manage portfolios" ON public.portfolios
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update portfolios" ON public.portfolios
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete portfolios" ON public.portfolios
  FOR DELETE USING (public.is_admin());

-- Create new granular RLS policies for portfolio_holdings table
-- All authenticated users can read portfolio holdings
CREATE POLICY "Authenticated users can read portfolio_holdings" ON public.portfolio_holdings
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only admins can create, update, or delete portfolio holdings
CREATE POLICY "Admins can manage portfolio_holdings" ON public.portfolio_holdings
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update portfolio_holdings" ON public.portfolio_holdings
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete portfolio_holdings" ON public.portfolio_holdings
  FOR DELETE USING (public.is_admin());