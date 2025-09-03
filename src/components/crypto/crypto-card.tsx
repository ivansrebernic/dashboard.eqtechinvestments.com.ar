import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CryptoCurrency } from '@/types/crypto'
import { formatters } from '@/lib/coinmarketcap/services'

interface CryptoCardProps {
  cryptocurrency: CryptoCurrency
}

export function CryptoCard({ cryptocurrency }: CryptoCardProps) {
  const quote = cryptocurrency.quote.USD
  const isPositive = quote.percent_change_24h > 0

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-muted-foreground">
                #{cryptocurrency.cmc_rank}
              </span>
              <h3 className="font-semibold text-lg">{cryptocurrency.symbol}</h3>
            </div>
          </div>
          <div className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{formatters.percentage(quote.percent_change_24h)}
          </div>
        </div>
        <p className="text-sm text-muted-foreground truncate">{cryptocurrency.name}</p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Price</span>
            <span className="font-semibold">
              {formatters.currency(quote.price)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Market Cap</span>
            <span className="text-sm">
              {formatters.marketCap(quote.market_cap)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Volume (24h)</span>
            <span className="text-sm">
              {formatters.volume(quote.volume_24h)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Change (7d)</span>
            <span className={`text-sm ${quote.percent_change_7d > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {quote.percent_change_7d > 0 ? '+' : ''}{formatters.percentage(quote.percent_change_7d)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}