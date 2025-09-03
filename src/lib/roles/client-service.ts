'use client';

import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/types/auth';

export class ClientRoleService {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Get current user's role
   */
  async getCurrentUserRole(): Promise<UserRole | null> {
    try {
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      
      if (userError || !user) {
        return null;
      }

      return await this.getUserRole(user.id);
    } catch (error) {
      console.error('Error getting current user role:', error);
      return null;
    }
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
        console.error('Error fetching user role:', error);
        return null;
      }

      return data as UserRole || null;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  }

  /**
   * Check if current user has specific role
   */
  async currentUserHasRole(requiredRole: UserRole): Promise<boolean> {
    const currentRole = await this.getCurrentUserRole();
    return currentRole === requiredRole;
  }

  /**
   * Check if current user is admin
   */
  async isCurrentUserAdmin(): Promise<boolean> {
    return await this.currentUserHasRole('admin');
  }
}

// Client-side service instance
export const clientRoleService = new ClientRoleService();