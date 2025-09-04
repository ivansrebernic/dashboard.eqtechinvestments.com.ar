import { CryptoCurrency, GlobalMetrics } from '@/types/crypto'

// Client-side service that uses our API routes
export class CryptoService {
  /**
   * Get top cryptocurrencies - uses /api/crypto/listings
   */
  async getTopCryptocurrencies(limit: number = 20): Promise<CryptoCurrency[]> {
    try {
      const response = await fetch(`/api/crypto/listings?limit=${limit}`)
      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        throw new Error(result.error || 'Failed to fetch cryptocurrency data')
      }
    } catch (error) {
      console.error('Error fetching top cryptocurrencies:', error)
      throw new Error('Failed to fetch cryptocurrency data')
    }
  }

  /**
   * Get specific cryptocurrency by symbol - uses /api/crypto/[symbol]
   */
  async getCryptocurrencyBySymbol(symbol: string): Promise<CryptoCurrency | null> {
    try {
      const response = await fetch(`/api/crypto/${encodeURIComponent(symbol)}`)
      
      if (response.status === 404) {
        return null
      }

      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        throw new Error(result.error || `Failed to fetch ${symbol} data`)
      }
    } catch (error) {
      console.error(`Error fetching cryptocurrency ${symbol}:`, error)
      throw new Error(`Failed to fetch ${symbol} data`)
    }
  }

  /**
   * Get global market metrics - uses /api/crypto/global
   */
  async getGlobalMetrics(): Promise<GlobalMetrics> {
    try {
      const response = await fetch('/api/crypto/global')
      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        throw new Error(result.error || 'Failed to fetch global market data')
      }
    } catch (error) {
      console.error('Error fetching global metrics:', error)
      throw new Error('Failed to fetch global market data')
    }
  }

  /**
   * Search cryptocurrencies by name or symbol - uses /api/crypto/search
   */
  async searchCryptocurrencies(query: string, limit: number = 10): Promise<CryptoCurrency[]> {
    try {
      const response = await fetch(`/api/crypto/search?q=${encodeURIComponent(query)}&limit=${limit}`)
      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        throw new Error(result.error || 'Failed to search cryptocurrency data')
      }
    } catch (error) {
      console.error('Error searching cryptocurrencies:', error)
      throw new Error('Failed to search cryptocurrency data')
    }
  }
}

// Utility functions for formatting cryptocurrency data
export const formatters = {
  currency: (value: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: value < 1 ? 6 : 2,
      maximumFractionDigits: value < 1 ? 6 : 2,
    }).format(value)
  },

  number: (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value)
  },

  percentage: (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100)
  },

  marketCap: (value: number): string => {
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`
    }
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`
    }
    if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`
    }
    return formatters.currency(value)
  },

  volume: (value: number): string => {
    return formatters.marketCap(value) // Same formatting as market cap
  },

  currencyCompact: (value: number): string => {
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(1)}T`
    }
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`
    }
    if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`
    }
    if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(1)}K`
    }
    return `$${value.toFixed(2)}`
  }
}

// Singleton service instance
export const cryptoService = new CryptoService()