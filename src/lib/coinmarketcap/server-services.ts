// Server-only service for CoinMarketCap API
import { getCoinMarketCapClient } from './client'
import { CryptoCurrency, GlobalMetrics } from '@/types/crypto'

// Simple in-memory cache for API responses
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>()

  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  clear(): void {
    this.cache.clear()
  }
}

const cache = new SimpleCache()

export class ServerCryptoService {
  private client = getCoinMarketCapClient()

  /**
   * Get top cryptocurrencies with caching
   */
  async getTopCryptocurrencies(limit: number = 20): Promise<CryptoCurrency[]> {
    const cacheKey = `top-cryptos-${limit}`
    
    // Try to get from cache first
    const cached = cache.get<CryptoCurrency[]>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const response = await this.client.getLatestListings({
        limit,
        sort: 'market_cap',
        sort_dir: 'desc'
      })

      const data = response.data
      
      // Cache for 5 minutes
      cache.set(cacheKey, data, 5)
      
      return data
    } catch (error) {
      console.error('Error fetching top cryptocurrencies:', error)
      throw new Error('Failed to fetch cryptocurrency data')
    }
  }

  /**
   * Get specific cryptocurrency by symbol
   */
  async getCryptocurrencyBySymbol(symbol: string): Promise<CryptoCurrency | null> {
    const cacheKey = `crypto-${symbol.toLowerCase()}`
    
    const cached = cache.get<CryptoCurrency>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const response = await this.client.getLatestListings({
        limit: 5000, // Large limit to find specific coin
        convert: 'USD'
      })

      const cryptocurrency = response.data.find(
        crypto => crypto.symbol.toLowerCase() === symbol.toLowerCase()
      )

      if (cryptocurrency) {
        cache.set(cacheKey, cryptocurrency, 5)
        return cryptocurrency
      }

      return null
    } catch (error) {
      console.error(`Error fetching cryptocurrency ${symbol}:`, error)
      throw new Error(`Failed to fetch ${symbol} data`)
    }
  }

  /**
   * Get global market metrics
   */
  async getGlobalMetrics(): Promise<GlobalMetrics> {
    const cacheKey = 'global-metrics'
    
    const cached = cache.get<GlobalMetrics>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const response = await this.client.getGlobalMetrics()
      const data = response.data
      
      // Cache for 10 minutes
      cache.set(cacheKey, data, 10)
      
      return data
    } catch (error) {
      console.error('Error fetching global metrics:', error)
      throw new Error('Failed to fetch global market data')
    }
  }

  /**
   * Search cryptocurrencies by name or symbol
   */
  async searchCryptocurrencies(query: string, limit: number = 10): Promise<CryptoCurrency[]> {
    const cacheKey = `search-${query.toLowerCase()}-${limit}`
    
    const cached = cache.get<CryptoCurrency[]>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const response = await this.client.getLatestListings({
        limit: 1000, // Get more data to search through
        convert: 'USD'
      })

      const searchTerm = query.toLowerCase()
      const filtered = response.data.filter(crypto => 
        crypto.name.toLowerCase().includes(searchTerm) || 
        crypto.symbol.toLowerCase().includes(searchTerm)
      ).slice(0, limit)

      cache.set(cacheKey, filtered, 5)
      
      return filtered
    } catch (error) {
      console.error('Error searching cryptocurrencies:', error)
      throw new Error('Failed to search cryptocurrency data')
    }
  }

  /**
   * Clear cache manually
   */
  clearCache(): void {
    cache.clear()
  }
}

// Singleton service instance for server-side use only
export const serverCryptoService = new ServerCryptoService()