'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'

export function FearGreedIndex() {
  const [data, setData] = useState<any>(null)
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
    const interval = setInterval(fetchData, 30 * 60 * 1000) // 30 minutes
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
    <div className="w-fit">
      <Card className="bg-gradient-to-br from-eqtech-surface/80 to-eqtech-surface-elevated/60 backdrop-blur-sm border-eqtech-gold/20 shadow-lg">
        <div className="p-6 flex flex-col items-center space-y-4">
          <div className="text-sm font-medium text-eqtech-gray-light font-roboto-flex">
            Fear & Greed Index
          </div>
          
          {/* Simple circular progress */}
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-eqtech-gray-medium/20"
              />
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke={color}
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${(value / 100) * 201} 201`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-eqtech-light">{value}</div>
              </div>
            </div>
          </div>
          
          <div className="text-xs font-medium text-center" style={{ color }}>
            {getLabel()}
          </div>
        </div>
      </Card>
    </div>
  )
}