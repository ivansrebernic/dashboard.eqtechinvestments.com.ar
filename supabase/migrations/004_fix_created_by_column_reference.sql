-- Fix the get_all_users_with_roles function
-- Issue: Column ur.created_by does not exist

DROP FUNCTION IF EXISTS get_all_users_with_roles();

CREATE OR REPLACE FUNCTION get_all_users_with_roles()
RETURNS TABLE (
  id uuid,
  email text,
  user_metadata jsonb,
  role text,
  roleData jsonb
) 
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND user_roles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Return all auth users with their roles (if any)
  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    COALESCE(u.raw_user_meta_data, '{}'::jsonb) as user_metadata,
    COALESCE(ur.role, 'basic'::text) as role,
    CASE 
      WHEN ur.id IS NOT NULL THEN
        jsonb_build_object(
          'id', ur.id,
          'user_id', ur.user_id,
          'role', ur.role::text,
          'created_at', ur.created_at,
          'updated_at', ur.updated_at
        )
      ELSE NULL
    END as roleData
  FROM auth.users u
  LEFT JOIN public.user_roles ur ON u.id = ur.user_id
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
-- (function itself checks for admin role)
GRANT EXECUTE ON FUNCTION get_all_users_with_roles() TO authenticated;