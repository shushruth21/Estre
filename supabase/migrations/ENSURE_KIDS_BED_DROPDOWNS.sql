INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('kids_bed', 'fabric_cladding_plan', 'Single Colour', 'Single Colour', 1, true, '{"default": true}'),
  ('kids_bed', 'fabric_cladding_plan', 'Multi Colour', 'Multi Colour', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('kids_bed', 'storage_required', 'Yes', 'Yes', 1, true, '{}'),
  ('kids_bed', 'storage_required', 'No', 'No', 2, true, '{"default": true}'),
  ('kids_bed', 'storage_type', 'Box Storage', 'Box Storage', 1, true, '{}'),
  ('kids_bed', 'storage_type', 'Side Drawer', 'Side Drawer', 2, true, '{}'),
  ('kids_bed', 'box_storage_type', 'Manual', 'Manual', 1, true, '{}'),
  ('kids_bed', 'box_storage_type', 'Hydraulic / Electric', 'Hydraulic / Electric', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

WITH legs(name, metadata) AS (
  VALUES
    ('Cylinder Leg', '{"sizes": ["3 in", "4 in", "6 in"]}'::jsonb),
    ('Kulfi Leg-Gold', '{"sizes": ["4 in", "6 in", "8 in", "10 in"]}'::jsonb),
    ('Kulfi Leg-Black & Gold', '{"sizes": ["4 in", "6 in", "8 in", "10 in"]}'::jsonb),
    ('Kulfi Leg-Rose Gold', '{"sizes": ["4 in", "6 in", "8 in", "10 in"]}'::jsonb),
    ('Petriaz Leg-Gold', '{"sizes": ["4 in", "6 in"]}'::jsonb),
    ('Petriaz Leg-Rose Gold', '{"sizes": ["4 in", "6 in"]}'::jsonb),
    ('Aurora Leg', '{"sizes": ["5 in", "6 in"]}'::jsonb),
    ('Petriaz Leg-Chrome Finish', '{"sizes": ["4 in", "5 in"]}'::jsonb)
)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata)
SELECT 'kids_bed', 'leg_type', name, name, row_number() OVER (ORDER BY name), true, metadata
FROM legs
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('kids_bed', 'discount_approver', 'Sales Executive', 'Sales Executive', 1, true, '{}'),
  ('kids_bed', 'discount_approver', 'Store Manager', 'Store Manager', 2, true, '{}'),
  ('kids_bed', 'discount_approver', 'Sales Head', 'Sales Head', 3, true, '{}'),
  ('kids_bed', 'discount_approver', 'Director', 'Director', 4, true, '{"default": true}')
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
SELECT 'kids_bed', 'discount_code', code, code, sort_order, true, jsonb_build_object('percentage', percentage)
FROM discount_codes
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

SELECT field_name, COUNT(*) AS options
FROM dropdown_options
WHERE category = 'kids_bed'
  AND field_name IN (
    'fabric_cladding_plan',
    'storage_required',
    'storage_type',
    'box_storage_type',
    'leg_type',
    'discount_approver',
    'discount_code'
  )
GROUP BY field_name
ORDER BY field_name;
