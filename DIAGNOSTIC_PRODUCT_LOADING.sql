-- ============================================
-- COMPREHENSIVE PRODUCT LOADING DIAGNOSTIC
-- ============================================
-- Run this script in Supabase SQL Editor to diagnose product loading issues

-- ============================================
-- PART 1: CHECK PRODUCT DATA EXISTS
-- ============================================
\echo '=== PART 1: Product Data Check ==='

SELECT
    'sofa_database' as table_name,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_active = true) as active,
    COUNT(*) FILTER (WHERE is_active = false) as inactive,
    COUNT(*) FILTER (WHERE images IS NOT NULL) as with_images
FROM sofa_database
UNION ALL
SELECT 'bed_database', COUNT(*), COUNT(*) FILTER (WHERE is_active = true),
       COUNT(*) FILTER (WHERE is_active = false), COUNT(*) FILTER (WHERE images IS NOT NULL)
FROM bed_database
UNION ALL
SELECT 'recliner_database', COUNT(*), COUNT(*) FILTER (WHERE is_active = true),
       COUNT(*) FILTER (WHERE is_active = false), COUNT(*) FILTER (WHERE images IS NOT NULL)
FROM recliner_database
UNION ALL
SELECT 'cinema_chairs_database', COUNT(*), COUNT(*) FILTER (WHERE is_active = true),
       COUNT(*) FILTER (WHERE is_active = false), COUNT(*) FILTER (WHERE images IS NOT NULL)
FROM cinema_chairs_database
UNION ALL
SELECT 'dining_chairs_database', COUNT(*), COUNT(*) FILTER (WHERE is_active = true),
       COUNT(*) FILTER (WHERE is_active = false), COUNT(*) FILTER (WHERE images IS NOT NULL)
FROM dining_chairs_database
UNION ALL
SELECT 'arm_chairs_database', COUNT(*), COUNT(*) FILTER (WHERE is_active = true),
       COUNT(*) FILTER (WHERE is_active = false), COUNT(*) FILTER (WHERE images IS NOT NULL)
FROM arm_chairs_database
UNION ALL
SELECT 'benches_database', COUNT(*), COUNT(*) FILTER (WHERE is_active = true),
       COUNT(*) FILTER (WHERE is_active = false), COUNT(*) FILTER (WHERE images IS NOT NULL)
FROM benches_database
UNION ALL
SELECT 'kids_bed_database', COUNT(*), COUNT(*) FILTER (WHERE is_active = true),
       COUNT(*) FILTER (WHERE is_active = false), COUNT(*) FILTER (WHERE images IS NOT NULL)
FROM kids_bed_database
UNION ALL
SELECT 'sofabed_database', COUNT(*), COUNT(*) FILTER (WHERE is_active = true),
       COUNT(*) FILTER (WHERE is_active = false), COUNT(*) FILTER (WHERE images IS NOT NULL)
FROM sofabed_database
UNION ALL
SELECT 'database_pouffes', COUNT(*), COUNT(*), 0, COUNT(*) FILTER (WHERE image IS NOT NULL)
FROM database_pouffes
ORDER BY table_name;

-- ============================================
-- PART 2: CHECK RLS POLICIES
-- ============================================
\echo ''
\echo '=== PART 2: RLS Policy Check ==='

SELECT
    tablename,
    policyname,
    roles,
    cmd,
    CASE
        WHEN qual::text LIKE '%is_active%' THEN 'Filters by is_active'
        WHEN qual::text = 'true' THEN 'No filter (all rows)'
        ELSE 'Custom filter'
    END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
    'sofa_database', 'bed_database', 'recliner_database',
    'cinema_chairs_database', 'dining_chairs_database', 'arm_chairs_database',
    'benches_database', 'kids_bed_database', 'sofabed_database', 'database_pouffes'
)
AND cmd = 'SELECT'
ORDER BY tablename;

