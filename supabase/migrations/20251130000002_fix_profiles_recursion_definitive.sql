-- ============================================================================
-- FIX INFINITE RECURSION IN PROFILES RLS POLICIES (DEFINITIVE)
-- ============================================================================
-- This migration fixes the "infinite recursion detected in policy for relation 'profiles'" error.
-- It ensures that ALL helper functions used in RLS policies are SECURITY DEFINER
-- and that policies use these functions instead of direct table queries.

-- 1. Drop ALL existing policies on profiles to ensure a clean slate
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff and admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- 2. Redefine helper functions as SECURITY DEFINER (bypasses RLS)
-- We use OR REPLACE to ensure they are updated

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

CREATE OR REPLACE FUNCTION public.is_staff_or_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id 
    AND role IN ('admin', 'staff', 'factory_staff', 'store_manager', 'production_manager')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id 
    AND role IN ('staff', 'factory_staff')
  );
$$;

-- 3. Recreate policies using these functions

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Staff and admins can view all profiles
-- CRITICAL: This must use the SECURITY DEFINER function to avoid recursion
CREATE POLICY "Staff and admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

-- Policy: Admins can manage all profiles (update/delete)
-- CRITICAL: This must use the SECURITY DEFINER function to avoid recursion
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 4. Ensure other tables also use these functions (optional but good practice)
-- (We don't need to drop/recreate other tables' policies here as they just call these functions
-- or use EXISTS clauses that are generally safe if they don't query the same table recursively,
-- but profiles querying profiles is the main recursion source.)

