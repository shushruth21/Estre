-- ============================================================================
-- ENSURE ADMIN ROLE FOR newadmin@estre.in
-- Run this script in Supabase SQL Editor to ensure admin role is set correctly
-- ============================================================================

-- Step 1: Check if user exists and current role
SELECT 
    u.id,
    u.email,
    u.created_at as user_created,
    p.role as current_role,
    p.full_name
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'newadmin@estre.in';

-- Step 2: Ensure profile exists with admin role
DO $$
DECLARE
    v_user_id uuid;
    v_email text := 'newadmin@estre.in';
BEGIN
    -- Get user ID from email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;
    
    -- Check if user exists
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '❌ User not found with email: %. Please create the user first in Supabase Dashboard > Authentication > Users', v_email;
    END IF;
    
    -- Insert or update profile with admin role
    INSERT INTO profiles (user_id, role, full_name)
    VALUES (v_user_id, 'admin'::app_role, 'Admin User')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = 'admin'::app_role,
        full_name = COALESCE(profiles.full_name, 'Admin User');
    
    RAISE NOTICE '✅ Admin role set successfully for user: %', v_email;
    RAISE NOTICE '✅ User ID: %', v_user_id;
    
END $$;

-- Step 3: Verify the role was assigned correctly
SELECT 
    u.email,
    p.role,
    p.full_name,
    CASE 
        WHEN p.role = 'admin' THEN '✅ Admin'
        ELSE '❌ Not Admin - Current role: ' || p.role
    END as status
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'newadmin@estre.in';


