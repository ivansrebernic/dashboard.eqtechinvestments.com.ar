'use client'

import { HoldingPerformance } from '@/types/portfolio'
import { formatters } from '@/lib/coinmarketcap/services'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { CryptoIcon } from '@/components/ui/crypto-icon'

interface HoldingsTableProps {
  holdings: HoldingPerformance[]
  loading?: boolean
  showTitle?: boolean
  title?: string
  className?: string
}


export function HoldingsTable({
  holdings,
  loading = false,
  showTitle = true,
  title = 'Portfolio Holdings',
  className = ''
}: HoldingsTableProps) {
  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-eqtech-surface/80 via-eqtech-surface-elevated/60 to-eqtech-surface/80 backdrop-blur-xl border border-eqtech-gray-medium/20 rounded-3xl p-8 ${className}`}>
        {showTitle && (
          <div className="mb-8 flex items-center space-x-3">
            <div className="w-6 h-6 bg-eqtech-gray-medium/30 rounded animate-pulse"></div>
            <div className="h-6 bg-eqtech-gray-medium/20 rounded w-48 animate-pulse"></div>
          </div>
        )}
        <div className="animate-pulse space-y-4">
          {/* Table headers */}
          <div className="grid grid-cols-5 gap-4 pb-4 border-b border-eqtech-gray-medium/30">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-eqtech-gray-medium/20 rounded"></div>
            ))}
          </div>
          {/* Table rows */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 py-4">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-6 bg-eqtech-gray-medium/10 rounded"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const sortedHoldings = holdings.sort((a, b) => b.portfolioWeight - a.portfolioWeight)

  return (
    <div className={`bg-gradient-to-br from-eqtech-surface/80 via-eqtech-surface-elevated/60 to-eqtech-surface/80 backdrop-blur-xl border border-eqtech-gray-medium/20 rounded-3xl p-8 ${className}`}>
      {showTitle && (
        <h3 className="text-2xl font-semibold text-eqtech-light mb-8 flex items-center space-x-3">
          <Wallet className="w-6 h-6 text-eqtech-gold" />
          <span>{title}</span>
        </h3>
      )}
      
      {sortedHoldings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-eqtech-gray-medium/30">
                <th className="text-left py-4 px-2 text-eqtech-gray-light font-medium text-sm uppercase tracking-wider">
                  Asset
                </th>
                <th className="text-right py-4 px-2 text-eqtech-gray-light font-medium text-sm uppercase tracking-wider">
                  Price
                </th>
                <th className="text-right py-4 px-2 text-eqtech-gray-light font-medium text-sm uppercase tracking-wider">
                  24h Change
                </th>
                <th className="text-right py-4 px-2 text-eqtech-gray-light font-medium text-sm uppercase tracking-wider">
                  Portfolio Weight %
                </th>
                <th className="text-right py-4 px-2 text-eqtech-gray-light font-medium text-sm uppercase tracking-wider">
                  Visual Weight
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((holding, index) => (
                <tr 
                  key={`${holding.symbol}-${index}`} 
                  className="border-b border-eqtech-gray-medium/20 hover:bg-eqtech-surface-elevated/30 transition-colors group"
                >
                  <td className="py-6 px-2">
                    <div className="flex items-center space-x-3">
                      <CryptoIcon
                        cryptoId={holding.cryptoId}
                        symbol={holding.symbol}
                        name={holding.cryptoName}
                        size={16}
                        className="shadow-sm"
                        showFallbackInitial={true}
                      />
                      <div>
                        <span className="font-semibold text-eqtech-light text-lg">
                          {holding.symbol}
                        </span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="text-right py-6 px-2">
                    <div className="text-eqtech-light font-medium text-lg">
                      {formatters.currency(holding.currentPrice)}
                    </div>
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
                        <div>
                          {holding.priceChangePercent24h >= 0 ? '+' : ''}
                          {holding.priceChangePercent24h.toFixed(2)}%
                        </div>
                      </div>
                    ) : (
                      <span className="text-eqtech-gray-light">-</span>
                    )}
                  </td>
                  
                  <td className="text-right py-6 px-2">
                    <div className="text-eqtech-light font-bold text-lg">
                      {holding.portfolioWeight.toFixed(1)}%
                    </div>
                  </td>
                  
                  <td className="text-right py-6 px-2">
                    <div className="flex items-center justify-end space-x-2">
                      <div className="w-16 h-2 bg-eqtech-gray-dark rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-eqtech-gold to-eqtech-gold-light rounded-full transition-all duration-500 group-hover:shadow-sm group-hover:shadow-eqtech-gold/50"
                          style={{ width: `${Math.min(100, holding.portfolioWeight)}%` }}
                        ></div>
                      </div>
                      <span className="text-eqtech-gold font-medium min-w-[3rem] text-sm">
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
        <div className="text-center py-12">
          <div className="p-6 bg-eqtech-gold/10 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-eqtech-gold" />
          </div>
          <h4 className="text-lg font-semibold text-eqtech-light mb-2">No Holdings Available</h4>
          <p className="text-eqtech-gray-light">
            This portfolio doesn&apos;t have any holdings configured yet.
          </p>
        </div>
      )}
    </div>
  )
}