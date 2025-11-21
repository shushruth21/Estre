-- =====================================================
-- CREATE TEST USERS FOR DEVELOPMENT
-- =====================================================
--
-- This script creates test users for development and testing
-- Run this in Supabase SQL Editor
--
-- IMPORTANT: These are test credentials. Change passwords in production!
-- =====================================================

-- Note: You must run this script using the Supabase Dashboard SQL Editor
-- as it requires service role permissions to create auth users

-- Test Admin User
-- Email: testadmin@estre.in
-- Password: Admin@2025Secure!
-- Role: admin

-- Test Staff User
-- Email: teststaff@estre.in
-- Password: Staff@2025Secure!
-- Role: staff

-- Test Customer User
-- Email: testcustomer@estre.in
-- Password: Customer@2025!
-- Role: customer

-- =====================================================
-- MANUAL CREATION STEPS:
-- =====================================================
--
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add user" → "Create new user"
-- 3. Enter email and password from above
-- 4. Confirm email automatically
-- 5. After user is created, run the following SQL to set role:

-- For Admin User (replace USER_ID with actual ID from auth.users):
-- UPDATE profiles SET role = 'admin', full_name = 'Test Admin' WHERE user_id = 'ADMIN_USER_ID';

-- For Staff User:
-- UPDATE profiles SET role = 'staff', full_name = 'Test Staff Member' WHERE user_id = 'STAFF_USER_ID';

-- For Customer User:
-- UPDATE profiles SET role = 'customer', full_name = 'Test Customer' WHERE user_id = 'CUSTOMER_USER_ID';

-- =====================================================
-- VERIFY USERS:
-- =====================================================

-- Check all users and their roles
SELECT
  u.id,
  u.email,
  p.full_name,
  p.role,
  u.created_at
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email LIKE '%test%@estre.in'
ORDER BY u.created_at DESC;
