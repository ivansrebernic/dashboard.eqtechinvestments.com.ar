export interface SnapshotConfiguration {
  id: string
  portfolioId?: string // null for global config
  intervalHours: number // 6, 24, 168 (weekly), etc.
  enabled: boolean
  lastRunAt?: string
  createdAt: string
  updatedAt: string
}

export interface PortfolioPerformanceSnapshot {
  id: string
  portfolioId: string
  calculatedAt: string
  
  // Core performance metrics
  weightedReturnPercentage: number // The calculated weighted return
  totalChange24h?: number // Overall 24h change percentage
  assetCount: number
  
  // Top and worst performers
  topPerformerSymbol?: string
  topPerformerChange?: number
  worstPerformerSymbol?: string
  worstPerformerChange?: number
  
  // Complete snapshot data as JSON for flexibility
  snapshotData: SnapshotData
  
  createdAt: string
}

export interface SnapshotData {
  portfolioName: string
  holdings: SnapshotHolding[]
  totalValue: number
  totalChange24h: number
  totalChangePercent24h: number
  metrics: {
    assetCount: number
    topPerformer?: {
      symbol: string
      changePercent: number
    }
    worstPerformer?: {
      symbol: string
      changePercent: number
    }
  }
  timestamp: string
  cryptoPrices: Record<string, number> // symbol -> price for reference
}

export interface SnapshotHolding {
  symbol: string
  amount: number
  currentPrice: number
  totalValue: number
  priceChange24h: number
  priceChangePercent24h: number
  portfolioWeight: number
  cryptoId?: number
  cryptoName?: string
}

// Database-specific interfaces for API responses
export interface DbSnapshotConfiguration {
  id: string
  portfolio_id?: string
  interval_hours: number
  enabled: boolean
  last_run_at?: string
  created_at: string
  updated_at: string
}

export interface DbPortfolioPerformanceSnapshot {
  id: string
  portfolio_id: string
  calculated_at: string
  weighted_return_percentage: number
  total_change_24h?: number
  asset_count: number
  top_performer_symbol?: string
  top_performer_change?: number
  worst_performer_symbol?: string
  worst_performer_change?: number
  snapshot_data: SnapshotData
  created_at: string
}

// API Request/Response Types
export interface CreateSnapshotConfigRequest {
  portfolioId?: string
  intervalHours: number
  enabled?: boolean
}

export interface UpdateSnapshotConfigRequest {
  intervalHours?: number
  enabled?: boolean
}

export interface CreateSnapshotRequest {
  portfolioId: string
  forceRecalculation?: boolean
}

export interface PortfolioNeedingSnapshot {
  portfolioId: string
  portfolioName: string
  intervalHours: number
  lastRunAt?: string
  nextRunDue: string
}

export interface GetSnapshotsResponse {
  snapshots: PortfolioPerformanceSnapshot[]
  totalCount: number
}

export interface GetHistoricalPerformanceResponse {
  snapshots: PortfolioPerformanceSnapshot[]
  portfolioId: string
  dateRange: {
    from: string
    to: string
  }
}

export interface SnapshotExecutionResult {
  success: boolean
  portfoliosProcessed: number
  snapshotsCreated: number
  errors: string[]
  executionTime: number
  timestamp: string
}