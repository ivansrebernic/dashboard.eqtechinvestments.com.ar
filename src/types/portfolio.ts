export interface Portfolio {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt?: string
  createdBy?: string
  holdings: PortfolioHolding[]
}

export interface PortfolioHolding {
  id: string
  symbol: string
  amount: number
  addedAt: string
  updatedAt?: string
}

// Database-specific interfaces
export interface DbPortfolio {
  id: string
  name: string
  description?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface DbPortfolioHolding {
  id: string
  portfolio_id: string
  symbol: string
  amount: number
  created_at: string
  updated_at: string
}

export interface PortfolioPerformance {
  totalValue: number
  holdings: HoldingPerformance[]
}

export interface HoldingPerformance {
  symbol: string
  amount: number
  currentPrice: number
  totalValue: number
}

export interface CreatePortfolioData {
  name: string
  description?: string
}

export interface AddHoldingData {
  symbol: string
  amount: number
}

// API Request/Response Types
export interface CreatePortfolioRequest {
  name: string
  description?: string
}

export interface UpdatePortfolioRequest {
  name?: string
  description?: string
}

export interface CreatePortfolioResponse {
  portfolio: Portfolio
}

export interface GetPortfoliosResponse {
  portfolios: Portfolio[]
}

export interface GetPortfolioResponse {
  portfolio: Portfolio
}

export interface AddHoldingRequest {
  symbol: string
  amount: number
}

export interface UpdateHoldingRequest {
  amount: number
}

export interface ApiErrorResponse {
  error: string
}

// Additional types for detailed portfolio views
export interface PortfolioWithHoldings extends Portfolio {
  holdings: PortfolioHolding[]
}