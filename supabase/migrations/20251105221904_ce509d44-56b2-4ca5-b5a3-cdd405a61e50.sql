-- ============================================================================
-- PHASE 6: POPULATE DROPDOWN OPTIONS FOR ALL CATEGORIES
-- Eliminates all hardcoded values from configurators
-- ============================================================================

-- Clear existing test data
DELETE FROM dropdown_options WHERE category IN ('recliner', 'bed', 'cinema_chairs', 'dining_chairs', 'arm_chairs', 'benches', 'kids_bed', 'sofabed');

-- ============================================================================
-- COMMON OPTIONS (Used across multiple categories)
-- ============================================================================

-- Foam Types (All categories)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('common', 'foam_type', 'Firm', 'Firm', 1, true, '{"default": true, "price_adjustment": 0}'),
('common', 'foam_type', 'Soft', 'Soft', 2, true, '{"price_adjustment": 0}'),
('common', 'foam_type', 'Super Soft', 'Super Soft', 3, true, '{"price_adjustment": 0}'),
('common', 'foam_type', 'Latex', 'Latex', 4, true, '{"price_adjustment": 500, "upgrade": true}'),
('common', 'foam_type', 'Memory', 'Memory Foam', 5, true, '{"price_adjustment": 800, "upgrade": true}');

-- Console Sizes (Sofa, Recliner, Cinema Chairs)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('common', 'console_size', '6"', '6 inches', 1, true, '{"default": true, "width_inches": 6}'),
('common', 'console_size', '10"', '10 inches', 2, true, '{"width_inches": 10}');

-- ============================================================================
-- RECLINER SPECIFIC OPTIONS
-- ============================================================================

-- Base Shapes
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('recliner', 'base_shape', 'STANDARD', 'Standard', 1, true, '{"default": true, "sections": ["front"]}'),
('recliner', 'base_shape', 'L SHAPE', 'L Shape', 2, true, '{"sections": ["front", "left"]}');

-- Seat Types
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('recliner', 'seat_type', '1-Seater', '1-Seater', 1, true, '{"width_inches": 22}'),
('recliner', 'seat_type', '2-Seater', '2-Seater', 2, true, '{"width_inches": 44}'),
('recliner', 'seat_type', '3-Seater', '3-Seater', 3, true, '{"width_inches": 66}'),
('recliner', 'seat_type', 'Corner', 'Corner Seat', 4, true, '{"width_inches": 30}');

-- Mechanism Types
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('recliner', 'mechanism_type', 'Manual', 'Manual', 1, true, '{"default": true, "price_adjustment": 0}'),
('recliner', 'mechanism_type', 'Manual-RRR', 'Manual RRR', 2, true, '{"price_adjustment": 1000}'),
('recliner', 'mechanism_type', 'Electric', 'Electric', 3, true, '{"price_adjustment": 3000}'),
('recliner', 'mechanism_type', 'Electric-RRR', 'Electric RRR', 4, true, '{"price_adjustment": 4000}'),
('recliner', 'mechanism_type', 'Only Sofa', 'Sofa Only (No Recline)', 5, true, '{"price_adjustment": -500}');

-- Recliner Dimensions
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('recliner', 'seat_depth', '22', '22 inches', 1, true, '{"default": true, "price_adjustment": 0}'),
('recliner', 'seat_depth', '24', '24 inches', 2, true, '{"price_adjustment": 200}'),
('recliner', 'seat_depth', '26', '26 inches', 3, true, '{"price_adjustment": 400}'),
('recliner', 'seat_depth', '28', '28 inches', 4, true, '{"price_adjustment": 600}'),
('recliner', 'seat_width', '22', '22 inches', 1, true, '{"default": true, "price_adjustment": 0}'),
('recliner', 'seat_width', '24', '24 inches', 2, true, '{"price_adjustment": 200}'),
('recliner', 'seat_width', '26', '26 inches', 3, true, '{"price_adjustment": 400}'),
('recliner', 'seat_width', '30', '30 inches', 4, true, '{"price_adjustment": 800}'),
('recliner', 'seat_height', '16', '16 inches', 1, true, '{"default": true, "price_adjustment": 0}'),
('recliner', 'seat_height', '18', '18 inches', 2, true, '{"price_adjustment": 100}'),
('recliner', 'seat_height', '20', '20 inches', 3, true, '{"price_adjustment": 200}');

-- ============================================================================
-- BED SPECIFIC OPTIONS
-- ============================================================================

