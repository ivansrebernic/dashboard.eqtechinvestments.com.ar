import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: string | number
    isPositive: boolean
    icon?: LucideIcon
  }
  color?: 'default' | 'success' | 'danger' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  loading?: boolean
  className?: string
  children?: ReactNode
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'default',
  size = 'md',
  onClick,
  loading,
  className = '',
  children
}: MetricCardProps) {
  const colorClasses = {
    default: 'border-eqtech-gray-medium/20 hover:border-eqtech-gold/30 shadow-eqtech-gold/10',
    success: 'border-eqtech-gray-medium/20 hover:border-green-400/30 shadow-green-400/10',
    danger: 'border-eqtech-gray-medium/20 hover:border-red-400/30 shadow-red-400/10',
    warning: 'border-eqtech-gray-medium/20 hover:border-yellow-400/30 shadow-yellow-400/10'
  }

  const iconColorClasses = {
    default: 'from-eqtech-gold/20 to-eqtech-gold/10 text-eqtech-gold',
    success: 'from-green-400/20 to-green-400/10 text-green-400',
    danger: 'from-red-400/20 to-red-400/10 text-red-400',
    warning: 'from-yellow-400/20 to-yellow-400/10 text-yellow-400'
  }

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const iconSizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const valueSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl'
  }

  if (loading) {
    return (
      <div className={`group relative bg-gradient-to-br from-eqtech-surface/80 via-eqtech-surface-elevated/60 to-eqtech-surface/80 backdrop-blur-xl border rounded-3xl overflow-hidden animate-pulse ${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-eqtech-gold/10 to-transparent rounded-full blur-2xl"></div>
        <div className="relative space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-eqtech-gray-medium/20 rounded-2xl"></div>
            <div className="w-16 h-4 bg-eqtech-gray-medium/20 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-eqtech-gray-medium/30 rounded"></div>
            <div className="h-4 bg-eqtech-gray-medium/20 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`group relative bg-gradient-to-br from-eqtech-surface/80 via-eqtech-surface-elevated/60 to-eqtech-surface/80 backdrop-blur-xl border rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl ${sizeClasses[size]} ${colorClasses[color]} ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-eqtech-gold/10 to-transparent rounded-full blur-2xl group-hover:from-eqtech-gold/20 transition-all duration-500"></div>
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 bg-gradient-to-br rounded-2xl backdrop-blur-sm transition-all duration-300 ${iconColorClasses[color]}`}>
            <Icon className={iconSizeClasses[size]} />
          </div>
          <div className="text-xs text-eqtech-gray-light uppercase tracking-wider">{title}</div>
        </div>
        
        {/* Value and content */}
        <div className="space-y-2">
          <p className={`font-bold text-eqtech-light tracking-tight ${valueSizeClasses[size]}`}>
            {value}
          </p>
          
          {/* Trend indicator */}
          {trend && (
            <div className={`flex items-center space-x-2 text-sm font-medium ${
              trend.isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {trend.icon && <trend.icon className="w-4 h-4" />}
              <span>{trend.value}</span>
            </div>
          )}
          
          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm text-eqtech-gray-light">
              {subtitle}
            </p>
          )}
          
          {/* Custom children */}
          {children}
        </div>
      </div>
      
      {/* Hover border glow */}
      {onClick && (
        <div className="absolute inset-0 rounded-3xl border border-eqtech-gold/0 group-hover:border-eqtech-gold/30 transition-all duration-500"></div>
      )}
    </div>
  )
}