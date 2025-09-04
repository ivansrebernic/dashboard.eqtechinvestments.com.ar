import { NextResponse } from 'next/server'
import { serverCryptoService } from '@/lib/coinmarketcap/server-services'

export async function GET() {
  try {
    const stats = serverCryptoService.getCacheStats()
    
    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        recommendations: [
          'Monitor API call reduction after implementing batch operations',
          'Track cache hit rates for optimal TTL tuning',
          'Monitor stale data usage during high-traffic periods'
        ],
        caching_strategy: {
          fresh_ttl: '5 minutes',
          stale_until: '15 minutes',
          batch_optimization: 'enabled',
          fallback_strategy: 'individual_requests'
        },
        optimization_impact: {
          estimated_api_reduction: '90-95%',
          cache_efficiency: stats.enhancedCache.hitRate,
          stale_data_usage: stats.enhancedCache.staleness
        }
      }
    })
  } catch (error) {
    console.error('Error in cache stats:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get cache statistics' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    // Clear all caches
    serverCryptoService.clearCache()
    
    return NextResponse.json({
      success: true,
      message: 'All caches cleared successfully'
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear cache' 
      },
      { status: 500 }
    )
  }
}