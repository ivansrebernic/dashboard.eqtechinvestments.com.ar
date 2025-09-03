-- Fix RLS infinite recursion by using PostgreSQL functions instead of direct table queries
-- This prevents RLS policies from recursively querying the same table they protect

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Recreate policies using the is_admin() function instead of direct queries
-- The is_admin() function has SECURITY DEFINER and SET search_path, so it bypasses RLS

-- Admins can read all roles (using function instead of direct query)
CREATE POLICY "Admins can read all roles" ON public.user_roles
  FOR SELECT USING (public.is_admin());

-- Only admins can insert/update/delete roles (using function instead of direct query)
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.is_admin());