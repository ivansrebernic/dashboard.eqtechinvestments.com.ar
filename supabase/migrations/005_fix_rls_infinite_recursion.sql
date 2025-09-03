-- Fix RLS infinite recursion by adding SET search_path clause to PostgreSQL functions
-- This prevents RLS policies from interfering with SECURITY DEFINER functions

-- Fix user_has_role function
CREATE OR REPLACE FUNCTION public.user_has_role(user_uuid UUID, required_role TEXT)
RETURNS BOOLEAN 
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = required_role
  );
END;
$$ LANGUAGE plpgsql;

-- Fix get_user_role function  
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT 
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(user_role, 'basic');
END;
$$ LANGUAGE plpgsql;

-- Fix is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN 
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN public.user_has_role(user_uuid, 'admin');
END;
$$ LANGUAGE plpgsql;