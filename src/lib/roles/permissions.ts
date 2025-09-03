import type { UserRole } from '@/types/auth'

// Define permissions for each role
export const ROLE_PERMISSIONS = {
  admin: {
    canAccessAdmin: true,
    canManageUsers: true,
    canAssignRoles: true,
    canViewAllUsers: true,
    canDeleteUsers: true,
    canAccessDashboard: true,
    canViewCrypto: true,
  },
  basic: {
    canAccessAdmin: false,
    canManageUsers: false,
    canAssignRoles: false,
    canViewAllUsers: false,
    canDeleteUsers: false,
    canAccessDashboard: true,
    canViewCrypto: true,
  }
} as const

export type Permission = keyof typeof ROLE_PERMISSIONS.admin

// Role hierarchy - higher roles inherit permissions from lower roles
export const ROLE_HIERARCHY: UserRole[] = ['basic', 'admin']

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role][permission] || false
}

/**
 * Check if a role can access a specific route
 */
export function canAccessRoute(role: UserRole, route: string): boolean {
  const routePermissions: Record<string, Permission> = {
    '/': 'canAccessDashboard',
    '/admin': 'canAccessAdmin',
    '/admin/users': 'canManageUsers',
    '/admin/roles': 'canAssignRoles',
    '/dashboard': 'canAccessDashboard',
    '/crypto': 'canViewCrypto',
  }

  // Check exact route match
  if (routePermissions[route]) {
    return hasPermission(role, routePermissions[route])
  }

  // Check route patterns
  if (route.startsWith('/admin')) {
    return hasPermission(role, 'canAccessAdmin')
  }

  // Default: allow access for basic routes
  return true
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole) {
  return ROLE_PERMISSIONS[role]
}

/**
 * Check if role A has higher or equal permissions than role B
 */
export function hasHigherOrEqualRole(roleA: UserRole, roleB: UserRole): boolean {
  const indexA = ROLE_HIERARCHY.indexOf(roleA)
  const indexB = ROLE_HIERARCHY.indexOf(roleB)
  return indexA >= indexB
}

/**
 * Get role display information
 */
export const ROLE_INFO = {
  admin: {
    label: 'Administrator',
    description: 'Full system access and user management',
    color: 'red',
    icon: 'shield-check'
  },
  basic: {
    label: 'Basic User',
    description: 'Standard user access',
    color: 'blue',
    icon: 'user'
  }
} as const

/**
 * Protected routes that require specific roles
 */
export const PROTECTED_ROUTES = {
  admin: [
    '/admin',
    '/admin/users',
    '/admin/roles',
    '/admin/settings'
  ],
  basic: [
    '/',
    '/dashboard',
    '/profile'
  ]
} as const

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password'
] as const

/**
 * Check if route is public
 */
export function isPublicRoute(route: string): boolean {
  return PUBLIC_ROUTES.includes(route as typeof PUBLIC_ROUTES[number]) || route.startsWith('/api/auth')
}

/**
 * Get required role for a route
 */
export function getRequiredRole(route: string): UserRole | null {
  if (PROTECTED_ROUTES.admin.some(adminRoute => route.startsWith(adminRoute))) {
    return 'admin'
  }
  
  if (PROTECTED_ROUTES.basic.some(basicRoute => route.startsWith(basicRoute))) {
    return 'basic'
  }
  
  return null
}