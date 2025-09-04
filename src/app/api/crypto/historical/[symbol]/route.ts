import { NextRequest, NextResponse } from 'next/server'
import { getCoinMarketCapClient } from '@/lib/coinmarketcap/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params
    const { searchParams } = new URL(request.url)
    
    const count = searchParams.get('count') || '30'
    const interval = searchParams.get('interval') || '1d'
    
    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbol is required' },
        { status: 400 }
      )
    }

    const client = getCoinMarketCapClient()
    const data = await client.getHistoricalQuotes({
      symbol: symbol.toUpperCase(),
      count: parseInt(count),
      interval: interval as '5m' | '10m' | '15m' | '30m' | '45m' | '1h' | '2h' | '3h' | '4h' | '6h' | '12h' | '1d' | '2d' | '3d' | '7d' | '14d' | '15d' | '30d' | '60d' | '90d' | '365d'
    })

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Error fetching historical crypto data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch historical data'
      },
      { status: 500 }
    )
  }
}