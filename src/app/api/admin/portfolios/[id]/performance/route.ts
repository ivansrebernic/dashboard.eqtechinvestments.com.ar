import { NextRequest, NextResponse } from 'next/server'
import { dbPortfolioService } from '@/lib/portfolio/db-service'
import { createClient } from '@/lib/supabase/server'
import { cryptoService } from '@/lib/coinmarketcap/services'
import type { PortfolioPerformance, HoldingPerformance } from '@/types/portfolio'

// GET /api/admin/portfolios/[id]/performance - Get portfolio performance with current values
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const portfolio = await dbPortfolioService.getPortfolioById(id)
    
    if (!portfolio || portfolio.holdings.length === 0) {
      return NextResponse.json(
        { error: 'Portfolio not found or has no holdings' },
        { status: 404 }
      )
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
            const priceChangePercent24h = cryptoData.quote.USD.percent_change_24h || 0
            const priceChange24h = (holdingValue * priceChangePercent24h) / 100

            holdingPerformances.push({
              symbol: holding.symbol,
              amount: holding.amount,
              currentPrice,
              totalValue: holdingValue,
              priceChange24h,
              priceChangePercent24h,
              marketCap: cryptoData.quote.USD.market_cap,
              volume24h: cryptoData.quote.USD.volume_24h,
              portfolioWeight: 0 // Will be calculated after all holdings are processed
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
            totalValue: 0,
            priceChange24h: 0,
            priceChangePercent24h: 0,
            portfolioWeight: 0
          })
        }
      }

      // Calculate portfolio weights
      const holdingsWithWeights = holdingPerformances.map(holding => ({
        ...holding,
        portfolioWeight: totalValue > 0 ? (holding.totalValue / totalValue) * 100 : 0
      }))

      // Calculate total changes
      const totalChange24h = holdingsWithWeights.reduce((sum, holding) => sum + holding.priceChange24h, 0)
      const totalChangePercent24h = totalValue > 0 ? (totalChange24h / (totalValue - totalChange24h)) * 100 : 0

      const performance: PortfolioPerformance = {
        totalValue,
        totalChange24h,
        totalChangePercent24h,
        holdings: holdingsWithWeights,
        metrics: {
          assetCount: holdingsWithWeights.length,
          topPerformer: null,
          worstPerformer: null,
          lastUpdated: new Date().toISOString()
        }
      }

      return NextResponse.json({ performance })
    } catch (error) {
      console.error('Error calculating portfolio performance:', error)
      return NextResponse.json(
        { error: 'Failed to calculate performance' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error fetching portfolio performance:', error)
    
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}