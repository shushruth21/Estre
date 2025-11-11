INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('dining_chairs', 'fabric_cladding_plan', 'Single Colour', 'Single Colour', 1, true, '{"default": true}'),
  ('dining_chairs', 'fabric_cladding_plan', 'Dual Colour', 'Dual Colour', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('dining_chairs', 'seat_width', '22 in', '22 in', 1, true, '{}'),
  ('dining_chairs', 'seat_width', '24 in', '24 in', 2, true, '{}'),
  ('dining_chairs', 'seat_width', '26 in', '26 in', 3, true, '{}'),
  ('dining_chairs', 'seat_width', '30 in', '30 in', 4, true, '{}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('dining_chairs', 'seat_depth', '22 in', '22 in', 1, true, '{}'),
  ('dining_chairs', 'seat_depth', '24 in', '24 in', 2, true, '{}'),
  ('dining_chairs', 'seat_depth', '26 in', '26 in', 3, true, '{}'),
  ('dining_chairs', 'seat_depth', '30 in', '30 in', 4, true, '{}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('dining_chairs', 'seat_height', '16 in', '16 in', 1, true, '{}'),
  ('dining_chairs', 'seat_height', '18 in', '18 in', 2, true, '{"default": true}'),
  ('dining_chairs', 'seat_height', '20 in', '20 in', 3, true, '{}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('dining_chairs', 'leg_type', 'Kulfi Leg-Brown with Gold', 'Kulfi Leg-Brown with Gold', 1, true, '{"size": "16 in"}'),
  ('dining_chairs', 'leg_type', 'Kulfi Leg-Cream with Gold', 'Kulfi Leg-Cream with Gold', 2, true, '{"size": "16 in"}'),
  ('dining_chairs', 'leg_type', 'Kulfi Leg-Black', 'Kulfi Leg-Black', 3, true, '{"size": "16 in"}'),
  ('dining_chairs', 'leg_type', 'Kulfi Leg-Black with Gold', 'Kulfi Leg-Black with Gold', 4, true, '{"size": "16 in"}'),
  ('dining_chairs', 'leg_type', 'Kulfi Leg-Gold', 'Kulfi Leg-Gold', 5, true, '{"size": "16 in"}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('dining_chairs', 'discount_approver', 'Sales Executive', 'Sales Executive', 1, true, '{}'),
  ('dining_chairs', 'discount_approver', 'Store Manager', 'Store Manager', 2, true, '{}'),
  ('dining_chairs', 'discount_approver', 'Sales Head', 'Sales Head', 3, true, '{}'),
  ('dining_chairs', 'discount_approver', 'Director', 'Director', 4, true, '{"default": true}')
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
SELECT 'dining_chairs', 'discount_code', code, code, sort_order, true, jsonb_build_object('percentage', percentage)
FROM discount_codes
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

SELECT field_name, COUNT(*) AS options
FROM dropdown_options
WHERE category = 'dining_chairs'
  AND field_name IN ('fabric_cladding_plan', 'seat_width', 'seat_depth', 'seat_height', 'leg_type', 'discount_approver', 'discount_code')
GROUP BY field_name
ORDER BY field_name;
