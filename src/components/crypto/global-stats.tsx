'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GlobalMetrics } from '@/types/crypto'
import { formatters } from '@/lib/coinmarketcap/services'

export function GlobalStats() {
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGlobalMetrics() {
      try {
        const response = await fetch('/api/crypto/global')
        const result = await response.json()

        if (result.success) {
          setMetrics(result.data)
        } else {
          setError(result.error || 'Failed to fetch global metrics')
        }
      } catch (err) {
        setError('Network error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchGlobalMetrics()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Global Market Stats</CardTitle>
          <CardDescription>Loading market overview...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Global Market Stats</CardTitle>
          <CardDescription className="text-red-600">Error: {error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!metrics) return null

  const usdQuote = metrics.quote.USD

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Market Stats</CardTitle>
        <CardDescription>
          Overview of the cryptocurrency market
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Total Market Cap</p>
              <p className="font-semibold">
                {formatters.marketCap(usdQuote.total_market_cap)}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">24h Volume</p>
              <p className="font-semibold">
                {formatters.volume(usdQuote.total_volume_24h)}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Active Cryptos</p>
              <p className="font-semibold">
                {formatters.number(metrics.active_cryptocurrencies)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">BTC Dominance</p>
              <p className="font-semibold">
                {metrics.btc_dominance.toFixed(2)}%
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">ETH Dominance</p>
              <p className="font-semibold">
                {metrics.eth_dominance.toFixed(2)}%
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Market Pairs</p>
              <p className="font-semibold">
                {formatters.number(metrics.active_market_pairs)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}