-- Add pricing metadata to existing sofa lounger_size options
-- This makes sofa lounger pricing database-driven

-- Update existing sofa lounger sizes with pricing metadata
-- Pricing: 5ft/5'6" = 100%, 6ft = 110%, 6'6" = 120%, 7ft = 130%
UPDATE dropdown_options
SET metadata = jsonb_build_object(
  'base_percentage', 100,
  'price_multiplier', 1.0,
  'fabric_meters', 6.5
)
WHERE category = 'sofa' 
  AND field_name = 'lounger_size' 
  AND option_value IN ('5 ft', '5''6"', '5\'6"');

UPDATE dropdown_options
SET metadata = jsonb_build_object(
  'base_percentage', 100,
  'price_multiplier', 1.1,
  'fabric_meters', 7.2
)
WHERE category = 'sofa' 
  AND field_name = 'lounger_size' 
  AND option_value = '6 ft';

UPDATE dropdown_options
SET metadata = jsonb_build_object(
  'base_percentage', 100,
  'price_multiplier', 1.2,
  'fabric_meters', 7.8
)
WHERE category = 'sofa' 
  AND field_name = 'lounger_size' 
  AND option_value IN ('6''6"', '6\'6"');

UPDATE dropdown_options
SET metadata = jsonb_build_object(
  'base_percentage', 100,
  'price_multiplier', 1.3,
  'fabric_meters', 8.4
)
WHERE category = 'sofa' 
  AND field_name = 'lounger_size' 
  AND option_value = '7 ft';

-- Verify the updates
SELECT 
  option_value,
  display_label,
  metadata
FROM dropdown_options
WHERE category = 'sofa' 
  AND field_name = 'lounger_size'
  AND is_active = true
ORDER BY sort_order;

