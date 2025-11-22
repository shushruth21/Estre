-- ============================================================================
-- VERIFY AND FIX ADMIN PROFILE FOR newadmin@estre.in
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Check current status
SELECT 
    u.id as user_id,
    u.email,
    u.created_at as user_created,
    p.id as profile_id,
    p.role as profile_role,
    p.full_name,
    p.created_at as profile_created,
    CASE 
        WHEN p.role = 'admin' THEN '✅ Admin role set correctly'
        WHEN p.role IS NULL THEN '❌ No role set'
        ELSE '⚠️ Role is: ' || p.role
    END as status
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'newadmin@estre.in';

-- Step 2: Ensure profile exists with admin role
DO $$
DECLARE
    v_user_id uuid;
    v_email text := 'newadmin@estre.in';
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '❌ User not found with email: %', v_email;
    END IF;
    
    -- Insert or update profile with admin role
    INSERT INTO profiles (user_id, role, full_name)
    VALUES (v_user_id, 'admin'::app_role, 'Admin User')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = 'admin'::app_role,
        full_name = COALESCE(profiles.full_name, 'Admin User');
    
    RAISE NOTICE '✅ Profile updated successfully for: %', v_email;
    RAISE NOTICE '✅ User ID: %', v_user_id;
    RAISE NOTICE '✅ Role: admin';
    
END $$;

-- Step 3: Verify the fix
SELECT 
    u.email,
    p.role,
    CASE 
        WHEN p.role = 'admin' THEN '✅ READY - Admin role confirmed'
        ELSE '❌ ISSUE - Role is: ' || p.role
    END as verification_status
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'newadmin@estre.in';


