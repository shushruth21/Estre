-- ============================================
-- TEST EXACT APP QUERY - Run this in Supabase SQL Editor
-- ============================================
-- This tests the exact query the app uses for "sofa" category

-- First, check what columns exist in sofa_database
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sofa_database'
AND column_name IN (
    'id', 'title', 'images', 
    'net_price_rs', 'strike_price_1seater_rs', 'strike_price_rs',
    'discount_percent', 'discount_rs', 'bom_rs', 'is_active'
)
ORDER BY column_name;

-- Test 2: Try the exact query the app uses (as anonymous user)
SET ROLE anon;

-- This is what the app queries for "sofa" category:
SELECT 
    id, 
    title, 
    images, 
    net_price_rs, 
    strike_price_1seater_rs,  -- Check if this column exists!
    discount_percent, 
    discount_rs, 
    bom_rs
FROM sofa_database
WHERE is_active = true
ORDER BY title
LIMIT 5;

-- If the above fails, try with strike_price_rs instead:
SELECT 
    id, 
    title, 
    images, 
    net_price_rs, 
    strike_price_rs,  -- Alternative column name
    discount_percent, 
    discount_rs, 
    bom_rs
FROM sofa_database
WHERE is_active = true
ORDER BY title
LIMIT 5;

RESET ROLE;

-- Test 3: Check RLS policies
SELECT 
    tablename,
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'sofa_database'
ORDER BY policyname;

