-- ============================================================================
-- DATABASE VERIFICATION SCRIPT
-- Run this to check if all required data exists in your Supabase database
-- ============================================================================

-- ============================================================================
-- STEP 1: Check dropdown_options for sofa category
-- ============================================================================
SELECT 
  'SOFA DROPDOWN OPTIONS' as check_type,
  field_name,
  COUNT(*) as option_count,
  STRING_AGG(option_value, ', ' ORDER BY sort_order) as available_options
FROM dropdown_options 
WHERE category = 'sofa' AND is_active = true
GROUP BY field_name
ORDER BY field_name;

-- Expected results:
-- console_size: 2 options
-- foam_type: 5 options  
-- front_seat_count: 4 options
-- leg_type: 4 options
-- lounger_size: 2 options
-- seat_depth: 4 options
-- seat_width: 4 options
-- shape: 3 options
-- stitch_type: 6 options
-- wood_type: 4 options

-- ============================================================================
-- STEP 2: Check if any required fields are missing
-- ============================================================================
WITH required_fields AS (
  SELECT unnest(ARRAY[
    'shape', 'front_seat_count', 'console_size', 'lounger_size', 
    'foam_type', 'seat_depth', 'seat_width', 'leg_type', 
    'wood_type', 'stitch_type'
  ]) as field_name
),
existing_fields AS (
  SELECT DISTINCT field_name 
  FROM dropdown_options 
  WHERE category = 'sofa' AND is_active = true
)
SELECT 
  rf.field_name as missing_field,
  'Missing - Run COMPLETE_SOFA_SETUP.sql' as status
FROM required_fields rf
LEFT JOIN existing_fields ef ON rf.field_name = ef.field_name
WHERE ef.field_name IS NULL;

-- ============================================================================
-- STEP 3: Check RLS policies for dropdown_options
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'dropdown_options';

-- Should see a policy allowing SELECT for authenticated/anonymous users

-- ============================================================================
-- STEP 4: Check other required tables
-- ============================================================================

-- Check fabric_coding table
SELECT 
  'FABRIC_CODING' as table_name,
  COUNT(*) as total_fabrics,
  COUNT(*) FILTER (WHERE is_active = true) as active_fabrics
FROM fabric_coding;

-- Check legs_prices table
SELECT 
  'LEGS_PRICES' as table_name,
  COUNT(*) as total_legs,
  COUNT(*) FILTER (WHERE is_active = true) as active_legs
FROM legs_prices;

-- Check accessories_prices table
SELECT 
  'ACCESSORIES_PRICES' as table_name,
  COUNT(*) as total_accessories,
  COUNT(*) FILTER (WHERE is_active = true) as active_accessories
FROM accessories_prices;

-- Check pricing_formulas for sofa
SELECT 
  'SOFA_PRICING_FORMULAS' as table_name,
  COUNT(*) as total_formulas,
  COUNT(*) FILTER (WHERE is_active = true) as active_formulas
FROM pricing_formulas
WHERE category = 'sofa';

-- Check sofa_database table
SELECT 
  'SOFA_DATABASE' as table_name,
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE is_active = true) as active_products
FROM sofa_database;

-- ============================================================================
-- STEP 5: Sample data check - Show first few options
-- ============================================================================
SELECT 
  'SAMPLE DATA' as check_type,
  category,
  field_name,
  option_value,
  display_label,
  sort_order,
  is_active
FROM dropdown_options 
WHERE category = 'sofa' 
ORDER BY field_name, sort_order
LIMIT 20;

