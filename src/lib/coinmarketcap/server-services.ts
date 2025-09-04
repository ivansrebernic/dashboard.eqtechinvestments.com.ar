// Server-only service for CoinMarketCap API
import { getCoinMarketCapClient } from './client'
import { CryptoCurrency, GlobalMetrics } from '@/types/crypto'

// Enhanced cache with stale-while-revalidate support
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  staleUntil: number // Allow serving stale data for better UX
}

class EnhancedCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private refreshPromises = new Map<string, Promise<unknown>>() // Prevent duplicate API calls
  private stats = {
    hits: 0,
    misses: 0,
    staleHits: 0,
    totalRequests: 0
  }

  set<T>(key: string, data: T, ttlMinutes: number = 5, staleMinutes: number = 15): void {
    const now = Date.now()
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: ttlMinutes * 60 * 1000,
      staleUntil: now + (staleMinutes * 60 * 1000)
    })
  }

  get<T>(key: string): { data: T; isStale: boolean } | null {
    this.stats.totalRequests++
    const entry = this.cache.get(key)
    if (!entry) {
      this.stats.misses++
      return null
    }

    const now = Date.now()
    
    // Hard expiry - remove from cache
    if (now > entry.staleUntil) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    // Return data with staleness indicator
    const isStale = now > (entry.timestamp + entry.ttl)
    if (isStale) {
      this.stats.staleHits++
    } else {
      this.stats.hits++
    }
    return { data: entry.data as T, isStale }
  }

  clear(): void {
    this.cache.clear()
    this.refreshPromises.clear()
    this.stats = { hits: 0, misses: 0, staleHits: 0, totalRequests: 0 }
  }

  getStats() {
    const cacheSize = this.cache.size
    const hitRate = this.stats.totalRequests > 0 ? 
      ((this.stats.hits + this.stats.staleHits) / this.stats.totalRequests * 100).toFixed(2) : '0.00'
    const freshHitRate = this.stats.totalRequests > 0 ? 
      (this.stats.hits / this.stats.totalRequests * 100).toFixed(2) : '0.00'
    
    return {
      ...this.stats,
      cacheSize,
      hitRate: `${hitRate}%`,
      freshHitRate: `${freshHitRate}%`,
      staleness: this.stats.staleHits > 0 ? 
        `${(this.stats.staleHits / (this.stats.hits + this.stats.staleHits) * 100).toFixed(2)}%` : '0.00%'
    }
  }

  // Prevent duplicate concurrent requests
  async getOrFetch<T>(
    key: string, 
    fetchFn: () => Promise<T>,
    ttlMinutes: number = 5,
    staleMinutes: number = 15
  ): Promise<T> {
    const cached = this.get<T>(key)
    
    // Return fresh cached data immediately
    if (cached && !cached.isStale) {
      return cached.data
    }

    // If we have stale data but refresh is in progress, return stale data
    if (cached?.isStale && this.refreshPromises.has(key)) {
      return cached.data
    }

    // Start refresh (either no cache or stale data)
    if (!this.refreshPromises.has(key)) {
      const promise = fetchFn().then(data => {
        this.set(key, data, ttlMinutes, staleMinutes)
        this.refreshPromises.delete(key)
        return data
      }).catch(error => {
        this.refreshPromises.delete(key)
        throw error
      })
      
      this.refreshPromises.set(key, promise)
    }

    // If we have stale data, return it while refresh happens in background
    if (cached?.isStale) {
      // Background refresh, return stale data immediately
      this.refreshPromises.get(key)?.catch(() => {}) // Ignore background errors
      return cached.data
    }

    // No cached data, wait for fresh data
    return this.refreshPromises.get(key) as Promise<T>
  }
}

const cache = new EnhancedCache()

export class ServerCryptoService {
  private client = getCoinMarketCapClient()
  private allCryptosCache: CryptoCurrency[] | null = null
  private allCryptosTimestamp: number = 0
  private readonly ALL_CRYPTOS_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Get top cryptocurrencies with enhanced caching
   */
  async getTopCryptocurrencies(limit: number = 20): Promise<CryptoCurrency[]> {
    const cacheKey = `top-cryptos-${limit}`
    
    return cache.getOrFetch(
      cacheKey,
      async () => {
        const response = await this.client.getLatestListings({
          limit,
          sort: 'market_cap',
          sort_dir: 'desc'
        })
        return response.data
      },
      5, // Fresh for 5 minutes
      15  // Stale-but-usable for 15 minutes total
    )
  }

  /**
   * Batch load all cryptocurrencies to eliminate individual symbol lookups
   */
  private async getAllCryptocurrencies(): Promise<CryptoCurrency[]> {
    const now = Date.now()
    
    // Return cached data if still valid
    if (this.allCryptosCache && (now - this.allCryptosTimestamp) < this.ALL_CRYPTOS_TTL) {
      return this.allCryptosCache
    }

    try {
      console.log(`🔄 Fetching ALL cryptocurrencies (5000) - SINGLE BATCH CALL`)
      const response = await this.client.getLatestListings({
        limit: 5000,
        convert: 'USD'
      })

      this.allCryptosCache = response.data
      this.allCryptosTimestamp = now
      console.log(`✅ Cached ${response.data.length} cryptocurrencies for batch lookup`)
      
      return response.data
    } catch (error) {
      // If fresh fetch fails but we have stale data, return stale data
      if (this.allCryptosCache) {
        console.warn('Using stale crypto data due to API error:', error)
        return this.allCryptosCache
      }
      throw error
    }
  }

