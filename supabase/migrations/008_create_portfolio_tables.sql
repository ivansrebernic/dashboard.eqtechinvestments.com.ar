-- Create portfolios table
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create portfolio_holdings table  
CREATE TABLE IF NOT EXISTS public.portfolio_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique symbol per portfolio
  UNIQUE(portfolio_id, symbol)
);

-- Create indexes for better performance
CREATE INDEX idx_portfolios_created_by ON public.portfolios(created_by);
CREATE INDEX idx_portfolios_created_at ON public.portfolios(created_at DESC);
CREATE INDEX idx_portfolio_holdings_portfolio_id ON public.portfolio_holdings(portfolio_id);
CREATE INDEX idx_portfolio_holdings_symbol ON public.portfolio_holdings(symbol);

-- Enable Row Level Security
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_holdings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portfolios - only admins can access
CREATE POLICY "Admins can manage portfolios" ON public.portfolios
  FOR ALL USING (public.is_admin());

-- RLS Policies for portfolio_holdings - only admins can access  
CREATE POLICY "Admins can manage holdings" ON public.portfolio_holdings
  FOR ALL USING (public.is_admin());

-- Add update triggers for updated_at columns
CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON public.portfolios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolio_holdings_updated_at
  BEFORE UPDATE ON public.portfolio_holdings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();