-- ============================================================================
-- COMPLETE SOFA CONFIGURATOR DATABASE SETUP
-- This migration ensures ALL dropdown options are populated for sofa configurator
-- Run this in Supabase SQL Editor to populate all required data
-- ============================================================================

-- ============================================================================
-- STEP 1: ENSURE SOFA DROPDOWN OPTIONS EXIST
-- ============================================================================

-- Delete existing sofa options to avoid duplicates
DELETE FROM dropdown_options WHERE category = 'sofa';

-- SHAPE OPTIONS
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'shape', 'Standard', 'Standard', 1, true, '{"default": true}'),
('sofa', 'shape', 'L-Shape', 'L-Shape', 2, true, '{}'),
('sofa', 'shape', 'U-Shape', 'U-Shape', 3, true, '{}');

-- FRONT SEAT COUNT
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'front_seat_count', '1-Seater', '1-Seater', 1, true, '{}'),
('sofa', 'front_seat_count', '2-Seater', '2-Seater', 2, true, '{"default": true}'),
('sofa', 'front_seat_count', '3-Seater', '3-Seater', 3, true, '{}'),
('sofa', 'front_seat_count', '4-Seater', '4-Seater', 4, true, '{}');

-- CONSOLE SIZES
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'console_size', '6"', '6 inches', 1, true, '{"default": true, "width_inches": 6}'),
('sofa', 'console_size', '10"', '10 inches', 2, true, '{"width_inches": 10}');

-- LOUNGER SIZES
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'lounger_size', '6ft', '6 feet', 1, true, '{"default": true}'),
('sofa', 'lounger_size', 'additional_6', 'Additional 6 feet', 2, true, '{}');

-- FOAM TYPES
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'foam_type', 'Firm', 'Firm', 1, true, '{"default": true, "price_adjustment": 0}'),
('sofa', 'foam_type', 'Soft', 'Soft', 2, true, '{"price_adjustment": 0}'),
('sofa', 'foam_type', 'Super Soft', 'Super Soft', 3, true, '{"price_adjustment": 0}'),
('sofa', 'foam_type', 'Latex Foam', 'Latex Foam', 4, true, '{"price_adjustment": 4000, "upgrade": true}'),
('sofa', 'foam_type', 'Memory Foam', 'Memory Foam', 5, true, '{"price_adjustment": 3000, "upgrade": true}');

-- SEAT DEPTH OPTIONS
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'seat_depth', '22 in', '22 inches', 1, true, '{"default": true, "percentage": 0}'),
('sofa', 'seat_depth', '24 in', '24 inches', 2, true, '{"percentage": 0}'),
('sofa', 'seat_depth', '26 in', '26 inches', 3, true, '{"percentage": 3}'),
('sofa', 'seat_depth', '28 in', '28 inches', 4, true, '{"percentage": 6}');

-- SEAT WIDTH OPTIONS
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'seat_width', '22 in', '22 inches', 1, true, '{"default": true, "percentage": 0}'),
('sofa', 'seat_width', '24 in', '24 inches', 2, true, '{"percentage": 0}'),
('sofa', 'seat_width', '26 in', '26 inches', 3, true, '{"percentage": 6.5}'),
('sofa', 'seat_width', '30 in', '30 inches', 4, true, '{"percentage": 19.5}');

-- LEG TYPES
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'leg_type', 'Standard', 'Standard Legs', 1, true, '{"default": true}'),
('sofa', 'leg_type', 'Premium', 'Premium Legs', 2, true, '{"upgrade": true}'),
('sofa', 'leg_type', 'Walnut', 'Walnut Finish', 3, true, '{"upgrade": true}'),
('sofa', 'leg_type', 'Chrome', 'Chrome Finish', 4, true, '{"upgrade": true}');

-- WOOD TYPES
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'wood_type', 'Pine', 'Pine', 1, true, '{"default": true}'),
('sofa', 'wood_type', 'Walnut', 'Walnut', 2, true, '{"upgrade": true}'),
('sofa', 'wood_type', 'Oak', 'Oak', 3, true, '{"upgrade": true}'),
('sofa', 'wood_type', 'Teak', 'Teak', 4, true, '{"upgrade": true}');

-- STITCH TYPES
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'stitch_type', 'Plain seam', 'Plain seam', 1, true, '{"default": true, "description": "Professional quality finish"}'),
('sofa', 'stitch_type', 'Top stitch', 'Top stitch', 2, true, '{"description": "Professional quality finish"}'),
('sofa', 'stitch_type', 'Double top stitch', 'Double top stitch', 3, true, '{"description": "Professional quality finish"}'),
('sofa', 'stitch_type', 'Piping/corded seam', 'Piping/corded seam', 4, true, '{"description": "Professional quality finish"}'),
('sofa', 'stitch_type', 'French seam', 'French seam', 5, true, '{"description": "Professional quality finish"}'),
('sofa', 'stitch_type', 'Felled seam/Double stitched seam', 'Felled seam/Double stitched seam', 6, true, '{"description": "Professional quality finish"}');

-- ============================================================================
-- STEP 2: VERIFY DATA WAS INSERTED
-- ============================================================================

-- Check counts
SELECT 
  field_name, 
  COUNT(*) as option_count 
FROM dropdown_options 
WHERE category = 'sofa' AND is_active = true
GROUP BY field_name
ORDER BY field_name;

-- Expected output should show:
-- console_size: 2
-- foam_type: 5
-- front_seat_count: 4
-- leg_type: 4
-- lounger_size: 2
-- seat_depth: 4
-- seat_width: 4
-- shape: 3
-- stitch_type: 6
-- wood_type: 4

-- ============================================================================
-- STEP 3: VERIFY ROW LEVEL SECURITY
-- ============================================================================

-- Ensure public can read active dropdown options
-- This should already be set, but verify:
SELECT * FROM pg_policies 
WHERE tablename = 'dropdown_options' 
AND policyname LIKE '%read%';

-- If no public read policy exists, create it:
-- CREATE POLICY "Public read active dropdowns" ON dropdown_options
--   FOR SELECT USING (is_active = true);