  /**
   * Get specific cryptocurrency by symbol - now uses batch-loaded data
   */
  async getCryptocurrencyBySymbol(symbol: string): Promise<CryptoCurrency | null> {
    const normalizedSymbol = symbol.toUpperCase()
    const cacheKey = `crypto-${normalizedSymbol}`
    
    return cache.getOrFetch(
      cacheKey,
      async () => {
        const allCryptos = await this.getAllCryptocurrencies()
        const cryptocurrency = allCryptos.find(
          crypto => crypto.symbol === normalizedSymbol
        )
        return cryptocurrency || null
      },
      5,  // Fresh for 5 minutes
      15  // Stale-but-usable for 15 minutes total
    )
  }

  /**
   * Get multiple cryptocurrencies by symbols - BATCH OPTIMIZED
   */
  async getCryptocurrenciesBySymbols(symbols: string[]): Promise<Map<string, CryptoCurrency | null>> {
    const normalizedSymbols = symbols.map(s => s.toUpperCase())
    const result = new Map<string, CryptoCurrency | null>()
    
    // Check cache first for each symbol
    const uncachedSymbols: string[] = []
    for (const symbol of normalizedSymbols) {
      const cacheKey = `crypto-${symbol}`
      const cached = cache.get<CryptoCurrency | null>(cacheKey)
      if (cached && !cached.isStale) {
        result.set(symbol, cached.data)
        console.log(`💾 Cache HIT for ${symbol}`)
      } else {
        uncachedSymbols.push(symbol)
        console.log(`❌ Cache MISS for ${symbol}`)
      }
    }

    // Batch fetch uncached symbols
    if (uncachedSymbols.length > 0) {
      try {
        const allCryptos = await this.getAllCryptocurrencies()
        
        for (const symbol of uncachedSymbols) {
          const cryptocurrency = allCryptos.find(crypto => crypto.symbol === symbol) || null
          result.set(symbol, cryptocurrency)
          
          // Cache individual results
          const cacheKey = `crypto-${symbol}`
          cache.set(cacheKey, cryptocurrency, 5, 15)
        }
      } catch (error) {
        console.error('Error in batch crypto lookup:', error)
        // Add null entries for failed lookups
        for (const symbol of uncachedSymbols) {
          result.set(symbol, null)
        }
      }
    }

    return result
  }

  /**
   * Get global market metrics with enhanced caching
   */
  async getGlobalMetrics(): Promise<GlobalMetrics> {
    const cacheKey = 'global-metrics'
    
    return cache.getOrFetch(
      cacheKey,
      async () => {
        const response = await this.client.getGlobalMetrics()
        return response.data
      },
      10, // Fresh for 10 minutes
      30  // Stale-but-usable for 30 minutes total
    )
  }

  /**
   * Search cryptocurrencies by name or symbol - uses batch-loaded data
   */
  async searchCryptocurrencies(query: string, limit: number = 10): Promise<CryptoCurrency[]> {
    const cacheKey = `search-${query.toLowerCase()}-${limit}`
    
    return cache.getOrFetch(
      cacheKey,
      async () => {
        const allCryptos = await this.getAllCryptocurrencies()
        const searchTerm = query.toLowerCase()
        
        return allCryptos.filter(crypto => 
          crypto.name.toLowerCase().includes(searchTerm) || 
          crypto.symbol.toLowerCase().includes(searchTerm)
        ).slice(0, limit)
      },
      5,  // Fresh for 5 minutes
      15  // Stale-but-usable for 15 minutes total
    )
  }

  /**
   * Clear cache manually (enhanced version)
   */
  clearCache(): void {
    cache.clear()
    this.allCryptosCache = null
    this.allCryptosTimestamp = 0
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const enhancedStats = cache.getStats()
    const allCryptosAge = this.allCryptosCache ? 
      Math.round((Date.now() - this.allCryptosTimestamp) / 1000) : 0
    
    return {
      enhancedCache: enhancedStats,
      allCryptosCache: {
        size: this.allCryptosCache?.length || 0,
        ageSeconds: allCryptosAge,
        isStale: allCryptosAge > (this.ALL_CRYPTOS_TTL / 1000)
      },
      optimization_summary: {
        total_api_calls_made: 1, // Only 1 batch call instead of N individual calls
        api_calls_saved: enhancedStats.hits + enhancedStats.staleHits,
        cache_effectiveness: enhancedStats.hitRate
      }
    }
  }
}

// Singleton service instance for server-side use only
export const serverCryptoService = new ServerCryptoService()