-- Bed Sizes
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('bed', 'bed_size', 'Single', 'Single', 1, true, '{"default": true, "width_inches": 36, "length_inches": 72}'),
('bed', 'bed_size', 'Double', 'Double', 2, true, '{"width_inches": 54, "length_inches": 75}'),
('bed', 'bed_size', 'Queen', 'Queen', 3, true, '{"width_inches": 60, "length_inches": 78}'),
('bed', 'bed_size', 'King', 'King', 4, true, '{"width_inches": 72, "length_inches": 80}');

-- Storage Types
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('bed', 'storage_type', 'Hydraulic', 'Hydraulic Lift', 1, true, '{"default": true, "price_adjustment": 2000}'),
('bed', 'storage_type', 'Box', 'Box Storage', 2, true, '{"price_adjustment": 1500}'),
('bed', 'storage_type', 'Drawer', 'Drawer Storage', 3, true, '{"price_adjustment": 2500}');

-- Mattress Support Types
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('bed', 'mattress_support', 'Slat', 'Slat Support', 1, true, '{"default": true, "price_adjustment": 0}'),
('bed', 'mattress_support', 'Solid', 'Solid Base', 2, true, '{"price_adjustment": 500}');

-- Bed Dimensions
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('bed', 'bed_length', '72', '72 inches (6 ft)', 1, true, '{"default": true, "price_adjustment": 0}'),
('bed', 'bed_length', '75', '75 inches (6.25 ft)', 2, true, '{"price_adjustment": 300}'),
('bed', 'bed_length', '78', '78 inches (6.5 ft)', 3, true, '{"price_adjustment": 600}'),
('bed', 'bed_length', '80', '80 inches (6.67 ft)', 4, true, '{"price_adjustment": 800}'),
('bed', 'bed_width', '36', '36 inches (Single)', 1, true, '{"default": true, "price_adjustment": 0}'),
('bed', 'bed_width', '54', '54 inches (Double)', 2, true, '{"price_adjustment": 1000}'),
('bed', 'bed_width', '60', '60 inches (Queen)', 3, true, '{"price_adjustment": 1500}'),
('bed', 'bed_width', '72', '72 inches (King)', 4, true, '{"price_adjustment": 2500}'),
('bed', 'headboard_height', '30', '30 inches', 1, true, '{"default": true, "price_adjustment": 0}'),
('bed', 'headboard_height', '36', '36 inches', 2, true, '{"price_adjustment": 500}'),
('bed', 'headboard_height', '42', '42 inches', 3, true, '{"price_adjustment": 1000}'),
('bed', 'headboard_height', '48', '48 inches', 4, true, '{"price_adjustment": 1500}');

-- ============================================================================
-- CINEMA CHAIRS SPECIFIC OPTIONS
-- ============================================================================

-- Number of Seats
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('cinema_chairs', 'seat_count', '1', '1 Seat', 1, true, '{}'),
('cinema_chairs', 'seat_count', '2', '2 Seats', 2, true, '{"default": true}'),
('cinema_chairs', 'seat_count', '3', '3 Seats', 3, true, '{}'),
('cinema_chairs', 'seat_count', '4', '4 Seats', 4, true, '{}'),
('cinema_chairs', 'seat_count', '5', '5 Seats', 5, true, '{}'),
('cinema_chairs', 'seat_count', '6', '6 Seats', 6, true, '{}'),
('cinema_chairs', 'seat_count', '7', '7 Seats', 7, true, '{}'),
('cinema_chairs', 'seat_count', '8', '8 Seats', 8, true, '{}'),
('cinema_chairs', 'seat_count', '9', '9 Seats', 9, true, '{}'),
('cinema_chairs', 'seat_count', '10', '10 Seats', 10, true, '{}');

-- Mechanism Types (Cinema-specific)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('cinema_chairs', 'mechanism_type', 'Manual', 'Manual Recline', 1, true, '{"default": true, "price_adjustment": 0}'),
('cinema_chairs', 'mechanism_type', 'Electric', 'Electric Recline', 2, true, '{"price_adjustment": 5000}');

