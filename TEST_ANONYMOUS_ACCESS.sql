-- ============================================
-- TEST ANONYMOUS ACCESS - Run this in Supabase SQL Editor
-- ============================================
-- This will test if anonymous users can actually read products

-- Test 1: Check current role
SELECT current_user, current_setting('role');

-- Test 2: Switch to anonymous role and test access
SET ROLE anon;

-- Test 3: Try to read products (this is what the app does)
SELECT 
    id, 
    title, 
    images, 
    net_price_rs, 
    strike_price_rs, 
    discount_percent, 
    discount_rs, 
    bom_rs
FROM sofa_database
WHERE is_active = true
ORDER BY title
LIMIT 5;

-- Test 4: Check if we can count products
SELECT COUNT(*) as count FROM sofa_database WHERE is_active = true;

-- Reset role
RESET ROLE;

-- Test 5: Verify RLS policies are correct
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'sofa_database'
AND policyname LIKE 'Public read%';

-- Test 6: Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'sofa_database';

