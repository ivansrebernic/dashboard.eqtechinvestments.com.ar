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

      const performance: PortfolioPerformance = {
        totalValue,
        holdings: holdingPerformances
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