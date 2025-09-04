import { Portfolio, HoldingPerformance } from '@/types/portfolio'

export interface HistoricalQuote {
  timestamp: string
  price: number
  date: string
}

export interface HistoricalPortfolioData {
  date: string
  value: number
  timestamp: number
}

interface HistoricalCacheEntry {
  data: HistoricalQuote[]
  timestamp: number
  expiresAt: number
}

class HistoricalDataServiceClass {
  private cache = new Map<string, HistoricalCacheEntry>()
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
  private readonly baseUrl = '/api/crypto/historical'
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Set up automatic cache cleanup every hour
    this.cleanupInterval = setInterval(() => {
      this.clearExpiredCache()
    }, 60 * 60 * 1000) // 1 hour
  }

  /**
   * Get historical price data for a cryptocurrency symbol
   */
  async getHistoricalData(symbol: string, days: number = 30): Promise<HistoricalQuote[]> {
    const cacheKey = `${symbol.toUpperCase()}_${days}`
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data
    }

    try {
      const response = await fetch(`${this.baseUrl}/${symbol}?count=${days}&interval=1d`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch historical data')
      }

      // Transform CoinMarketCap response to our format
      const quotes = this.transformCoinMarketCapData(result.data)
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: quotes,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_DURATION
      })

      return quotes

    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error)
      
      // Return cached data if available, even if expired
      if (cached) {
        return cached.data
      }
      
      // Return empty array as fallback
      return []
    }
  }

  /**
   * Calculate historical portfolio performance
   */
  async calculateHistoricalPortfolioPerformance(
    portfolio: Portfolio,
    currentHoldings: HoldingPerformance[],
    days: number = 30
  ): Promise<HistoricalPortfolioData[]> {
    try {
      // Get historical data for all holdings
      const historicalDataPromises = portfolio.holdings.map(holding =>
        this.getHistoricalData(holding.symbol, days)
      )

      const allHistoricalData = await Promise.all(historicalDataPromises)

      // Create a map for easy lookup
      const historicalMap = new Map<string, HistoricalQuote[]>()
      portfolio.holdings.forEach((holding, index) => {
        historicalMap.set(holding.symbol, allHistoricalData[index])
      })

      // Generate date range
      const dates = this.generateDateRange(days)

      // Calculate portfolio value for each date
      const portfolioHistory: HistoricalPortfolioData[] = dates.map(date => {
        let totalValue = 0

        portfolio.holdings.forEach(holding => {
          const historicalPrices = historicalMap.get(holding.symbol) || []
          
          // Find the closest price for this date
          const price = this.findClosestPrice(historicalPrices, date.timestamp)
          
          if (price > 0) {
            totalValue += holding.amount * price
          }
        })

        return {
          date: date.dateString,
          value: totalValue,
          timestamp: date.timestamp
        }
      })

      return portfolioHistory

    } catch (error) {
      console.error('Error calculating historical portfolio performance:', error)
      return []
    }
  }

  /**
   * Transform CoinMarketCap historical data format
   */
  private transformCoinMarketCapData(cmcData: any): HistoricalQuote[] {
    try {
      // CoinMarketCap returns quotes in different formats
      // Handle both single asset and multiple asset responses
      let quotes: any[] = []
      
      if (cmcData.data && Array.isArray(cmcData.data)) {
        // Multiple quotes format
        quotes = cmcData.data
      } else if (cmcData.quotes && Array.isArray(cmcData.quotes)) {
        // Single asset format
        quotes = cmcData.quotes
      } else if (Array.isArray(cmcData)) {
        quotes = cmcData
      }

      return quotes.map((quote: any) => {
        const timestamp = quote.timestamp || quote.last_updated
        const price = quote.quote?.USD?.price || quote.price || 0
        
        return {
          timestamp,
          price,
          date: new Date(timestamp).toISOString().split('T')[0]
        }
      }).filter(quote => quote.price > 0)

    } catch (error) {
      console.error('Error transforming CoinMarketCap data:', error)
      return []
    }
  }

  /**
   * Generate array of dates going back N days
   */
  private generateDateRange(days: number) {
    const dates = []
    const now = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      dates.push({
        timestamp: date.getTime(),
        dateString: date.toISOString().split('T')[0],
        displayDate: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      })
    }
    
    return dates
  }

  /**
   * Find the closest available price for a given timestamp
   */
  private findClosestPrice(quotes: HistoricalQuote[], targetTimestamp: number): number {
    if (!quotes.length) return 0

    // Convert target to date string for comparison
    const targetDate = new Date(targetTimestamp).toISOString().split('T')[0]
    
    // Try to find exact date match first
    const exactMatch = quotes.find(quote => quote.date === targetDate)
    if (exactMatch) {
      return exactMatch.price
    }

    // Find closest date
    let closest = quotes[0]
    let minDiff = Math.abs(new Date(quotes[0].timestamp).getTime() - targetTimestamp)

    for (const quote of quotes) {
      const diff = Math.abs(new Date(quote.timestamp).getTime() - targetTimestamp)
      if (diff < minDiff) {
        minDiff = diff
        closest = quote
      }
    }

    return closest.price
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Force clear all cache
   */
  clearAllCache() {
    this.cache.clear()
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.clearAllCache()
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        cached: new Date(entry.timestamp).toISOString(),
        expires: new Date(entry.expiresAt).toISOString(),
        expired: Date.now() >= entry.expiresAt
      }))
    }
  }
}

// Export singleton instance
export const historicalDataService = new HistoricalDataServiceClass()