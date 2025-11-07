-- ============================================================================
-- ASSIGN ADMIN ROLE TO USER
-- Run this script in Supabase SQL Editor to add admin role to newadmin@estre.in
-- ============================================================================

-- Step 1: Check if user exists
SELECT 
    id,
    email,
    created_at
FROM auth.users
WHERE email = 'newadmin@estre.in';

-- Step 2: Add admin role (run this after confirming user exists)
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
    
    -- Check if role already exists
    IF EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = v_user_id 
        AND role = 'admin'::app_role
    ) THEN
        RAISE NOTICE '✅ User already has admin role';
        RETURN;
    END IF;
    
    -- Add admin role
    INSERT INTO user_roles (user_id, role)
    VALUES (v_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE '✅ Admin role added successfully for user: %', v_email;
    RAISE NOTICE '✅ User ID: %', v_user_id;
    
END $$;

-- Step 3: Verify the role was assigned
SELECT 
    u.email,
    ur.role,
    ur.created_at as role_assigned_at
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'newadmin@estre.in';

-- ============================================================================
-- ALTERNATIVE: If you know the user ID, use this instead
-- ============================================================================
-- Replace 'USER_ID_HERE' with the actual UUID from Step 1
-- INSERT INTO user_roles (user_id, role)
-- VALUES ('USER_ID_HERE'::uuid, 'admin'::app_role)
-- ON CONFLICT (user_id, role) DO NOTHING;

