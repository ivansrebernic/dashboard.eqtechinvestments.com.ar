'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RoleBadge } from '@/components/roles/role-badge'
import { useUserRole, usePermissions } from '@/lib/roles/hooks'
import { 
  Home, 
  BarChart3, 
  Settings, 
  Users, 
  Shield, 
  Menu, 
  X,
  LogOut,
  Briefcase,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  permission?: keyof ReturnType<typeof usePermissions>
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: Home,
    permission: 'canAccessDashboard'
  },
  {
    href: '/crypto',
    label: 'Crypto',
    icon: BarChart3,
    permission: 'canViewCrypto'
  },
  {
    href: '/admin',
    label: 'Admin',
    icon: Shield,
    permission: 'canAccessAdmin'
  },
  {
    href: '/admin/users',
    label: 'User Management',
    icon: Users,
    permission: 'canManageUsers'
  },
  {
    href: '/admin/portfolios',
    label: 'Portfolio Management',
    icon: Briefcase,
    permission: 'canAccessAdmin'
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings
  }
]

export function NavMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { role, loading } = useUserRole()
  const permissions = usePermissions()

  const filteredNavItems = navItems.filter(item => {
    if (!item.permission) return true
    return permissions[item.permission]
  })

  const handleSignOut = async () => {
    // This would typically be handled by your auth service
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="w-64 h-screen relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-eqtech-dark via-eqtech-gray-dark to-eqtech-dark">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--eqtech-gold)_0%,_transparent_50%)] opacity-5"></div>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,_transparent_0%,_var(--eqtech-gold)_1%,_transparent_2%)] opacity-10"></div>
        </div>
        <div className="relative p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-eqtech-gray-medium/30 rounded-lg backdrop-blur-sm"></div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-eqtech-gray-medium/20 rounded-lg backdrop-blur-sm"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Navigation sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 relative overflow-hidden transition-transform duration-300 ease-in-out md:sticky md:translate-x-0 md:h-screen md:top-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Multi-layered background with geometric patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-eqtech-dark via-eqtech-gray-dark to-eqtech-dark">
          {/* Subtle mesh gradient overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--eqtech-gold)_0%,_transparent_60%)] opacity-8"></div>
          {/* Diagonal lines pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(135deg,_transparent_0%,_var(--eqtech-gold)_1%,_transparent_2%,_transparent_48%,_var(--eqtech-gold)_49%,_transparent_50%)] opacity-15"></div>
          {/* Subtle noise texture */}
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,_transparent,_transparent_1px,_var(--eqtech-gold)_1px,_var(--eqtech-gold)_2px)] opacity-5"></div>
          {/* Inner glow border */}
          <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-eqtech-gold/30 to-transparent"></div>
        </div>
        
        <div className="relative flex h-full flex-col backdrop-blur-sm">
          {/* Header */}
          <div className="p-6 border-b border-eqtech-gold/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Logo/Brand Icon */}
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-eqtech-gold to-eqtech-dark-gold flex items-center justify-center shadow-lg">
                  <Shield className="h-4 w-4 text-eqtech-dark" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-eqtech-light font-montserrat tracking-tight">EQTech</h2>
                  <p className="text-xs text-eqtech-gray-light font-roboto-flex -mt-1">Admin Panel</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden hover:bg-eqtech-gold/10 text-eqtech-gray-light hover:text-eqtech-light transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {role && (
              <div className="mt-4">
                <RoleBadge role={role} />
              </div>
            )}
          </div>

          {/* Navigation items */}
          <nav className="flex-1 p-4 pt-2">
            <div className="space-y-1">
              {filteredNavItems.map((item, index) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))
                
                return (
                  <div key={item.href} className="relative group">
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 font-roboto-flex relative overflow-hidden group",
                        isActive 
                          ? "bg-gradient-to-r from-eqtech-gold/20 to-eqtech-gold/10 text-eqtech-light border border-eqtech-gold/20 shadow-lg" 
                          : "text-eqtech-gray-light hover:text-eqtech-light hover:bg-eqtech-gold/5 hover:border-eqtech-gold/10 border border-transparent"
                      )}
                    >
                      {/* Active indicator line */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-eqtech-gold to-eqtech-dark-gold rounded-full"></div>
                      )}
                      
                      {/* Icon container with subtle glow effect for active state */}
                      <div className={cn(
                        "relative flex items-center justify-center w-5 h-5 transition-all duration-200",
                        isActive ? "drop-shadow-[0_0_8px_var(--eqtech-gold)]" : ""
                      )}>
                        <item.icon className={cn(
                          "h-4 w-4 transition-colors duration-200",
                          isActive ? "text-eqtech-gold" : "text-eqtech-gray-light group-hover:text-eqtech-gold"
                        )} />
                      </div>
                      
                      <span className="flex-1 truncate">{item.label}</span>
                      
                      {/* Hover chevron indicator */}
                      <ChevronRight className={cn(
                        "h-3 w-3 transition-all duration-200 opacity-0 group-hover:opacity-50 transform translate-x-[-8px] group-hover:translate-x-0",
                        isActive ? "opacity-60 text-eqtech-gold" : "text-eqtech-gray-light"
                      )} />
                      
                      {/* Background shimmer effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-eqtech-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    </Link>
                    
                    {/* Subtle separator line */}
                    {index < filteredNavItems.length - 1 && (
                      <div className="mx-4 mt-2 h-px bg-gradient-to-r from-transparent via-eqtech-gray-medium/20 to-transparent"></div>
                    )}
                  </div>
                )
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-eqtech-gold/10">
            <div className="space-y-3">
              {/* System status indicator */}
              <div className="flex items-center justify-between px-4 py-2 bg-eqtech-gold/5 rounded-lg border border-eqtech-gold/10">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-eqtech-gray-light font-roboto-flex">System Online</span>
                </div>
                <div className="text-xs text-eqtech-gray-light font-roboto-flex">v2.1</div>
              </div>
              
              {/* Sign out button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-eqtech-gray-light hover:text-eqtech-light hover:bg-red-500/10 hover:border-red-400/20 border border-transparent transition-all duration-200 font-roboto-flex group py-3"
                onClick={handleSignOut}
              >
                <div className="flex items-center space-x-3 w-full">
                  <LogOut className="h-4 w-4 text-eqtech-gold group-hover:text-red-400 transition-colors" />
                  <span className="flex-1 text-left">Sign Out</span>
                  <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Simple horizontal nav for pages that don't need full sidebar
export function HorizontalNav() {
  const pathname = usePathname()
  const { role } = useUserRole()
  const permissions = usePermissions()

  const filteredNavItems = navItems.filter(item => {
    if (!item.permission) return true
    return permissions[item.permission]
  })

  return (
    <Card className="p-2">
      <nav className="flex items-center space-x-1">
        {filteredNavItems.slice(0, 4).map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          )
        })}
        
        <div className="flex-1" />
        
        {role && <RoleBadge role={role} />}
      </nav>
    </Card>
  )
}