'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerRoleService } from './service';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/auth';

/**
 * Server action to assign a role to a user
 */
export async function assignUserRole(
  userId: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const serverRoleService = createServerRoleService();

    // Check if current user is admin
    const isAdmin = await serverRoleService.isAdmin(user.id);
    if (!isAdmin) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Assign the role
    const result = await serverRoleService.assignRole({
      userId,
      role,
      assignedBy: user.id
    });

    if (result.success) {
      // Revalidate pages that might show user role data
      revalidatePath('/admin/users');
      revalidatePath('/dashboard');
    }

    return result;
  } catch (error) {
    console.error('Error in assignUserRole:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Server action to remove a user's role (set to basic)
 */
export async function removeUserRole(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    const serverRoleService = createServerRoleService();

    // Check if current user is admin
    const isAdmin = await serverRoleService.isAdmin(user.id);
    if (!isAdmin) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Set role to basic (default)
    const result = await serverRoleService.assignRole({
      userId,
      role: 'basic',
      assignedBy: user.id
    });

    if (result.success) {
      revalidatePath('/admin/users');
      revalidatePath('/dashboard');
    }

    return result;
  } catch (error) {
    console.error('Error in removeUserRole:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Server action to get current user's role
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const serverRoleService = createServerRoleService();
    return await serverRoleService.getUserRole(user.id);
  } catch (error) {
    console.error('Error getting current user role:', error);
    return null;
  }
}

/**
 * Server action to check if current user has specific role
 */
export async function checkUserRole(requiredRole: UserRole): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return false;
    }

    const serverRoleService = createServerRoleService();
    return await serverRoleService.userHasRole(user.id, requiredRole);
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
}

/**
 * Server action to check if current user is admin
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return false;
    }

    const serverRoleService = createServerRoleService();
    return await serverRoleService.isAdmin(user.id);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Server action to redirect if user doesn't have required role
 */
export async function redirectIfUnauthorized(
  requiredRole: UserRole,
  redirectTo: string = '/unauthorized'
) {
  const hasRole = await checkUserRole(requiredRole);
  
  if (!hasRole) {
    redirect(redirectTo);
  }
}

/**
 * Server action to get all users with roles (admin only)
 */
export async function getAllUsersWithRoles() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const serverRoleService = createServerRoleService();
    const isAdmin = await serverRoleService.isAdmin(user.id);
    if (!isAdmin) {
      throw new Error('Insufficient permissions');
    }

    return await serverRoleService.getAllUsersWithRoles();
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}