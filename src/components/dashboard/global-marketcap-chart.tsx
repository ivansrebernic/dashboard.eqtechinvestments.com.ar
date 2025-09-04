'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'

interface MarketCapDataPoint {
  timestamp: string
  total_market_cap: number
}

export function GlobalMarketCapChart() {
  const [data, setData] = useState<MarketCapDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [trend, setTrend] = useState<{ percentage: number; isPositive: boolean }>({ percentage: 0, isPositive: true })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/crypto/global-historical')
        const result = await response.json()
        
        console.log('Global market cap API response:', result)
        
        if (result.success && result.data?.data?.quotes) {
          // Transform the data for chart display
          const chartData = result.data.data.quotes.map((item: any) => ({
            timestamp: item.timestamp,
            total_market_cap: item.quote?.USD?.total_market_cap || 0,
            date: format(new Date(item.timestamp), 'MMM yyyy')
          })) // Keep original order (oldest first)

          setData(chartData)
          
          // Calculate trend (data is oldest first)
          if (chartData.length >= 2) {
            const latest = chartData[chartData.length - 1].total_market_cap // Last item is newest
            const previous = chartData[chartData.length - 2].total_market_cap // Second to last is previous month
            const change = ((latest - previous) / previous) * 100
            setTrend({ percentage: Math.abs(change), isPositive: change >= 0 })
          }
        } else {
          console.log('Data structure does not match expected format:', result.data)
          setError('Invalid data structure')
        }
      } catch (error) {
        console.error('Global market cap fetch error:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60 * 60 * 1000) // 1 hour
    return () => clearInterval(interval)
  }, [])

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
    return `$${(value / 1e6).toFixed(1)}M`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-eqtech-surface/90 backdrop-blur-sm border border-eqtech-gold/20 rounded-lg p-3 shadow-lg">
          <p className="text-sm text-eqtech-light font-medium">{label}</p>
          <p className="text-xs text-eqtech-gold">
            Market Cap: {formatMarketCap(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-eqtech-surface/80 to-eqtech-surface-elevated/60 backdrop-blur-sm border-eqtech-gold/20 shadow-lg h-full">
        <div className="p-6 space-y-4 h-full flex flex-col justify-center">
          <div className="h-4 w-32 bg-eqtech-gray-medium/30 rounded animate-pulse"></div>
          <div className="h-24 bg-eqtech-gray-medium/20 rounded animate-pulse"></div>
          <div className="h-3 w-24 bg-eqtech-gray-medium/20 rounded animate-pulse"></div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-eqtech-surface/80 to-eqtech-surface-elevated/60 backdrop-blur-sm border-red-400/20 shadow-lg h-full">
        <div className="p-6 h-full flex flex-col justify-center">
          <div className="text-center">
            <h3 className="text-sm font-medium text-eqtech-gray-light mb-2">
              Global Market Cap
            </h3>
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-eqtech-surface/80 to-eqtech-surface-elevated/60 backdrop-blur-sm border-eqtech-gold/20 shadow-lg h-full">
        <div className="p-6 h-full flex flex-col justify-center">
          <div className="text-center">
            <h3 className="text-sm font-medium text-eqtech-gray-light mb-2">
              Global Market Cap
            </h3>
            <p className="text-eqtech-gray-light text-xs">No data available</p>
          </div>
        </div>
      </Card>
    )
  }

  const currentValue = data[data.length - 1]?.total_market_cap || 0 // Last item is newest
  const TrendIcon = trend.isPositive ? TrendingUp : TrendingDown

  return (
    <Card className="bg-gradient-to-br from-eqtech-surface/80 to-eqtech-surface-elevated/60 backdrop-blur-sm border-eqtech-gold/20 shadow-lg h-full">
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-eqtech-gray-light font-roboto-flex">
              Global Market Cap
            </h3>
            <div className="text-2xl font-bold text-eqtech-light font-montserrat">
              {formatMarketCap(currentValue)}
            </div>
          </div>
          <div className={`flex items-center space-x-1 text-sm font-medium ${
            trend.isPositive ? 'text-green-400' : 'text-red-400'
          }`}>
            <TrendIcon className="w-4 h-4" />
            <span>{trend.isPositive ? '+' : '-'}{trend.percentage.toFixed(1)}%</span>
          </div>
        </div>

        {/* Chart - flex-1 to take remaining space */}
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis 
                dataKey="date" 
                hide 
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="total_market_cap" 
                stroke="#d4af37"
                strokeWidth={2}
                dot={false}
                activeDot={{ 
                  r: 4, 
                  fill: '#d4af37',
                  stroke: '#d4af37',
                  strokeWidth: 2
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Time range */}
        <div className="text-xs text-eqtech-gray-light font-roboto-flex mt-4">
          Last 12 months
        </div>
      </div>
    </Card>
  )
}