import { Portfolio, CreatePortfolioData, AddHoldingData, PortfolioPerformance } from '@/types/portfolio'
import { cryptoService } from '@/lib/coinmarketcap/services'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export class ApiPortfolioService {
  private baseUrl = '/api/admin/portfolios'

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
   * Get all portfolios
   */
  async getPortfolios(): Promise<Portfolio[]> {
    return this.makeRequest<Portfolio[]>('')
  }

  /**
   * Get portfolio by ID
   */
  async getPortfolioById(id: string): Promise<Portfolio> {
    return this.makeRequest<Portfolio>(`/${id}`)
  }

  /**
   * Create new portfolio
   */
  async createPortfolio(data: CreatePortfolioData): Promise<Portfolio> {
    return this.makeRequest<Portfolio>('', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Update portfolio
   */
  async updatePortfolio(id: string, data: Partial<CreatePortfolioData>): Promise<Portfolio> {
    return this.makeRequest<Portfolio>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  /**
   * Delete portfolio
   */
  async deletePortfolio(id: string): Promise<void> {
    await this.makeRequest(`/${id}`, {
      method: 'DELETE',
    })
  }

  /**
   * Add holding to portfolio
   */
  async addHolding(portfolioId: string, holdingData: AddHoldingData): Promise<Portfolio> {
    return this.makeRequest<Portfolio>(`/${portfolioId}/holdings`, {
      method: 'POST',
      body: JSON.stringify(holdingData),
    })
  }

  /**
   * Update holding amount
   */
  async updateHolding(portfolioId: string, holdingId: string, amount: number): Promise<Portfolio> {
    return this.makeRequest<Portfolio>(`/${portfolioId}/holdings/${holdingId}`, {
      method: 'PUT',
      body: JSON.stringify({ amount }),
    })
  }

  /**
   * Remove holding from portfolio
   */
  async removeHolding(portfolioId: string, holdingId: string): Promise<Portfolio> {
    return this.makeRequest<Portfolio>(`/${portfolioId}/holdings/${holdingId}`, {
      method: 'DELETE',
    })
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
export const apiPortfolioService = new ApiPortfolioService()

// Create hook for easy use in React components
export function useApiPortfolios() {
  return {
    getPortfolios: () => apiPortfolioService.getPortfolios(),
    getPortfolioById: (id: string) => apiPortfolioService.getPortfolioById(id),
    createPortfolio: (data: CreatePortfolioData) => apiPortfolioService.createPortfolio(data),
    updatePortfolio: (id: string, data: Partial<CreatePortfolioData>) => 
      apiPortfolioService.updatePortfolio(id, data),
    deletePortfolio: (id: string) => apiPortfolioService.deletePortfolio(id),
    addHolding: (portfolioId: string, holdingData: AddHoldingData) => 
      apiPortfolioService.addHolding(portfolioId, holdingData),
    updateHolding: (portfolioId: string, holdingId: string, amount: number) => 
      apiPortfolioService.updateHolding(portfolioId, holdingId, amount),
    removeHolding: (portfolioId: string, holdingId: string) => 
      apiPortfolioService.removeHolding(portfolioId, holdingId),
    calculatePerformance: (portfolio: Portfolio) => 
      apiPortfolioService.calculatePerformance(portfolio)
  }
}