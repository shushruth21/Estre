-- Ensure all 6 pillow types exist for sofa category
-- Based on user's requirements:
-- 1. Simple (sort_order: 1)
-- 2. Diamond Quilted pillow (sort_order: 2)
-- 3. Belt Quilted (sort_order: 3)
-- 4. Diamond with pipen quilting pillow (sort_order: 4)
-- 5. Tassels with pillow (sort_order: 5)
-- 6. Tassels without a pillow (sort_order: 6)

INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active)
VALUES
  ('sofa', 'pillow_type', 'Simple', 'Simple', 1, true),
  ('sofa', 'pillow_type', 'Diamond Quilted pillow', 'Diamond Quilted pillow', 2, true),
  ('sofa', 'pillow_type', 'Belt Quilted', 'Belt Quilted', 3, true),
  ('sofa', 'pillow_type', 'Diamond with pipen quilting pillow', 'Diamond with pipen quilting pillow', 4, true),
  ('sofa', 'pillow_type', 'Tassels with pillow', 'Tassels with pillow', 5, true),
  ('sofa', 'pillow_type', 'Tassels without a pillow', 'Tassels without a pillow', 6, true)
ON CONFLICT (category, field_name, option_value) 
DO UPDATE SET 
  display_label = EXCLUDED.display_label,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

-- Verify the count
DO $$
DECLARE
  pillow_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO pillow_count
  FROM dropdown_options
  WHERE category = 'sofa' 
    AND field_name = 'pillow_type' 
    AND is_active = true;
  
  IF pillow_count < 6 THEN
    RAISE NOTICE 'WARNING: Only % pillow types found. Expected 6.', pillow_count;
  ELSE
    RAISE NOTICE 'SUCCESS: All 6 pillow types are active in the database.';
  END IF;
END $$;