-- Cinema Chair Dimensions
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('cinema_chairs', 'seat_depth', '22', '22 inches', 1, true, '{"default": true, "price_adjustment": 0}'),
('cinema_chairs', 'seat_depth', '24', '24 inches', 2, true, '{"price_adjustment": 200}'),
('cinema_chairs', 'seat_depth', '26', '26 inches', 3, true, '{"price_adjustment": 400}'),
('cinema_chairs', 'seat_depth', '28', '28 inches', 4, true, '{"price_adjustment": 600}'),
('cinema_chairs', 'seat_width', '22', '22 inches', 1, true, '{"default": true, "price_adjustment": 0}'),
('cinema_chairs', 'seat_width', '24', '24 inches', 2, true, '{"price_adjustment": 200}'),
('cinema_chairs', 'seat_width', '26', '26 inches', 3, true, '{"price_adjustment": 400}'),
('cinema_chairs', 'seat_width', '30', '30 inches', 4, true, '{"price_adjustment": 800}'),
('cinema_chairs', 'seat_height', '16', '16 inches', 1, true, '{"default": true, "price_adjustment": 0}'),
('cinema_chairs', 'seat_height', '18', '18 inches', 2, true, '{"price_adjustment": 100}'),
('cinema_chairs', 'seat_height', '20', '20 inches', 3, true, '{"price_adjustment": 200}');

-- ============================================================================
-- DINING CHAIRS SPECIFIC OPTIONS
-- ============================================================================

-- Set Quantities
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('dining_chairs', 'set_quantity', '2', 'Set of 2 Chairs', 1, true, '{"chairs": 2}'),
('dining_chairs', 'set_quantity', '4', 'Set of 4 Chairs', 2, true, '{"default": true, "chairs": 4}'),
('dining_chairs', 'set_quantity', '6', 'Set of 6 Chairs', 3, true, '{"chairs": 6}'),
('dining_chairs', 'set_quantity', '8', 'Set of 8 Chairs', 4, true, '{"chairs": 8}');

-- Dining Chair Foam Types (Simpler options)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('dining_chairs', 'foam_type', 'Firm', 'Firm', 1, true, '{"default": true, "price_adjustment": 0}'),
('dining_chairs', 'foam_type', 'Soft', 'Soft', 2, true, '{"price_adjustment": 0}'),
('dining_chairs', 'foam_type', 'Super Soft', 'Super Soft', 3, true, '{"price_adjustment": 0}');

-- Dining Chair Dimensions
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('dining_chairs', 'seat_depth', '16', '16 inches', 1, true, '{"price_adjustment": 0}'),
('dining_chairs', 'seat_depth', '18', '18 inches', 2, true, '{"default": true, "price_adjustment": 100}'),
('dining_chairs', 'seat_depth', '20', '20 inches', 3, true, '{"price_adjustment": 200}'),
('dining_chairs', 'seat_width', '16', '16 inches', 1, true, '{"price_adjustment": 0}'),
('dining_chairs', 'seat_width', '18', '18 inches', 2, true, '{"default": true, "price_adjustment": 100}'),
('dining_chairs', 'seat_width', '20', '20 inches', 3, true, '{"price_adjustment": 200}'),
('dining_chairs', 'seat_height', '16', '16 inches', 1, true, '{"price_adjustment": 0}'),
('dining_chairs', 'seat_height', '18', '18 inches', 2, true, '{"default": true, "price_adjustment": 100}'),
('dining_chairs', 'seat_height', '20', '20 inches', 3, true, '{"price_adjustment": 200}');

-- ============================================================================
-- ARM CHAIRS SPECIFIC OPTIONS
-- ============================================================================

-- Pillow Types
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('arm_chairs', 'pillow_type', 'Simple', 'Simple', 1, true, '{"default": true, "price_adjustment": 0}'),
('arm_chairs', 'pillow_type', 'Diamond Quilted', 'Diamond Quilted', 2, true, '{"price_adjustment": 200}'),
('arm_chairs', 'pillow_type', 'Belt Quilted', 'Belt Quilted', 3, true, '{"price_adjustment": 250}'),
('arm_chairs', 'pillow_type', 'Tassels', 'With Tassels', 4, true, '{"price_adjustment": 150}');

-- Pillow Sizes
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('arm_chairs', 'pillow_size', '18x18', '18" x 18"', 1, true, '{"default": true, "width": 18, "height": 18, "price_adjustment": 0}'),
('arm_chairs', 'pillow_size', '20x20', '20" x 20"', 2, true, '{"width": 20, "height": 20, "price_adjustment": 100}'),
('arm_chairs', 'pillow_size', '16x24', '16" x 24"', 3, true, '{"width": 16, "height": 24, "price_adjustment": 150}');

