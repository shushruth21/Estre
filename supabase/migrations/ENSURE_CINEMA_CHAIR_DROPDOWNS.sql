-- ============================================================================
-- ENSURE CINEMA CHAIRS DROPDOWN OPTIONS
-- ============================================================================
-- Seeds the dropdown_options table with all entries required by the Cinema
-- Chairs configurator. The migration is idempotent and can be re-run safely.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Seat Count / Seater Types
-- ---------------------------------------------------------------------------
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('cinema_chairs', 'seat_count', '1-Seater', '1-Seater', 1, true, '{"default": true}'),
  ('cinema_chairs', 'seat_count', '2-Seater', '2-Seater', 2, true, '{}'),
  ('cinema_chairs', 'seat_count', '3-Seater', '3-Seater', 3, true, '{}'),
  ('cinema_chairs', 'seat_count', '4-Seater', '4-Seater', 4, true, '{}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

-- ---------------------------------------------------------------------------
-- Mechanism Types
-- ---------------------------------------------------------------------------
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('cinema_chairs', 'mechanism_type', 'Single Motor', 'Single Motor', 1, true, '{"price_per_seat": 0, "default": true}'),
  ('cinema_chairs', 'mechanism_type', 'Dual Motor', 'Dual Motor', 2, true, '{"price_per_seat": 28000}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

-- ---------------------------------------------------------------------------
-- Seat Width Options
-- ---------------------------------------------------------------------------
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('cinema_chairs', 'seat_width', '22 In', '22 In', 1, true, '{"default": true, "width_multiplier": 0}'),
  ('cinema_chairs', 'seat_width', '24 In', '24 In', 2, true, '{"width_multiplier": 0}'),
  ('cinema_chairs', 'seat_width', '28 In', '28 In', 3, true, '{"width_multiplier": 0.13}'),
  ('cinema_chairs', 'seat_width', '30 In', '30 In', 4, true, '{"width_multiplier": 0.195}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

-- ---------------------------------------------------------------------------
-- Seat Depth Options
-- ---------------------------------------------------------------------------
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('cinema_chairs', 'seat_depth', '22 in', '22 in', 1, true, '{"default": true, "depth_multiplier": 0}'),
  ('cinema_chairs', 'seat_depth', '24 in', '24 in', 2, true, '{"depth_multiplier": 0}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

-- ---------------------------------------------------------------------------
-- Seat Height Options
-- ---------------------------------------------------------------------------
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('cinema_chairs', 'seat_height', '18 in', '18 in', 1, true, '{"default": true}'),
  ('cinema_chairs', 'seat_height', '20 in', '20 in', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

-- ---------------------------------------------------------------------------
-- Cladding Plan Options
-- ---------------------------------------------------------------------------
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('cinema_chairs', 'cladding_plan', 'Single Colour', 'Single Colour', 1, true, '{"default": true}'),
  ('cinema_chairs', 'cladding_plan', 'Dual Colour', 'Dual Colour', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

-- ---------------------------------------------------------------------------
-- Leg Types
-- ---------------------------------------------------------------------------
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('cinema_chairs', 'leg_type', 'Cylinder Leg (3 in)', 'Cylinder Leg (3 in)', 1, true, '{}'),
  ('cinema_chairs', 'leg_type', 'Cylinder Leg (4 in)', 'Cylinder Leg (4 in)', 2, true, '{}'),
  ('cinema_chairs', 'leg_type', 'Kulfi Leg-Gold (4 in)', 'Kulfi Leg-Gold (4 in)', 3, true, '{}'),
  ('cinema_chairs', 'leg_type', 'Kulfi Leg-Black & Gold (4 in)', 'Kulfi Leg-Black & Gold (4 in)', 4, true, '{}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

-- ---------------------------------------------------------------------------
-- Wood Options
-- ---------------------------------------------------------------------------
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('cinema_chairs', 'wood_type', 'Pine (Default)', 'Pine (Default)', 1, true, '{"default": true}'),
  ('cinema_chairs', 'wood_type', 'Teak', 'Teak', 2, true, '{}'),
  ('cinema_chairs', 'wood_type', 'Sheesham', 'Sheesham', 3, true, '{}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

-- ---------------------------------------------------------------------------
-- Headrest Options
-- ---------------------------------------------------------------------------
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('cinema_chairs', 'headrest_option', 'Yes', 'Yes', 1, true, '{"default": true}'),
  ('cinema_chairs', 'headrest_option', 'No', 'No', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

-- ---------------------------------------------------------------------------
-- Verification Query
-- ---------------------------------------------------------------------------
SELECT field_name,
       COUNT(*)        AS option_count,
       STRING_AGG(option_value, ', ' ORDER BY sort_order) AS options
FROM dropdown_options
WHERE category = 'cinema_chairs'
  AND field_name IN (
    'seat_count',
    'mechanism_type',
    'seat_width',
    'seat_depth',
    'seat_height',
    'cladding_plan',
    'leg_type',
    'wood_type',
    'headrest_option'
  )
  AND is_active = true
GROUP BY field_name
ORDER BY field_name;

