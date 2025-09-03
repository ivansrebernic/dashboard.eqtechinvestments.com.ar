'use client'

import { useEffect, useState } from 'react'
import { CryptoCard } from './crypto-card'
import { CryptoCurrency } from '@/types/crypto'
import { Button } from '@/components/ui/button'

interface CryptoListProps {
  initialLimit?: number
}

export function CryptoList({ initialLimit = 10 }: CryptoListProps) {
  const [cryptocurrencies, setCryptocurrencies] = useState<CryptoCurrency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState(initialLimit)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    fetchCryptocurrencies(limit)
  }, [limit])

  async function fetchCryptocurrencies(currentLimit: number) {
    try {
      if (currentLimit > cryptocurrencies.length) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }

      const response = await fetch(`/api/crypto/listings?limit=${currentLimit}`)
      const result = await response.json()

      if (result.success) {
        setCryptocurrencies(result.data)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch cryptocurrencies')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    setLimit(prev => prev + 10)
  }

  const handleRefresh = () => {
    fetchCryptocurrencies(limit)
  }

  if (loading && cryptocurrencies.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(initialLimit)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-muted rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error && cryptocurrencies.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <Button onClick={handleRefresh} variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Top Cryptocurrencies</h2>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          disabled={loading || loadingMore}
        >
          {loading || loadingMore ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cryptocurrencies.map((crypto) => (
          <CryptoCard key={crypto.id} cryptocurrency={crypto} />
        ))}
      </div>

      {cryptocurrencies.length >= limit && (
        <div className="text-center pt-4">
          <Button 
            onClick={handleLoadMore} 
            variant="outline"
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}

      {error && (
        <div className="text-center text-red-600 text-sm">
          Error: {error}
        </div>
      )}
    </div>
  )
}