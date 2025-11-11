-- ============================================================================
-- REMOVE OLD PILLOW TYPES (Diamond, Belt, Tassels)
-- ============================================================================
-- This migration disables/removes the old pillow type options:
-- - 'Diamond'
-- - 'Belt'
-- - 'Tassels'
--
-- These are replaced by more specific options like:
-- - 'Diamond Quilted pillow'
-- - 'Diamond with pipen quilting pillow'
-- - 'Belt Quilted'
-- - 'Tassels with pillow'
-- - 'Tassels without a pillow'
--
-- To edit pillow types in the future, simply update the dropdown_options table:
-- - Set is_active = false to hide an option
-- - Set is_active = true to show an option
-- - Update display_label to change how it appears in the UI
-- - Update metadata to change pricing or other properties
-- ============================================================================

-- Disable old pillow type options for 'sofa' category
UPDATE dropdown_options
SET is_active = false,
    updated_at = NOW()
WHERE category = 'sofa'
  AND field_name = 'pillow_type'
  AND option_value IN ('Diamond', 'Belt', 'Tassels');

-- Also disable for 'sofabed' category if they exist
UPDATE dropdown_options
SET is_active = false,
    updated_at = NOW()
WHERE category = 'sofabed'
  AND field_name = 'pillow_type'
  AND option_value IN ('Diamond', 'Belt', 'Tassels');

-- Verify the changes
DO $$
DECLARE
  disabled_count INTEGER;
  active_count INTEGER;
BEGIN
  -- Count disabled options
  SELECT COUNT(*) INTO disabled_count
  FROM dropdown_options
  WHERE category IN ('sofa', 'sofabed')
    AND field_name = 'pillow_type'
    AND option_value IN ('Diamond', 'Belt', 'Tassels')
    AND is_active = false;
  
  -- Count active pillow types
  SELECT COUNT(*) INTO active_count
  FROM dropdown_options
  WHERE category = 'sofa'
    AND field_name = 'pillow_type'
    AND is_active = true;
  
  RAISE NOTICE 'Disabled % old pillow type options (Diamond, Belt, Tassels)', disabled_count;
  RAISE NOTICE 'Active pillow types for sofa: %', active_count;
  
  IF active_count = 0 THEN
    RAISE WARNING 'WARNING: No active pillow types found for sofa category!';
  END IF;
END $$;

-- ============================================================================
-- HOW TO MANAGE PILLOW TYPES IN THE FUTURE:
-- ============================================================================
-- 
-- 1. View all pillow types:
--    SELECT * FROM dropdown_options 
--    WHERE category = 'sofa' AND field_name = 'pillow_type'
--    ORDER BY sort_order;
--
-- 2. Add a new pillow type:
--    INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata)
--    VALUES ('sofa', 'pillow_type', 'New Type', 'New Pillow Type', 10, true, '{"price_adjustment": 0}');
--
-- 3. Disable a pillow type (hide from UI):
--    UPDATE dropdown_options
--    SET is_active = false
--    WHERE category = 'sofa' AND field_name = 'pillow_type' AND option_value = 'Type Name';
--
-- 4. Enable a pillow type (show in UI):
--    UPDATE dropdown_options
--    SET is_active = true
--    WHERE category = 'sofa' AND field_name = 'pillow_type' AND option_value = 'Type Name';
--
-- 5. Update display label:
--    UPDATE dropdown_options
--    SET display_label = 'New Display Name'
--    WHERE category = 'sofa' AND field_name = 'pillow_type' AND option_value = 'Type Name';
--
-- 6. Update pricing metadata:
--    UPDATE dropdown_options
--    SET metadata = '{"price_adjustment": 500, "formula_key": "pillow_new_type_price"}'
--    WHERE category = 'sofa' AND field_name = 'pillow_type' AND option_value = 'Type Name';
--
-- ============================================================================

