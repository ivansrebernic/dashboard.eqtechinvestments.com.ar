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

    return response.json()
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
    const queryParams: Record<string, string> = {
      start: '1',
      limit: '100',
      convert: 'USD',
      sort: 'market_cap',
      sort_dir: 'desc',
      cryptocurrency_type: 'all',
      ...params
    }

    // Convert numeric values to strings
    Object.entries(queryParams).forEach(([key, value]) => {
      if (typeof value === 'number') {
        queryParams[key] = value.toString()
      }
    })

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
      convert: 'USD',
      ...params
    }

    // Convert numeric values to strings
    Object.entries(queryParams).forEach(([key, value]) => {
      if (typeof value === 'number') {
        queryParams[key] = value.toString()
      }
    })

    return this.makeRequest<PriceConversionResponse>('/tools/price-conversion', queryParams)
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