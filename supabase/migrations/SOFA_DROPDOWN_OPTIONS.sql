-- ============================================================================
-- SOFA DROPDOWN OPTIONS
-- This migration populates all dropdown options for sofa configurator
-- All options are database-driven with NO hardcoded values
-- ============================================================================

-- Clear existing sofa dropdown options
DELETE FROM dropdown_options WHERE category = 'sofa';

-- ============================================================================
-- SHAPE OPTIONS
-- ============================================================================
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'shape', 'Standard', 'Standard', 1, true, '{"default": true}'),
('sofa', 'shape', 'L-Shape', 'L-Shape', 2, true, '{}'),
('sofa', 'shape', 'U-Shape', 'U-Shape', 3, true, '{}');

-- ============================================================================
-- FRONT SEAT COUNT
-- ============================================================================
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'front_seat_count', '1-Seater', '1-Seater', 1, true, '{}'),
('sofa', 'front_seat_count', '2-Seater', '2-Seater', 2, true, '{"default": true}'),
('sofa', 'front_seat_count', '3-Seater', '3-Seater', 3, true, '{}'),
('sofa', 'front_seat_count', '4-Seater', '4-Seater', 4, true, '{}');

-- ============================================================================
-- CONSOLE SIZES (if not already in common)
-- ============================================================================
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'console_size', '6"', '6 inches', 1, true, '{"default": true, "width_inches": 6}'),
('sofa', 'console_size', '10"', '10 inches', 2, true, '{"width_inches": 10}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- ============================================================================
-- LOUNGER SIZES
-- ============================================================================
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'lounger_size', '6ft', '6 feet', 1, true, '{"default": true}'),
('sofa', 'lounger_size', 'additional_6', 'Additional 6 feet', 2, true, '{}');

-- ============================================================================
-- FOAM TYPES (if not already in common, use common for sofa)
-- ============================================================================
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'foam_type', 'Firm', 'Firm', 1, true, '{"default": true, "price_adjustment": 0}'),
('sofa', 'foam_type', 'Soft', 'Soft', 2, true, '{"price_adjustment": 0}'),
('sofa', 'foam_type', 'Super Soft', 'Super Soft', 3, true, '{"price_adjustment": 0}'),
('sofa', 'foam_type', 'Latex Foam', 'Latex Foam', 4, true, '{"price_adjustment": 4000, "upgrade": true}'),
('sofa', 'foam_type', 'Memory Foam', 'Memory Foam', 5, true, '{"price_adjustment": 3000, "upgrade": true}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- ============================================================================
-- SEAT DEPTH OPTIONS
-- ============================================================================
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'seat_depth', '22 in', '22 inches', 1, true, '{"default": true, "percentage": 0}'),
('sofa', 'seat_depth', '24 in', '24 inches', 2, true, '{"percentage": 0}'),
('sofa', 'seat_depth', '26 in', '26 inches', 3, true, '{"percentage": 3}'),
('sofa', 'seat_depth', '28 in', '28 inches', 4, true, '{"percentage": 6}');

-- ============================================================================
-- SEAT WIDTH OPTIONS
-- ============================================================================
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'seat_width', '22 in', '22 inches', 1, true, '{"default": true, "percentage": 0}'),
('sofa', 'seat_width', '24 in', '24 inches', 2, true, '{"percentage": 0}'),
('sofa', 'seat_width', '26 in', '26 inches', 3, true, '{"percentage": 6.5}'),
('sofa', 'seat_width', '30 in', '30 inches', 4, true, '{"percentage": 19.5}');

-- ============================================================================
-- LEG TYPES
-- ============================================================================
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'leg_type', 'Standard', 'Standard Legs', 1, true, '{"default": true}'),
('sofa', 'leg_type', 'Premium', 'Premium Legs', 2, true, '{"upgrade": true}'),
('sofa', 'leg_type', 'Walnut', 'Walnut Finish', 3, true, '{"upgrade": true}'),
('sofa', 'leg_type', 'Chrome', 'Chrome Finish', 4, true, '{"upgrade": true}');

-- ============================================================================
-- WOOD TYPES
-- ============================================================================
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'wood_type', 'Pine', 'Pine', 1, true, '{"default": true}'),
('sofa', 'wood_type', 'Walnut', 'Walnut', 2, true, '{"upgrade": true}'),
('sofa', 'wood_type', 'Oak', 'Oak', 3, true, '{"upgrade": true}'),
('sofa', 'wood_type', 'Teak', 'Teak', 4, true, '{"upgrade": true}');

-- ============================================================================
-- STITCH TYPES
-- ============================================================================
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'stitch_type', 'Plain seam', 'Plain seam', 1, true, '{"default": true, "description": "Professional quality finish"}'),
('sofa', 'stitch_type', 'Top stitch', 'Top stitch', 2, true, '{"description": "Professional quality finish"}'),
('sofa', 'stitch_type', 'Double top stitch', 'Double top stitch', 3, true, '{"description": "Professional quality finish"}'),
('sofa', 'stitch_type', 'Piping/corded seam', 'Piping/corded seam', 4, true, '{"description": "Professional quality finish"}'),
('sofa', 'stitch_type', 'French seam', 'French seam', 5, true, '{"description": "Professional quality finish"}'),
('sofa', 'stitch_type', 'Felled seam/Double stitched seam', 'Felled seam/Double stitched seam', 6, true, '{"description": "Professional quality finish"}');

