'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cryptoService } from '@/lib/coinmarketcap/services'
import { formatters } from '@/lib/coinmarketcap/services'
import { cn } from '@/lib/utils'
import type { CryptoCurrency } from '@/types/crypto'

interface CryptoSearchProps {
  onSelect: (crypto: CryptoCurrency) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function CryptoSearch({ onSelect, placeholder = "Search cryptocurrencies...", className, disabled }: CryptoSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<CryptoCurrency[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency | null>(null)
  
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Handle clicks outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search effect
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    if (query.trim().length < 2) {
      return
    }

    setLoading(true)
    
    debounceRef.current = setTimeout(async () => {
      try {
        const searchResults = await cryptoService.searchCryptocurrencies(query.trim(), 8)
        setResults(searchResults)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query])

  const handleSelect = (crypto: CryptoCurrency) => {
    setSelectedCrypto(crypto)
    setQuery('')
    setIsOpen(false)
    onSelect(crypto)
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    if (!query && results.length === 0 && !loading) {
      // Load popular cryptos when opening empty search
      loadPopularCryptos()
    }
  }

  const loadPopularCryptos = async () => {
    setLoading(true)
    try {
      const popular = await cryptoService.getTopCryptocurrencies(6)
      setResults(popular)
    } catch (error) {
      console.error('Error loading popular cryptos:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearSelection = () => {
    setSelectedCrypto(null)
    setQuery('')
    setResults([])
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div ref={searchRef} className={cn("relative w-full", className)}>
      {/* Selected crypto display */}
      {selectedCrypto && (
        <div className="flex items-center gap-3 p-3 border rounded-md bg-background">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              <img
                src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${selectedCrypto.id}.png`}
                alt={`${selectedCrypto.name} logo`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initial letter if image fails to load
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
              <span className="hidden text-xs font-bold text-primary">
                {selectedCrypto.symbol.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium text-sm">{selectedCrypto.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedCrypto.symbol} • {formatters.currency(selectedCrypto.quote.USD.price)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            disabled={disabled}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Search input */}
      {!selectedCrypto && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className="pl-10"
            disabled={disabled}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      {/* Dropdown results */}
      {isOpen && !selectedCrypto && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1">
          <Card>
            <CardContent className="p-0">
              {loading && results.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  Searching...
                </div>
              ) : results.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {query.trim() ? `No results for "${query}"` : 'Start typing to search cryptocurrencies'}
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {!query.trim() && (
                    <div className="p-2 text-xs text-muted-foreground font-medium border-b">
                      Popular Cryptocurrencies
                    </div>
                  )}
                  {results.map((crypto) => (
                    <button
                      key={crypto.id}
                      onClick={() => handleSelect(crypto)}
                      className="w-full p-3 text-left hover:bg-muted transition-colors border-b last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                          <img
                            src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${crypto.id}.png`}
                            alt={`${crypto.name} logo`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to initial letter if image fails to load
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                          <span className="hidden text-sm font-bold text-primary">
                            {crypto.symbol.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{crypto.name}</p>
                            <Badge variant="secondary" className="text-xs">
                              {crypto.symbol}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{formatters.currency(crypto.quote.USD.price)}</span>
                            <span className={cn(
                              "flex items-center",
                              crypto.quote.USD.percent_change_24h >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {crypto.quote.USD.percent_change_24h >= 0 ? '+' : ''}
                              {crypto.quote.USD.percent_change_24h.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p>#{crypto.cmc_rank}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}