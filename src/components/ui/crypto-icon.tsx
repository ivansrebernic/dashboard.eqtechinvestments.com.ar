'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CryptoIconProps {
  cryptoId?: number
  symbol: string
  name?: string
  size?: 16 | 20 | 24 | 32 | 40 | 48
  className?: string
  fallbackClassName?: string
  showFallbackInitial?: boolean
  fallbackColor?: string
}

const CHART_COLORS = ['#d4af37', '#e6c86b', '#f2d98f', '#c4941a', '#b8860b', '#e6c46b', '#f0d982', '#deb887']

export function CryptoIcon({
  cryptoId,
  symbol,
  name,
  size = 24,
  className,
  fallbackClassName,
  showFallbackInitial = true,
  fallbackColor
}: CryptoIconProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Get fallback color from symbol if not provided
  const getFallbackColor = () => {
    if (fallbackColor) return fallbackColor
    
    // Simple hash function to consistently pick a color based on symbol
    let hash = 0
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash)
    }
    const colorIndex = Math.abs(hash) % CHART_COLORS.length
    return CHART_COLORS[colorIndex]
  }

  const containerClasses = cn(
    'rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 bg-eqtech-gray-medium',
    className
  )

  const fallbackClasses = cn(
    'w-full h-full rounded-full flex items-center justify-center text-eqtech-gold font-bold',
    fallbackClassName
  )

  // Use static class mappings that Tailwind can detect at build time
  const getSizeClasses = () => {
    switch (size) {
      case 16: return 'w-4 h-4'
      case 20: return 'w-5 h-5'
      case 24: return 'w-6 h-6'
      case 32: return 'w-8 h-8'
      case 40: return 'w-10 h-10'
      case 48: return 'w-12 h-12'
      default: return 'w-6 h-6'
    }
  }

  // If no crypto ID or image failed to load, show fallback
  if (!cryptoId || imageError) {
    if (showFallbackInitial) {
      return (
        <div className={cn(containerClasses, getSizeClasses())}>
          <div 
            className={fallbackClasses}
            style={{ backgroundColor: getFallbackColor() }}
          >
            <span style={{ fontSize: `${size * 0.5}px` }}>
              {symbol.charAt(0)}
            </span>
          </div>
        </div>
      )
    } else {
      return (
        <div 
          className={cn(containerClasses, getSizeClasses())}
          style={{ backgroundColor: getFallbackColor() }}
        >
        </div>
      )
    }
  }

  return (
    <div className={cn(containerClasses, getSizeClasses())}>
      <Image
        src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${cryptoId}.png`}
        alt={name ? `${name} (${symbol}) logo` : `${symbol} logo`}
        width={size}
        height={size}
        className={cn(
          'w-full h-full object-cover transition-opacity',
          imageLoaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setImageError(true)
          setImageLoaded(false)
        }}
      />
      
      {/* Show fallback while loading */}
      {!imageLoaded && !imageError && (
        <div 
          className={cn(
            fallbackClasses, 
            ' inset-0 animate-pulse'
          )}
          style={{ backgroundColor: getFallbackColor() }}
        >
          {showFallbackInitial && (
            <span style={{ fontSize: `${size * 0.5}px` }}>
              {symbol.charAt(0)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}