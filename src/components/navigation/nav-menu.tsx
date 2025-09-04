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
        "fixed left-0 top-0 z-40 h-screen w-72 relative overflow-hidden transition-transform duration-300 ease-in-out md:sticky md:translate-x-0 md:h-screen md:top-0 md:self-start md:max-h-screen shadow-2xl shadow-black/20",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Premium Multi-layered background with advanced patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-eqtech-dark via-eqtech-darker to-eqtech-dark">
          {/* Luxury mesh gradient overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--eqtech-gold)_0%,_var(--eqtech-gold-light)_30%,_transparent_70%)] opacity-12"></div>
          {/* Premium geometric pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(135deg,_transparent_0%,_var(--eqtech-gold-light)_1%,_transparent_2%,_transparent_48%,_var(--eqtech-gold)_49%,_transparent_50%)] opacity-20"></div>
          {/* Sophisticated noise texture */}
          <div className="absolute inset-0 bg-[repeating-conic-gradient(from_0deg_at_50%_50%,_transparent_0deg,_var(--eqtech-gold)_2deg,_transparent_4deg)] opacity-8"></div>
          {/* Enhanced glow border with gradient */}
          <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-eqtech-gold/50 to-eqtech-gold-light/30 shadow-lg shadow-eqtech-gold/20"></div>
          {/* Floating light orbs */}
          <div className="absolute top-1/4 right-8 w-32 h-32 bg-gradient-to-br from-eqtech-gold/10 to-transparent rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-1/3 right-4 w-24 h-24 bg-gradient-to-br from-eqtech-gold-light/10 to-transparent rounded-full blur-2xl opacity-40"></div>
        </div>
        
        <div className="relative flex h-full flex-col backdrop-blur-sm">
          {/* Premium Header */}
          <div className="p-8 border-b border-gradient-to-r border-eqtech-gold/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Premium Logo/Brand Icon */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-eqtech-gold via-eqtech-gold-light to-eqtech-gold-light flex items-center justify-center shadow-2xl shadow-eqtech-gold/30">
                    <Shield className="h-6 w-6 text-eqtech-dark" />
                  </div>
                  <div className="absolute inset-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-eqtech-gold to-eqtech-gold-light opacity-50 blur-lg"></div>
                </div>
                <div className="space-y-1">
                  <h2 className="font-bold text-xl text-eqtech-light font-montserrat tracking-tight">EQTech</h2>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-eqtech-gold rounded-full"></div>
                    <p className="text-xs text-eqtech-gold-light font-roboto-flex uppercase tracking-wider">Investment Suite</p>
                  </div>
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
              <div className="mt-6">
                <div className="p-3 bg-eqtech-surface/60 backdrop-blur-sm rounded-xl border border-eqtech-gold/20">
                  <RoleBadge role={role} />
                </div>
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
                        "flex items-center space-x-4 px-6 py-4 rounded-2xl text-sm font-medium transition-all duration-300 font-roboto-flex relative overflow-hidden group",
                        isActive 
                          ? "bg-gradient-to-r from-eqtech-gold/25 via-eqtech-gold-light/20 to-eqtech-gold-light/15 text-eqtech-light border border-eqtech-gold/30 shadow-xl shadow-eqtech-gold/10" 
                          : "text-eqtech-gray-light hover:text-eqtech-light hover:bg-gradient-to-r hover:from-eqtech-gold/8 hover:to-eqtech-gold-light/5 hover:border-eqtech-gold/15 border border-transparent hover:shadow-lg hover:shadow-eqtech-gold/5"
                      )}
                    >
                      {/* Enhanced Active indicator */}
                      {isActive && (
                        <>
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1.5 h-12 bg-gradient-to-b from-eqtech-gold via-eqtech-gold-light to-eqtech-gold-light rounded-full shadow-lg shadow-eqtech-gold/50"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-eqtech-gold/10 via-transparent to-transparent opacity-50"></div>
                        </>
                      )}
                      
                      {/* Premium Icon container with enhanced glow */}
                      <div className={cn(
                        "relative flex items-center justify-center w-10 h-10 transition-all duration-300 rounded-xl",
                        isActive 
                          ? "bg-gradient-to-br from-eqtech-gold/20 to-eqtech-gold-light/15 drop-shadow-[0_0_12px_var(--eqtech-gold)] shadow-inner" 
                          : "group-hover:bg-eqtech-gold/10 group-hover:drop-shadow-[0_0_6px_var(--eqtech-gold)]"
                      )}>
                        <item.icon className={cn(
                          "h-5 w-5 transition-all duration-300",
                          isActive ? "text-eqtech-gold scale-110" : "text-eqtech-gray-light group-hover:text-eqtech-gold group-hover:scale-105"
                        )} />
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-br from-eqtech-gold/30 to-transparent rounded-xl blur-sm"></div>
                        )}
                      </div>
                      
                      <span className="flex-1 truncate">{item.label}</span>
                      
                      {/* Enhanced hover chevron indicator */}
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-all duration-300 opacity-0 group-hover:opacity-70 transform translate-x-[-12px] group-hover:translate-x-0",
                        isActive ? "opacity-80 text-eqtech-gold scale-110" : "text-eqtech-gray-light group-hover:text-eqtech-gold"
                      )} />
                      
                      {/* Premium background shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-eqtech-gold/10 to-eqtech-gold-light/8 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-[-100%] group-hover:translate-x-[100%] rounded-2xl"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-x-[-100%] group-hover:translate-x-[100%] rounded-2xl"></div>
                    </Link>
                    
                    {/* Enhanced separator line */}
                    {index < filteredNavItems.length - 1 && (
                      <div className="mx-6 mt-3 h-px bg-gradient-to-r from-transparent via-eqtech-gold/10 to-transparent relative">
                        <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-eqtech-gold-light/5 to-transparent blur-sm"></div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </nav>

          {/* Premium Footer */}
          <div className="p-6 border-t border-eqtech-gold/20">
            <div className="space-y-4">
              {/* Enhanced system status indicator */}
              <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-eqtech-surface/80 to-eqtech-surface-elevated/60 backdrop-blur-sm rounded-2xl border border-eqtech-gold/15 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full opacity-30 blur-sm"></div>
                  </div>
                  <span className="text-sm text-eqtech-light font-roboto-flex font-medium">System Online</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-eqtech-gold rounded-full"></div>
                  <div className="text-xs text-eqtech-gold font-roboto-flex font-semibold tracking-wider">v2.1 Pro</div>
                </div>
              </div>
              
              {/* Premium sign out button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-eqtech-gray-light hover:text-eqtech-light hover:bg-gradient-to-r hover:from-red-500/15 hover:to-red-400/10 hover:border-red-400/30 border border-transparent rounded-2xl transition-all duration-300 font-roboto-flex group py-4 px-5 relative overflow-hidden"
                onClick={handleSignOut}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="flex items-center space-x-4 w-full relative">
                  <div className="p-2 bg-eqtech-gold/10 group-hover:bg-red-400/20 rounded-xl transition-all duration-300">
                    <LogOut className="h-4 w-4 text-eqtech-gold group-hover:text-red-400 transition-colors duration-300" />
                  </div>
                  <span className="flex-1 text-left font-medium">Sign Out</span>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-60 transition-all duration-300 group-hover:text-red-400" />
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