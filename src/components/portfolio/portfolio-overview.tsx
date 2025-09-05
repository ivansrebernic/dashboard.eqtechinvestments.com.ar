'use client'

import { useEffect, useState, useCallback } from 'react'
import { publicPortfolioService } from '@/lib/portfolio/public-api-service'
import { Portfolio, PortfolioPerformance } from '@/types/portfolio'
import { PortfolioCard } from './portfolio-card'
import { FearGreedIndex } from '@/components/dashboard/fear-greed-index'
import { GlobalMarketCapChart } from '@/components/dashboard/global-marketcap-chart'
import { Wallet, Zap, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface PortfolioWithPerformance extends Portfolio {
  performance: PortfolioPerformance
  loading: boolean
  error?: string
}

export function PortfolioOverview() {
  const [portfolios, setPortfolios] = useState<PortfolioWithPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchPortfoliosData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const portfoliosData = await publicPortfolioService.getPortfolios()
      
      // Use the batch-optimized API for better performance
      const performanceMap = await publicPortfolioService.calculateMultiplePortfolioPerformances(portfoliosData)
      
      const portfoliosWithPerformance = portfoliosData.map(portfolio => {
        const performance = performanceMap.get(portfolio.id)
        
        if (!performance) {
          return {
            ...portfolio,
            performance: {
              totalValue: 0,
              totalChange24h: 0,
              totalChangePercent24h: 0,
              holdings: [],
              metrics: {
                assetCount: 0,
                topPerformer: null,
                worstPerformer: null,
                lastUpdated: new Date().toISOString()
              }
            },
            loading: false,
            error: 'Failed to load performance data'
          }
        }
        
        return {
          ...portfolio,
          performance,
          loading: false
        }
      })

      // Sort portfolios by creation date (oldest first)
      const sortedPortfolios = portfoliosWithPerformance.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )

      setPortfolios(sortedPortfolios)
      setLastUpdated(new Date().toISOString())

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch portfolio data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPortfoliosData()
  }, [fetchPortfoliosData])

  // Set up real-time updates every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPortfoliosData()
    }, 120000) // 2 minutes

    return () => clearInterval(interval)
  }, [fetchPortfoliosData])

  if (loading) {
    return (
      <div className="min-h-screen bg-eqtech-dark relative overflow-hidden">
        {/* Premium background effects */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-eqtech-gold/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-eqtech-gold/3 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 max-w-8xl mx-auto p-8">
          <div className="animate-pulse space-y-8">
            <div className="h-16 bg-eqtech-gray-medium/20 rounded-2xl"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 bg-eqtech-gray-medium/10 rounded-3xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-eqtech-gray-medium/10 rounded-3xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-eqtech-dark p-6">
        <div className="max-w-8xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Portfolio Data</h2>
            <p className="text-red-300">{error}</p>
            <button
              onClick={fetchPortfoliosData}
              className="mt-4 px-4 py-2 bg-eqtech-gold text-eqtech-dark rounded-lg hover:bg-eqtech-gold/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-eqtech-dark relative overflow-hidden">
      {/* Premium background effects */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-eqtech-gold/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-eqtech-gold/3 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 max-w-8xl mx-auto p-8">
        {/* Enhanced Header */}
        <div className="mb-12">
          <div className="flex items-end justify-between mb-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-8 bg-gradient-to-b from-eqtech-gold to-eqtech-gold-light rounded-full shadow-lg shadow-eqtech-gold/20"></div>
                <h1 className="text-6xl font-bold text-eqtech-light font-serif tracking-tight">
                  Portfolio
                </h1>
              </div>
              <h2 className="text-2xl font-light text-eqtech-gold-light ml-12 font-montserrat tracking-wide">
                Overview
              </h2>
            </div>
            
            {/* Real-time status indicator */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 bg-eqtech-surface/60 rounded-xl border border-eqtech-gold/20 backdrop-blur-sm">
                <Zap className="w-4 h-4 text-green-400 animate-pulse" />
                <span className="text-xs text-eqtech-gray-light font-roboto-flex uppercase tracking-wider">Live</span>
              </div>
              
              {lastUpdated && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-eqtech-surface/40 rounded-xl border border-eqtech-gray-medium/20">
                  <Clock className="w-4 h-4 text-eqtech-gray-light" />
                  <span className="text-xs text-eqtech-gray-light">
                    {format(new Date(lastUpdated), 'HH:mm:ss')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Market Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <FearGreedIndex />
          <div className="lg:col-span-2">
            <GlobalMarketCapChart />
          </div>
        </div>

        {/* Portfolio Grid */}
        {portfolios.length > 0 ? (
          <>
            <div className="mb-8">
              <h3 className="text-3xl font-semibold text-eqtech-light mb-2 flex items-center space-x-3">
                <Wallet className="w-8 h-8 text-eqtech-gold" />
                <span>Your Portfolios</span>
              </h3>
              <p className="text-eqtech-gray-light ml-11">
                {portfolios.length} portfolio{portfolios.length !== 1 ? 's' : ''} • Click any card to view detailed analytics
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
              {portfolios.map((portfolio) => (
                <PortfolioCard
                  key={portfolio.id}
                  portfolio={portfolio}
                  performance={portfolio.performance}
                  loading={portfolio.loading}
                  error={portfolio.error}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="p-6 bg-eqtech-gold/10 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Wallet className="w-12 h-12 text-eqtech-gold" />
            </div>
            <h3 className="text-2xl font-semibold text-eqtech-light mb-4">No Portfolios Found</h3>
            <p className="text-eqtech-gray-light text-lg">
              Contact an administrator to create your first portfolio.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}