'use client'

import { AdminGuard } from '@/components/auth/route-guard'
import { NavMenu } from '@/components/navigation/nav-menu'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUserRole } from '@/lib/roles/hooks'
import { RoleBadge } from '@/components/roles/role-badge'
import { Users, Settings, Shield, BarChart3, Briefcase } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
  const { role } = useUserRole()

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background flex">
        <NavMenu />
        
        <main className="flex-1 p-4">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Manage users, roles, and system settings
                </p>
              </div>
              {role && <RoleBadge role={role} />}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold">--</p>
                    </div>
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Admin Users</p>
                      <p className="text-2xl font-bold">--</p>
                    </div>
                    <Shield className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Basic Users</p>
                      <p className="text-2xl font-bold">--</p>
                    </div>
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">System Health</p>
                      <p className="text-2xl font-bold text-green-600">OK</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </CardTitle>
                  <CardDescription>
                    View, manage, and assign roles to users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild className="w-full">
                    <Link href="/admin/users">
                      Manage Users
                    </Link>
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    View all users, assign roles, and manage permissions
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Portfolio Management
                  </CardTitle>
                  <CardDescription>
                    Create and manage cryptocurrency portfolios
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/admin/portfolios">
                      Manage Portfolios
                    </Link>
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Track crypto holdings and monitor portfolio performance
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Role Management
                  </CardTitle>
                  <CardDescription>
                    Configure roles and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/admin/roles">
                      Manage Roles
                    </Link>
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Define role permissions and access levels
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    System Settings
                  </CardTitle>
                  <CardDescription>
                    Configure system-wide settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/admin/settings">
                      System Settings
                    </Link>
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Manage application configuration and preferences
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest user actions and system events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">System initialized</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Just now</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Role system enabled</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Just now</span>
                  </div>
                  
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">Activity log will appear here once users start interacting with the system</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AdminGuard>
  )
}