-- ============================================
-- PART 3: TEST ANONYMOUS ACCESS
-- ============================================
\echo ''
\echo '=== PART 3: Anonymous Access Test ==='

-- Test as anonymous user
SET ROLE anon;

-- Test query for sofa_database (most common category)
SELECT
    id,
    title,
    CASE
        WHEN images IS NULL THEN 'NULL'
        WHEN images = '' THEN 'EMPTY'
        ELSE SUBSTRING(images::text, 1, 50) || '...'
    END as images_preview,
    net_price_rs,
    strike_price_1seater_rs,
    is_active
FROM sofa_database
WHERE is_active = true
LIMIT 3;

-- Test count query
SELECT
    'sofa' as category,
    COUNT(*) as accessible_products
FROM sofa_database
WHERE is_active = true;

RESET ROLE;

-- ============================================
-- PART 4: VERIFY COLUMN NAMES
-- ============================================
\echo ''
\echo '=== PART 4: Column Name Verification ==='

-- Check pricing columns for each table
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN (
    'sofa_database', 'bed_database', 'recliner_database',
    'cinema_chairs_database', 'dining_chairs_database', 'arm_chairs_database',
    'benches_database', 'kids_bed_database', 'sofabed_database', 'database_pouffes'
)
AND (
    column_name LIKE '%price%'
    OR column_name LIKE '%images%'
    OR column_name = 'image'
    OR column_name = 'is_active'
)
ORDER BY table_name, column_name;

-- ============================================
-- PART 5: CHECK SUPPORTING TABLES
-- ============================================
\echo ''
\echo '=== PART 5: Supporting Tables Check ==='

SELECT
    'dropdown_options' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE is_active = true) as active_rows,
    COUNT(DISTINCT category) as categories
FROM dropdown_options
UNION ALL
SELECT
    'fabric_coding',
    COUNT(*),
    COUNT(*) FILTER (WHERE is_active = true),
    NULL
FROM fabric_coding
UNION ALL
SELECT
    'accessories_prices',
    COUNT(*),
    COUNT(*) FILTER (WHERE is_active = true),
    NULL
FROM accessories_prices
UNION ALL
SELECT
    'legs_prices',
    COUNT(*),
    COUNT(*) FILTER (WHERE is_active = true),
    NULL
FROM legs_prices;

-- ============================================
-- PART 6: SAMPLE PRODUCTS QUERY
-- ============================================
\echo ''
\echo '=== PART 6: Sample Products from Each Category ==='

-- Sofa
SELECT 'SOFA' as category, id, title, net_price_rs, strike_price_1seater_rs
FROM sofa_database WHERE is_active = true LIMIT 1;

-- Bed
SELECT 'BED' as category, id, title, net_price_single_no_storage_rs as net_price, strike_price_rs as strike_price
FROM bed_database WHERE is_active = true LIMIT 1;

-- Recliner
SELECT 'RECLINER' as category, id, title, net_price_rs, strike_price_1seater_rs as strike_price
FROM recliner_database WHERE is_active = true LIMIT 1;

-- Pouffe
SELECT 'POUFFE' as category, id, title, net_price, strike_price_rs as strike_price
FROM database_pouffes LIMIT 1;

-- ============================================
-- PART 7: DIAGNOSTICS SUMMARY
-- ============================================
\echo ''
\echo '=== DIAGNOSTICS SUMMARY ==='
\echo 'Expected Results:'
\echo '  ✓ All product tables should have active > 0'
\echo '  ✓ All tables should have RLS policies with roles = {public}'
\echo '  ✓ Anonymous access test should return products without errors'
\echo '  ✓ Column names should match between tables and Products.tsx queries'
\echo '  ✓ Supporting tables should have data'
\echo ''
\echo 'If any test fails:'
\echo '  • Check RLS policies are enabled and use TO public'
\echo '  • Verify products have is_active = true'
\echo '  • Ensure column names match the CATEGORY_COLUMNS mapping in Products.tsx'
\echo '  • Check browser console for detailed error messages'
