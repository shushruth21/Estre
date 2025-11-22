-- ============================================================================
-- CREATE STAFF USER: newstaff@estre.in
-- Run this script in Supabase SQL Editor AFTER creating the user
-- ============================================================================

-- Step 1: Check if user exists
SELECT 
    u.id as user_id,
    u.email,
    u.created_at as user_created,
    p.role as current_role,
    CASE 
        WHEN p.role = 'staff' THEN '✅ Already staff'
        WHEN p.role IS NULL THEN '❌ No role set'
        WHEN u.id IS NULL THEN '❌ User does not exist - Create user first!'
        ELSE '⚠️ Current role: ' || p.role
    END as status
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'newstaff@estre.in';

-- Step 2: Set staff role (run this AFTER creating the user in Supabase Dashboard)
DO $$
DECLARE
    v_user_id uuid;
    v_email text := 'newstaff@estre.in';
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '❌ User not found with email: %. Please create the user first in Supabase Dashboard > Authentication > Users', v_email;
    END IF;
    
    -- Insert or update profile with staff role
    INSERT INTO profiles (user_id, role, full_name)
    VALUES (v_user_id, 'staff'::app_role, 'Staff User')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = 'staff'::app_role,
        full_name = COALESCE(profiles.full_name, 'Staff User');
    
    RAISE NOTICE '✅ Profile updated successfully!';
    RAISE NOTICE '✅ Email: %', v_email;
    RAISE NOTICE '✅ User ID: %', v_user_id;
    RAISE NOTICE '✅ Role set to: staff';
    
END $$;

-- Step 3: Verify the update
SELECT 
    u.email,
    p.role,
    p.full_name,
    CASE 
        WHEN p.role = 'staff' THEN '✅ SUCCESS - Staff role confirmed'
        ELSE '❌ FAILED - Role is: ' || p.role
    END as verification_status
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'newstaff@estre.in';


