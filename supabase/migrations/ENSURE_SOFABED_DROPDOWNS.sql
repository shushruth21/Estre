-- Ensure sofabed dropdown options exist
-- This migration is idempotent

-- Base Shapes
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofabed', 'base_shape', 'STANDARD', 'Standard', 1, true, '{"default": true}'),
('sofabed', 'base_shape', 'L SHAPE', 'L Shape', 2, true, '{}'),
('sofabed', 'base_shape', 'U SHAPE', 'U Shape', 3, true, '{}'),
('sofabed', 'base_shape', 'COMBO', 'Combo', 4, true, '{}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata;

-- Seat Types
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofabed', 'seat_type', '2-Seater', '2-Seater', 1, true, '{"default": true}'),
('sofabed', 'seat_type', '3-Seater', '3-Seater', 2, true, '{}'),
('sofabed', 'seat_type', '4-Seater', '4-Seater', 3, true, '{}'),
('sofabed', 'seat_type', '2-Seater No Mech', '2-Seater No Mech', 4, true, '{}'),
('sofabed', 'seat_type', '3-Seater No Mech', '3-Seater No Mech', 5, true, '{}'),
('sofabed', 'seat_type', '4-Seater No Mech', '4-Seater No Mech', 6, true, '{}'),
('sofabed', 'seat_type', 'Corner', 'Corner', 7, true, '{}'),
('sofabed', 'seat_type', 'Backrest', 'Backrest', 8, true, '{}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata;

-- Seat Depth Options
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofabed', 'seat_depth', '22', '22 inches', 1, true, '{"default": true, "upgrade_percent": 0}'),
('sofabed', 'seat_depth', '23', '23 inches', 2, true, '{"upgrade_percent": 0}'),
('sofabed', 'seat_depth', '24', '24 inches', 3, true, '{"upgrade_percent": 0}'),
('sofabed', 'seat_depth', '25', '25 inches', 4, true, '{"upgrade_percent": 0}'),
('sofabed', 'seat_depth', '26', '26 inches', 5, true, '{"upgrade_percent": 0.03}'),
('sofabed', 'seat_depth', '27', '27 inches', 6, true, '{"upgrade_percent": 0.03}'),
('sofabed', 'seat_depth', '28', '28 inches', 7, true, '{"upgrade_percent": 0.06}'),
('sofabed', 'seat_depth', '29', '29 inches', 8, true, '{"upgrade_percent": 0.06}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata;

-- Seat Width Options
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofabed', 'seat_width', '22', '22 inches', 1, true, '{"default": true, "upgrade_percent": 0}'),
('sofabed', 'seat_width', '23', '23 inches', 2, true, '{"upgrade_percent": 0}'),
('sofabed', 'seat_width', '24', '24 inches', 3, true, '{"upgrade_percent": 0}'),
('sofabed', 'seat_width', '25', '25 inches', 4, true, '{"upgrade_percent": 0}'),
('sofabed', 'seat_width', '26', '26 inches', 5, true, '{"upgrade_percent": 0.065}'),
('sofabed', 'seat_width', '27', '27 inches', 6, true, '{"upgrade_percent": 0.065}'),
('sofabed', 'seat_width', '30', '30 inches', 7, true, '{"upgrade_percent": 0.195}'),
('sofabed', 'seat_width', '31', '31 inches', 8, true, '{"upgrade_percent": 0.195}')
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
  AND field_name IN ('base_shape', 'seat_type', 'seat_width', 'seat_depth')
  AND is_active = true
GROUP BY field_name
ORDER BY field_name;

