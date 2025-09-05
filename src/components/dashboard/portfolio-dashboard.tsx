'use client'

import { useEffect, useState, useCallback } from 'react'
import { publicPortfolioService } from '@/lib/portfolio/public-api-service'
import { Portfolio, PortfolioPerformance } from '@/types/portfolio'
import { formatters } from '@/lib/coinmarketcap/services'
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Wallet, DollarSign, BarChart3, ChevronDown, Coins, Clock, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { FearGreedIndex } from './fear-greed-index'
import { GlobalMarketCapChart } from './global-marketcap-chart'

interface PortfolioWithPerformance extends Portfolio {
  performance: PortfolioPerformance
  loading: boolean
  error?: string
}

const CHART_COLORS = ['#d4af37', '#e6c86b', '#f2d98f', '#c4941a', '#b8860b', '#e6c46b', '#f0d982', '#deb887']

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

export function PortfolioDashboard() {
  const [portfolios, setPortfolios] = useState<PortfolioWithPerformance[]>([])
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null)
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioWithPerformance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchPortfoliosData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const portfoliosData = await publicPortfolioService.getPortfolios()
      
      const portfoliosWithPerformance = await Promise.all(
        portfoliosData.map(async (portfolio) => {
          try {
            const performance = await publicPortfolioService.calculatePerformance(portfolio)
            return {
              ...portfolio,
              performance,
              loading: false
            }
          } catch (error) {
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
              error: error instanceof Error ? error.message : 'Failed to calculate performance'
            }
          }
        })
      )

      setPortfolios(portfoliosWithPerformance)
      setLastUpdated(new Date().toISOString())

      // Auto-select the first portfolio if none is selected
      if (!selectedPortfolioId && portfoliosWithPerformance.length > 0) {
        const firstPortfolio = portfoliosWithPerformance[0]
        setSelectedPortfolioId(firstPortfolio.id)
        setSelectedPortfolio(firstPortfolio)
      } else if (selectedPortfolioId) {
        // Update the selected portfolio with fresh data
        const updatedSelected = portfoliosWithPerformance.find(p => p.id === selectedPortfolioId)
        if (updatedSelected) {
          setSelectedPortfolio(updatedSelected)
        }
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch portfolio data')
    } finally {
      setLoading(false)
    }
  }, [selectedPortfolioId])


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


  const handlePortfolioSelection = (portfolioId: string) => {
    const selected = portfolios.find(p => p.id === portfolioId)
    if (selected) {
      setSelectedPortfolioId(portfolioId)
      setSelectedPortfolio(selected)
      setIsDropdownOpen(false)
    }
  }


  const getHoldingsDistributionData = () => {
    if (!selectedPortfolio) return []
    
    return selectedPortfolio.performance.holdings.map((holding, index) => ({
      name: holding.symbol,
      value: holding.portfolioWeight,
      percentage: holding.portfolioWeight,
      color: CHART_COLORS[index % CHART_COLORS.length]
    })).filter(item => item.value > 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-eqtech-dark p-6">
        <div className="max-w-8xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-eqtech-gold border-t-transparent"></div>
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
        {/* Enhanced Header with Portfolio Selector */}
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
                Analytics Suite
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
          
          {/* Portfolio Selector */}
          {portfolios.length > 0 && (
            <div className="relative inline-block">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-3 bg-gradient-to-r from-eqtech-surface/80 via-eqtech-surface-elevated/60 to-eqtech-surface/80 backdrop-blur-xl border border-eqtech-gray-medium/20 rounded-2xl px-6 py-4 text-eqtech-light hover:border-eqtech-gold/30 transition-all duration-300 hover:shadow-xl hover:shadow-eqtech-gold/10"
              >
                <Wallet className="w-6 h-6 text-eqtech-gold" />
                <span className="font-medium text-lg">
                  {selectedPortfolio ? selectedPortfolio.name : 'Select Portfolio'}
                </span>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-full mt-3 w-80 bg-eqtech-surface/90 backdrop-blur-xl border border-eqtech-gray-medium/30 rounded-2xl shadow-2xl z-50">
                  <div className="p-2">
                    {portfolios.map((portfolio) => (
                      <button
                        key={portfolio.id}
                        onClick={() => handlePortfolioSelection(portfolio.id)}
                        className={`group w-full text-left p-4 rounded-xl hover:bg-eqtech-surface-elevated/80 transition-all duration-200 relative overflow-hidden ${
                          selectedPortfolioId === portfolio.id 
                            ? 'bg-gradient-to-r from-eqtech-gold/20 to-eqtech-gold-light/10 border border-eqtech-gold/30 text-eqtech-light' 
                            : 'text-eqtech-light hover:border hover:border-eqtech-gray-medium/20'
                        }`}
                      >
                        {selectedPortfolioId === portfolio.id && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-eqtech-gold to-eqtech-gold-light rounded-full"></div>
                        )}
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-medium text-lg">{portfolio.name}</span>
                          <span className="text-sm font-bold text-eqtech-gold">
                            {formatPercentage(calculateWeightedROI(portfolio.performance.holdings))}
                          </span>
                        </div>
                        {portfolio.description && (
                          <p className="text-sm text-eqtech-gray-light truncate mb-2">
                            {portfolio.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-eqtech-gray-light">
                            {portfolio.performance.metrics.assetCount} assets
                          </span>
                          {portfolio.performance.totalChangePercent24h !== 0 && (
                            <div className={`flex items-center space-x-1 text-xs font-medium ${
                              portfolio.performance.totalChangePercent24h >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {portfolio.performance.totalChangePercent24h >= 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              <span>{portfolio.performance.totalChangePercent24h >= 0 ? '+' : ''}{portfolio.performance.totalChangePercent24h.toFixed(2)}%</span>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Market Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <FearGreedIndex />
          <div className="lg:col-span-2">
            <GlobalMarketCapChart />
          </div>
        </div>

        {/* Portfolio Analytics */}
        {selectedPortfolio ? (
          <>
            {/* Hero Metrics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
              {/* Total Portfolio Value */}
              <div className="group relative bg-gradient-to-br from-eqtech-surface/80 via-eqtech-surface-elevated/60 to-eqtech-surface/80 backdrop-blur-xl border border-eqtech-gray-medium/20 rounded-3xl p-8 hover:border-eqtech-gold/30 transition-all duration-500 hover:shadow-2xl hover:shadow-eqtech-gold/10 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-eqtech-gold/10 to-transparent rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-4 bg-gradient-to-br from-eqtech-gold/20 to-eqtech-gold/10 rounded-2xl backdrop-blur-sm">
                      <DollarSign className="w-8 h-8 text-eqtech-gold" />
                    </div>
                    <div className="text-xs text-eqtech-gray-light uppercase tracking-wider">Portfolio ROI</div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-4xl font-bold text-eqtech-light tracking-tight">
                      {formatPercentage(calculateWeightedROI(selectedPortfolio.performance.holdings))}
                    </p>
                    {selectedPortfolio.performance.totalChangePercent24h !== 0 && (
                      <div className={`flex items-center space-x-2 text-sm font-medium ${
                        selectedPortfolio.performance.totalChangePercent24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {selectedPortfolio.performance.totalChangePercent24h >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span>{selectedPortfolio.performance.totalChangePercent24h >= 0 ? '+' : ''}{selectedPortfolio.performance.totalChangePercent24h.toFixed(2)}% (24h)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Asset Count */}
              <div className="group relative bg-gradient-to-br from-eqtech-surface/80 via-eqtech-surface-elevated/60 to-eqtech-surface/80 backdrop-blur-xl border border-eqtech-gray-medium/20 rounded-3xl p-8 hover:border-eqtech-gold/30 transition-all duration-500 hover:shadow-2xl hover:shadow-eqtech-gold/10 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-eqtech-gold/10 to-transparent rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-4 bg-gradient-to-br from-eqtech-gold/20 to-eqtech-gold/10 rounded-2xl backdrop-blur-sm">
                      <Coins className="w-8 h-8 text-eqtech-gold" />
                    </div>
                    <div className="text-xs text-eqtech-gray-light uppercase tracking-wider">Assets</div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-4xl font-bold text-eqtech-light tracking-tight">
                      {selectedPortfolio.performance.metrics.assetCount}
                    </p>
                    <p className="text-sm text-eqtech-gray-light">
                      Diversified holdings
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Performer */}
              <div className="group relative bg-gradient-to-br from-eqtech-surface/80 via-eqtech-surface-elevated/60 to-eqtech-surface/80 backdrop-blur-xl border border-eqtech-gray-medium/20 rounded-3xl p-8 hover:border-green-400/30 transition-all duration-500 hover:shadow-2xl hover:shadow-green-400/10 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-400/10 to-transparent rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-4 bg-gradient-to-br from-green-400/20 to-green-400/10 rounded-2xl backdrop-blur-sm">
                      <TrendingUp className="w-8 h-8 text-green-400" />
                    </div>
                    <div className="text-xs text-eqtech-gray-light uppercase tracking-wider">Top Performer</div>
                  </div>
                  <div className="space-y-2">
                    {selectedPortfolio.performance.metrics.topPerformer ? (
                      <>
                        <p className="text-2xl font-bold text-eqtech-light tracking-tight">
                          {selectedPortfolio.performance.metrics.topPerformer.symbol}
                        </p>
                        <div className="flex items-center space-x-2 text-sm font-medium text-green-400">
                          <span>+{selectedPortfolio.performance.metrics.topPerformer.changePercent.toFixed(2)}%</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-xl text-eqtech-gray-light">No data</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Worst Performer */}
              <div className="group relative bg-gradient-to-br from-eqtech-surface/80 via-eqtech-surface-elevated/60 to-eqtech-surface/80 backdrop-blur-xl border border-eqtech-gray-medium/20 rounded-3xl p-8 hover:border-red-400/30 transition-all duration-500 hover:shadow-2xl hover:shadow-red-400/10 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-400/10 to-transparent rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-4 bg-gradient-to-br from-red-400/20 to-red-400/10 rounded-2xl backdrop-blur-sm">
                      <TrendingDown className="w-8 h-8 text-red-400" />
                    </div>
                    <div className="text-xs text-eqtech-gray-light uppercase tracking-wider">Needs Attention</div>
                  </div>
                  <div className="space-y-2">
                    {selectedPortfolio.performance.metrics.worstPerformer ? (
                      <>
                        <p className="text-2xl font-bold text-eqtech-light tracking-tight">
                          {selectedPortfolio.performance.metrics.worstPerformer.symbol}
                        </p>
                        <div className="flex items-center space-x-2 text-sm font-medium text-red-400">
                          <span>{selectedPortfolio.performance.metrics.worstPerformer.changePercent.toFixed(2)}%</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-xl text-eqtech-gray-light">No data</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and Analytics Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
              {/* Asset Allocation Chart */}
              <div className="bg-gradient-to-br from-eqtech-surface/80 via-eqtech-surface-elevated/60 to-eqtech-surface/80 backdrop-blur-xl border border-eqtech-gray-medium/20 rounded-3xl p-8">
                <h3 className="text-2xl font-semibold text-eqtech-light mb-6 flex items-center space-x-3">
                  <BarChart3 className="w-6 h-6 text-eqtech-gold" />
                  <span>Asset Allocation</span>
                </h3>
                {getHoldingsDistributionData().length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={getHoldingsDistributionData()}
                        cx="50%"
                        cy="50%"
                        outerRadius={140}
                        innerRadius={60}
                        dataKey="value"
                        label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                        labelLine={false}
                      >
                        {getHoldingsDistributionData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Portfolio Weight']}
                        contentStyle={{
                          backgroundColor: 'rgba(15, 20, 25, 0.95)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          borderRadius: '12px',
                          color: '#fff',
                          backdropFilter: 'blur(10px)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-eqtech-gray-light">
                    No allocation data available
                  </div>
                )}
              </div>

            </div>

            {/* Detailed Holdings Table */}
            <div className="bg-gradient-to-br from-eqtech-surface/80 via-eqtech-surface-elevated/60 to-eqtech-surface/80 backdrop-blur-xl border border-eqtech-gray-medium/20 rounded-3xl p-8">
              <h3 className="text-2xl font-semibold text-eqtech-light mb-8 flex items-center space-x-3">
                <Wallet className="w-6 h-6 text-eqtech-gold" />
                <span>Portfolio Holdings</span>
              </h3>
              {selectedPortfolio.performance.holdings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-eqtech-gray-medium/30">
                        <th className="text-left py-4 px-2 text-eqtech-gray-light font-medium text-sm uppercase tracking-wider">Asset</th>
                        <th className="text-right py-4 px-2 text-eqtech-gray-light font-medium text-sm uppercase tracking-wider">Price</th>
                        <th className="text-right py-4 px-2 text-eqtech-gray-light font-medium text-sm uppercase tracking-wider">24h Change</th>
                        <th className="text-right py-4 px-2 text-eqtech-gray-light font-medium text-sm uppercase tracking-wider">Portfolio Weight %</th>
                        <th className="text-right py-4 px-2 text-eqtech-gray-light font-medium text-sm uppercase tracking-wider">Visual Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPortfolio.performance.holdings
                        .sort((a, b) => b.portfolioWeight - a.portfolioWeight)
                        .map((holding, index) => (
                          <tr key={index} className="border-b border-eqtech-gray-medium/20 hover:bg-eqtech-surface-elevated/30 transition-colors group">
                            <td className="py-6 px-2">
                              <div className="flex items-center space-x-3">
                                <div className={`w-4 h-4 rounded-full flex-shrink-0`} style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div>
                                <span className="font-semibold text-eqtech-light text-lg">{holding.symbol}</span>
                              </div>
                            </td>
                            <td className="text-right py-6 px-2 text-eqtech-light font-medium">
                              {formatters.currency(holding.currentPrice)}
                            </td>
                            <td className="text-right py-6 px-2">
                              {holding.priceChangePercent24h !== 0 ? (
                                <div className={`flex items-center justify-end space-x-1 font-medium ${
                                  holding.priceChangePercent24h >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {holding.priceChangePercent24h >= 0 ? (
                                    <TrendingUp className="w-4 h-4" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4" />
                                  )}
                                  <span>{holding.priceChangePercent24h >= 0 ? '+' : ''}{holding.priceChangePercent24h.toFixed(2)}%</span>
                                </div>
                              ) : (
                                <span className="text-eqtech-gray-light">-</span>
                              )}
                            </td>
                            <td className="text-right py-6 px-2 text-eqtech-light font-bold text-lg">
                              {holding.portfolioWeight.toFixed(1)}%
                            </td>
                            <td className="text-right py-6 px-2">
                              <div className="flex items-center justify-end space-x-2">
                                <div className="w-16 h-2 bg-eqtech-gray-dark rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-eqtech-gold to-eqtech-gold-light rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, holding.portfolioWeight)}%` }}
                                  ></div>
                                </div>
                                <span className="text-eqtech-gold font-medium min-w-[3rem]">
                                  {holding.portfolioWeight.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-eqtech-gray-light">
                  No holdings available for this portfolio
                </div>
              )}
            </div>
          </>
        ) : !loading && portfolios.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-6 bg-eqtech-gold/10 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Wallet className="w-12 h-12 text-eqtech-gold" />
            </div>
            <h3 className="text-2xl font-semibold text-eqtech-light mb-4">No Portfolios Found</h3>
            <p className="text-eqtech-gray-light text-lg">
              Contact an administrator to create your first portfolio.
            </p>
          </div>
        ) : !selectedPortfolio && portfolios.length > 0 ? (
          <div className="text-center py-12">
            <div className="p-6 bg-eqtech-gold/10 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <BarChart3 className="w-12 h-12 text-eqtech-gold" />
            </div>
            <h3 className="text-2xl font-semibent text-eqtech-light mb-4">Select a Portfolio</h3>
            <p className="text-eqtech-gray-light text-lg">
              Choose a portfolio from the dropdown above to view detailed analytics.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}