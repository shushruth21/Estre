-- ============================================================================
-- MASTER DATABASE SETUP FOR ESTRE FURNITURE CONFIGURATOR
-- Run this script in Supabase SQL Editor to ensure complete database setup
-- This script is idempotent - safe to run multiple times
-- ============================================================================

-- ============================================================================
-- STEP 1: ENSURE PUBLIC READ ACCESS TO DROPDOWN_OPTIONS
-- ============================================================================

-- Drop existing public read policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Public read active dropdowns" ON dropdown_options;

-- Create public read policy for dropdown_options
-- This allows unauthenticated users to read active dropdown options
CREATE POLICY "Public read active dropdowns" ON dropdown_options
  FOR SELECT 
  TO public
  USING (is_active = true);

-- ============================================================================
-- STEP 2: POPULATE ALL SOFA DROPDOWN OPTIONS
-- ============================================================================

-- Delete existing sofa options (to avoid duplicates on re-run)
DELETE FROM dropdown_options WHERE category = 'sofa';

-- SHAPE OPTIONS
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'shape', 'Standard', 'Standard', 1, true, '{"default": true}'),
('sofa', 'shape', 'L-Shape', 'L-Shape', 2, true, '{}'),
('sofa', 'shape', 'U-Shape', 'U-Shape', 3, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- FRONT SEAT COUNT
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'front_seat_count', '1-Seater', '1-Seater', 1, true, '{}'),
('sofa', 'front_seat_count', '2-Seater', '2-Seater', 2, true, '{"default": true}'),
('sofa', 'front_seat_count', '3-Seater', '3-Seater', 3, true, '{}'),
('sofa', 'front_seat_count', '4-Seater', '4-Seater', 4, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- CONSOLE SIZES
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'console_size', '6"', '6 inches', 1, true, '{"default": true, "width_inches": 6}'),
('sofa', 'console_size', '10"', '10 inches', 2, true, '{"width_inches": 10}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- LOUNGER SIZES
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'lounger_size', '6ft', '6 feet', 1, true, '{"default": true}'),
('sofa', 'lounger_size', 'additional_6', 'Additional 6 feet', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- FOAM TYPES
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'foam_type', 'Firm', 'Firm', 1, true, '{"default": true, "price_adjustment": 0}'),
('sofa', 'foam_type', 'Soft', 'Soft', 2, true, '{"price_adjustment": 0}'),
('sofa', 'foam_type', 'Super Soft', 'Super Soft', 3, true, '{"price_adjustment": 0}'),
('sofa', 'foam_type', 'Latex Foam', 'Latex Foam', 4, true, '{"price_adjustment": 4000, "upgrade": true}'),
('sofa', 'foam_type', 'Memory Foam', 'Memory Foam', 5, true, '{"price_adjustment": 3000, "upgrade": true}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- SEAT DEPTH OPTIONS (with percentage metadata)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'seat_depth', '22 in', '22 inches', 1, true, '{"default": true, "percentage": 0}'),
('sofa', 'seat_depth', '24 in', '24 inches', 2, true, '{"percentage": 0}'),
('sofa', 'seat_depth', '26 in', '26 inches', 3, true, '{"percentage": 3}'),
('sofa', 'seat_depth', '28 in', '28 inches', 4, true, '{"percentage": 6}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- SEAT WIDTH OPTIONS (with percentage metadata)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'seat_width', '22 in', '22 inches', 1, true, '{"default": true, "percentage": 0}'),
('sofa', 'seat_width', '24 in', '24 inches', 2, true, '{"percentage": 0}'),
('sofa', 'seat_width', '26 in', '26 inches', 3, true, '{"percentage": 6.5}'),
('sofa', 'seat_width', '30 in', '30 inches', 4, true, '{"percentage": 19.5}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- LEG TYPES
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'leg_type', 'Standard', 'Standard Legs', 1, true, '{"default": true}'),
('sofa', 'leg_type', 'Premium', 'Premium Legs', 2, true, '{"upgrade": true}'),
('sofa', 'leg_type', 'Walnut', 'Walnut Finish', 3, true, '{"upgrade": true}'),
('sofa', 'leg_type', 'Chrome', 'Chrome Finish', 4, true, '{"upgrade": true}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- WOOD TYPES
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'wood_type', 'Pine', 'Pine', 1, true, '{"default": true}'),
('sofa', 'wood_type', 'Walnut', 'Walnut', 2, true, '{"upgrade": true}'),
('sofa', 'wood_type', 'Oak', 'Oak', 3, true, '{"upgrade": true}'),
('sofa', 'wood_type', 'Teak', 'Teak', 4, true, '{"upgrade": true}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- STITCH TYPES
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'stitch_type', 'Plain seam', 'Plain seam', 1, true, '{"default": true, "description": "Professional quality finish"}'),
('sofa', 'stitch_type', 'Top stitch', 'Top stitch', 2, true, '{"description": "Professional quality finish"}'),
('sofa', 'stitch_type', 'Double top stitch', 'Double top stitch', 3, true, '{"description": "Professional quality finish"}'),
('sofa', 'stitch_type', 'Piping/corded seam', 'Piping/corded seam', 4, true, '{"description": "Professional quality finish"}'),
('sofa', 'stitch_type', 'French seam', 'French seam', 5, true, '{"description": "Professional quality finish"}'),
('sofa', 'stitch_type', 'Felled seam/Double stitched seam', 'Felled seam/Double stitched seam', 6, true, '{"description": "Professional quality finish"}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- ============================================================================
-- STEP 3: VERIFY DATA WAS INSERTED
-- ============================================================================

-- Display summary of inserted data
DO $$
DECLARE
  total_count INTEGER;
  field_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count 
  FROM dropdown_options 
  WHERE category = 'sofa' AND is_active = true;
  
  SELECT COUNT(DISTINCT field_name) INTO field_count
  FROM dropdown_options 
  WHERE category = 'sofa' AND is_active = true;
  
  RAISE NOTICE '✅ Sofa dropdown options setup complete!';
  RAISE NOTICE '   Total options: %', total_count;
  RAISE NOTICE '   Total fields: %', field_count;
  RAISE NOTICE '   Expected: 38 options across 10 fields';
END $$;

-- ============================================================================
-- STEP 4: VERIFY RLS POLICIES
-- ============================================================================

-- Check if public read policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'dropdown_options' 
    AND policyname = 'Public read active dropdowns'
  ) THEN
    RAISE NOTICE '⚠️  Public read policy not found - creating it now';
    CREATE POLICY "Public read active dropdowns" ON dropdown_options
      FOR SELECT TO public USING (is_active = true);
  ELSE
    RAISE NOTICE '✅ Public read policy already exists';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: FINAL VERIFICATION QUERY
-- ============================================================================

-- Run this to see all sofa dropdown options
SELECT 
  field_name,
  COUNT(*) as option_count,
  STRING_AGG(option_value, ', ' ORDER BY sort_order) as options
FROM dropdown_options 
WHERE category = 'sofa' AND is_active = true
GROUP BY field_name
ORDER BY field_name;


-- Expected output:
-- console_size: 2 options (6", 10")
-- foam_type: 5 options (Firm, Soft, Super Soft, Latex Foam, Memory Foam)
-- front_seat_count: 4 options (1-Seater, 2-Seater, 3-Seater, 4-Seater)
-- leg_type: 4 options (Standard, Premium, Walnut, Chrome)
-- lounger_size: 2 options (6ft, additional_6)
-- seat_depth: 4 options (22 in, 24 in, 26 in, 28 in)
-- seat_width: 4 options (22 in, 24 in, 26 in, 30 in)
-- shape: 3 options (Standard, L-Shape, U-Shape)
-- stitch_type: 6 options (Plain seam, Top stitch, etc.)
-- wood_type: 4 options (Pine, Walnut, Oak, Teak)

