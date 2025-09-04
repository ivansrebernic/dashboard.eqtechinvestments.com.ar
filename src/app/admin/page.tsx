'use client'

import { AdminGuard } from '@/components/auth/route-guard'
import { NavMenu } from '@/components/navigation/nav-menu'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUserRole } from '@/lib/roles/hooks'
import { RoleBadge } from '@/components/roles/role-badge'
import { Users, BarChart3, Briefcase, Shield } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
  const { role } = useUserRole()

  return (
    <AdminGuard>
      <div className="min-h-screen bg-eqtech-dark flex">
        <NavMenu />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-eqtech-light font-montserrat">Admin Dashboard</h1>
                <p className="text-eqtech-gold mt-2 font-roboto-flex text-lg">
                  Manage users, roles, and system settings
                </p>
              </div>
              {role && <RoleBadge role={role} />}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-eqtech-gray-dark border-eqtech-gray-medium">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-eqtech-gray-light font-roboto-flex">Total Users</p>
                      <p className="text-2xl font-bold text-eqtech-light font-montserrat">--</p>
                    </div>
                    <Users className="h-8 w-8 text-eqtech-gold" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-eqtech-gray-dark border-eqtech-gray-medium">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-eqtech-gray-light font-roboto-flex">Admin Users</p>
                      <p className="text-2xl font-bold text-eqtech-light font-montserrat">--</p>
                    </div>
                    <Shield className="h-8 w-8 text-eqtech-gold" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-eqtech-gray-dark border-eqtech-gray-medium">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-eqtech-gray-light font-roboto-flex">Basic Users</p>
                      <p className="text-2xl font-bold text-eqtech-light font-montserrat">--</p>
                    </div>
                    <Users className="h-8 w-8 text-eqtech-gold" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-eqtech-gray-dark border-eqtech-gray-medium">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-eqtech-gray-light font-roboto-flex">System Health</p>
                      <p className="text-2xl font-bold text-eqtech-gold font-montserrat">OK</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-eqtech-gold" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-eqtech-gray-dark border-eqtech-gray-medium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-eqtech-light font-montserrat">
                    <Users className="h-5 w-5 text-eqtech-gold" />
                    User Management
                  </CardTitle>
                  <CardDescription className="text-eqtech-gray-light font-roboto-flex">
                    View, manage, and assign roles to users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild className="w-full bg-eqtech-gold text-eqtech-dark hover:bg-eqtech-dark-gold font-montserrat font-medium">
                    <Link href="/admin/users">
                      Manage Users
                    </Link>
                  </Button>
                  <p className="text-sm text-eqtech-gray-light font-roboto-flex">
                    View all users, assign roles, and manage permissions
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-eqtech-gray-dark border-eqtech-gray-medium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-eqtech-light font-montserrat">
                    <Briefcase className="h-5 w-5 text-eqtech-gold" />
                    Portfolio Management
                  </CardTitle>
                  <CardDescription className="text-eqtech-gray-light font-roboto-flex">
                    Create and manage cryptocurrency portfolios
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild className="w-full bg-eqtech-gray-dark border border-eqtech-gray-medium text-eqtech-light hover:bg-eqtech-gray-medium font-montserrat">
                    <Link href="/admin/portfolios">
                      Manage Portfolios
                    </Link>
                  </Button>
                  <p className="text-sm text-eqtech-gray-light font-roboto-flex">
                    Track crypto holdings and monitor portfolio performance
                  </p>
                </CardContent>
              </Card>
              
            </div>

          </div>
        </main>
      </div>
    </AdminGuard>
  )
}