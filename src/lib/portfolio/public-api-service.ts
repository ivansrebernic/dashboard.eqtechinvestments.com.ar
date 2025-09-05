import { 
  Portfolio, 
  PortfolioPerformance, 
  HoldingPerformance, 
  PortfolioMetrics, 
  AssetPerformance,
  CreatePortfolioData,
  AddHoldingData 
} from '@/types/portfolio'
import { cryptoService } from '@/lib/coinmarketcap/services'
import type { CryptoCurrency } from '@/types/crypto'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Unified Portfolio Service - handles both read-only and admin operations
 * with optimized batch crypto data fetching to avoid N+1 performance issues
 */
export class UnifiedPortfolioService {
  private readOnlyBaseUrl = '/api/portfolios'
  private adminBaseUrl = '/api/admin/portfolios'

  /**
   * Make authenticated API request
   */
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    useAdminEndpoint = false
  ): Promise<T> {
    const baseUrl = useAdminEndpoint ? this.adminBaseUrl : this.readOnlyBaseUrl
    const url = `${baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    const data: ApiResponse<T> = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'API request failed')
    }

    return data.data as T
  }

  /**
   * Get all portfolios (read-only for basic users)
   */
  async getPortfolios(): Promise<Portfolio[]> {
    return this.makeRequest<Portfolio[]>('')
  }

  /**
   * Get portfolio by ID (admin operation)
   */
  async getPortfolioById(id: string): Promise<Portfolio> {
    return this.makeRequest<Portfolio>(`/${id}`, {}, true)
  }

  /**
   * Create new portfolio (admin operation)
   */
  async createPortfolio(data: CreatePortfolioData): Promise<Portfolio> {
    return this.makeRequest<Portfolio>('', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true)
  }

  /**
   * Update portfolio (admin operation)
   */
  async updatePortfolio(id: string, data: Partial<CreatePortfolioData>): Promise<Portfolio> {
    return this.makeRequest<Portfolio>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true)
  }

  /**
   * Delete portfolio (admin operation)
   */
  async deletePortfolio(id: string): Promise<void> {
    await this.makeRequest(`/${id}`, {
      method: 'DELETE',
    }, true)
  }

  /**
   * Add holding to portfolio (admin operation)
   */
  async addHolding(portfolioId: string, holdingData: AddHoldingData): Promise<Portfolio> {
    return this.makeRequest<Portfolio>(`/${portfolioId}/holdings`, {
      method: 'POST',
      body: JSON.stringify(holdingData),
    }, true)
  }

  /**
   * Update holding amount (admin operation)
   */
  async updateHolding(portfolioId: string, holdingId: string, amount: number): Promise<Portfolio> {
    return this.makeRequest<Portfolio>(`/${portfolioId}/holdings/${holdingId}`, {
      method: 'PUT',
      body: JSON.stringify({ amount }),
    }, true)
  }

  /**
   * Remove holding from portfolio (admin operation)
   */
  async removeHolding(portfolioId: string, holdingId: string): Promise<Portfolio> {
    return this.makeRequest<Portfolio>(`/${portfolioId}/holdings/${holdingId}`, {
      method: 'DELETE',
    }, true)
  }

  /**
   * Calculate portfolio performance using BATCH-OPTIMIZED CoinMarketCap API
   */
  async calculatePerformance(portfolio: Portfolio): Promise<PortfolioPerformance> {
    if (portfolio.holdings.length === 0) {
      return {
        totalValue: 0,
        totalChange24h: 0,
        totalChangePercent24h: 0,
        holdings: [],
        metrics: {
          assetCount: 0,
          topPerformer: null,
          worstPerformer: null,
          lastUpdated: new Date().toISOString()
        }
      }
    }

    try {
      // BATCH OPTIMIZATION: Fetch all crypto prices at once to avoid N+1 queries
      const symbols = portfolio.holdings.map(h => h.symbol)
      const cryptoMap = await cryptoService.getCryptocurrenciesBySymbols(symbols)
      
      // Calculate holding performances from batch data
      const holdingPerformances = portfolio.holdings.map((holding) => {
        try {
          const crypto = cryptoMap.get(holding.symbol.toUpperCase())
          
          if (!crypto) {
            console.warn(`Cryptocurrency not found: ${holding.symbol}`)
            return this.createEmptyHolding(holding)
          }

          const quote = crypto.quote.USD
          const currentPrice = quote.price
          const currentValue = holding.amount * currentPrice
          const priceChange24h = quote.percent_change_24h || 0
          const change24hValue = (currentValue * priceChange24h) / 100

          return {
            symbol: holding.symbol,
            amount: holding.amount,
            currentPrice,
            totalValue: currentValue,
            priceChange24h: change24hValue,
            priceChangePercent24h: priceChange24h,
            marketCap: quote.market_cap,
            volume24h: quote.volume_24h,
            portfolioWeight: 0, // Will be calculated after all holdings are processed
            cryptoId: crypto.id,
            cryptoName: crypto.name
          } as HoldingPerformance
        } catch (error) {
          console.error(`Error calculating performance for ${holding.symbol}:`, error)
          return this.createEmptyHolding(holding)
        }
      })

      // Calculate portfolio totals and weights
      const totalValue = holdingPerformances.reduce(
        (sum, holding) => sum + holding.totalValue, 
        0
      )

      const totalChange24h = holdingPerformances.reduce(
        (sum, holding) => sum + holding.priceChange24h,
        0
      )

      const totalChangePercent24h = totalValue > 0 ? (totalChange24h / (totalValue - totalChange24h)) * 100 : 0

      // Calculate portfolio weights
      const holdingsWithWeights = holdingPerformances.map(holding => ({
        ...holding,
        portfolioWeight: totalValue > 0 ? (holding.totalValue / totalValue) * 100 : 0
      }))

      // Calculate portfolio metrics
      const metrics = this.calculatePortfolioMetrics(holdingsWithWeights)

      return {
        totalValue,
        totalChange24h,
        totalChangePercent24h,
        holdings: holdingsWithWeights,
        metrics
      }
    } catch (error) {
      console.error('Error calculating portfolio performance:', error)
      return {
        totalValue: 0,
        totalChange24h: 0,
        totalChangePercent24h: 0,
        holdings: portfolio.holdings.map(holding => this.createEmptyHolding(holding)),
        metrics: {
          assetCount: portfolio.holdings.length,
          topPerformer: null,
          worstPerformer: null,
          lastUpdated: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Create empty holding performance object
   */
  private createEmptyHolding(holding: { symbol: string; amount: number }): HoldingPerformance {
    return {
      symbol: holding.symbol,
      amount: holding.amount,
      currentPrice: 0,
      totalValue: 0,
      priceChange24h: 0,
      priceChangePercent24h: 0,
      marketCap: undefined,
      volume24h: undefined,
      portfolioWeight: 0
    }
  }

  /**
   * Calculate portfolio-level metrics
   */
  private calculatePortfolioMetrics(holdings: HoldingPerformance[]): PortfolioMetrics {
    const validHoldings = holdings.filter(h => h.totalValue > 0)
    
    let topPerformer: AssetPerformance | null = null
    let worstPerformer: AssetPerformance | null = null

    if (validHoldings.length > 0) {
      // Find best and worst performers by percentage change
      const sortedByPerformance = validHoldings.sort((a, b) => b.priceChangePercent24h - a.priceChangePercent24h)
      
      if (sortedByPerformance.length > 0) {
        const best = sortedByPerformance[0]
        const worst = sortedByPerformance[sortedByPerformance.length - 1]

        topPerformer = {
          symbol: best.symbol,
          changePercent: best.priceChangePercent24h,
          change24h: best.priceChange24h,
          totalValue: best.totalValue
        }

        worstPerformer = {
          symbol: worst.symbol,
          changePercent: worst.priceChangePercent24h,
          change24h: worst.priceChange24h,
          totalValue: worst.totalValue
        }
      }
    }

    return {
      assetCount: holdings.length,
      topPerformer,
      worstPerformer,
      lastUpdated: new Date().toISOString()
    }
  }


  /**
   * Calculate performance for multiple portfolios - BATCH OPTIMIZED
   * This is the key optimization for dashboard loading
   */
  async calculateMultiplePortfolioPerformances(
    portfolios: Portfolio[]
  ): Promise<Map<string, PortfolioPerformance>> {
    if (portfolios.length === 0) {
      return new Map()
    }

    try {
      // Collect all unique symbols across all portfolios
      const allSymbols = new Set<string>()
      for (const portfolio of portfolios) {
        portfolio.holdings.forEach(holding => allSymbols.add(holding.symbol))
      }

      // SINGLE batch fetch for all crypto data needed
      const cryptoMap = await cryptoService.getCryptocurrenciesBySymbols(Array.from(allSymbols))
      
      // Calculate performance for each portfolio using the shared crypto data
      const results = new Map<string, PortfolioPerformance>()
      
      for (const portfolio of portfolios) {
        try {
          const performance = await this.calculatePerformanceFromCryptoMap(portfolio, cryptoMap)
          results.set(portfolio.id, performance)
        } catch (error) {
          console.error(`Error calculating performance for portfolio ${portfolio.id}:`, error)
          // Add empty performance for failed portfolio
          results.set(portfolio.id, {
            totalValue: 0,
            totalChange24h: 0,
            totalChangePercent24h: 0,
            holdings: portfolio.holdings.map(holding => this.createEmptyHolding(holding)),
            metrics: {
              assetCount: portfolio.holdings.length,
              topPerformer: null,
              worstPerformer: null,
              lastUpdated: new Date().toISOString()
            }
          })
        }
      }

      return results
    } catch (error) {
      console.error('Error in batch portfolio performance calculation:', error)
      // Fallback to individual calculations
      const results = new Map<string, PortfolioPerformance>()
      
      await Promise.allSettled(
        portfolios.map(async (portfolio) => {
          try {
            const performance = await this.calculatePerformance(portfolio)
            results.set(portfolio.id, performance)
          } catch (error) {
            console.error(`Failed to calculate performance for portfolio ${portfolio.id}:`, error)
          }
        })
      )
      
      return results
    }
  }

  /**
   * Helper method to calculate portfolio performance from pre-fetched crypto data
   */
  private async calculatePerformanceFromCryptoMap(
    portfolio: Portfolio,
    cryptoMap: Map<string, CryptoCurrency | null>
  ): Promise<PortfolioPerformance> {
    if (portfolio.holdings.length === 0) {
      return {
        totalValue: 0,
        totalChange24h: 0,
        totalChangePercent24h: 0,
        holdings: [],
        metrics: {
          assetCount: 0,
          topPerformer: null,
          worstPerformer: null,
          lastUpdated: new Date().toISOString()
        }
      }
    }

    // Calculate holding performances from pre-fetched crypto data
    const holdingPerformances = portfolio.holdings.map((holding) => {
      try {
        const crypto = cryptoMap.get(holding.symbol.toUpperCase())
        
        if (!crypto) {
          console.warn(`Cryptocurrency not found: ${holding.symbol}`)
          return this.createEmptyHolding(holding)
        }

        const quote = crypto.quote.USD
        const currentPrice = quote.price
        const currentValue = holding.amount * currentPrice
        const priceChange24h = quote.percent_change_24h || 0
        const change24hValue = (currentValue * priceChange24h) / 100

        return {
          symbol: holding.symbol,
          amount: holding.amount,
          currentPrice,
          totalValue: currentValue,
          priceChange24h: change24hValue,
          priceChangePercent24h: priceChange24h,
          marketCap: quote.market_cap,
          volume24h: quote.volume_24h,
          portfolioWeight: 0, // Will be calculated after all holdings are processed
          cryptoId: crypto.id,
          cryptoName: crypto.name
        } as HoldingPerformance
      } catch (error) {
        console.error(`Error calculating performance for ${holding.symbol}:`, error)
        return this.createEmptyHolding(holding)
      }
    })

    // Calculate portfolio totals and weights
    const totalValue = holdingPerformances.reduce(
      (sum, holding) => sum + holding.totalValue, 
      0
    )

    const totalChange24h = holdingPerformances.reduce(
      (sum, holding) => sum + holding.priceChange24h,
      0
    )

    const totalChangePercent24h = totalValue > 0 ? (totalChange24h / (totalValue - totalChange24h)) * 100 : 0

    // Calculate portfolio weights
    const holdingsWithWeights = holdingPerformances.map(holding => ({
      ...holding,
      portfolioWeight: totalValue > 0 ? (holding.totalValue / totalValue) * 100 : 0
    }))

    // Calculate portfolio metrics
    const metrics = this.calculatePortfolioMetrics(holdingsWithWeights)

    return {
      totalValue,
      totalChange24h,
      totalChangePercent24h,
      holdings: holdingsWithWeights,
      metrics
    }
  }

  /**
   * PERFORMANCE OPTIMIZATION: Enhanced calculatePerformance that uses batch crypto fetching
   * This method replaces the inefficient Promise.all individual calls in the old api-service
   */
  async calculatePerformanceOptimized(portfolio: Portfolio): Promise<PortfolioPerformance> {
    if (portfolio.holdings.length === 0) {
      return {
        totalValue: 0,
        totalChange24h: 0,
        totalChangePercent24h: 0,
        holdings: [],
        metrics: {
          assetCount: 0,
          topPerformer: null,
          worstPerformer: null,
          lastUpdated: new Date().toISOString()
        }
      }
    }

    try {
      // BATCH OPTIMIZATION: Single API call for all symbols instead of N individual calls
      const symbols = portfolio.holdings.map(h => h.symbol)
      const cryptoMap = await cryptoService.getCryptocurrenciesBySymbols(symbols)
      
      // Use the existing optimized calculation method
      return this.calculatePerformanceFromCryptoMap(portfolio, cryptoMap)
    } catch (error) {
      console.error('Error calculating optimized portfolio performance:', error)
      return {
        totalValue: 0,
        totalChange24h: 0,
        totalChangePercent24h: 0,
        holdings: portfolio.holdings.map(holding => this.createEmptyHolding(holding)),
        metrics: {
          assetCount: portfolio.holdings.length,
          topPerformer: null,
          worstPerformer: null,
          lastUpdated: new Date().toISOString()
        }
      }
    }
  }
}

// Create singleton instance
export const portfolioService = new UnifiedPortfolioService()

// Backward compatibility exports
export const publicPortfolioService = portfolioService
export const apiPortfolioService = portfolioService

// Create hook for read-only portfolio operations
export function usePublicPortfolios() {
  return {
    getPortfolios: () => portfolioService.getPortfolios(),
    calculatePerformance: (portfolio: Portfolio) => 
      portfolioService.calculatePerformanceOptimized(portfolio),
    // BATCH OPTIMIZED METHODS
    calculateMultiplePortfolioPerformances: (portfolios: Portfolio[]) =>
      portfolioService.calculateMultiplePortfolioPerformances(portfolios)
  }
}

// Create hook for admin portfolio operations
export function useAdminPortfolios() {
  return {
    getPortfolios: () => portfolioService.getPortfolios(),
    getPortfolioById: (id: string) => portfolioService.getPortfolioById(id),
    createPortfolio: (data: CreatePortfolioData) => portfolioService.createPortfolio(data),
    updatePortfolio: (id: string, data: Partial<CreatePortfolioData>) => 
      portfolioService.updatePortfolio(id, data),
    deletePortfolio: (id: string) => portfolioService.deletePortfolio(id),
    addHolding: (portfolioId: string, holdingData: AddHoldingData) => 
      portfolioService.addHolding(portfolioId, holdingData),
    updateHolding: (portfolioId: string, holdingId: string, amount: number) => 
      portfolioService.updateHolding(portfolioId, holdingId, amount),
    removeHolding: (portfolioId: string, holdingId: string) => 
      portfolioService.removeHolding(portfolioId, holdingId),
    calculatePerformance: (portfolio: Portfolio) => 
      portfolioService.calculatePerformanceOptimized(portfolio)
  }
}

// Create hook that auto-detects and uses the optimized batch method for admin operations
export function useApiPortfolios() {
  return {
    getPortfolios: () => portfolioService.getPortfolios(),
    getPortfolioById: (id: string) => portfolioService.getPortfolioById(id),
    createPortfolio: (data: CreatePortfolioData) => portfolioService.createPortfolio(data),
    updatePortfolio: (id: string, data: Partial<CreatePortfolioData>) => 
      portfolioService.updatePortfolio(id, data),
    deletePortfolio: (id: string) => portfolioService.deletePortfolio(id),
    addHolding: (portfolioId: string, holdingData: AddHoldingData) => 
      portfolioService.addHolding(portfolioId, holdingData),
    updateHolding: (portfolioId: string, holdingId: string, amount: number) => 
      portfolioService.updateHolding(portfolioId, holdingId, amount),
    removeHolding: (portfolioId: string, holdingId: string) => 
      portfolioService.removeHolding(portfolioId, holdingId),
    calculatePerformance: (portfolio: Portfolio) => 
      portfolioService.calculatePerformanceOptimized(portfolio)
  }
}