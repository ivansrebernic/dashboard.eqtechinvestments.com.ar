'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleBadge } from '@/components/roles/role-badge';
import { PermissionGuard } from '@/components/auth/route-guard';
import { useUserRole, usePermissions } from '@/lib/roles/hooks';
import { Button } from '@/components/ui/button';
import { Shield, Users, Settings, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import type { User } from '@/types/auth';

interface DashboardContentProps {
  user: User | null;
}

export function DashboardContent({ user }: DashboardContentProps) {
  const { role, loading } = useUserRole();
  const permissions = usePermissions();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="animate-pulse space-y-2">
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Welcome Card */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Welcome Back!</span>
            {role && <RoleBadge role={role} />}
          </CardTitle>
          <CardDescription>
            Track cryptocurrency markets and manage your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p><strong>User:</strong> {user?.email}</p>
            {user?.user_metadata?.username && (
              <p><strong>Username:</strong> {user.user_metadata.username}</p>
            )}
            {role && (
              <p><strong>Role:</strong> <span className="capitalize">{role}</span></p>
            )}
            <p className="text-sm text-muted-foreground">
              Access real-time cryptocurrency data and market insights
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Actions available based on your role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {permissions.canViewCrypto && (
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/crypto">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Crypto Markets
              </Link>
            </Button>
          )}
          
          <PermissionGuard permission="canAccessAdmin" showUnauthorized={false}>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin">
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </Link>
            </Button>
          </PermissionGuard>
          
          <PermissionGuard permission="canManageUsers" showUnauthorized={false}>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/users">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Link>
            </Button>
          </PermissionGuard>
          
          {(!permissions.canAccessAdmin && !permissions.canManageUsers) && (
            <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
              Basic user access - contact admin for additional permissions
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Information Card */}
      {role && (
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Your Permissions</CardTitle>
            <CardDescription>
              What you can do with your current role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Access Dashboard</span>
                <span className={`text-xs px-2 py-1 rounded ${permissions.canAccessDashboard ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {permissions.canAccessDashboard ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">View Crypto</span>
                <span className={`text-xs px-2 py-1 rounded ${permissions.canViewCrypto ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {permissions.canViewCrypto ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Admin Access</span>
                <span className={`text-xs px-2 py-1 rounded ${permissions.canAccessAdmin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {permissions.canAccessAdmin ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Manage Users</span>
                <span className={`text-xs px-2 py-1 rounded ${permissions.canManageUsers ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {permissions.canManageUsers ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}