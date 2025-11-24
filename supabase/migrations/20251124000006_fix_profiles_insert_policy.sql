-- ============================================================================
-- FIX PROFILES INSERT POLICY FOR USER SIGNUP
-- ============================================================================
-- This migration ensures users can INSERT their own profile on signup
-- The 403 error on profiles upsert suggests INSERT policy is missing

-- Drop existing INSERT policy if it exists (to recreate it)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create INSERT policy for users to create their own profile
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Also ensure UPDATE policy exists (should already exist, but ensure it)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Comment
COMMENT ON POLICY "Users can insert own profile" ON public.profiles IS 
'Allows authenticated users to create their own profile record on signup';

