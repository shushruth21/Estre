-- ============================================================================
-- ENSURE FRONT SEAT COUNT OPTIONS (1-4) EXIST
-- This migration ensures front_seat_count dropdown options are available
-- ============================================================================

-- Insert front seat count options (1-Seater to 4-Seater)
-- Only inserts if they don't already exist (idempotent)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'front_seat_count', '1-Seater', '1-Seater', 1, true, '{}'),
('sofa', 'front_seat_count', '2-Seater', '2-Seater', 2, true, '{"default": true}'),
('sofa', 'front_seat_count', '3-Seater', '3-Seater', 3, true, '{}'),
('sofa', 'front_seat_count', '4-Seater', '4-Seater', 4, true, '{}')
ON CONFLICT (category, field_name, option_value) 
DO UPDATE SET
  display_label = EXCLUDED.display_label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata;

-- Verify the options were inserted/updated
SELECT 
  field_name,
  option_value,
  display_label,
  sort_order,
  is_active
FROM dropdown_options 
WHERE category = 'sofa' 
  AND field_name = 'front_seat_count' 
  AND is_active = true
ORDER BY sort_order;

-- Expected output: 4 rows (1-Seater, 2-Seater, 3-Seater, 4-Seater)

