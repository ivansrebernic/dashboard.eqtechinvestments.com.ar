'use client'

import { useState, useEffect, useCallback } from 'react'
import { clientRoleService } from './client-service'
import type { UserRole, UserWithRole } from '@/types/auth'
import type { Permission } from './permissions'
import { hasPermission, canAccessRoute } from './permissions'

/**
 * Hook to get and manage current user's role
 */
export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRole = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const userRole = await clientRoleService.getCurrentUserRole()
      setRole(userRole)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch role')
      setRole(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRole()
  }, [fetchRole])

  return {
    role,
    loading,
    error,
    refetch: fetchRole,
    isAdmin: role === 'admin',
    isBasic: role === 'basic'
  }
}

/**
 * Hook to check user permissions
 */
export function usePermissions() {
  const { role } = useUserRole()

  const checkPermission = useCallback((permission: Permission): boolean => {
    if (!role) return false
    return hasPermission(role, permission)
  }, [role])

  const checkRouteAccess = useCallback((route: string): boolean => {
    if (!role) return false
    return canAccessRoute(role, route)
  }, [role])

  return {
    checkPermission,
    checkRouteAccess,
    canAccessAdmin: checkPermission('canAccessAdmin'),
    canManageUsers: checkPermission('canManageUsers'),
    canAssignRoles: checkPermission('canAssignRoles'),
    canViewAllUsers: checkPermission('canViewAllUsers'),
    canDeleteUsers: checkPermission('canDeleteUsers'),
    canAccessDashboard: checkPermission('canAccessDashboard'),
    canViewCrypto: checkPermission('canViewCrypto')
  }
}

/**
 * Hook for admin functions
 */
export function useAdminFunctions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const assignRole = useCallback(async (userId: string, newRole: UserRole) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: newRole }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to assign role')
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign role'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const removeRole = useCallback(async (userId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: 'basic' }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to remove role')
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove role'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getAllUsers = useCallback(async (): Promise<UserWithRole[]> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/users')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch users')
      }

      return result.users || []
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    assignRole,
    removeRole,
    getAllUsers,
    loading,
    error,
    clearError: () => setError(null)
  }
}

/**
 * Hook to check if user has specific role
 */
export function useRoleCheck(requiredRole: UserRole) {
  const { role, loading } = useUserRole()
  
  return {
    hasRole: role === requiredRole,
    loading,
    role
  }
}

/**
 * Hook for role-based conditional rendering
 */
export function useConditionalRender() {
  const { role } = useUserRole()
  const { checkPermission, checkRouteAccess } = usePermissions()

  const renderIf = useCallback((condition: {
    role?: UserRole
    permission?: Permission
    route?: string
    custom?: (role: UserRole | null) => boolean
  }, children: React.ReactNode) => {
    if (condition.role && role !== condition.role) return null
    if (condition.permission && !checkPermission(condition.permission)) return null
    if (condition.route && !checkRouteAccess(condition.route)) return null
    if (condition.custom && !condition.custom(role)) return null
    
    return children
  }, [role, checkPermission, checkRouteAccess])

  return { renderIf }
}