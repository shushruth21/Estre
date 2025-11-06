-- ============================================================================
-- ADD MISSING SOFA DROPDOWN FIELDS
-- This adds the front_seat_count field that the SofaConfigurator expects
-- ============================================================================

-- Front Seat Count (was missing from original migration)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'front_seat_count', '1-Seater', '1-Seater', 1, true, '{}'),
('sofa', 'front_seat_count', '2-Seater', '2-Seater', 2, true, '{"default": true}'),
('sofa', 'front_seat_count', '3-Seater', '3-Seater', 3, true, '{}'),
('sofa', 'front_seat_count', '4-Seater', '4-Seater', 4, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- Verify the field was added
SELECT 
  field_name,
  COUNT(*) as option_count,
  STRING_AGG(option_value, ', ' ORDER BY sort_order) as options
FROM dropdown_options 
WHERE category = 'sofa' AND field_name = 'front_seat_count' AND is_active = true
GROUP BY field_name;

