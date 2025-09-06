import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types for our operations
interface Portfolio {
  id: string
  name: string
  description?: string
}

interface PortfolioHolding {
  id: string
  portfolio_id: string
  symbol: string
  amount: number
}

interface CryptoCurrency {
  id: number
  name: string
  symbol: string
  quote: {
    USD: {
      price: number
      percent_change_24h: number
      market_cap: number
      volume_24h: number
    }
  }
}

interface SnapshotHolding {
  symbol: string
  amount: number
  currentPrice: number
  totalValue: number
  priceChange24h: number
  priceChangePercent24h: number
  portfolioWeight: number
  cryptoId?: number
  cryptoName?: string
}

interface SnapshotData {
  portfolioName: string
  holdings: SnapshotHolding[]
  totalValue: number
  totalChange24h: number
  totalChangePercent24h: number
  metrics: {
    assetCount: number
    topPerformer?: {
      symbol: string
      changePercent: number
    }
    worstPerformer?: {
      symbol: string
      changePercent: number
    }
  }
  timestamp: string
  cryptoPrices: Record<string, number>
}

serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const coinmarketcapApiKey = Deno.env.get('COINMARKETCAP_API_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Universal portfolio snapshot creation started')

    let results = {
      success: true,
      portfoliosProcessed: 0,
      snapshotsCreated: 0,
      errors: [] as string[],
      executionTime: 0,
      timestamp: new Date().toISOString()
    }

    const startTime = Date.now()

    // Get ALL portfolios
    const { data: allPortfolios, error: portfoliosError } = await supabase
      .from('portfolios')
      .select('*')
    
    if (portfoliosError) {
      throw new Error(`Failed to get portfolios: ${portfoliosError.message}`)
    }

    if (!allPortfolios || allPortfolios.length === 0) {
      return new Response(JSON.stringify({
        ...results,
        message: 'No portfolios found'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      })
    }

    console.log(`Found ${allPortfolios.length} total portfolios`)

    // Process each portfolio
    for (const portfolio of allPortfolios) {
      try {
        console.log(`Processing portfolio: ${portfolio.name} (${portfolio.id})`)
        
        // Get portfolio holdings
        const { data: holdings, error: holdingsError } = await supabase
          .from('portfolio_holdings')
          .select('*')
          .eq('portfolio_id', portfolio.id)
        
        if (holdingsError) {
          results.errors.push(`Failed to get holdings for ${portfolio.name}: ${holdingsError.message}`)
          continue
        }
        
        if (!holdings || holdings.length === 0) {
          console.log(`Portfolio ${portfolio.name} has no holdings, skipping`)
          continue
        }

        results.portfoliosProcessed++

        // Get crypto prices from CoinMarketCap
        const symbols = holdings.map(h => h.symbol.toUpperCase()).join(',')
        const cryptoPriceResponse = await fetch(
          `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbols}`,
          {
            headers: {
              'X-CMC_PRO_API_KEY': coinmarketcapApiKey,
              'Accept': 'application/json'
            }
          }
        )
        
        if (!cryptoPriceResponse.ok) {
          results.errors.push(`Failed to get crypto prices for ${portfolio.name}`)
          continue
        }
        
        const cryptoData = await cryptoPriceResponse.json()
        
        if (cryptoData.status?.error_code !== 0) {
          results.errors.push(`CoinMarketCap API error for ${portfolio.name}: ${cryptoData.status?.error_message}`)
          continue
        }

        // Calculate portfolio performance
        const snapshotHoldings: SnapshotHolding[] = []
        let totalValue = 0
        let totalChange24h = 0
        const cryptoPrices: Record<string, number> = {}
        
        for (const holding of holdings) {
          const crypto = cryptoData.data[holding.symbol.toUpperCase()] as CryptoCurrency
          
          if (!crypto) {
            console.warn(`Crypto not found: ${holding.symbol}`)
            continue
          }
          
          const quote = crypto.quote.USD
          const currentPrice = quote.price
          const currentValue = holding.amount * currentPrice
          const priceChangePercent24h = quote.percent_change_24h || 0
          const priceChange24h = (currentValue * priceChangePercent24h) / 100
          
          totalValue += currentValue
          totalChange24h += priceChange24h
          cryptoPrices[holding.symbol] = currentPrice
          
          snapshotHoldings.push({
            symbol: holding.symbol,
            amount: holding.amount,
            currentPrice,
            totalValue: currentValue,
            priceChange24h,
            priceChangePercent24h,
            portfolioWeight: 0, // Will be calculated after totals are known
            cryptoId: crypto.id,
            cryptoName: crypto.name
          })
        }
        
        if (snapshotHoldings.length === 0) {
          console.log(`Portfolio ${portfolio.name} has no valid holdings with price data, skipping`)
          continue
        }
        
        // Calculate portfolio weights and weighted returns
        let weightedReturn = 0
        for (const holding of snapshotHoldings) {
          holding.portfolioWeight = totalValue > 0 ? (holding.totalValue / totalValue) * 100 : 0
          weightedReturn += (holding.portfolioWeight * holding.priceChangePercent24h) / 100
        }
        
        // Find top and worst performers
        const sortedByPerformance = snapshotHoldings.sort((a, b) => b.priceChangePercent24h - a.priceChangePercent24h)
        const topPerformer = sortedByPerformance[0]
        const worstPerformer = sortedByPerformance[sortedByPerformance.length - 1]
        
        const totalChangePercent24h = totalValue > 0 ? (totalChange24h / (totalValue - totalChange24h)) * 100 : 0
        
        // Create snapshot data
        const snapshotData: SnapshotData = {
          portfolioName: portfolio.name,
          holdings: snapshotHoldings,
          totalValue,
          totalChange24h,
          totalChangePercent24h,
          metrics: {
            assetCount: snapshotHoldings.length,
            topPerformer: topPerformer ? {
              symbol: topPerformer.symbol,
              changePercent: topPerformer.priceChangePercent24h
            } : undefined,
            worstPerformer: worstPerformer ? {
              symbol: worstPerformer.symbol,
              changePercent: worstPerformer.priceChangePercent24h
            } : undefined
          },
          timestamp: new Date().toISOString(),
          cryptoPrices
        }
        
        // Save snapshot to database
        const { error: snapshotError } = await supabase
          .from('portfolio_performance_snapshots')
          .insert({
            portfolio_id: portfolio.id,
            weighted_return_percentage: weightedReturn,
            total_change_24h: totalChangePercent24h,
            asset_count: snapshotHoldings.length,
            top_performer_symbol: topPerformer?.symbol,
            top_performer_change: topPerformer?.priceChangePercent24h,
            worst_performer_symbol: worstPerformer?.symbol,
            worst_performer_change: worstPerformer?.priceChangePercent24h,
            snapshot_data: snapshotData
          })
        
        if (snapshotError) {
          results.errors.push(`Failed to save snapshot for ${portfolio.name}: ${snapshotError.message}`)
          continue
        }
        
        results.snapshotsCreated++
        
        console.log(`Successfully created snapshot for ${portfolio.name}`, {
          weightedReturn: `${weightedReturn.toFixed(2)}%`,
          totalValue: `$${totalValue.toFixed(2)}`,
          assetCount: snapshotHoldings.length
        })
        
      } catch (portfolioError) {
        console.error(`Error processing portfolio ${portfolio.name}:`, portfolioError)
        results.errors.push(`Error processing ${portfolio.name}: ${portfolioError.message}`)
      }
    }
    
    results.executionTime = Date.now() - startTime
    results.success = results.errors.length === 0 || results.snapshotsCreated > 0
    
    console.log('Universal portfolio snapshot creation completed', results)
    
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })
    
  } catch (error) {
    console.error('Universal snapshot creation error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    })
  }
})