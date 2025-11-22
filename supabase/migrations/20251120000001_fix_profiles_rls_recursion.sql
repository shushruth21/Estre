-- ===============================================
-- FIX INFINITE RECURSION IN PROFILES RLS POLICIES
-- ===============================================
-- The profiles RLS policies were querying the profiles table directly,
-- causing infinite recursion. This migration fixes them to use
-- SECURITY DEFINER functions that bypass RLS.

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Staff and admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Ensure helper functions exist and use SECURITY DEFINER (bypass RLS)
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

-- Recreate policies using SECURITY DEFINER functions (no recursion)
CREATE POLICY "Staff and admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

-- Only admins can manage all profiles (including role changes)
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Also ensure is_admin_or_manager uses profiles and is SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin_or_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id 
    AND role IN ('admin', 'store_manager', 'production_manager', 'staff')
  );
$$;

