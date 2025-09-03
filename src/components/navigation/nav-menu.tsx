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
  LogOut
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
      <div className="w-64 bg-card border-r">
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded"></div>
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
        "fixed left-0 top-0 z-40 h-full w-64 bg-card border-r transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Navigation</h2>
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {role && (
              <div className="mt-2">
                <RoleBadge role={role} />
              </div>
            )}
          </div>

          {/* Navigation items */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        isActive 
                          ? "bg-accent text-accent-foreground" 
                          : "text-muted-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
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