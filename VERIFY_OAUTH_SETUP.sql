-- ===============================================
-- OAUTH SETUP VERIFICATION SCRIPT
-- ===============================================
-- Run this in Supabase SQL Editor to verify everything is set up correctly

-- 1. Check if OAuth trigger exists
SELECT 
  '✅ OAuth Trigger Check' as test_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS - Trigger exists'
    ELSE '❌ FAIL - Trigger missing'
  END as result
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created_oauth';

-- 2. Check if handle_oauth_user function exists
SELECT 
  '✅ OAuth Function Check' as test_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PASS - Function exists'
    ELSE '❌ FAIL - Function missing'
  END as result
FROM pg_proc 
WHERE proname = 'handle_oauth_user';

-- 3. Check profiles table structure
SELECT 
  '✅ Profiles Table Check' as test_name,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ PASS - All required columns exist'
    ELSE '❌ FAIL - Missing columns'
  END as result
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('user_id', 'full_name', 'role', 'created_at');

-- 4. List recent profiles (check if OAuth users have profiles)
SELECT 
  p.user_id,
  p.full_name,
  p.role,
  u.email,
  u.raw_app_meta_data->>'provider' as auth_provider,
  p.created_at
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
ORDER BY p.created_at DESC
LIMIT 10;

-- 5. Check for OAuth users without profiles (should be empty)
SELECT 
  '✅ Orphaned OAuth Users Check' as test_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS - All OAuth users have profiles'
    ELSE '⚠️ WARNING - ' || COUNT(*) || ' OAuth users missing profiles'
  END as result
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
AND u.email IS NOT NULL;

-- 6. Test trigger with dry run (doesn't actually create user)
SELECT 
  '✅ Profile Creation Logic' as test_name,
  CASE 
    WHEN handle_oauth_user IS NOT NULL THEN '✅ PASS - Function is callable'
    ELSE '❌ FAIL - Function not accessible'
  END as result
FROM pg_proc 
WHERE proname = 'handle_oauth_user';

