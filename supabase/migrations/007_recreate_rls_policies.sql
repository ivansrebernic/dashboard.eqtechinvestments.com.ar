-- Recreate RLS policies for user_roles table
-- This fixes the "new row violates row-level security policy" error
-- Uses is_admin() function to avoid infinite recursion

-- Users can read their own role
CREATE POLICY "Users can read own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can read all roles (using function to avoid recursion)
CREATE POLICY "Admins can read all roles" ON public.user_roles
  FOR SELECT USING (public.is_admin());

-- Admins can manage roles (INSERT/UPDATE/DELETE using function to avoid recursion)
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.is_admin());