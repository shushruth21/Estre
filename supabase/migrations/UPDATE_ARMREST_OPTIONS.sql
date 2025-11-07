-- Update armrest_type dropdown options with pricing and width information
-- This script updates existing armrest options with correct pricing and width metadata

-- Update Default (no charge, no width specified)
UPDATE dropdown_options
SET 
  metadata = jsonb_build_object(
    'default', true,
    'price_rs', 0,
    'width_in', null
  )
WHERE category = 'sofa' 
  AND field_name = 'armrest_type' 
  AND option_value = 'Default';

-- Update Balboa (no charge, 11.0 inches)
UPDATE dropdown_options
SET 
  metadata = jsonb_build_object(
    'default', false,
    'price_rs', 0,
    'width_in', 11.0
  )
WHERE category = 'sofa' 
  AND field_name = 'armrest_type' 
  AND option_value = 'Balboa';

-- Update Ocean (₹5,000, 7.0 inches)
UPDATE dropdown_options
SET 
  metadata = jsonb_build_object(
    'default', false,
    'price_rs', 5000,
    'width_in', 7.0
  )
WHERE category = 'sofa' 
  AND field_name = 'armrest_type' 
  AND option_value = 'Ocean';

-- Update Nest (₹5,000, 6.0 inches)
UPDATE dropdown_options
SET 
  metadata = jsonb_build_object(
    'default', false,
    'price_rs', 5000,
    'width_in', 6.0
  )
WHERE category = 'sofa' 
  AND field_name = 'armrest_type' 
  AND option_value = 'Nest';

-- Update Etan (₹5,000, 8.0 inches)
UPDATE dropdown_options
SET 
  metadata = jsonb_build_object(
    'default', false,
    'price_rs', 5000,
    'width_in', 8.0
  )
WHERE category = 'sofa' 
  AND field_name = 'armrest_type' 
  AND option_value = 'Etan';

-- Update Albatross (₹5,000, 8.0 inches)
UPDATE dropdown_options
SET 
  metadata = jsonb_build_object(
    'default', false,
    'price_rs', 5000,
    'width_in', 8.0
  )
WHERE category = 'sofa' 
  AND field_name = 'armrest_type' 
  AND option_value = 'Albatross';

-- Update Anke (₹5,000, 4.5 inches)
UPDATE dropdown_options
SET 
  metadata = jsonb_build_object(
    'default', false,
    'price_rs', 5000,
    'width_in', 4.5
  )
WHERE category = 'sofa' 
  AND field_name = 'armrest_type' 
  AND option_value = 'Anke';

-- Update Dinny (₹5,000, 5.0 inches)
UPDATE dropdown_options
SET 
  metadata = jsonb_build_object(
    'default', false,
    'price_rs', 5000,
    'width_in', 5.0
  )
WHERE category = 'sofa' 
  AND field_name = 'armrest_type' 
  AND option_value = 'Dinny';

-- Verify updates
SELECT 
  option_value,
  display_label,
  metadata->>'price_rs' as price_rs,
  metadata->>'width_in' as width_in,
  metadata->>'default' as is_default
FROM dropdown_options
WHERE category = 'sofa' 
  AND field_name = 'armrest_type'
ORDER BY sort_order;

