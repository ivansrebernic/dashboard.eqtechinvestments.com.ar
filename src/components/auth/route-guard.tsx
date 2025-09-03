'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserRole, usePermissions } from '@/lib/roles/hooks';
import type { UserRole } from '@/types/auth';
import type { Permission } from '@/lib/roles/permissions';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: Permission;
  fallback?: React.ReactNode;
  redirectTo?: string;
  showUnauthorized?: boolean;
}

export function RouteGuard({
  children,
  requiredRole,
  requiredPermission,
  fallback,
  redirectTo = '/unauthorized',
  showUnauthorized = true
}: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { role, loading } = useUserRole();
  const { checkPermission } = usePermissions();

  useEffect(() => {
    if (loading) return;

    let hasAccess = true;

    // Check role requirement
    if (requiredRole && role !== requiredRole) {
      hasAccess = false;
    }

    // Check permission requirement
    if (requiredPermission && !checkPermission(requiredPermission)) {
      hasAccess = false;
    }

    // If no access and should redirect
    if (!hasAccess && showUnauthorized) {
      const url = new URL(redirectTo, window.location.origin);
      url.searchParams.set('redirectTo', pathname);
      router.push(url.toString());
    }
  }, [role, loading, requiredRole, requiredPermission, checkPermission, router, pathname, redirectTo, showUnauthorized]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check access
  let hasAccess = true;

  if (requiredRole && role !== requiredRole) {
    hasAccess = false;
  }

  if (requiredPermission && !checkPermission(requiredPermission)) {
    hasAccess = false;
  }

  // Show fallback or nothing if no access
  if (!hasAccess) {
    return fallback || null;
  }

  return <>{children}</>;
}

// Specific guard components
export function AdminGuard({ children, fallback, redirectTo, showUnauthorized = true }: Omit<RouteGuardProps, 'requiredRole'>) {
  return (
    <RouteGuard
      requiredRole="admin"
      fallback={fallback}
      redirectTo={redirectTo}
      showUnauthorized={showUnauthorized}
    >
      {children}
    </RouteGuard>
  );
}

export function BasicGuard({ children, fallback, redirectTo, showUnauthorized = true }: Omit<RouteGuardProps, 'requiredRole'>) {
  return (
    <RouteGuard
      requiredRole="basic"
      fallback={fallback}
      redirectTo={redirectTo}
      showUnauthorized={showUnauthorized}
    >
      {children}
    </RouteGuard>
  );
}

// Permission-based guards
export function PermissionGuard({ 
  children, 
  permission, 
  fallback, 
  redirectTo, 
  showUnauthorized = false 
}: {
  children: React.ReactNode;
  permission: Permission;
  fallback?: React.ReactNode;
  redirectTo?: string;
  showUnauthorized?: boolean;
}) {
  return (
    <RouteGuard
      requiredPermission={permission}
      fallback={fallback}
      redirectTo={redirectTo}
      showUnauthorized={showUnauthorized}
    >
      {children}
    </RouteGuard>
  );
}

// Higher-order component version
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: UserRole,
  options: {
    fallback?: React.ReactNode;
    redirectTo?: string;
    showUnauthorized?: boolean;
  } = {}
) {
  return function GuardedComponent(props: P) {
    return (
      <RouteGuard
        requiredRole={requiredRole}
        fallback={options.fallback}
        redirectTo={options.redirectTo}
        showUnauthorized={options.showUnauthorized}
      >
        <Component {...props} />
      </RouteGuard>
    );
  };
}

// Higher-order component with permission guard
export function withPermissionGuard<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: Permission,
  options: {
    fallback?: React.ReactNode;
    redirectTo?: string;
    showUnauthorized?: boolean;
  } = {}
) {
  return function GuardedComponent(props: P) {
    return (
      <RouteGuard
        requiredPermission={requiredPermission}
        fallback={options.fallback}
        redirectTo={options.redirectTo}
        showUnauthorized={options.showUnauthorized}
      >
        <Component {...props} />
      </RouteGuard>
    );
  };
}