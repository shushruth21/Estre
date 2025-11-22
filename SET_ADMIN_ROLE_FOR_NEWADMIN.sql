-- ============================================================================
-- SET ADMIN ROLE FOR newadmin@estre.in
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Check current status
SELECT 
    u.id as user_id,
    u.email,
    p.role as current_role,
    CASE 
        WHEN p.role = 'admin' THEN '✅ Already admin'
        WHEN p.role IS NULL THEN '❌ No role set'
        ELSE '⚠️ Current role: ' || p.role
    END as status
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'newadmin@estre.in';

-- Step 2: Update profile to admin role
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
    
    -- Update profile to admin role (upsert to handle if profile doesn't exist)
    INSERT INTO profiles (user_id, role, full_name)
    VALUES (v_user_id, 'admin'::app_role, 'Admin User')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = 'admin'::app_role,
        full_name = COALESCE(profiles.full_name, 'Admin User');
    
    RAISE NOTICE '✅ Profile updated successfully!';
    RAISE NOTICE '✅ Email: %', v_email;
    RAISE NOTICE '✅ User ID: %', v_user_id;
    RAISE NOTICE '✅ Role set to: admin';
    
END $$;

-- Step 3: Verify the update
SELECT 
    u.email,
    p.role,
    p.full_name,
    CASE 
        WHEN p.role = 'admin' THEN '✅ SUCCESS - Admin role confirmed'
        ELSE '❌ FAILED - Role is still: ' || p.role
    END as verification_status
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'newadmin@estre.in';


