export interface CryptoCurrency {
  id: number
  name: string
  symbol: string
  slug: string
  num_market_pairs: number
  date_added: string
  tags: string[]
  max_supply: number | null
  circulating_supply: number
  total_supply: number
  platform: {
    id: number
    name: string
    symbol: string
    slug: string
    token_address: string
  } | null
  cmc_rank: number
  self_reported_circulating_supply: number | null
  self_reported_market_cap: number | null
  tvl_ratio: number | null
  last_updated: string
  quote: {
    [key: string]: {
      price: number
      volume_24h: number
      volume_change_24h: number
      percent_change_1h: number
      percent_change_24h: number
      percent_change_7d: number
      percent_change_30d: number
      percent_change_60d: number
      percent_change_90d: number
      market_cap: number
      market_cap_dominance: number
      fully_diluted_market_cap: number
      tvl: number | null
      last_updated: string
    }
  }
}

export interface CryptoListingsResponse {
  status: {
    timestamp: string
    error_code: number
    error_message: string | null
    elapsed: number
    credit_count: number
    notice: string | null
  }
  data: CryptoCurrency[]
}

export interface CryptoInfo {
  id: number
  name: string
  symbol: string
  category: string
  description: string
  slug: string
  logo: string
  subreddit: string
  notice: string
  tags: string[]
  'tag-names': string[]
  'tag-groups': string[]
  urls: {
    website: string[]
    twitter: string[]
    message_board: string[]
    chat: string[]
    facebook: string[]
    explorer: string[]
    reddit: string[]
    technical_doc: string[]
    source_code: string[]
    announcement: string[]
  }
  platform: {
    id: number
    name: string
    symbol: string
    slug: string
    token_address: string
  } | null
  date_added: string
  twitter_username: string
  is_hidden: number
  date_launched: string | null
  contract_address: {
    contract_address: string
    platform: {
      name: string
      coin: {
        id: string
        name: string
        symbol: string
        slug: string
      }
    }
  }[]
  self_reported_circulating_supply: number | null
  self_reported_tags: string[] | null
}

export interface CryptoInfoResponse {
  status: {
    timestamp: string
    error_code: number
    error_message: string | null
    elapsed: number
    credit_count: number
    notice: string | null
  }
  data: {
    [key: string]: CryptoInfo
  }
}

export interface GlobalMetrics {
  active_cryptocurrencies: number
  total_cryptocurrencies: number
  active_market_pairs: number
  active_exchanges: number
  total_exchanges: number
  eth_dominance: number
  btc_dominance: number
  eth_dominance_yesterday: number
  btc_dominance_yesterday: number
  eth_dominance_24h_percentage_change: number
  btc_dominance_24h_percentage_change: number
  defi_volume_24h: number
  defi_volume_24h_reported: number
  defi_market_cap: number
  defi_24h_percentage_change: number
  stablecoin_volume_24h: number
  stablecoin_volume_24h_reported: number
  stablecoin_market_cap: number
  stablecoin_24h_percentage_change: number
  derivatives_volume_24h: number
  derivatives_volume_24h_reported: number
  derivatives_24h_percentage_change: number
  quote: {
    [key: string]: {
      total_market_cap: number
      total_volume_24h: number
      total_volume_24h_reported: number
      altcoin_volume_24h: number
      altcoin_volume_24h_reported: number
      altcoin_market_cap: number
      defi_volume_24h: number
      defi_volume_24h_reported: number
      defi_24h_percentage_change: number
      defi_market_cap: number
      stablecoin_volume_24h: number
      stablecoin_volume_24h_reported: number
      stablecoin_24h_percentage_change: number
      stablecoin_market_cap: number
      derivatives_volume_24h: number
      derivatives_volume_24h_reported: number
      derivatives_24h_percentage_change: number
      total_market_cap_yesterday: number
      total_volume_24h_yesterday: number
      total_market_cap_yesterday_percentage_change: number
      total_volume_24h_yesterday_percentage_change: number
      last_updated: string
    }
  }
  last_updated: string
}

export interface GlobalMetricsResponse {
  status: {
    timestamp: string
    error_code: number
    error_message: string | null
    elapsed: number
    credit_count: number
    notice: string | null
  }
  data: GlobalMetrics
}

export interface PriceConversionResponse {
  status: {
    timestamp: string
    error_code: number
    error_message: string | null
    elapsed: number
    credit_count: number
    notice: string | null
  }
  data: {
    id: number
    symbol: string
    name: string
    amount: number
    last_updated: string
    quote: {
      [key: string]: {
        price: number
        last_updated: string
      }
    }
  }
}