-- Arm Chair Dimensions
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('arm_chairs', 'seat_depth', '20', '20 inches', 1, true, '{"default": true, "price_adjustment": 0}'),
('arm_chairs', 'seat_depth', '22', '22 inches', 2, true, '{"price_adjustment": 200}'),
('arm_chairs', 'seat_depth', '24', '24 inches', 3, true, '{"price_adjustment": 400}'),
('arm_chairs', 'seat_width', '22', '22 inches', 1, true, '{"default": true, "price_adjustment": 0}'),
('arm_chairs', 'seat_width', '24', '24 inches', 2, true, '{"price_adjustment": 200}'),
('arm_chairs', 'seat_width', '26', '26 inches', 3, true, '{"price_adjustment": 400}'),
('arm_chairs', 'seat_height', '16', '16 inches', 1, true, '{"default": true, "price_adjustment": 0}'),
('arm_chairs', 'seat_height', '18', '18 inches', 2, true, '{"price_adjustment": 100}'),
('arm_chairs', 'seat_height', '20', '20 inches', 3, true, '{"price_adjustment": 200}');

-- ============================================================================
-- BENCHES SPECIFIC OPTIONS
-- ============================================================================

-- Seating Capacity
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('benches', 'seating_capacity', '2-seater', '2-Seater', 1, true, '{"seats": 2, "typical_length": 48}'),
('benches', 'seating_capacity', '3-seater', '3-Seater', 2, true, '{"default": true, "seats": 3, "typical_length": 60}'),
('benches', 'seating_capacity', 'custom', 'Custom Size', 3, true, '{"seats": null}');

-- Storage Types (Bench-specific)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('benches', 'storage_type', 'Lift-top', 'Lift-top Storage', 1, true, '{"default": true, "price_adjustment": 1500}'),
('benches', 'storage_type', 'Drawer', 'Drawer Storage', 2, true, '{"price_adjustment": 2000}');

-- Bench Dimensions
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('benches', 'bench_length', '36', '36 inches (3 ft)', 1, true, '{"price_adjustment": 0}'),
('benches', 'bench_length', '48', '48 inches (4 ft)', 2, true, '{"default": true, "price_adjustment": 500}'),
('benches', 'bench_length', '60', '60 inches (5 ft)', 3, true, '{"price_adjustment": 1000}'),
('benches', 'bench_length', '72', '72 inches (6 ft)', 4, true, '{"price_adjustment": 1500}'),
('benches', 'bench_depth', '16', '16 inches', 1, true, '{"price_adjustment": 0}'),
('benches', 'bench_depth', '18', '18 inches', 2, true, '{"default": true, "price_adjustment": 100}'),
('benches', 'bench_depth', '20', '20 inches', 3, true, '{"price_adjustment": 200}'),
('benches', 'bench_height', '16', '16 inches', 1, true, '{"price_adjustment": 0}'),
('benches', 'bench_height', '18', '18 inches', 2, true, '{"default": true, "price_adjustment": 100}'),
('benches', 'bench_height', '20', '20 inches', 3, true, '{"price_adjustment": 200}'),
('benches', 'bench_height', '22', '22 inches', 4, true, '{"price_adjustment": 300}');

-- ============================================================================
-- KIDS BED (Same as bed but separate category for admin management)
-- ============================================================================

INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('kids_bed', 'bed_size', 'Single', 'Single', 1, true, '{"default": true, "width_inches": 36, "length_inches": 72}'),
('kids_bed', 'bed_size', 'Double', 'Double', 2, true, '{"width_inches": 54, "length_inches": 75}'),
('kids_bed', 'storage_type', 'Hydraulic', 'Hydraulic Lift', 1, true, '{"default": true, "price_adjustment": 2000}'),
('kids_bed', 'storage_type', 'Box', 'Box Storage', 2, true, '{"price_adjustment": 1500}'),
('kids_bed', 'storage_type', 'Drawer', 'Drawer Storage', 3, true, '{"price_adjustment": 2500}'),
('kids_bed', 'mattress_support', 'Slat', 'Slat Support', 1, true, '{"default": true, "price_adjustment": 0}'),
('kids_bed', 'mattress_support', 'Solid', 'Solid Base', 2, true, '{"price_adjustment": 500}');

-- ============================================================================
-- SOFA BED (Same as sofa but separate for admin management)
-- ============================================================================

-- Note: SofaConfigurator already uses dynamic dropdowns from 'sofa' category
-- Adding 'sofabed' category allows separate admin management if needed
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofabed', 'bed_mechanism', 'Pull-out', 'Pull-out Mechanism', 1, true, '{"default": true, "price_adjustment": 3000}'),
('sofabed', 'bed_mechanism', 'Fold-down', 'Fold-down Mechanism', 2, true, '{"price_adjustment": 3500}'),
('sofabed', 'bed_mechanism', 'Click-clack', 'Click-clack Mechanism', 3, true, '{"price_adjustment": 2500}');