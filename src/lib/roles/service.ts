import { createClient } from '@/lib/supabase/server'
import { createClient as createClientClient } from '@/lib/supabase/client'
import type { UserRole, UserRoleData, RoleAssignment, UserWithRole } from '@/types/auth'

export class RoleService {
  private supabase

  constructor(isServer = false) {
    this.supabase = isServer ? createClient() : createClientClient()
  }

  /**
   * Get user role by user ID
   */
  async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_role', {
        user_uuid: userId
      });

      if (error) {
        console.error('Error fetching user role:', error)
        return null
      }

      return data as UserRole || 'basic'
    } catch (error) {
      console.error('Error in getUserRole:', error)
      return null
    }
  }

  /**
   * Get current user's role
   */
  async getCurrentUserRole(): Promise<UserRole | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        return null
      }

      return this.getUserRole(user.id)
    } catch (error) {
      console.error('Error getting current user role:', error)
      return null
    }
  }

  /**
   * Check if user has specific role
   */
  async userHasRole(userId: string, requiredRole: UserRole): Promise<boolean> {
    const userRole = await this.getUserRole(userId)
    return userRole === requiredRole
  }

  /**
   * Check if current user has specific role
   */
  async currentUserHasRole(requiredRole: UserRole): Promise<boolean> {
    const userRole = await this.getCurrentUserRole()
    return userRole === requiredRole
  }

  /**
   * Check if user is admin
   */
  async isAdmin(userId?: string): Promise<boolean> {
    if (userId) {
      return this.userHasRole(userId, 'admin')
    }
    return this.currentUserHasRole('admin')
  }

  /**
   * Assign role to user (admin only)
   */
  async assignRole(assignment: RoleAssignment): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if current user is admin
      const isCurrentUserAdmin = await this.isAdmin()
      if (!isCurrentUserAdmin) {
        return { success: false, error: 'Insufficient permissions' }
      }

      const { data: currentUser } = await this.supabase.auth.getUser()
      
      const { error } = await this.supabase
        .from('user_roles')
        .upsert({
          user_id: assignment.userId,
          role: assignment.role,
          created_by: currentUser?.user?.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get all users with their roles (admin only)
   */
  async getAllUsersWithRoles(): Promise<UserWithRole[]> {
    try {
      const isCurrentUserAdmin = await this.isAdmin()
      if (!isCurrentUserAdmin) {
        throw new Error('Insufficient permissions')
      }

      // Get all users from auth.users with their roles
      const { data, error } = await this.supabase
        .from('user_roles')
        .select(`
          *,
          user:user_id (
            id,
            email,
            user_metadata
          )
        `)

      if (error) {
        throw new Error(error.message)
      }

      return data?.map((item: {
        id: string
        user_id: string
        role: UserRole
        created_at: string
        updated_at: string
        created_by?: string
        user?: {
          id: string
          email: string
          user_metadata?: Record<string, unknown>
        }
      }) => ({
        id: item.user?.id || '',
        email: item.user?.email || '',
        user_metadata: item.user?.user_metadata,
        role: item.role,
        roleData: {
          id: item.id,
          user_id: item.user_id,
          role: item.role,
          created_at: item.created_at,
          updated_at: item.updated_at,
          created_by: item.created_by
        }
      })) || []
    } catch (error) {
      console.error('Error fetching users with roles:', error)
      return []
    }
  }

  /**
   * Remove role from user (admin only)
   */
  async removeRole(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const isCurrentUserAdmin = await this.isAdmin()
      if (!isCurrentUserAdmin) {
        return { success: false, error: 'Insufficient permissions' }
      }

      const { error } = await this.supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get user role data with metadata
   */
  async getUserRoleData(userId: string): Promise<UserRoleData | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching user role data:', error)
      return null
    }
  }
}

// Singleton instances for client only
export const roleService = new RoleService(false) // Client-side

// Factory function for server-side instances (must be called within request context)
export function createServerRoleService(): RoleService {
  return new RoleService(true)
}