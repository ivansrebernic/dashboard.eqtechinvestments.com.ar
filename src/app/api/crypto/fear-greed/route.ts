import { NextResponse } from 'next/server'

// Simple in-memory cache
let fearGreedCache: {
  data: any
  timestamp: number
} = {
  data: null,
  timestamp: 0
}

const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

export async function GET() {
  try {
    const now = Date.now()
    
    // Check cache
    if (fearGreedCache.data && (now - fearGreedCache.timestamp) < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: fearGreedCache.data.data[0],
        cached: true
      })
    }

    // Fetch from Alternative.me API
    const response = await fetch('https://api.alternative.me/fng/', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const fearGreedData = await response.json()
    
    // Update cache
    fearGreedCache = {
      data: fearGreedData,
      timestamp: now
    }

    return NextResponse.json({
      success: true,
      data: fearGreedData.data[0],
      cached: false
    })

  } catch (error) {
    // Return stale data if available
    if (fearGreedCache.data) {
      return NextResponse.json({
        success: true,
        data: fearGreedCache.data.data[0],
        cached: true,
        stale: true
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Fear & Greed Index' },
      { status: 500 }
    )
  }
}