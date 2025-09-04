'use client'

import { useState, useEffect, useCallback } from 'react'
import { Portfolio, PortfolioPerformance } from '@/types/portfolio'
import { usePublicPortfolios } from '@/lib/portfolio/public-api-service'

interface OptimizedPortfolioDashboardProps {
  // This component demonstrates the optimized approach
  className?: string
}

export function OptimizedPortfolioDashboard({ className }: OptimizedPortfolioDashboardProps) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [performances, setPerformances] = useState<Map<string, PortfolioPerformance>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)
  
  const portfolioService = usePublicPortfolios()

  // OPTIMIZED: Load all portfolio data with a single batch API call
  const loadPortfolioData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Step 1: Get all portfolios
      const portfolioList = await portfolioService.getPortfolios()
      setPortfolios(portfolioList)

      // Step 2: BATCH calculate all performances at once
      // This replaces N individual API calls with 1 batch call
      const performanceMap = await portfolioService.calculateMultiplePortfolioPerformances(portfolioList)
      setPerformances(performanceMap)

      console.log(`✅ Optimized load complete: ${portfolioList.length} portfolios loaded with 1 batch API call`)
      
    } catch (err) {
      console.error('Portfolio loading error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load portfolio data')
    } finally {
      setLoading(false)
    }
  }, [portfolioService])

  // Manual refresh for demonstration
  const handleManualRefresh = () => {
    setRefreshCount(prev => prev + 1)
    loadPortfolioData()
  }

  // Initial load
  useEffect(() => {
    loadPortfolioData()
  }, [loadPortfolioData])

  // Optional: Auto-refresh every 5 minutes (reduced from 2 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh triggered')
      loadPortfolioData()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [loadPortfolioData])

  if (loading && portfolios.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error && portfolios.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error Loading Portfolios</h3>
          <p className="text-red-700 text-sm mt-1">{error}</p>
          <button 
            onClick={handleManualRefresh}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with refresh controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Dashboard</h2>
          <p className="text-gray-600 text-sm">
            Optimized with batch API calls • Refreshes: {refreshCount}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
          
          <div className="text-xs text-gray-500 flex items-center">
            Auto-refresh: 5min
          </div>
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {portfolios.map((portfolio) => {
          const performance = performances.get(portfolio.id)
          
          return (
            <div key={portfolio.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900">{portfolio.name}</h3>
                {loading && (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>

              {performance ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Value</span>
                    <span className="font-medium">
                      ${performance.totalValue.toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">24h Change</span>
                    <span className={`font-medium ${
                      performance.totalChangePercent24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {performance.totalChangePercent24h >= 0 ? '+' : ''}
                      {performance.totalChangePercent24h.toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    Assets: {performance.metrics.assetCount} • 
                    Updated: {new Date(performance.metrics.lastUpdated).toLocaleTimeString()}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Performance Summary */}
      {portfolios.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Optimization Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Portfolios</div>
              <div className="font-medium">{portfolios.length}</div>
            </div>
            <div>
              <div className="text-gray-600">API Strategy</div>
              <div className="font-medium text-green-600">Batch Optimized</div>
            </div>
            <div>
              <div className="text-gray-600">Cache TTL</div>
              <div className="font-medium">5min / 15min stale</div>
            </div>
            <div>
              <div className="text-gray-600">Auto Refresh</div>
              <div className="font-medium">Every 5 minutes</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OptimizedPortfolioDashboard