'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity } from 'lucide-react'

interface ChartDataPoint {
  date: string
  value: number
  timestamp: number
}

interface PerformanceChartProps {
  data: ChartDataPoint[]
  loading?: boolean
  height?: number
  title?: string
  showTitle?: boolean
  className?: string
}

export function PerformanceChart({
  data,
  loading = false,
  height = 400,
  title = 'Performance Trends',
  showTitle = true,
  className = ''
}: PerformanceChartProps) {
  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-eqtech-surface/80 via-eqtech-surface-elevated/60 to-eqtech-surface/80 backdrop-blur-xl border border-eqtech-gray-medium/20 rounded-3xl p-8 ${className}`}>
        {showTitle && (
          <div className="mb-6 flex items-center space-x-3">
            <div className="w-6 h-6 bg-eqtech-gold/20 rounded animate-pulse"></div>
            <div className="h-6 bg-eqtech-gray-medium/20 rounded w-48 animate-pulse"></div>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-eqtech-gold border-t-transparent"></div>
          </div>
        )}
        <div className="animate-pulse">
          <div style={{ height }} className="bg-eqtech-gray-medium/10 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-br from-eqtech-surface/80 via-eqtech-surface-elevated/60 to-eqtech-surface/80 backdrop-blur-xl border border-eqtech-gray-medium/20 rounded-3xl p-8 ${className}`}>
      {showTitle && (
        <h3 className="text-2xl font-semibold text-eqtech-light mb-6 flex items-center space-x-3">
          <Activity className="w-6 h-6 text-eqtech-gold" />
          <span>{title}</span>
        </h3>
      )}
      
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="date" 
              stroke="#888" 
              fontSize={12}
              tick={{ fill: '#888' }}
              tickLine={{ stroke: '#888' }}
            />
            <YAxis 
              stroke="#888" 
              tickFormatter={(value) => `${value.toFixed(1)}%`} 
              fontSize={12}
              tick={{ fill: '#888' }}
              tickLine={{ stroke: '#888' }}
            />
            <Tooltip 
              formatter={(value: number) => [`${value.toFixed(2)}%`, 'ROI Trend']}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: 'rgba(15, 20, 25, 0.95)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '12px',
                color: '#fff',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
              }}
              cursor={{
                stroke: 'rgba(212, 175, 55, 0.5)',
                strokeWidth: 1,
                strokeDasharray: '3 3'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#d4af37" 
              strokeWidth={3}
              dot={{ 
                fill: '#d4af37', 
                strokeWidth: 2, 
                r: 4,
                stroke: '#d4af37'
              }}
              activeDot={{ 
                r: 6, 
                stroke: '#d4af37', 
                strokeWidth: 2,
                fill: '#d4af37',
                style: {
                  filter: 'drop-shadow(0 0 6px #d4af37)'
                }
              }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center text-eqtech-gray-light" style={{ height }}>
          <div className="text-center">
            <Activity className="w-12 h-12 text-eqtech-gray-medium/50 mx-auto mb-4" />
            <p>No performance data available</p>
          </div>
        </div>
      )}
    </div>
  )
}