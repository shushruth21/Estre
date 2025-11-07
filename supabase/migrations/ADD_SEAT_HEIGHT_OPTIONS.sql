-- Add Seat Height options for Sofa category
-- This migration adds seat height dropdown options: 16 in, 18 in, 20 in

INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'seat_height', '16', '16 in', 1, true, '{"default": false}'),
('sofa', 'seat_height', '18', '18 in', 2, true, '{"default": true}'),
('sofa', 'seat_height', '20', '20 in', 3, true, '{"default": false}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET 
  display_label = EXCLUDED.display_label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata;

-- Verification query
SELECT category, field_name, option_value, display_label, sort_order, is_active 
FROM dropdown_options 
WHERE category = 'sofa' AND field_name = 'seat_height'
ORDER BY sort_order;

