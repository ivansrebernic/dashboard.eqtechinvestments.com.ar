import { 
  CryptoListingsResponse, 
  CryptoInfoResponse, 
  GlobalMetricsResponse,
  PriceConversionResponse 
} from '@/types/crypto'

const BASE_URL = 'https://pro-api.coinmarketcap.com/v1'

export class CoinMarketCapClient {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async makeRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    // 🔍 API CALL TRACKING
    console.log(`🌐 CoinMarketCap API Call: ${endpoint}`, {
      timestamp: new Date().toISOString(),
      params: params || {},
      url: url.toString()
    })

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': this.apiKey,
        'Accept': 'application/json',
        'Accept-Encoding': 'deflate, gzip',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`CoinMarketCap API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log(`✅ API Response received for ${endpoint}`)
    return result
  }

  /**
   * Get latest cryptocurrency listings
   */
  async getLatestListings(params?: {
    start?: number
    limit?: number
    convert?: string
    sort?: string
    sort_dir?: 'asc' | 'desc'
    cryptocurrency_type?: 'all' | 'coins' | 'tokens'
    tag?: string
  }): Promise<CryptoListingsResponse> {
    const baseParams = {
      start: '1',
      limit: '100',
      convert: 'USD',
      sort: 'market_cap',
      sort_dir: 'desc',
      cryptocurrency_type: 'all'
    }
    
    const queryParams: Record<string, string> = { ...baseParams }
    
    // Override with provided params, converting to strings
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams[key] = value.toString()
        }
      })
    }

    return this.makeRequest<CryptoListingsResponse>('/cryptocurrency/listings/latest', queryParams)
  }

  /**
   * Get cryptocurrency metadata
   */
  async getCryptocurrencyInfo(params: {
    id?: string
    slug?: string
    symbol?: string
    address?: string
    aux?: string
  }): Promise<CryptoInfoResponse> {
    const queryParams: Record<string, string> = {}
    
    if (params.id) queryParams.id = params.id
    if (params.slug) queryParams.slug = params.slug
    if (params.symbol) queryParams.symbol = params.symbol
    if (params.address) queryParams.address = params.address
    if (params.aux) queryParams.aux = params.aux

    return this.makeRequest<CryptoInfoResponse>('/cryptocurrency/info', queryParams)
  }

  /**
   * Get global cryptocurrency market metrics
   */
  async getGlobalMetrics(params?: {
    convert?: string
  }): Promise<GlobalMetricsResponse> {
    const queryParams: Record<string, string> = {
      convert: 'USD',
      ...params
    }

    return this.makeRequest<GlobalMetricsResponse>('/global-metrics/quotes/latest', queryParams)
  }

  /**
   * Convert cryptocurrency amounts
   */
  async convertPrice(params: {
    amount: number
    id?: string
    symbol?: string
    time?: string
    convert_id?: string
    convert?: string
  }): Promise<PriceConversionResponse> {
    const queryParams: Record<string, string> = {
      amount: params.amount.toString(),
      convert: 'USD'
    }
    
    // Add other params, converting to strings
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'amount' && value !== undefined) {
        queryParams[key] = value.toString()
      }
    })

    return this.makeRequest<PriceConversionResponse>('/tools/price-conversion', queryParams)
  }

  /**
   * Get historical cryptocurrency quotes
   */
  async getHistoricalQuotes(params: {
    symbol: string
    time_start?: string
    time_end?: string
    count?: number
    interval?: '5m' | '10m' | '15m' | '30m' | '45m' | '1h' | '2h' | '3h' | '4h' | '6h' | '12h' | '1d' | '2d' | '3d' | '7d' | '14d' | '15d' | '30d' | '60d' | '90d' | '365d'
    convert?: string
  }): Promise<unknown> {
    const queryParams: Record<string, string> = {
      symbol: params.symbol,
      convert: 'USD',
      interval: '1d',
      count: '30'
    }

    // Override with provided params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams[key] = value.toString()
      }
    })

    return this.makeRequest<unknown>('/cryptocurrency/quotes/historical', queryParams)
  }
}

// Singleton instance
let clientInstance: CoinMarketCapClient | null = null

export function getCoinMarketCapClient(): CoinMarketCapClient {
  if (!clientInstance) {
    const apiKey = process.env.COINMARKETCAP_API_KEY
    if (!apiKey) {
      throw new Error('COINMARKETCAP_API_KEY environment variable is not set')
    }
    clientInstance = new CoinMarketCapClient(apiKey)
  }
  return clientInstance
}