-- ============================================================================
-- ADD ADMIN ROLE FOR USER
-- Run this script in Supabase SQL Editor to add admin role to your user
-- ============================================================================

-- Replace 'your-email@example.com' with your actual email address
DO $$
DECLARE
    v_user_id uuid;
    v_email text := 'your-email@example.com'; -- CHANGE THIS TO YOUR EMAIL
BEGIN
    -- Get user ID from email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;
    
    -- Check if user exists
    IF v_user_id IS NULL THEN
        RAISE NOTICE '❌ User not found with email: %', v_email;
        RAISE NOTICE '💡 Please check your email address and try again.';
        RETURN;
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

-- ============================================================================
-- VERIFY ADMIN ROLE
-- Run this to check if your user has admin role
-- ============================================================================

-- List all admin users
SELECT 
    u.email,
    ur.role,
    ur.created_at as role_assigned_at
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role IN ('admin', 'store_manager', 'production_manager')
ORDER BY ur.created_at DESC;

-- ============================================================================
-- QUICK FIX: Add admin role by user ID (if you know your user ID)
-- ============================================================================

-- Uncomment and replace USER_ID_HERE with your actual user ID
-- INSERT INTO user_roles (user_id, role)
-- VALUES ('USER_ID_HERE', 'admin'::app_role)
-- ON CONFLICT (user_id, role) DO NOTHING;

