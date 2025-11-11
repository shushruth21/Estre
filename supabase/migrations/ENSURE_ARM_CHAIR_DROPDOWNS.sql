INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('arm_chairs', 'fabric_cladding_plan', 'Single Colour', 'Single Colour', 1, true, '{"default": true}'),
  ('arm_chairs', 'fabric_cladding_plan', 'Dual Colour', 'Dual Colour', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('arm_chairs', 'seat_width', '22 in', '22 in', 1, true, '{"width_multiplier": 0}'),
  ('arm_chairs', 'seat_width', '24 in', '24 in', 2, true, '{"width_multiplier": 0}'),
  ('arm_chairs', 'seat_width', '26 in', '26 in', 3, true, '{"width_multiplier": 0.065}'),
  ('arm_chairs', 'seat_width', '30 in', '30 in', 4, true, '{"width_multiplier": 0.195}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('arm_chairs', 'seat_depth', '22 in', '22 in', 1, true, '{"depth_multiplier": 0}'),
  ('arm_chairs', 'seat_depth', '24 in', '24 in', 2, true, '{"depth_multiplier": 0}'),
  ('arm_chairs', 'seat_depth', '26 in', '26 in', 3, true, '{"depth_multiplier": 0.03}'),
  ('arm_chairs', 'seat_depth', '28 in', '28 in', 4, true, '{"depth_multiplier": 0.06}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('arm_chairs', 'seat_height', '16 in', '16 in', 1, true, '{}'),
  ('arm_chairs', 'seat_height', '18 in', '18 in', 2, true, '{"default": true}'),
  ('arm_chairs', 'seat_height', '20 in', '20 in', 3, true, '{}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('arm_chairs', 'leg_type', 'Kulfi Leg-Brown with Gold', 'Kulfi Leg-Brown with Gold', 1, true, '{"size": "16 in"}'),
  ('arm_chairs', 'leg_type', 'Kulfi Leg-Cream with Gold', 'Kulfi Leg-Cream with Gold', 2, true, '{"size": "16 in"}'),
  ('arm_chairs', 'leg_type', 'Kulfi Leg-Black', 'Kulfi Leg-Black', 3, true, '{"size": "16 in"}'),
  ('arm_chairs', 'leg_type', 'Kulfi Leg-Black with Gold', 'Kulfi Leg-Black with Gold', 4, true, '{"size": "16 in"}'),
  ('arm_chairs', 'leg_type', 'Kulfi Leg-Gold', 'Kulfi Leg-Gold', 5, true, '{"size": "16 in"}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

WITH pillow_types(type, display, sort_order) AS (
  VALUES
    ('Simple pillow', 'Simple pillow', 1),
    ('Diamond quilted pillow', 'Diamond quilted pillow', 2),
    ('Diamond with pipen quilted pillow', 'Diamond with pipen quilted pillow', 3),
    ('Belt overlapping pillow', 'Belt overlapping pillow', 4),
    ('Tassels with pillow', 'Tassels with pillow', 5),
    ('Tassels without pillow', 'Tassels without pillow', 6)
)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active)
SELECT 'arm_chairs', 'pillow_type', type, display, sort_order, true
FROM pillow_types
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active;

WITH pillow_sizes(size, metadata, sort_order) AS (
  VALUES
    ('18 in X 18 in', '{"price_matrix": {"Simple pillow": 1200, "Diamond quilted pillow": 3500, "Diamond with pipen quilted pillow": 3500, "Belt overlapping pillow": 4000, "Tassels with pillow": 2500, "Tassels without pillow": 2500}, "fabric_matrix": {"Simple pillow": 0.6, "Diamond quilted pillow": 0.7, "Diamond with pipen quilted pillow": 0.7, "Belt overlapping pillow": 1.5, "Tassels with pillow": 0.6, "Tassels without pillow": 0.6}}'::jsonb, 1),
    ('20 in X 20 in', '{"price_matrix": {"Simple pillow": 1500, "Diamond quilted pillow": 4000, "Diamond with pipen quilted pillow": 4000, "Belt overlapping pillow": 4500, "Tassels with pillow": 3000, "Tassels without pillow": 3000}, "fabric_matrix": {"Simple pillow": 0.7, "Diamond quilted pillow": 0.8, "Diamond with pipen quilted pillow": 0.8, "Belt overlapping pillow": 1.5, "Tassels with pillow": 0.7, "Tassels without pillow": 0.7}}'::jsonb, 2),
    ('16 in X 24 in', '{"price_matrix": {"Simple pillow": 1500, "Diamond quilted pillow": 4000, "Diamond with pipen quilted pillow": 4000, "Belt overlapping pillow": 4500, "Tassels with pillow": 3000, "Tassels without pillow": 3000}, "fabric_matrix": {"Simple pillow": 0.8, "Diamond quilted pillow": 0.9, "Diamond with pipen quilted pillow": 0.9, "Belt overlapping pillow": 2.0, "Tassels with pillow": 0.8, "Tassels without pillow": 0.8}}'::jsonb, 3)
)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata)
SELECT 'arm_chairs', 'pillow_size', size, size, sort_order, true, metadata
FROM pillow_sizes
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('arm_chairs', 'pillow_fabric_plan', 'Single Colour', 'Single Colour', 1, true, '{"default": true}'),
  ('arm_chairs', 'pillow_fabric_plan', 'Dual Colour', 'Dual Colour', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('arm_chairs', 'discount_approver', 'Sales Executive', 'Sales Executive', 1, true, '{}'),
  ('arm_chairs', 'discount_approver', 'Store Manager', 'Store Manager', 2, true, '{}'),
  ('arm_chairs', 'discount_approver', 'Sales Head', 'Sales Head', 3, true, '{}'),
  ('arm_chairs', 'discount_approver', 'Director', 'Director', 4, true, '{"default": true}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

WITH discount_codes(code, percentage, sort_order) AS (
  VALUES
    ('EVIP', 0.01, 1),
    ('EVIP2', 0.02, 2),
    ('EVIP3', 0.03, 3),
    ('EVIP4', 0.04, 4),
    ('EVIP5', 0.05, 5),
    ('EVIP6', 0.06, 6),
    ('EVIP7', 0.07, 7),
    ('EVIP8', 0.08, 8),
    ('EVIP9', 0.09, 9),
    ('EVIP10', 0.10, 10),
    ('EVIP11', 0.11, 11),
    ('EVIP12', 0.12, 12),
    ('EVIP13', 0.13, 13),
    ('EVIP14', 0.14, 14),
    ('EVIP15', 0.15, 15)
)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata)
SELECT 'arm_chairs', 'discount_code', code, code, sort_order, true, jsonb_build_object('percentage', percentage)
FROM discount_codes
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

SELECT field_name, COUNT(*) AS options
FROM dropdown_options
WHERE category = 'arm_chairs'
  AND field_name IN (
    'fabric_cladding_plan',
    'seat_width',
    'seat_depth',
    'seat_height',
    'leg_type',
    'pillow_type',
    'pillow_size',
    'pillow_fabric_plan',
    'discount_approver',
    'discount_code'
  )
GROUP BY field_name
ORDER BY field_name;
