import { NextRequest, NextResponse } from 'next/server'
import { getCoinMarketCapClient } from '@/lib/coinmarketcap/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params
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
      interval: interval as any
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