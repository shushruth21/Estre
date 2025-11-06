-- ============================================================================
-- ADD SOFA SHAPE-SPECIFIC LOGIC FIELDS
-- These fields support conditional logic based on shape selection
-- ============================================================================

-- L1 Option (for L Shape, U Shape, Combo)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'l1_option', 'Backrest', 'Backrest', 1, true, '{"default": true}'),
('sofa', 'l1_option', 'Corner', 'Corner', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- R1 Option (for U Shape, Combo)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'r1_option', 'Backrest', 'Backrest', 1, true, '{"default": true}'),
('sofa', 'r1_option', 'Corner', 'Corner', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- L2 Number of Seats (LHS - Left Hand Side)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'l2_seat_count', '1', '1 Seat', 1, true, '{}'),
('sofa', 'l2_seat_count', '2', '2 Seats', 2, true, '{"default": true}'),
('sofa', 'l2_seat_count', '3', '3 Seats', 3, true, '{}'),
('sofa', 'l2_seat_count', '4', '4 Seats', 4, true, '{}'),
('sofa', 'l2_seat_count', '5', '5 Seats', 5, true, '{}'),
('sofa', 'l2_seat_count', '6', '6 Seats', 6, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- R2 Number of Seats (RHS - Right Hand Side)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'r2_seat_count', '1', '1 Seat', 1, true, '{}'),
('sofa', 'r2_seat_count', '2', '2 Seats', 2, true, '{"default": true}'),
('sofa', 'r2_seat_count', '3', '3 Seats', 3, true, '{}'),
('sofa', 'r2_seat_count', '4', '4 Seats', 4, true, '{}'),
('sofa', 'r2_seat_count', '5', '5 Seats', 5, true, '{}'),
('sofa', 'r2_seat_count', '6', '6 Seats', 6, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- Verify the fields were added
SELECT 
  field_name,
  COUNT(*) as option_count
FROM dropdown_options 
WHERE category = 'sofa' 
AND field_name IN ('l1_option', 'r1_option', 'l2_seat_count', 'r2_seat_count')
AND is_active = true
GROUP BY field_name
ORDER BY field_name;

