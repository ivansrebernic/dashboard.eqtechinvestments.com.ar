import { Portfolio, PortfolioPerformance, HoldingPerformance, PortfolioMetrics, AssetPerformance } from '@/types/portfolio'
import { cryptoService } from '@/lib/coinmarketcap/services'
import { historicalDataService, type HistoricalPortfolioData } from './historical-data-service'
import type { CryptoCurrency } from '@/types/crypto'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export class PublicPortfolioService {
  private baseUrl = '/api/portfolios'

  /**
   * Make authenticated API request
   */
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
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
      // OPTIMIZATION: Batch fetch all crypto prices at once
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
            portfolioWeight: 0 // Will be calculated after all holdings are processed
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
   * Calculate historical portfolio performance
   */
  async calculateHistoricalPerformance(
    portfolio: Portfolio,
    days: number = 30
  ): Promise<HistoricalPortfolioData[]> {
    try {
      // Get current performance to ensure we have up-to-date holdings data
      const currentPerformance = await this.calculatePerformance(portfolio)
      
      return await historicalDataService.calculateHistoricalPortfolioPerformance(
        portfolio,
        currentPerformance.holdings,
        days
      )
    } catch (error) {
      console.error('Error calculating historical portfolio performance:', error)
      return []
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
          portfolioWeight: 0 // Will be calculated after all holdings are processed
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
}

// Create singleton instance
export const publicPortfolioService = new PublicPortfolioService()

// Create hook for easy use in React components
export function usePublicPortfolios() {
  return {
    getPortfolios: () => publicPortfolioService.getPortfolios(),
    calculatePerformance: (portfolio: Portfolio) => 
      publicPortfolioService.calculatePerformance(portfolio),
    calculateHistoricalPerformance: (portfolio: Portfolio, days?: number) =>
      publicPortfolioService.calculateHistoricalPerformance(portfolio, days),
    // BATCH OPTIMIZED METHODS
    calculateMultiplePortfolioPerformances: (portfolios: Portfolio[]) =>
      publicPortfolioService.calculateMultiplePortfolioPerformances(portfolios)
  }
}