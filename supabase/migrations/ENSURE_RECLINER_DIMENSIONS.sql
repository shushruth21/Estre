-- Ensure recliner dimension options exist
-- This migration is idempotent (can be run multiple times safely)

-- Seat Depth Options
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('recliner', 'seat_depth', '22', '22 inches', 1, true, '{"default": true, "upgrade_percent": 0}'),
('recliner', 'seat_depth', '24', '24 inches', 2, true, '{"upgrade_percent": 0}'),
('recliner', 'seat_depth', '26', '26 inches', 3, true, '{"upgrade_percent": 3}'),
('recliner', 'seat_depth', '28', '28 inches', 4, true, '{"upgrade_percent": 6}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata;

-- Seat Width Options
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('recliner', 'seat_width', '22', '22 inches', 1, true, '{"default": true, "upgrade_percent": 0}'),
('recliner', 'seat_width', '24', '24 inches', 2, true, '{"upgrade_percent": 0}'),
('recliner', 'seat_width', '26', '26 inches', 3, true, '{"upgrade_percent": 6.5}'),
('recliner', 'seat_width', '28', '28 inches', 4, true, '{"upgrade_percent": 13}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata;

-- Seat Height Options
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('recliner', 'seat_height', '16', '16 inches', 1, true, '{"default": true}'),
('recliner', 'seat_height', '18', '18 inches', 2, true, '{}'),
('recliner', 'seat_height', '20', '20 inches', 3, true, '{}')
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
WHERE category = 'recliner' 
  AND field_name IN ('seat_depth', 'seat_width', 'seat_height')
  AND is_active = true
GROUP BY field_name
ORDER BY field_name;

