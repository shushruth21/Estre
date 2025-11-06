-- ============================================================================
-- ADD HEADREST OPTION FOR SOFA
-- Adds comes_with_headrest dropdown option under Advanced Options
-- ============================================================================

-- Headrest Option (Yes/No/NA)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'comes_with_headrest', 'NA', 'Not Applicable', 1, true, '{"default": true}'),
('sofa', 'comes_with_headrest', 'Yes', 'Yes', 2, true, '{}'),
('sofa', 'comes_with_headrest', 'No', 'No', 3, true, '{}')
ON CONFLICT (category, field_name, option_value) 
DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata;

-- Verify the option was added
SELECT 
  field_name,
  option_value,
  display_label,
  sort_order,
  is_active
FROM dropdown_options 
WHERE category = 'sofa' 
  AND field_name = 'comes_with_headrest' 
  AND is_active = true
ORDER BY sort_order;

-- Expected output: 3 rows (NA, Yes, No)

