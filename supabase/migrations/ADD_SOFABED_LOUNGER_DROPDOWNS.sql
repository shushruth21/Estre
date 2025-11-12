-- Add separate lounger dropdown options for sofabed category
-- This ensures complete separation from sofa category

-- Lounger Sizes for SofaBed
-- Pricing: Base 5'6" = 40% of 2-seater price, each additional 6" = +4%
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofabed', 'lounger_size', 'Lounger-5 ft', 'Lounger-5 ft', 1, true, '{"base_percentage": 40, "fabric_meters": 5.5, "price_multiplier": 0.94}'),
('sofabed', 'lounger_size', 'Lounger-5 ft 6 in', 'Lounger-5 ft 6 in', 2, true, '{"base_percentage": 40, "fabric_meters": 6.5, "price_multiplier": 1.0, "default": true}'),
('sofabed', 'lounger_size', 'Lounger-6 ft', 'Lounger-6 ft', 3, true, '{"base_percentage": 40, "fabric_meters": 7.2, "price_multiplier": 1.04}'),
('sofabed', 'lounger_size', 'Lounger-6 ft 6 in', 'Lounger-6 ft 6 in', 4, true, '{"base_percentage": 40, "fabric_meters": 7.8, "price_multiplier": 1.08}'),
('sofabed', 'lounger_size', 'Lounger-7 ft', 'Lounger-7 ft', 5, true, '{"base_percentage": 40, "fabric_meters": 8.4, "price_multiplier": 1.12}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata;

-- Lounger Placement Options for SofaBed
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofabed', 'lounger_placement', 'LHS', 'Left Hand Side (LHS)', 1, true, '{"allowed_shapes": ["STANDARD", "U SHAPE", "COMBO"]}'),
('sofabed', 'lounger_placement', 'RHS', 'Right Hand Side (RHS)', 2, true, '{"allowed_shapes": ["STANDARD", "U SHAPE", "COMBO"]}'),
('sofabed', 'lounger_placement', 'Both', 'Both LHS & RHS', 3, true, '{"allowed_shapes": ["STANDARD", "U SHAPE", "COMBO"], "requires_2_loungers": true}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata;

-- Lounger Storage Options
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofabed', 'lounger_storage', 'Yes', 'Yes', 1, true, '{"price_adjustment": 0}'),
('sofabed', 'lounger_storage', 'No', 'No', 2, true, '{"price_adjustment": 0, "default": true}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata;

-- Verify the data
SELECT 
  field_name,
  COUNT(*) as option_count,
  STRING_AGG(option_value, ', ' ORDER BY sort_order) as options
FROM dropdown_options
WHERE category = 'sofabed' 
  AND field_name IN ('lounger_size', 'lounger_placement', 'lounger_storage')
  AND is_active = true
GROUP BY field_name
ORDER BY field_name;

