-- Add first login tracking columns to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster first login queries
CREATE INDEX IF NOT EXISTS idx_user_roles_first_login ON public.user_roles(first_login) WHERE first_login = true;

-- Update the handle_new_user function to check for admin-created users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, first_login)
  VALUES (
    NEW.id, 
    'basic',
    -- Set first_login to true if user was created with this metadata
    COALESCE((NEW.raw_user_meta_data->>'first_login')::boolean, false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark first login as complete
CREATE OR REPLACE FUNCTION public.complete_first_login(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.user_roles 
  SET 
    first_login = false,
    password_changed_at = CASE 
      WHEN password_changed_at IS NULL THEN NOW() 
      ELSE password_changed_at 
    END,
    updated_at = NOW()
  WHERE user_id = user_uuid AND first_login = true;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark password as changed (can be called separately from first login)
CREATE OR REPLACE FUNCTION public.mark_password_changed(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.user_roles 
  SET 
    password_changed_at = NOW(),
    updated_at = NOW()
  WHERE user_id = user_uuid;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user needs first login prompt
CREATE OR REPLACE FUNCTION public.needs_first_login_prompt(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND first_login = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policy to allow users to read their own first_login status
CREATE POLICY IF NOT EXISTS "Users can read own first login status" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy to allow users to update their own first_login status
CREATE POLICY IF NOT EXISTS "Users can update own first login status" ON public.user_roles
  FOR UPDATE USING (auth.uid() = user_id);