'use client'

import { useRouter } from 'next/navigation'
import { Portfolio, PortfolioPerformance } from '@/types/portfolio'
import { TrendingUp, TrendingDown, Wallet, Coins, Activity } from 'lucide-react'

interface PortfolioCardProps {
  portfolio: Portfolio
  performance: PortfolioPerformance
  loading?: boolean
  error?: string
}

// Helper function to calculate weighted ROI for a portfolio
function calculateWeightedROI(holdings: { portfolioWeight: number; priceChangePercent24h: number }[]): number {
  if (!holdings || holdings.length === 0) return 0
  
  return holdings.reduce((sum, holding) => {
    const weight = holding.portfolioWeight || 0
    const roi = holding.priceChangePercent24h || 0
    return sum + (weight * roi) / 100
  }, 0)
}

// Helper function to format percentage values
function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export function PortfolioCard({ portfolio, performance, loading, error }: PortfolioCardProps) {
  const router = useRouter()
  
  const weightedROI = calculateWeightedROI(performance.holdings)
  const topPerformer = performance.metrics.topPerformer
  
  const handleClick = () => {
    router.push(`/portfolios/${portfolio.id}`)
  }

  if (loading) {
    return (
      <div className="group relative bg-gradient-to-br from-eqtech-surface/80 via-eqtech-surface-elevated/60 to-eqtech-surface/80 backdrop-blur-xl border border-eqtech-gray-medium/20 rounded-3xl p-8 overflow-hidden animate-pulse">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-eqtech-gold/10 to-transparent rounded-full blur-2xl"></div>
        <div className="relative space-y-6">
          <div className="h-8 bg-eqtech-gray-medium/30 rounded-lg"></div>
          <div className="h-12 bg-eqtech-gray-medium/20 rounded-lg"></div>
          <div className="flex justify-between">
            <div className="h-4 w-16 bg-eqtech-gray-medium/20 rounded"></div>
            <div className="h-4 w-20 bg-eqtech-gray-medium/20 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="group relative bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent backdrop-blur-xl border border-red-500/20 rounded-3xl p-8 overflow-hidden">
        <div className="relative">
          <h3 className="text-xl font-semibold text-eqtech-light mb-2">{portfolio.name}</h3>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      onClick={handleClick}
      className="group relative bg-gradient-to-br from-eqtech-surface/80 via-eqtech-surface-elevated/60 to-eqtech-surface/80 backdrop-blur-xl border border-eqtech-gray-medium/20 rounded-3xl p-8 overflow-hidden cursor-pointer transition-all duration-500 hover:border-eqtech-gold/40 hover:shadow-2xl hover:shadow-eqtech-gold/10 hover:scale-[1.02] active:scale-[0.98]"
    >
      {/* Premium background effects */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-eqtech-gold/10 to-transparent rounded-full blur-2xl group-hover:from-eqtech-gold/20 transition-all duration-500"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-eqtech-gold/5 to-transparent rounded-full blur-3xl group-hover:from-eqtech-gold/10 transition-all duration-500"></div>
      
      {/* Interactive glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-eqtech-gold/0 via-eqtech-gold/0 to-eqtech-gold/0 group-hover:from-eqtech-gold/5 group-hover:via-eqtech-gold/2 group-hover:to-eqtech-gold/0 rounded-3xl transition-all duration-700"></div>
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-eqtech-gold/20 to-eqtech-gold/10 rounded-2xl backdrop-blur-sm group-hover:from-eqtech-gold/30 group-hover:to-eqtech-gold/20 transition-all duration-300">
              <Wallet className="w-6 h-6 text-eqtech-gold" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-eqtech-light group-hover:text-white transition-colors duration-300">
                {portfolio.name}
              </h3>
              {portfolio.description && (
                <p className="text-sm text-eqtech-gray-light group-hover:text-eqtech-gold-light transition-colors duration-300 mt-1">
                  {portfolio.description.length > 60 
                    ? `${portfolio.description.substring(0, 60)}...` 
                    : portfolio.description
                  }
                </p>
              )}
            </div>
          </div>
          
          {/* ROI Badge */}
          <div className={`flex items-center space-x-1 px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-300 ${
            weightedROI >= 0 
              ? 'bg-green-500/20 text-green-400 group-hover:bg-green-500/30' 
              : 'bg-red-500/20 text-red-400 group-hover:bg-red-500/30'
          }`}>
            {weightedROI >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{formatPercentage(weightedROI)}</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Asset Count */}
          <div className="p-4 bg-eqtech-surface/60 rounded-2xl border border-eqtech-gray-medium/10 group-hover:bg-eqtech-surface/80 group-hover:border-eqtech-gold/20 transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-eqtech-gold/10 rounded-lg group-hover:bg-eqtech-gold/20 transition-all duration-300">
                <Coins className="w-4 h-4 text-eqtech-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold text-eqtech-light">{performance.metrics.assetCount}</p>
                <p className="text-xs text-eqtech-gray-light">Assets</p>
              </div>
            </div>
          </div>

          {/* Top Performer */}
          <div className="p-4 bg-eqtech-surface/60 rounded-2xl border border-eqtech-gray-medium/10 group-hover:bg-eqtech-surface/80 group-hover:border-eqtech-gold/20 transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-400/10 rounded-lg group-hover:bg-green-400/20 transition-all duration-300">
                <Activity className="w-4 h-4 text-green-400" />
              </div>
              <div>
                {topPerformer ? (
                  <>
                    <p className="text-sm font-bold text-eqtech-light">{topPerformer.symbol}</p>
                    <p className="text-xs text-green-400">+{topPerformer.changePercent.toFixed(1)}%</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-eqtech-gray-light">-</p>
                    <p className="text-xs text-eqtech-gray-light">No data</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action indicator */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-eqtech-gray-light group-hover:text-eqtech-gold-light transition-colors duration-300">
            Click to view details
          </span>
          <div className="flex items-center space-x-1 text-eqtech-gold opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            <span className="text-xs">View</span>
            <TrendingUp className="w-3 h-3" />
          </div>
        </div>
      </div>
      
      {/* Hover border glow */}
      <div className="absolute inset-0 rounded-3xl border border-eqtech-gold/0 group-hover:border-eqtech-gold/30 transition-all duration-500"></div>
    </div>
  )
}