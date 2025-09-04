import { NextResponse } from 'next/server'
import { getCoinMarketCapClient } from '@/lib/coinmarketcap/client'

// Simple in-memory cache
let globalHistoricalCache: {
  data: unknown
  timestamp: number
} = {
  data: null,
  timestamp: 0
}

const CACHE_DURATION = 4 * 60 * 60 * 1000 // 4 hours (historical data doesn't change often)

export async function GET() {
  try {
    const now = Date.now()
    
    // Check cache
    if (globalHistoricalCache.data && (now - globalHistoricalCache.timestamp) < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: globalHistoricalCache.data,
        cached: true
      })
    }

    const client = getCoinMarketCapClient()
    
    // Get 12 months of data with 30-day intervals
    const historicalData = await client.getGlobalMetricsHistorical({
      interval: '30d',
      count: 12
    })

    // Update cache
    globalHistoricalCache = {
      data: historicalData,
      timestamp: now
    }

    return NextResponse.json({
      success: true,
      data: historicalData,
      cached: false
    })

  } catch (error) {
    console.error('Error in /api/crypto/global-historical:', error)
    
    // Return stale data if available
    if (globalHistoricalCache.data) {
      return NextResponse.json({
        success: true,
        data: globalHistoricalCache.data,
        cached: true,
        stale: true
      })
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch global historical metrics' 
      },
      { status: 500 }
    )
  }
}