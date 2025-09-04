'use client'

import { useEffect, useState } from 'react'
import { publicPortfolioService } from '@/lib/portfolio/public-api-service'
import { Portfolio, PortfolioPerformance, HoldingPerformance } from '@/types/portfolio'
import { formatters } from '@/lib/coinmarketcap/services'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { TrendingUp, TrendingDown, Wallet, DollarSign, Activity, BarChart3, ChevronDown, Coins } from 'lucide-react'
import { format, subDays } from 'date-fns'

interface PortfolioWithPerformance extends Portfolio {
  performance: PortfolioPerformance
  loading: boolean
  error?: string
}

interface DetailedMetrics {
  totalValue: number
  totalHoldings: number
  topHolding: HoldingPerformance | null
  change24h: number
  avgPrice: number
}

const CHART_COLORS = ['#c9b06e', '#e6d59a', '#f0e7c3', '#b8a05e', '#a08f54', '#8e7d4a', '#7a6b40', '#665936']

export function PortfolioDashboard() {
  const [portfolios, setPortfolios] = useState<PortfolioWithPerformance[]>([])
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null)
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioWithPerformance | null>(null)
  const [metrics, setMetrics] = useState<DetailedMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    fetchPortfoliosData()
  }, [])

  const fetchPortfoliosData = async () => {
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
              performance: { totalValue: 0, holdings: [] },
              loading: false,
              error: error instanceof Error ? error.message : 'Failed to calculate performance'
            }
          }
        })
      )

      setPortfolios(portfoliosWithPerformance)

      // Auto-select the first portfolio if none is selected
      if (!selectedPortfolioId && portfoliosWithPerformance.length > 0) {
        const firstPortfolio = portfoliosWithPerformance[0]
        setSelectedPortfolioId(firstPortfolio.id)
        setSelectedPortfolio(firstPortfolio)
        calculateDetailedMetrics(firstPortfolio)
      } else if (selectedPortfolioId) {
        // Update the selected portfolio with fresh data
        const updatedSelected = portfoliosWithPerformance.find(p => p.id === selectedPortfolioId)
        if (updatedSelected) {
          setSelectedPortfolio(updatedSelected)
          calculateDetailedMetrics(updatedSelected)
        }
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch portfolio data')
    } finally {
      setLoading(false)
    }
  }

  const calculateDetailedMetrics = (portfolio: PortfolioWithPerformance) => {
    const { performance } = portfolio
    const topHolding = performance.holdings.length > 0 
      ? performance.holdings.reduce((top, current) => 
          current.totalValue > top.totalValue ? current : top
        ) 
      : null

    const avgPrice = performance.holdings.length > 0
      ? performance.holdings.reduce((sum, holding) => sum + holding.currentPrice, 0) / performance.holdings.length
      : 0

    setMetrics({
      totalValue: performance.totalValue,
      totalHoldings: performance.holdings.length,
      topHolding,
      change24h: Math.random() * 10 - 5, // Mock data - would be calculated from historical data
      avgPrice
    })
  }

  const handlePortfolioSelection = (portfolioId: string) => {
    const selected = portfolios.find(p => p.id === portfolioId)
    if (selected) {
      setSelectedPortfolioId(portfolioId)
      setSelectedPortfolio(selected)
      calculateDetailedMetrics(selected)
      setIsDropdownOpen(false)
    }
  }

  const generateMockChartData = (portfolio: PortfolioWithPerformance) => {
    const data = []
    for (let i = 30; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const baseValue = portfolio.performance.totalValue
      const variance = baseValue * 0.1 * (Math.random() - 0.5)
      data.push({
        date: format(date, 'MMM dd'),
        value: Math.max(0, baseValue + variance),
        timestamp: date.getTime()
      })
    }
    return data
  }

  const getHoldingsDistributionData = () => {
    if (!selectedPortfolio) return []
    
    return selectedPortfolio.performance.holdings.map((holding, index) => ({
      name: holding.symbol,
      value: holding.totalValue,
      percentage: selectedPortfolio.performance.totalValue > 0 
        ? (holding.totalValue / selectedPortfolio.performance.totalValue) * 100 
        : 0,
      color: CHART_COLORS[index % CHART_COLORS.length]
    })).filter(item => item.value > 0)
  }

  const getHoldingsBarData = () => {
    if (!selectedPortfolio) return []
    
    return selectedPortfolio.performance.holdings.map(holding => ({
      symbol: holding.symbol,
      amount: holding.amount,
      value: holding.totalValue,
      price: holding.currentPrice
    })).sort((a, b) => b.value - a.value)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-eqtech-dark p-6">
        <div className="max-w-7xl mx-auto">
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
        <div className="max-w-7xl mx-auto">
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
    <div className="min-h-screen bg-eqtech-dark">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with Portfolio Selector */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-eqtech-light font-serif mb-4">
            Portfolio Analytics
          </h1>
          
          {/* Portfolio Selector */}
          {portfolios.length > 0 && (
            <div className="relative inline-block">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-3 bg-gradient-to-r from-eqtech-gray-dark to-eqtech-gray-darker border border-eqtech-gray-medium rounded-lg px-4 py-3 text-eqtech-light hover:border-eqtech-gold/50 transition-all duration-200"
              >
                <Wallet className="w-5 h-5 text-eqtech-gold" />
                <span className="font-medium">
                  {selectedPortfolio ? selectedPortfolio.name : 'Select Portfolio'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-full mt-2 w-64 bg-eqtech-gray-darker border border-eqtech-gray-medium rounded-lg shadow-2xl z-50">
                  <div className="py-2">
                    {portfolios.map((portfolio) => (
                      <button
                        key={portfolio.id}
                        onClick={() => handlePortfolioSelection(portfolio.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-eqtech-gray-dark transition-colors ${
                          selectedPortfolioId === portfolio.id ? 'bg-eqtech-gold/10 text-eqtech-gold' : 'text-eqtech-light'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{portfolio.name}</span>
                          <span className="text-sm text-eqtech-gray-light">
                            {formatters.currency(portfolio.performance.totalValue)}
                          </span>
                        </div>
                        {portfolio.description && (
                          <p className="text-sm text-eqtech-gray-light truncate mt-1">
                            {portfolio.description}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Portfolio Details */}
        {selectedPortfolio && metrics ? (
          <>
            {/* Key Metrics for Selected Portfolio */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-eqtech-gray-dark to-eqtech-gray-darker border border-eqtech-gray-medium rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-eqtech-gray-light text-sm font-medium">Total Value</p>
                    <p className="text-2xl font-bold text-eqtech-light mt-1">
                      {formatters.currency(metrics.totalValue)}
                    </p>
                  </div>
                  <div className="p-3 bg-eqtech-gold/10 rounded-lg">
                    <DollarSign className="w-6 h-6 text-eqtech-gold" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-eqtech-gray-dark to-eqtech-gray-darker border border-eqtech-gray-medium rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-eqtech-gray-light text-sm font-medium">Total Holdings</p>
                    <p className="text-2xl font-bold text-eqtech-light mt-1">
                      {metrics.totalHoldings}
                    </p>
                  </div>
                  <div className="p-3 bg-eqtech-gold/10 rounded-lg">
                    <Coins className="w-6 h-6 text-eqtech-gold" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-eqtech-gray-dark to-eqtech-gray-darker border border-eqtech-gray-medium rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-eqtech-gray-light text-sm font-medium">Top Holding</p>
                    <p className="text-xl font-semibold text-eqtech-light mt-1">
                      {metrics.topHolding ? metrics.topHolding.symbol : 'N/A'}
                    </p>
                    {metrics.topHolding && (
                      <p className="text-sm text-eqtech-gray-light">
                        {formatters.currency(metrics.topHolding.totalValue)}
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-eqtech-gold/10 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-eqtech-gold" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-eqtech-gray-dark to-eqtech-gray-darker border border-eqtech-gray-medium rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-eqtech-gray-light text-sm font-medium">24h Change</p>
                    <div className="flex items-center mt-1">
                      <p className={`text-2xl font-bold ${metrics.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {metrics.change24h >= 0 ? '+' : ''}{metrics.change24h.toFixed(2)}%
                      </p>
                      {metrics.change24h >= 0 ? (
                        <TrendingUp className="w-5 h-5 text-green-400 ml-2" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-400 ml-2" />
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-eqtech-gold/10 rounded-lg">
                    <Activity className="w-6 h-6 text-eqtech-gold" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              {/* Holdings Distribution Pie Chart */}
              <div className="bg-gradient-to-br from-eqtech-gray-dark to-eqtech-gray-darker border border-eqtech-gray-medium rounded-xl p-6">
                <h3 className="text-xl font-semibold text-eqtech-light mb-4">Holdings Distribution</h3>
                {getHoldingsDistributionData().length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={getHoldingsDistributionData()}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        dataKey="value"
                        label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                      >
                        {getHoldingsDistributionData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatters.currency(value), 'Value']}
                        contentStyle={{
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #333',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[350px] text-eqtech-gray-light">
                    No holdings data available
                  </div>
                )}
              </div>

              {/* Performance Trends */}
              <div className="bg-gradient-to-br from-eqtech-gray-dark to-eqtech-gray-darker border border-eqtech-gray-medium rounded-xl p-6">
                <h3 className="text-xl font-semibold text-eqtech-light mb-4">Performance Trends (30 Days)</h3>
                {selectedPortfolio.performance.totalValue > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={generateMockChartData(selectedPortfolio)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="date" stroke="#888" />
                      <YAxis stroke="#888" tickFormatter={(value) => formatters.currency(value)} />
                      <Tooltip 
                        formatter={(value: number) => [formatters.currency(value), 'Portfolio Value']}
                        contentStyle={{
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #333',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#c9b06e" 
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[350px] text-eqtech-gray-light">
                    No performance data available
                  </div>
                )}
              </div>
            </div>

            {/* Holdings Bar Chart */}
            <div className="mb-8">
              <div className="bg-gradient-to-br from-eqtech-gray-dark to-eqtech-gray-darker border border-eqtech-gray-medium rounded-xl p-6">
                <h3 className="text-xl font-semibold text-eqtech-light mb-4">Holdings Value Comparison</h3>
                {getHoldingsBarData().length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getHoldingsBarData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="symbol" stroke="#888" />
                      <YAxis stroke="#888" tickFormatter={(value) => formatters.currency(value)} />
                      <Tooltip 
                        formatter={(value: number) => [formatters.currency(value), 'Value']}
                        contentStyle={{
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #333',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Bar dataKey="value" fill="#c9b06e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-eqtech-gray-light">
                    No holdings data available
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Holdings Table */}
            <div className="bg-gradient-to-br from-eqtech-gray-dark to-eqtech-gray-darker border border-eqtech-gray-medium rounded-xl p-6">
              <h3 className="text-xl font-semibold text-eqtech-light mb-6">Detailed Holdings</h3>
              {selectedPortfolio.performance.holdings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-eqtech-gray-medium">
                        <th className="text-left py-3 px-4 text-eqtech-gray-light font-medium">Asset</th>
                        <th className="text-right py-3 px-4 text-eqtech-gray-light font-medium">Amount</th>
                        <th className="text-right py-3 px-4 text-eqtech-gray-light font-medium">Price</th>
                        <th className="text-right py-3 px-4 text-eqtech-gray-light font-medium">Total Value</th>
                        <th className="text-right py-3 px-4 text-eqtech-gray-light font-medium">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPortfolio.performance.holdings
                        .sort((a, b) => b.totalValue - a.totalValue)
                        .map((holding, index) => {
                          const weight = selectedPortfolio.performance.totalValue > 0 
                            ? (holding.totalValue / selectedPortfolio.performance.totalValue) * 100 
                            : 0
                          
                          return (
                            <tr key={index} className="border-b border-eqtech-gray-medium/30 hover:bg-eqtech-gray-medium/10 transition-colors">
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div>
                                  <span className="font-semibold text-eqtech-light">{holding.symbol}</span>
                                </div>
                              </td>
                              <td className="text-right py-4 px-4 text-eqtech-light">
                                {holding.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                              </td>
                              <td className="text-right py-4 px-4 text-eqtech-light">
                                {formatters.currency(holding.currentPrice)}
                              </td>
                              <td className="text-right py-4 px-4 text-eqtech-light font-semibold">
                                {formatters.currency(holding.totalValue)}
                              </td>
                              <td className="text-right py-4 px-4 text-eqtech-gold">
                                {weight.toFixed(2)}%
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-eqtech-gray-light">
                  No holdings available for this portfolio
                </div>
              )}
            </div>
          </>
        ) : !loading && portfolios.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-eqtech-gold/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-eqtech-gold" />
            </div>
            <h3 className="text-xl font-semibold text-eqtech-light mb-2">No Portfolios Found</h3>
            <p className="text-eqtech-gray-light">
              Contact an administrator to create your first portfolio.
            </p>
          </div>
        ) : !selectedPortfolio && portfolios.length > 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-eqtech-gold/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-eqtech-gold" />
            </div>
            <h3 className="text-xl font-semibold text-eqtech-light mb-2">Select a Portfolio</h3>
            <p className="text-eqtech-gray-light">
              Choose a portfolio from the dropdown above to view detailed analytics.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}