'use client'

import { useEffect, useState, useCallback } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import { PortfolioPerformanceSnapshot } from '@/types/snapshots'
import { format, parseISO } from 'date-fns'
import { TrendingUp, TrendingDown, Calendar, BarChart3, RefreshCw, Clock } from 'lucide-react'

interface PerformanceChartProps {
  portfolioId: string
  className?: string
}

interface ChartDataPoint {
  timestamp: string
  date: string
  weightedReturn: number
  totalChange24h: number
  assetCount: number
  displayDate: string
  formattedTime: string
}

export function PerformanceChart({ portfolioId, className = '' }: PerformanceChartProps) {
  const [snapshots, setSnapshots] = useState<PortfolioPerformanceSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchSnapshots = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/portfolios/${portfolioId}/snapshots?limit=20`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch snapshots: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch snapshots')
      }

      setSnapshots(data.data.snapshots || [])
      setLastUpdated(new Date().toISOString())

    } catch (error) {
      console.error('Error fetching snapshots:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch performance data')
      setSnapshots([])
    } finally {
      setLoading(false)
    }
  }, [portfolioId])

  useEffect(() => {
    fetchSnapshots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolioId])

  // Transform snapshots data for chart
  const chartData: ChartDataPoint[] = snapshots.map(snapshot => ({
    timestamp: snapshot.calculatedAt,
    date: snapshot.calculatedAt,
    weightedReturn: snapshot.weightedReturnPercentage,
    totalChange24h: snapshot.totalChange24h || 0,
    assetCount: snapshot.assetCount,
    displayDate: format(parseISO(snapshot.calculatedAt), 'MMM dd'),
    formattedTime: format(parseISO(snapshot.calculatedAt), 'HH:mm')
  })).reverse() // Show chronological order

  // Calculate performance metrics
  const latestSnapshot = snapshots[0]
  const oldestSnapshot = snapshots[snapshots.length - 1]
  const totalPeriodReturn = latestSnapshot && oldestSnapshot 
    ? latestSnapshot.weightedReturnPercentage - oldestSnapshot.weightedReturnPercentage
    : 0

  const averageReturn = snapshots.length > 0 
    ? snapshots.reduce((sum, s) => sum + s.weightedReturnPercentage, 0) / snapshots.length
    : 0

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-eqtech-surface/80 via-eqtech-surface-elevated/60 to-eqtech-surface/80 backdrop-blur-xl border border-eqtech-gray-medium/20 rounded-3xl p-8 ${className}`}>
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-eqtech-gold border-t-transparent"></div>
            <span className="text-eqtech-gray-light">Loading performance data...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-gradient-to-br from-eqtech-surface/80 via-eqtech-surface-elevated/60 to-eqtech-surface/80 backdrop-blur-xl border border-eqtech-gray-medium/20 rounded-3xl p-8 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-eqtech-light flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-eqtech-gold" />
            <span>Performance History</span>
          </h3>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchSnapshots}
            className="flex items-center space-x-2 px-4 py-2 bg-eqtech-gold text-eqtech-dark rounded-lg hover:bg-eqtech-gold/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    )
  }

  if (snapshots.length === 0) {
    return (
      <div className={`bg-gradient-to-br from-eqtech-surface/80 via-eqtech-surface-elevated/60 to-eqtech-surface/80 backdrop-blur-xl border border-eqtech-gray-medium/20 rounded-3xl p-8 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-eqtech-light flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-eqtech-gold" />
            <span>Performance History</span>
          </h3>
        </div>
        <div className="flex items-center justify-center h-64 text-eqtech-gray-light">
          <div className="text-center space-y-2">
            <Calendar className="w-12 h-12 mx-auto opacity-50" />
            <p>No performance snapshots available yet</p>
            <p className="text-sm">Snapshots will appear here as data is collected</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-br from-eqtech-surface/80 via-eqtech-surface-elevated/60 to-eqtech-surface/80 backdrop-blur-xl border border-eqtech-gray-medium/20 rounded-3xl p-8 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-semibold text-eqtech-light flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-eqtech-gold" />
          <span>Performance History</span>
        </h3>
        
        {lastUpdated && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-eqtech-surface/40 rounded-lg border border-eqtech-gray-medium/20">
            <Clock className="w-4 h-4 text-eqtech-gray-light" />
            <span className="text-xs text-eqtech-gray-light">
              Updated {format(new Date(lastUpdated), 'HH:mm:ss')}
            </span>
          </div>
        )}
      </div>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Latest Return */}
        <div className="bg-eqtech-surface/60 rounded-2xl p-4 border border-eqtech-gray-medium/20">
          <div className="flex items-center space-x-3">
            {latestSnapshot.weightedReturnPercentage >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
            <div>
              <p className="text-xs text-eqtech-gray-light uppercase tracking-wider">Current Return</p>
              <p className={`text-lg font-bold ${latestSnapshot.weightedReturnPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {latestSnapshot.weightedReturnPercentage >= 0 ? '+' : ''}{latestSnapshot.weightedReturnPercentage.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Period Performance */}
        <div className="bg-eqtech-surface/60 rounded-2xl p-4 border border-eqtech-gray-medium/20">
          <div className="flex items-center space-x-3">
            {totalPeriodReturn >= 0 ? (
              <TrendingUp className="w-5 h-5 text-blue-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-orange-400" />
            )}
            <div>
              <p className="text-xs text-eqtech-gray-light uppercase tracking-wider">Period Change</p>
              <p className={`text-lg font-bold ${totalPeriodReturn >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                {totalPeriodReturn >= 0 ? '+' : ''}{totalPeriodReturn.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Average Return */}
        <div className="bg-eqtech-surface/60 rounded-2xl p-4 border border-eqtech-gray-medium/20">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-5 h-5 text-eqtech-gold" />
            <div>
              <p className="text-xs text-eqtech-gray-light uppercase tracking-wider">Average Return</p>
              <p className="text-lg font-bold text-eqtech-gold">
                {averageReturn >= 0 ? '+' : ''}{averageReturn.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(212, 175, 55, 0.1)"
              horizontal={true}
              vertical={false}
            />
            <XAxis 
              dataKey="displayDate" 
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <ReferenceLine y={0} stroke="rgba(212, 175, 55, 0.5)" strokeDasharray="2 2" />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as ChartDataPoint
                  return (
                    <div className="bg-eqtech-surface/95 backdrop-blur-sm border border-eqtech-gold/30 rounded-xl p-4 shadow-xl">
                      <p className="text-eqtech-light font-medium mb-2">{label} - {data.formattedTime}</p>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="text-eqtech-gray-light">Weighted Return: </span>
                          <span className={`font-medium ${data.weightedReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {data.weightedReturn >= 0 ? '+' : ''}{data.weightedReturn.toFixed(2)}%
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="text-eqtech-gray-light">Assets: </span>
                          <span className="text-eqtech-light font-medium">{data.assetCount}</span>
                        </p>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Line 
              type="monotone" 
              dataKey="weightedReturn" 
              stroke="#d4af37" 
              strokeWidth={3}
              dot={false}
              activeDot={{ 
                r: 6, 
                fill: '#d4af37',
                stroke: '#f2d98f',
                strokeWidth: 2
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Data Summary */}
      <div className="mt-6 pt-6 border-t border-eqtech-gray-medium/20">
        <div className="flex items-center justify-between text-sm text-eqtech-gray-light">
          <span>Showing last {snapshots.length} snapshots</span>
          <span>{snapshots.length > 0 && `From ${format(parseISO(snapshots[snapshots.length - 1].calculatedAt), 'MMM dd, HH:mm')} to ${format(parseISO(snapshots[0].calculatedAt), 'MMM dd, HH:mm')}`}</span>
        </div>
      </div>
    </div>
  )
}