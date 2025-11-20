-- ============================================
-- TEST PRODUCT QUERY - Run this in Supabase SQL Editor
-- ============================================
-- This will help diagnose why products aren't loading

-- Test 1: Check if products exist
SELECT 
    'sofa_database' as table_name,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE is_active = true) as active_count
FROM sofa_database
UNION ALL
SELECT 'bed_database', COUNT(*), COUNT(*) FILTER (WHERE is_active = true) FROM bed_database
UNION ALL
SELECT 'recliner_database', COUNT(*), COUNT(*) FILTER (WHERE is_active = true) FROM recliner_database;

-- Test 2: Check RLS policies
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('sofa_database', 'bed_database', 'recliner_database')
AND policyname LIKE 'Public read%'
ORDER BY tablename;

-- Test 3: Test anonymous access
SET ROLE anon;
SELECT COUNT(*) as sofa_count FROM sofa_database WHERE is_active = true;
SELECT COUNT(*) as bed_count FROM bed_database WHERE is_active = true;
RESET ROLE;

-- Test 4: Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('sofa_database', 'bed_database', 'recliner_database')
ORDER BY tablename;

-- Test 5: Try the actual query the app uses
SET ROLE anon;
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
RESET ROLE;

