-- ===============================================
-- UPDATE PROFILES TABLE FOR ROLE STORAGE
-- ===============================================
-- This migration adds role column to profiles table and migrates existing roles
-- from user_roles table. It also creates a trigger to auto-assign 'customer' role.
-- NOTE: This migration assumes 'staff' enum value already exists (added in 20251116184707_add_staff_enum.sql)

-- 1. Add role column to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN role public.app_role DEFAULT 'customer';
  END IF;
END $$;

-- 3. Migrate existing roles from user_roles to profiles
-- For users who have roles in user_roles but not in profiles, copy the primary role
-- Only update if the column exists and the role is NULL
DO $$
BEGIN
  -- Check if role column exists before updating
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    UPDATE public.profiles p
    SET role = (
      SELECT ur.role 
      FROM public.user_roles ur 
      WHERE ur.user_id = p.user_id 
      ORDER BY 
        CASE ur.role
          WHEN 'admin' THEN 1
          WHEN 'store_manager' THEN 2
          WHEN 'production_manager' THEN 3
          WHEN 'sales_executive' THEN 4
          WHEN 'factory_staff' THEN 5
          WHEN 'customer' THEN 6
        END
      LIMIT 1
    )
    WHERE EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id
    )
    AND p.role IS NULL;
  END IF;
END $$;

-- 4. Create function to auto-assign customer role on profile creation
CREATE OR REPLACE FUNCTION public.auto_assign_customer_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If role is not set, default to customer
  IF NEW.role IS NULL THEN
    NEW.role := 'customer';
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Create trigger to auto-assign customer role
DROP TRIGGER IF EXISTS trigger_auto_assign_customer_role ON public.profiles;
CREATE TRIGGER trigger_auto_assign_customer_role
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_customer_role();

-- 6. Update existing profiles that don't have a role set
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    UPDATE public.profiles
    SET role = 'customer'
    WHERE role IS NULL;
  END IF;
END $$;

-- 7. Add NOT NULL constraint after setting defaults
DO $$
BEGIN
  -- First ensure all NULL values are set to 'customer'
  UPDATE public.profiles
  SET role = 'customer'
  WHERE role IS NULL;
  
  -- Then add NOT NULL constraint if column exists and is nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.profiles 
    ALTER COLUMN role SET NOT NULL;
  END IF;
END $$;

-- 8. Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 9. Update RLS policies for profiles table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Customers can view and update their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Staff and admins can view all profiles
-- Note: This policy uses a function to avoid recursion
-- Note: Using 'factory_staff' for now; 'staff' will be added in a later migration
CREATE POLICY "Staff and admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'factory_staff')
  )
);

-- Only admins can manage all profiles (including role changes)
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'admin'
  )
);

-- 10. Create helper function to get user role from profiles
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

-- 11. Create helper function to check if user is customer
CREATE OR REPLACE FUNCTION public.is_customer(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role = 'customer'
  );
$$;

-- 12. Create helper function to check if user is staff (includes factory_staff for backward compatibility)
-- Note: Using 'factory_staff' for now; 'staff' will be added in a later migration
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role = 'factory_staff'
  );
$$;

-- 13. Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role = 'admin'
  );
$$;

-- 14. Create helper function to check if user is staff or admin (includes factory_staff for backward compatibility)
-- Note: Using 'factory_staff' for now; 'staff' will be added in a later migration
CREATE OR REPLACE FUNCTION public.is_staff_or_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role IN ('admin', 'factory_staff')
  );
$$;

