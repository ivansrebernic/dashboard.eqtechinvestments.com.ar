'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'

interface FearGreedData {
  value: string
  value_classification: string
  timestamp: string
  time_until_update: string
}

export function FearGreedIndex() {
  const [data, setData] = useState<FearGreedData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/crypto/fear-greed')
        const result = await response.json()
        if (result.success) {
          setData(result.data)
        }
      } catch (error) {
        console.error('Fear & Greed fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60 * 60 * 1000) // 1 hour
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="w-fit">
        <Card className="bg-gradient-to-br from-eqtech-surface/80 to-eqtech-surface-elevated/60 backdrop-blur-sm border-eqtech-gold/20 shadow-lg">
          <div className="p-6 flex flex-col items-center space-y-4">
            <div className="h-4 w-24 bg-eqtech-gray-medium/30 rounded animate-pulse"></div>
            <div className="w-20 h-20 bg-eqtech-gray-medium/20 rounded-full animate-pulse"></div>
          </div>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const value = parseInt(data.value)
  const getColor = () => {
    if (value <= 24) return '#ef4444'
    if (value <= 49) return '#f97316' 
    if (value <= 74) return '#eab308'
    if (value <= 89) return '#22c55e'
    return '#16a34a'
  }

  const getLabel = () => {
    if (value <= 24) return 'Extreme Fear'
    if (value <= 49) return 'Fear'
    if (value <= 74) return 'Neutral' 
    if (value <= 89) return 'Greed'
    return 'Extreme Greed'
  }

  const color = getColor()

  return (
    <Card className="bg-gradient-to-br from-eqtech-surface/80 to-eqtech-surface-elevated/60 backdrop-blur-sm border-eqtech-gold/20 shadow-lg h-full">
      <div className="p-6 h-full flex flex-col justify-center">
        <div className="text-center">
          <div className="text-sm font-medium text-eqtech-gray-light font-roboto-flex mb-6">
            Fear & Greed Index
          </div>
          
          {/* Larger circular progress */}
          <div className="flex justify-center mb-6">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  className="text-eqtech-gray-medium/20"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke={color}
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={`${(value / 100) * 351.86} 351.86`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-eqtech-light mb-1">{value}</div>
                  <div className="text-sm font-medium" style={{ color }}>
                    {getLabel()}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-eqtech-gray-light font-roboto-flex">
            Last 24 hours
          </div>
        </div>
      </div>
    </Card>
  )
}