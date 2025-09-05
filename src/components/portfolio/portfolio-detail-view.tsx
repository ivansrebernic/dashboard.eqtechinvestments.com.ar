'use client'

import { useEffect, useState, useCallback } from 'react'
import { publicPortfolioService } from '@/lib/portfolio/public-api-service'
import { Portfolio, PortfolioPerformance } from '@/types/portfolio'
import { HistoricalPortfolioData } from '@/lib/portfolio/historical-data-service'
import { formatters } from '@/lib/coinmarketcap/services'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Wallet, DollarSign, Activity, BarChart3, Coins, Clock, Zap } from 'lucide-react'
import { format, subDays } from 'date-fns'

interface PortfolioDetailViewProps {
  portfolioId: string
}

interface PortfolioWithPerformance extends Portfolio {
  performance: PortfolioPerformance
  loading: boolean
  error?: string
  historicalData?: HistoricalPortfolioData[]
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

export function PortfolioDetailView({ portfolioId }: PortfolioDetailViewProps) {
  const [portfolio, setPortfolio] = useState<PortfolioWithPerformance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [historicalDataLoading, setHistoricalDataLoading] = useState(false)

  const fetchPortfolioData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const portfoliosData = await publicPortfolioService.getPortfolios()
      const selectedPortfolio = portfoliosData.find(p => p.id === portfolioId)
      
      if (!selectedPortfolio) {
        setError('Portfolio not found')
        return
      }

      const performance = await publicPortfolioService.calculatePerformance(selectedPortfolio)
      
      setPortfolio({
        ...selectedPortfolio,
        performance,
        loading: false
      })
      
      setLastUpdated(new Date().toISOString())

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch portfolio data')
    } finally {
      setLoading(false)
    }
  }, [portfolioId])

  // Fetch historical data for selected portfolio
  const fetchHistoricalData = useCallback(async (portfolioData: Portfolio) => {
    if (!portfolioData) return

    try {
      setHistoricalDataLoading(true)
      const historicalData = await publicPortfolioService.calculateHistoricalPerformance(portfolioData, 30)
      
      setPortfolio(prev => prev ? {
        ...prev,
        historicalData
      } : null)

    } catch (error) {
      console.error('Error fetching historical data:', error)
    } finally {
      setHistoricalDataLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPortfolioData()
  }, [fetchPortfolioData])

  // Set up real-time updates every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPortfolioData()
    }, 120000) // 2 minutes

    return () => clearInterval(interval)
  }, [fetchPortfolioData])

  // Fetch historical data when portfolio is loaded
  useEffect(() => {
    if (portfolio && !portfolio.historicalData && !portfolio.loading) {
      fetchHistoricalData(portfolio)
    }
  }, [portfolio, fetchHistoricalData])

  // Use real historical data or fall back to mock data
  const getChartData = (portfolioData: PortfolioWithPerformance) => {
    if (portfolioData.historicalData && portfolioData.historicalData.length > 0) {
      // Use real historical data
      return portfolioData.historicalData.map(dataPoint => ({
        date: format(new Date(dataPoint.timestamp), 'MMM dd'),
        value: dataPoint.value || 0,
        timestamp: dataPoint.timestamp
      }))
    }

    // Fallback to mock ROI data (should rarely happen now)
    const data = []
    const baseROI = portfolioData.performance.totalChangePercent24h || 0
    for (let i = 30; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const variance = baseROI * 0.2 * (Math.random() - 0.5)
      data.push({
        date: format(date, 'MMM dd'),
        value: baseROI + variance,
        timestamp: date.getTime()
      })
    }
    return data
  }

  const getHoldingsDistributionData = () => {
    if (!portfolio) return []
    
    return portfolio.performance.holdings.map((holding, index) => ({
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
            <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Portfolio</h2>
            <p className="text-red-300">{error}</p>
            <button
              onClick={fetchPortfolioData}
              className="mt-4 px-4 py-2 bg-eqtech-gold text-eqtech-dark rounded-lg hover:bg-eqtech-gold/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-eqtech-dark p-6">
        <div className="max-w-8xl mx-auto text-center py-12">
          <h2 className="text-xl font-semibold text-eqtech-light mb-4">Portfolio Not Found</h2>
          <p className="text-eqtech-gray-light">The requested portfolio could not be found.</p>
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
                  {portfolio.name}
                </h1>
              </div>
              {portfolio.description && (
                <p className="text-xl text-eqtech-gold-light ml-12 font-montserrat tracking-wide">
                  {portfolio.description}
                </p>
              )}
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

        {/* Hero Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
          {/* Total Portfolio ROI */}
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
                  {formatPercentage(calculateWeightedROI(portfolio.performance.holdings))}
                </p>
                {portfolio.performance.totalChangePercent24h !== 0 && (
                  <div className={`flex items-center space-x-2 text-sm font-medium ${
                    portfolio.performance.totalChangePercent24h >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {portfolio.performance.totalChangePercent24h >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>{portfolio.performance.totalChangePercent24h >= 0 ? '+' : ''}{portfolio.performance.totalChangePercent24h.toFixed(2)}% (24h)</span>
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
                  {portfolio.performance.metrics.assetCount}
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
                {portfolio.performance.metrics.topPerformer ? (
                  <>
                    <p className="text-2xl font-bold text-eqtech-light tracking-tight">
                      {portfolio.performance.metrics.topPerformer.symbol}
                    </p>
                    <div className="flex items-center space-x-2 text-sm font-medium text-green-400">
                      <span>+{portfolio.performance.metrics.topPerformer.changePercent.toFixed(2)}%</span>
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
                {portfolio.performance.metrics.worstPerformer ? (
                  <>
                    <p className="text-2xl font-bold text-eqtech-light tracking-tight">
                      {portfolio.performance.metrics.worstPerformer.symbol}
                    </p>
                    <div className="flex items-center space-x-2 text-sm font-medium text-red-400">
                      <span>{portfolio.performance.metrics.worstPerformer.changePercent.toFixed(2)}%</span>
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

          {/* Performance Chart */}
          <div className="bg-gradient-to-br from-eqtech-surface/80 via-eqtech-surface-elevated/60 to-eqtech-surface/80 backdrop-blur-xl border border-eqtech-gray-medium/20 rounded-3xl p-8">
            <h3 className="text-2xl font-semibold text-eqtech-light mb-6 flex items-center space-x-3">
              <Activity className="w-6 h-6 text-eqtech-gold" />
              <span>Performance Trends</span>
              {historicalDataLoading && (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-eqtech-gold border-t-transparent"></div>
              )}
            </h3>
            {portfolio.performance.holdings.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={getChartData(portfolio)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" tickFormatter={(value) => `${value.toFixed(1)}%`} fontSize={12} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'ROI Trend']}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 20, 25, 0.95)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '12px',
                      color: '#fff',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#d4af37" 
                    strokeWidth={3}
                    dot={{ fill: '#d4af37', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#d4af37', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-eqtech-gray-light">
                No performance data available
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
          {portfolio.performance.holdings.length > 0 ? (
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
                  {portfolio.performance.holdings
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
      </div>
    </div>
  )
}