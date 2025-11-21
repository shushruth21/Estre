-- ============================================
-- CREATE STAFF CREDENTIALS
-- ============================================
-- This script helps create staff user accounts with proper role assignments
-- Run this in Supabase SQL Editor

-- Step 1: Create staff user via Supabase Auth API (use Dashboard or API)
-- For now, we'll create a function to help assign roles after user creation

-- Function to assign staff role to a user by email
CREATE OR REPLACE FUNCTION assign_staff_role(user_email text, staff_role text DEFAULT 'staff')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Get user ID from email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Ensure profile exists
  INSERT INTO profiles (user_id, role)
  VALUES (target_user_id, staff_role)
  ON CONFLICT (user_id) 
  DO UPDATE SET role = staff_role;
  
  RAISE NOTICE 'Staff role assigned successfully to %', user_email;
END;
$$;

-- ============================================
-- MANUAL STEPS TO CREATE STAFF USER:
-- ============================================
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" > "Create new user"
-- 3. Fill in:
--    - Email: staff1@estre.in (or your preferred email)
--    - Password: Staff@123456 (or your preferred password)
--    - Auto Confirm User: ✅ (checked)
-- 4. Click "Create user"
-- 5. Copy the user's UUID from the users list
-- 6. Run the SQL below to assign staff role:

-- ============================================
-- QUICK ASSIGNMENT (Replace EMAIL with actual email):
-- ============================================

-- Option 1: Use the function (recommended)
-- SELECT assign_staff_role('staff1@estre.in', 'staff');

-- Option 2: Direct insert (if you have the user_id)
-- INSERT INTO profiles (user_id, role)
-- SELECT id, 'staff'
-- FROM auth.users
-- WHERE email = 'staff1@estre.in'
-- ON CONFLICT (user_id) DO UPDATE SET role = 'staff';

-- ============================================
-- CREATE MULTIPLE STAFF ACCOUNTS:
-- ============================================

-- Staff Account 1: Production Staff
-- Email: production.staff@estre.in
-- Password: (set via Supabase Dashboard)
-- Role: staff
-- SELECT assign_staff_role('production.staff@estre.in', 'staff');

-- Staff Account 2: Factory Staff
-- Email: factory.staff@estre.in
-- Password: (set via Supabase Dashboard)
-- Role: factory_staff
-- SELECT assign_staff_role('factory.staff@estre.in', 'factory_staff');

-- Staff Account 3: Store Manager
-- Email: store.manager@estre.in
-- Password: (set via Supabase Dashboard)
-- Role: store_manager
-- SELECT assign_staff_role('store.manager@estre.in', 'store_manager');

-- ============================================
-- VERIFY STAFF ACCOUNTS:
-- ============================================

-- Check all staff users and their roles
SELECT 
    u.email,
    u.created_at as user_created,
    p.role,
    CASE 
        WHEN p.role IN ('admin', 'super_admin') THEN 'Admin'
        WHEN p.role IN ('staff', 'production_manager', 'store_manager', 'factory_staff', 'ops_team') THEN 'Staff'
        ELSE 'Customer'
    END as access_level
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE p.role IN ('staff', 'production_manager', 'store_manager', 'factory_staff', 'ops_team')
ORDER BY u.created_at DESC;

-- ============================================
-- RESET STAFF PASSWORD (if needed):
-- ============================================
-- Go to Supabase Dashboard > Authentication > Users
-- Find the user > Click "..." > "Reset Password"
-- Or use Supabase Auth API to reset password

