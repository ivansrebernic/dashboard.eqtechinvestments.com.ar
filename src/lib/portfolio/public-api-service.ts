import { Portfolio, PortfolioPerformance } from '@/types/portfolio'
import { cryptoService } from '@/lib/coinmarketcap/services'

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
   * Calculate portfolio performance using CoinMarketCap API
   */
  async calculatePerformance(portfolio: Portfolio): Promise<PortfolioPerformance> {
    if (portfolio.holdings.length === 0) {
      return {
        totalValue: 0,
        holdings: []
      }
    }

    try {
      // Get current crypto prices for all holdings
      const holdingPerformances = await Promise.all(
        portfolio.holdings.map(async (holding) => {
          try {
            // Use existing CoinMarketCap service to get current price
            const crypto = await cryptoService.getCryptocurrencyBySymbol(holding.symbol)
            
            if (!crypto) {
              console.warn(`Cryptocurrency not found: ${holding.symbol}`)
              return {
                symbol: holding.symbol,
                amount: holding.amount,
                currentPrice: 0,
                totalValue: 0
              }
            }

            const currentPrice = crypto.quote.USD.price
            const currentValue = holding.amount * currentPrice

            return {
              symbol: holding.symbol,
              amount: holding.amount,
              currentPrice,
              totalValue: currentValue
            }
          } catch (error) {
            console.error(`Error getting price for ${holding.symbol}:`, error)
            return {
              symbol: holding.symbol,
              amount: holding.amount,
              currentPrice: 0,
              totalValue: 0
            }
          }
        })
      )

      const totalValue = holdingPerformances.reduce(
        (sum, holding) => sum + holding.totalValue, 
        0
      )

      return {
        totalValue,
        holdings: holdingPerformances
      }
    } catch (error) {
      console.error('Error calculating portfolio performance:', error)
      return {
        totalValue: 0,
        holdings: portfolio.holdings.map(holding => ({
          symbol: holding.symbol,
          amount: holding.amount,
          currentPrice: 0,
          totalValue: 0
        }))
      }
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
      publicPortfolioService.calculatePerformance(portfolio)
  }
}