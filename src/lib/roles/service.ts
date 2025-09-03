import { createClient } from '@/lib/supabase/server'
import { createClient as createClientClient } from '@/lib/supabase/client'
import type { UserRole, UserRoleData, RoleAssignment, UserWithRole } from '@/types/auth'
import type { SupabaseClient } from '@supabase/supabase-js'

export class RoleService {
  private supabase: SupabaseClient | null
  private isServer: boolean

  constructor(isServer = false) {
    this.isServer = isServer
    this.supabase = isServer ? null : createClientClient()
  }

  private async getSupabaseClient(): Promise<SupabaseClient> {
    if (this.isServer) {
      if (!this.supabase) {
        this.supabase = await createClient()
      }
      return this.supabase
    }
    return this.supabase!
  }

  /**
   * Get user role by user ID
   */
  async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      const supabase = await this.getSupabaseClient()
      const { data, error } = await supabase.rpc('get_user_role', {
        user_uuid: userId
      });

      if (error) throw new Error(`Failed to get user role: ${error.message}`)
      return data as UserRole || 'basic'
    } catch (error) {
      console.error('Error in getUserRole:', error)
      return null
    }
  }

  /**
   * Check if user is admin using PostgreSQL function
   */
  async isAdmin(userId?: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabaseClient()
      const { data, error } = await supabase.rpc('is_admin', 
        userId ? { user_uuid: userId } : {}
      )
      
      if (error) throw new Error(`Failed to check admin status: ${error.message}`)
      return data || false
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  }

  /**
   * Require current user to be admin, throws error if not
   */
  private async requireAdmin(): Promise<void> {
    const isCurrentUserAdmin = await this.isAdmin()
    if (!isCurrentUserAdmin) {
      throw new Error('Insufficient permissions')
    }
  }

  /**
   * Assign role to user (admin only)
   */
  async assignRole(assignment: RoleAssignment): Promise<{ success: boolean; error?: string }> {
    try {
      await this.requireAdmin()
      const supabase = await this.getSupabaseClient()

      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: assignment.userId,
          role: assignment.role,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) throw new Error(error.message)
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
      await this.requireAdmin()
      const supabase = await this.getSupabaseClient()
      
      const { data, error } = await supabase.rpc('get_all_users_with_roles')
      if (error) throw new Error(`Failed to fetch users with roles: ${error.message}`)
      
      return data || []
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
      await this.requireAdmin()
      const supabase = await this.getSupabaseClient()
      
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)

      if (error) throw new Error(error.message)
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
      const supabase = await this.getSupabaseClient()
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw new Error(`Failed to get user role data: ${error.message}`)
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