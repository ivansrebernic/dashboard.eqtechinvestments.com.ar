import { Portfolio, PortfolioHolding, PortfolioPerformance, CreatePortfolioData, AddHoldingData, HoldingPerformance } from '@/types/portfolio'
import { cryptoService } from '@/lib/coinmarketcap/services'

const STORAGE_KEY = 'admin_portfolios'

export class PortfolioService {
  /**
   * Get all portfolios from localStorage
   */
  static getPortfolios(): Portfolio[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading portfolios:', error)
      return []
    }
  }

  /**
   * Save portfolios to localStorage
   */
  static savePortfolios(portfolios: Portfolio[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolios))
    } catch (error) {
      console.error('Error saving portfolios:', error)
    }
  }

  /**
   * Create a new portfolio
   */
  static createPortfolio(data: CreatePortfolioData): Portfolio {
    const portfolio: Portfolio = {
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description,
      createdAt: new Date().toISOString(),
      holdings: []
    }

    const portfolios = this.getPortfolios()
    portfolios.push(portfolio)
    this.savePortfolios(portfolios)

    return portfolio
  }

  /**
   * Get a specific portfolio by ID
   */
  static getPortfolio(id: string): Portfolio | null {
    const portfolios = this.getPortfolios()
    return portfolios.find(p => p.id === id) || null
  }

  /**
   * Delete a portfolio
   */
  static deletePortfolio(id: string): boolean {
    const portfolios = this.getPortfolios()
    const filteredPortfolios = portfolios.filter(p => p.id !== id)
    
    if (filteredPortfolios.length === portfolios.length) {
      return false // Portfolio not found
    }

    this.savePortfolios(filteredPortfolios)
    return true
  }

  /**
   * Add a holding to a portfolio
   */
  static addHolding(portfolioId: string, holdingData: AddHoldingData): boolean {
    const portfolios = this.getPortfolios()
    const portfolio = portfolios.find(p => p.id === portfolioId)
    
    if (!portfolio) {
      return false
    }

    // Check if holding already exists
    const existingHolding = portfolio.holdings.find(h => h.symbol.toLowerCase() === holdingData.symbol.toLowerCase())
    
    if (existingHolding) {
      // Update amount
      existingHolding.amount += holdingData.amount
    } else {
      // Add new holding
      const holding: PortfolioHolding = {
        id: crypto.randomUUID(),
        symbol: holdingData.symbol.toUpperCase(),
        amount: holdingData.amount,
        addedAt: new Date().toISOString()
      }
      portfolio.holdings.push(holding)
    }

    this.savePortfolios(portfolios)
    return true
  }

  /**
   * Remove a holding from a portfolio
   */
  static removeHolding(portfolioId: string, holdingId: string): boolean {
    const portfolios = this.getPortfolios()
    const portfolio = portfolios.find(p => p.id === portfolioId)
    
    if (!portfolio) {
      return false
    }

    const initialLength = portfolio.holdings.length
    portfolio.holdings = portfolio.holdings.filter(h => h.id !== holdingId)
    
    if (portfolio.holdings.length === initialLength) {
      return false // Holding not found
    }

    this.savePortfolios(portfolios)
    return true
  }

  /**
   * Calculate portfolio performance using current crypto prices
   */
  static async calculatePerformance(portfolioId: string): Promise<PortfolioPerformance | null> {
    const portfolio = this.getPortfolio(portfolioId)
    
    if (!portfolio || portfolio.holdings.length === 0) {
      return null
    }

    try {
      const holdingPerformances: HoldingPerformance[] = []
      let totalValue = 0

      // Get current prices for all holdings
      for (const holding of portfolio.holdings) {
        try {
          const cryptoData = await cryptoService.getCryptocurrencyBySymbol(holding.symbol)
          
          if (cryptoData && cryptoData.quote.USD) {
            const currentPrice = cryptoData.quote.USD.price
            const holdingValue = holding.amount * currentPrice

            holdingPerformances.push({
              symbol: holding.symbol,
              amount: holding.amount,
              currentPrice,
              totalValue: holdingValue
            })

            totalValue += holdingValue
          }
        } catch (error) {
          console.error(`Error fetching price for ${holding.symbol}:`, error)
          // Add holding with 0 value if price fetch fails
          holdingPerformances.push({
            symbol: holding.symbol,
            amount: holding.amount,
            currentPrice: 0,
            totalValue: 0
          })
        }
      }

      return {
        totalValue,
        holdings: holdingPerformances
      }
    } catch (error) {
      console.error('Error calculating portfolio performance:', error)
      return null
    }
  }
}

// Client-side hook for portfolio management
export function usePortfolios() {
  const getPortfolios = () => PortfolioService.getPortfolios()
  const createPortfolio = (data: CreatePortfolioData) => PortfolioService.createPortfolio(data)
  const deletePortfolio = (id: string) => PortfolioService.deletePortfolio(id)
  const addHolding = (portfolioId: string, holding: AddHoldingData) => PortfolioService.addHolding(portfolioId, holding)
  const removeHolding = (portfolioId: string, holdingId: string) => PortfolioService.removeHolding(portfolioId, holdingId)
  const calculatePerformance = (portfolioId: string) => PortfolioService.calculatePerformance(portfolioId)

  return {
    getPortfolios,
    createPortfolio,
    deletePortfolio,
    addHolding,
    removeHolding,
    calculatePerformance
  }
}