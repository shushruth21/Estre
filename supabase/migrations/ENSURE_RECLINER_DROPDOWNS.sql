-- ============================================================================
-- ENSURE RECLINER DROPDOWN OPTIONS
-- ============================================================================
-- This migration is idempotent. It inserts (or updates) the core dropdown
-- options needed by the Recliner configurator so that the UI has fully
-- dynamic, database-driven options.
-- ============================================================================

-- Clean up any legacy shapes (e.g., U SHAPE / COMBO) that shouldn't be active
DELETE FROM dropdown_options
WHERE category = 'recliner'
  AND field_name = 'base_shape'
  AND option_value IN ('U SHAPE', 'COMBO');

-- ---------------------------------------------------------------------------
-- Base Shapes (only STANDARD and L SHAPE are valid for recliner)
-- ---------------------------------------------------------------------------
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('recliner', 'base_shape', 'STANDARD', 'Standard', 1, true, '{"default": true, "sections": ["F"]}'),
  ('recliner', 'base_shape', 'L SHAPE', 'L Shape', 2, true, '{"sections": ["F", "L1", "L2"]}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

-- ---------------------------------------------------------------------------
-- Seat Types
-- ---------------------------------------------------------------------------
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('recliner', 'seat_type', '1-Seater', '1-Seater', 1, true, '{"default": true}'),
  ('recliner', 'seat_type', '2-Seater', '2-Seater', 2, true, '{}'),
  ('recliner', 'seat_type', '3-Seater', '3-Seater', 3, true, '{}'),
  ('recliner', 'seat_type', '4-Seater', '4-Seater', 4, true, '{}'),
  ('recliner', 'seat_type', 'Corner', 'Corner', 5, true, '{}'),
  ('recliner', 'seat_type', 'Backrest', 'Backrest', 6, true, '{}'),
  ('recliner', 'seat_type', 'none', 'None', 99, true, '{}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

-- ---------------------------------------------------------------------------
-- Mechanism Types (with pricing metadata)
-- ---------------------------------------------------------------------------
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('recliner', 'mechanism_type', 'Manual', 'Manual', 1, true, '{"price": 0, "default": true}'),
  ('recliner', 'mechanism_type', 'Manual-RRR', 'Manual-RRR', 2, true, '{"price": 6800}'),
  ('recliner', 'mechanism_type', 'Electrical', 'Electrical', 3, true, '{"price": 14500}'),
  ('recliner', 'mechanism_type', 'Electrical-RRR', 'Electrical-RRR', 4, true, '{"price": 16500}'),
  ('recliner', 'mechanism_type', 'Only Sofa', 'Only Sofa', 5, true, '{"price": 0}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

-- ---------------------------------------------------------------------------
-- Seat Depth Options (upgrade percentage stored in metadata)
-- ---------------------------------------------------------------------------
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('recliner', 'seat_depth', '22', '22 inches', 1, true, '{"default": true, "upgrade_percent": 0}'),
  ('recliner', 'seat_depth', '24', '24 inches', 2, true, '{"upgrade_percent": 0}'),
  ('recliner', 'seat_depth', '26', '26 inches', 3, true, '{"upgrade_percent": 3}'),
  ('recliner', 'seat_depth', '28', '28 inches', 4, true, '{"upgrade_percent": 6}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

-- ---------------------------------------------------------------------------
-- Seat Width Options (upgrade percentage stored in metadata)
-- ---------------------------------------------------------------------------
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('recliner', 'seat_width', '22', '22 inches', 1, true, '{"default": true, "upgrade_percent": 0}'),
  ('recliner', 'seat_width', '24', '24 inches', 2, true, '{"upgrade_percent": 0}'),
  ('recliner', 'seat_width', '26', '26 inches', 3, true, '{"upgrade_percent": 6.5}'),
  ('recliner', 'seat_width', '28', '28 inches', 4, true, '{"upgrade_percent": 13}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

-- ---------------------------------------------------------------------------
-- Seat Height Options
-- ---------------------------------------------------------------------------
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('recliner', 'seat_height', '16', '16 inches', 1, true, '{"default": true}'),
  ('recliner', 'seat_height', '18', '18 inches', 2, true, '{}'),
  ('recliner', 'seat_height', '20', '20 inches', 3, true, '{}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order    = EXCLUDED.sort_order,
  is_active     = EXCLUDED.is_active,
  metadata      = EXCLUDED.metadata;

-- ---------------------------------------------------------------------------
-- Verification query (safe to run in migration output)
-- ---------------------------------------------------------------------------
SELECT field_name,
       COUNT(*)        AS option_count,
       STRING_AGG(option_value, ', ' ORDER BY sort_order) AS options
FROM dropdown_options
WHERE category = 'recliner'
  AND field_name IN ('base_shape', 'seat_type', 'mechanism_type', 'seat_depth', 'seat_width', 'seat_height')
  AND is_active = true
GROUP BY field_name
ORDER BY field_name;

