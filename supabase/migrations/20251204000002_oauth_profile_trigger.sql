-- ===============================================
-- OAUTH PROFILE AUTO-CREATION TRIGGER
-- ===============================================
-- This migration creates a trigger to automatically create profiles
-- for users signing up via OAuth (Google, Microsoft, Apple, etc.)

-- Function to create profile for OAuth users
CREATE OR REPLACE FUNCTION handle_oauth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile if it doesn't exist
  INSERT INTO public.profiles (user_id, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    'customer', -- Default role for OAuth users
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = COALESCE(
      EXCLUDED.full_name,
      public.profiles.full_name,
      SPLIT_PART(NEW.email, '@', 1)
    ),
    updated_at = NOW()
  WHERE public.profiles.full_name IS NULL OR public.profiles.full_name = '';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists (for re-running migration)
DROP TRIGGER IF EXISTS on_auth_user_created_oauth ON auth.users;

-- Create trigger on new user creation
CREATE TRIGGER on_auth_user_created_oauth
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_oauth_user();

-- Add comment for documentation
COMMENT ON FUNCTION handle_oauth_user() IS 'Automatically creates a customer profile when a user signs up via OAuth providers (Google, Microsoft, Apple, etc.)';

-- Backfill existing OAuth users who might not have profiles
-- This is safe to run multiple times
DO $$
DECLARE
  oauth_user RECORD;
BEGIN
  FOR oauth_user IN 
    SELECT 
      u.id,
      u.email,
      u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.user_id
    WHERE p.user_id IS NULL
      AND u.email IS NOT NULL
  LOOP
    INSERT INTO public.profiles (user_id, full_name, role, created_at, updated_at)
    VALUES (
      oauth_user.id,
      COALESCE(
        oauth_user.raw_user_meta_data->>'full_name',
        oauth_user.raw_user_meta_data->>'name',
        SPLIT_PART(oauth_user.email, '@', 1)
      ),
      'customer',
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END $$;

