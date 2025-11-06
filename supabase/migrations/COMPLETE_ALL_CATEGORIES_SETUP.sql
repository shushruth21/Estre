-- ============================================================================
-- COMPLETE DATABASE SETUP FOR ALL PRODUCT CATEGORIES
-- Estre Furniture Configurator - All Dropdown Options
-- This migration populates dropdowns for ALL 9 product categories
-- ============================================================================

-- ============================================================================
-- STEP 1: ENSURE PUBLIC READ ACCESS
-- ============================================================================
DROP POLICY IF EXISTS "Public read active dropdowns" ON dropdown_options;
CREATE POLICY "Public read active dropdowns" ON dropdown_options
  FOR SELECT TO public USING (is_active = true);

-- ============================================================================
-- STEP 2: SOFA - Complete Dropdown Options
-- ============================================================================
DELETE FROM dropdown_options WHERE category = 'sofa';

-- Model/Base Shape
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'base_shape', 'Standard', 'Standard', 1, true, '{"default": true}'),
('sofa', 'base_shape', 'L Shape', 'L Shape', 2, true, '{}'),
('sofa', 'base_shape', 'U Shape', 'U Shape', 3, true, '{}'),
('sofa', 'base_shape', 'Combo', 'Combo', 4, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- Lounger Required
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'lounger_required', 'Yes', 'Yes', 1, true, '{}'),
('sofa', 'lounger_required', 'No', 'No', 2, true, '{"default": true}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- Number of Loungers
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'lounger_count', '1 No.', '1 No.', 1, true, '{"default": true}'),
('sofa', 'lounger_count', '2 Nos.', '2 Nos.', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- Lounger Size
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'lounger_size', '5 ft', '5 ft', 1, true, '{}'),
('sofa', 'lounger_size', '5''6"', '5''6"', 2, true, '{}'),
('sofa', 'lounger_size', '6 ft', '6 ft', 3, true, '{"default": true}'),
('sofa', 'lounger_size', '6''6"', '6''6"', 4, true, '{}'),
('sofa', 'lounger_size', '7 ft', '7 ft', 5, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Lounger Positioning
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'lounger_position', 'LHS', 'Left Hand Side', 1, true, '{}'),
('sofa', 'lounger_position', 'RHS', 'Right Hand Side', 2, true, '{"default": true}'),
('sofa', 'lounger_position', 'Both', 'Both Sides', 3, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Console Required
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'console_required', 'Yes', 'Yes', 1, true, '{}'),
('sofa', 'console_required', 'No', 'No', 2, true, '{"default": true}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Number of Consoles
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'console_count', '1', '1 Console', 1, true, '{"default": true}'),
('sofa', 'console_count', '2', '2 Consoles', 2, true, '{}'),
('sofa', 'console_count', '3', '3 Consoles', 3, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Console Size
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'console_size', '6 in', '6 inches', 1, true, '{"default": true}'),
('sofa', 'console_size', '10 in', '10 inches', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Console Placement
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'console_placement', 'Front', 'Front', 1, true, '{"default": true}'),
('sofa', 'console_placement', 'Left', 'Left', 2, true, '{}'),
('sofa', 'console_placement', 'Right', 'Right', 3, true, '{}'),
('sofa', 'console_placement', 'Combo', 'Combo', 4, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Pillows Required
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'pillows_required', 'Yes', 'Yes', 1, true, '{}'),
('sofa', 'pillows_required', 'No', 'No', 2, true, '{"default": true}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Number of Pillows
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'pillow_count', '1', '1 Pillow', 1, true, '{}'),
('sofa', 'pillow_count', '2', '2 Pillows', 2, true, '{"default": true}'),
('sofa', 'pillow_count', '3', '3 Pillows', 3, true, '{}'),
('sofa', 'pillow_count', '4', '4 Pillows', 4, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Pillow Type
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'pillow_type', 'Simple', 'Simple', 1, true, '{"default": true}'),
('sofa', 'pillow_type', 'Diamond', 'Diamond', 2, true, '{}'),
('sofa', 'pillow_type', 'Belt', 'Belt', 3, true, '{}'),
('sofa', 'pillow_type', 'Tassels', 'Tassels', 4, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Pillow Size
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'pillow_size', '18"x18"', '18"x18"', 1, true, '{"default": true}'),
('sofa', 'pillow_size', '20"x20"', '20"x20"', 2, true, '{}'),
('sofa', 'pillow_size', '16"x24"', '16"x24"', 3, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Fabric Cladding Plan
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'fabric_cladding_plan', 'Single Colour', 'Single Colour', 1, true, '{"default": true}'),
('sofa', 'fabric_cladding_plan', 'Multi Colour', 'Multi Colour', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Multi-colour Plan Breakdown
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'fabric_breakdown', 'Structure', 'Structure', 1, true, '{}'),
('sofa', 'fabric_breakdown', 'Backrest', 'Backrest', 2, true, '{}'),
('sofa', 'fabric_breakdown', 'Seat', 'Seat', 3, true, '{}'),
('sofa', 'fabric_breakdown', 'Headrest', 'Headrest', 4, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Foam Options
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'foam_type', 'Firm', 'Firm', 1, true, '{"default": true, "price_adjustment": 0}'),
('sofa', 'foam_type', 'Soft', 'Soft', 2, true, '{"price_adjustment": 0}'),
('sofa', 'foam_type', 'Super Soft', 'Super Soft', 3, true, '{"price_adjustment": 0}'),
('sofa', 'foam_type', 'Latex', 'Latex', 4, true, '{"price_adjustment": 4000, "upgrade": true}'),
('sofa', 'foam_type', 'Memory Foam', 'Memory Foam', 5, true, '{"price_adjustment": 3000, "upgrade": true}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Seat Depth
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'seat_depth', '22"', '22 inches', 1, true, '{"default": true, "percentage": 0}'),
('sofa', 'seat_depth', '24"', '24 inches', 2, true, '{"percentage": 0}'),
('sofa', 'seat_depth', '26"', '26 inches', 3, true, '{"percentage": 3}'),
('sofa', 'seat_depth', '28"', '28 inches', 4, true, '{"percentage": 6}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Seat Width
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'seat_width', '22"', '22 inches', 1, true, '{"default": true, "percentage": 0}'),
('sofa', 'seat_width', '24"', '24 inches', 2, true, '{"percentage": 0}'),
('sofa', 'seat_width', '26"', '26 inches', 3, true, '{"percentage": 6.5}'),
('sofa', 'seat_width', '30"', '30 inches', 4, true, '{"percentage": 19.5}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Seat Height
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'seat_height', '16"', '16 inches', 1, true, '{}'),
('sofa', 'seat_height', '18"', '18 inches', 2, true, '{"default": true}'),
('sofa', 'seat_height', '20"', '20 inches', 3, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Armrest Types
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'armrest_type', 'Default', 'Default', 1, true, '{"default": true}'),
('sofa', 'armrest_type', 'Balboa', 'Balboa', 2, true, '{}'),
('sofa', 'armrest_type', 'Ocean', 'Ocean', 3, true, '{}'),
('sofa', 'armrest_type', 'Nest', 'Nest', 4, true, '{}'),
('sofa', 'armrest_type', 'Etan', 'Etan', 5, true, '{}'),
('sofa', 'armrest_type', 'Albatross', 'Albatross', 6, true, '{}'),
('sofa', 'armrest_type', 'Anke', 'Anke', 7, true, '{}'),
('sofa', 'armrest_type', 'Dinny', 'Dinny', 8, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Leg Types
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'leg_type', 'Cylinder Leg', 'Cylinder Leg', 1, true, '{"default": true}'),
('sofa', 'leg_type', 'Kulfi Leg - Gold', 'Kulfi Leg (Gold)', 2, true, '{}'),
('sofa', 'leg_type', 'Kulfi Leg - Black', 'Kulfi Leg (Black)', 3, true, '{}'),
('sofa', 'leg_type', 'Kulfi Leg - Rose Gold', 'Kulfi Leg (Rose Gold)', 4, true, '{}'),
('sofa', 'leg_type', 'Petriaz Leg', 'Petriaz Leg', 5, true, '{}'),
('sofa', 'leg_type', 'Aurora Leg', 'Aurora Leg', 6, true, '{}'),
('sofa', 'leg_type', 'L Shape', 'L Shape', 7, true, '{}'),
('sofa', 'leg_type', 'Wooden Leg', 'Wooden Leg', 8, true, '{}'),
('sofa', 'leg_type', 'Gun Black Metal', 'Gun Black Metal', 9, true, '{}'),
('sofa', 'leg_type', 'Gold Metal', 'Gold Metal', 10, true, '{}'),
('sofa', 'leg_type', 'Rose Gold Metal', 'Rose Gold Metal', 11, true, '{}'),
('sofa', 'leg_type', 'Trapezoid', 'Trapezoid', 12, true, '{}'),
('sofa', 'leg_type', 'V-Shape', 'V-Shape', 13, true, '{}'),
('sofa', 'leg_type', 'SS', 'SS', 14, true, '{}'),
('sofa', 'leg_type', 'Ring', 'Ring', 15, true, '{}'),
('sofa', 'leg_type', 'PUF', 'PUF', 16, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Stitch Types
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'stitch_type', 'Plain Seam', 'Plain Seam', 1, true, '{"default": true}'),
('sofa', 'stitch_type', 'Top Stitch', 'Top Stitch', 2, true, '{}'),
('sofa', 'stitch_type', 'Double Top Stitch', 'Double Top Stitch', 3, true, '{}'),
('sofa', 'stitch_type', 'Piping', 'Piping', 4, true, '{}'),
('sofa', 'stitch_type', 'French Seam', 'French Seam', 5, true, '{}'),
('sofa', 'stitch_type', 'Felled Seam', 'Felled Seam', 6, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Wood Types
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'wood_type', 'Pine', 'Pine (Default)', 1, true, '{"default": true}'),
('sofa', 'wood_type', 'Neem', 'Neem', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Headrest Required
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'headrest_required', 'NA', 'Not Applicable', 1, true, '{"default": true}'),
('sofa', 'headrest_required', 'Yes', 'Yes', 2, true, '{}'),
('sofa', 'headrest_required', 'No', 'No', 3, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- ============================================================================
-- STEP 3: SOFA BED - Complete Dropdown Options
-- ============================================================================
DELETE FROM dropdown_options WHERE category = 'sofa_bed';

-- Model
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa_bed', 'model', 'Standard', 'Standard', 1, true, '{"default": true}'),
('sofa_bed', 'model', 'L Shape', 'L Shape', 2, true, '{}'),
('sofa_bed', 'model', 'U Shape', 'U Shape', 3, true, '{}'),
('sofa_bed', 'model', 'Combo', 'Combo', 4, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Seater Quantity
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa_bed', 'seater_qty', 'D10', 'D10', 1, true, '{}'),
('sofa_bed', 'seater_qty', 'D11', 'D11', 2, true, '{}'),
('sofa_bed', 'seater_qty', 'D12', 'D12', 3, true, '{"default": true}'),
('sofa_bed', 'seater_qty', 'D13', 'D13', 4, true, '{}'),
('sofa_bed', 'seater_qty', 'D14', 'D14', 5, true, '{}'),
('sofa_bed', 'seater_qty', 'D15', 'D15', 6, true, '{}'),
('sofa_bed', 'seater_qty', 'D16', 'D16', 7, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Seater Type
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa_bed', 'seater_type', '2-Seater', '2-Seater', 1, true, '{}'),
('sofa_bed', 'seater_type', '3-Seater', '3-Seater', 2, true, '{"default": true}'),
('sofa_bed', 'seater_type', '4-Seater', '4-Seater', 3, true, '{}'),
('sofa_bed', 'seater_type', 'Corner', 'Corner', 4, true, '{}'),
('sofa_bed', 'seater_type', 'No Mech', 'No Mechanism', 5, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Lounger with Storage
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa_bed', 'lounger_storage', 'Yes', 'Yes', 1, true, '{}'),
('sofa_bed', 'lounger_storage', 'No', 'No', 2, true, '{"default": true}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Recliner Add-ons Required
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa_bed', 'recliner_addon_required', 'Yes', 'Yes', 1, true, '{}'),
('sofa_bed', 'recliner_addon_required', 'No', 'No', 2, true, '{"default": true}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Recliner Mechanism
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa_bed', 'recliner_mechanism', 'Manual', 'Manual', 1, true, '{"default": true}'),
('sofa_bed', 'recliner_mechanism', 'Electric', 'Electric', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Copy fabric, foam, pillow, armrest, leg types from sofa (use common category or reference)
-- (These will be handled by common/shared dropdowns)

-- ============================================================================
-- STEP 4: RECLINER - Complete Dropdown Options
-- ============================================================================
DELETE FROM dropdown_options WHERE category = 'recliner';

-- Model
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('recliner', 'model', 'Standard', 'Standard', 1, true, '{"default": true}'),
('recliner', 'model', 'L Shape', 'L Shape', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Seat Type
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('recliner', 'seat_type', '1-Seater', '1-Seater', 1, true, '{}'),
('recliner', 'seat_type', '2-Seater', '2-Seater', 2, true, '{"default": true}'),
('recliner', 'seat_type', '3-Seater', '3-Seater', 3, true, '{}'),
('recliner', 'seat_type', 'Corner', 'Corner', 4, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Mechanism Types
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('recliner', 'mechanism_type', 'Manual', 'Manual', 1, true, '{"default": true, "price_adjustment": 0}'),
('recliner', 'mechanism_type', 'Manual-RRR', 'Manual RRR', 2, true, '{"price_adjustment": 1000}'),
('recliner', 'mechanism_type', 'Electric', 'Electric', 3, true, '{"price_adjustment": 3000}'),
('recliner', 'mechanism_type', 'Electric-RRR', 'Electric RRR', 4, true, '{"price_adjustment": 4000}'),
('recliner', 'mechanism_type', 'Only Sofa', 'Sofa Only (No Recline)', 5, true, '{"price_adjustment": -500}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Dummy Seat Required
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('recliner', 'dummy_seat_required', 'Yes', 'Yes', 1, true, '{}'),
('recliner', 'dummy_seat_required', 'No', 'No', 2, true, '{"default": true}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Dummy Seat Placement
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('recliner', 'dummy_seat_placement', 'Front', 'Front', 1, true, '{}'),
('recliner', 'dummy_seat_placement', 'Left', 'Left', 2, true, '{}'),
('recliner', 'dummy_seat_placement', 'After n-th seat from left', 'After n-th seat from left', 3, true, '{"default": true}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- ============================================================================
-- STEP 5: CINEMA CHAIRS - Complete Dropdown Options
-- ============================================================================
DELETE FROM dropdown_options WHERE category = 'cinema_chairs';

-- Number of Seats
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('cinema_chairs', 'seat_count', '1', '1-Seater', 1, true, '{}'),
('cinema_chairs', 'seat_count', '2', '2-Seater', 2, true, '{"default": true}'),
('cinema_chairs', 'seat_count', '3', '3-Seater', 3, true, '{}'),
('cinema_chairs', 'seat_count', '4', '4-Seater', 4, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Mechanism
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('cinema_chairs', 'mechanism', 'Manual', 'Manual', 1, true, '{"default": true}'),
('cinema_chairs', 'mechanism', 'Electric', 'Electric', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Fabric Plan
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('cinema_chairs', 'fabric_plan', 'Single', 'Single Colour', 1, true, '{"default": true}'),
('cinema_chairs', 'fabric_plan', 'Dual Colour', 'Dual Colour', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- ============================================================================
-- STEP 6: BENCHES - Complete Dropdown Options
-- ============================================================================
DELETE FROM dropdown_options WHERE category = 'benches';

-- Seating Capacity
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('benches', 'seating_capacity', '2', '2 Seater', 1, true, '{}'),
('benches', 'seating_capacity', '3', '3 Seater', 2, true, '{"default": true}'),
('benches', 'seating_capacity', '4', '4 Seater', 3, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Storage Type
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('benches', 'storage_type', 'None', 'None', 1, true, '{"default": true}'),
('benches', 'storage_type', 'Box', 'Box Storage', 2, true, '{}'),
('benches', 'storage_type', 'Drawer', 'Drawer Storage', 3, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Seat Height
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('benches', 'seat_height', '16"', '16 inches', 1, true, '{}'),
('benches', 'seat_height', '18"', '18 inches', 2, true, '{"default": true}'),
('benches', 'seat_height', '20"', '20 inches', 3, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- ============================================================================
-- STEP 7: ARM CHAIRS - Complete Dropdown Options
-- ============================================================================
DELETE FROM dropdown_options WHERE category = 'arm_chairs';

-- Pillow Types
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('arm_chairs', 'pillow_type', 'Simple', 'Simple', 1, true, '{"default": true}'),
('arm_chairs', 'pillow_type', 'Diamond Quilted', 'Diamond Quilted', 2, true, '{}'),
('arm_chairs', 'pillow_type', 'Belt Quilted', 'Belt Quilted', 3, true, '{}'),
('arm_chairs', 'pillow_type', 'Tassels', 'Tassels', 4, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Pillow Sizes (same as sofa)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('arm_chairs', 'pillow_size', '18"x18"', '18"x18"', 1, true, '{"default": true}'),
('arm_chairs', 'pillow_size', '20"x20"', '20"x20"', 2, true, '{}'),
('arm_chairs', 'pillow_size', '16"x24"', '16"x24"', 3, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Fabric Plan
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('arm_chairs', 'fabric_plan', 'Single Colour', 'Single Colour', 1, true, '{"default": true}'),
('arm_chairs', 'fabric_plan', 'Dual Colour', 'Dual Colour', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- ============================================================================
-- STEP 8: DINING CHAIRS - Complete Dropdown Options
-- ============================================================================
DELETE FROM dropdown_options WHERE category = 'dining_chairs';

-- Fabric Plan
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('dining_chairs', 'fabric_plan', 'Single Colour', 'Single Colour', 1, true, '{"default": true}'),
('dining_chairs', 'fabric_plan', 'Dual Colour', 'Dual Colour (Front/Back)', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Seat Height
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('dining_chairs', 'seat_height', '16"', '16 inches', 1, true, '{}'),
('dining_chairs', 'seat_height', '18"', '18 inches', 2, true, '{"default": true}'),
('dining_chairs', 'seat_height', '20"', '20 inches', 3, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Leg Types (simplified for dining chairs)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('dining_chairs', 'leg_type', 'Kulfi - Cream', 'Kulfi Leg (Cream)', 1, true, '{}'),
('dining_chairs', 'leg_type', 'Kulfi - Brown', 'Kulfi Leg (Brown)', 2, true, '{}'),
('dining_chairs', 'leg_type', 'Kulfi - Black', 'Kulfi Leg (Black)', 3, true, '{"default": true}'),
('dining_chairs', 'leg_type', 'Kulfi - Gold', 'Kulfi Leg (Gold)', 4, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- ============================================================================
-- STEP 9: KIDS BED - Complete Dropdown Options
-- ============================================================================
DELETE FROM dropdown_options WHERE category = 'kids_bed';

-- Bed Sizes
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('kids_bed', 'bed_size', 'Single', 'Single', 1, true, '{"default": true}'),
('kids_bed', 'bed_size', 'Double', 'Double', 2, true, '{}'),
('kids_bed', 'bed_size', 'Queen', 'Queen', 3, true, '{}'),
('kids_bed', 'bed_size', 'King', 'King', 4, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Storage Type
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('kids_bed', 'storage_type', 'None', 'None', 1, true, '{"default": true}'),
('kids_bed', 'storage_type', 'Box', 'Box Storage', 2, true, '{}'),
('kids_bed', 'storage_type', 'Side Drawer', 'Side Drawer', 3, true, '{}'),
('kids_bed', 'storage_type', 'Manual', 'Manual Storage', 4, true, '{}'),
('kids_bed', 'storage_type', 'Hydraulic', 'Hydraulic Storage', 5, true, '{}'),
('kids_bed', 'storage_type', 'Electric', 'Electric Storage', 6, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- ============================================================================
-- STEP 10: BED - Complete Dropdown Options
-- ============================================================================
DELETE FROM dropdown_options WHERE category = 'bed';

-- Bed Sizes
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('bed', 'bed_size', 'Single', 'Single', 1, true, '{}'),
('bed', 'bed_size', 'Double', 'Double', 2, true, '{}'),
('bed', 'bed_size', 'Queen', 'Queen', 3, true, '{"default": true}'),
('bed', 'bed_size', 'King', 'King', 4, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Storage Type
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('bed', 'storage_type', 'None', 'None', 1, true, '{"default": true}'),
('bed', 'storage_type', 'Hydraulic', 'Hydraulic Storage', 2, true, '{}'),
('bed', 'storage_type', 'Box', 'Box Storage', 3, true, '{}'),
('bed', 'storage_type', 'Drawer', 'Drawer Storage', 4, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Storage Mechanism
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('bed', 'storage_mechanism', 'Manual', 'Manual', 1, true, '{"default": true}'),
('bed', 'storage_mechanism', 'Electric', 'Electric', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- Seat Height
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('bed', 'seat_height', '16"', '16 inches', 1, true, '{}'),
('bed', 'seat_height', '18"', '18 inches', 2, true, '{"default": true}'),
('bed', 'seat_height', '20"', '20 inches', 3, true, '{}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;
-- ============================================================================
-- STEP 11: COMMON OPTIONS (Used across multiple categories)
-- ============================================================================

-- Discount Approval Levels
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('common', 'discount_approval_level', 'Sales Exec', 'Sales Executive', 1, true, '{"max_discount": 5}'),
('common', 'discount_approval_level', 'Store Manager', 'Store Manager', 2, true, '{"max_discount": 10}'),
('common', 'discount_approval_level', 'Sales Head', 'Sales Head', 3, true, '{"max_discount": 15}'),
('common', 'discount_approval_level', 'Director', 'Director', 4, true, '{"max_discount": 20}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- Discount Codes
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('common', 'discount_code', 'EVIP1', 'EVIP1 - 1%', 1, true, '{"discount_percent": 1}'),
('common', 'discount_code', 'EVIP2', 'EVIP2 - 2%', 2, true, '{"discount_percent": 2}'),
('common', 'discount_code', 'EVIP3', 'EVIP3 - 3%', 3, true, '{"discount_percent": 3}'),
('common', 'discount_code', 'EVIP4', 'EVIP4 - 4%', 4, true, '{"discount_percent": 4}'),
('common', 'discount_code', 'EVIP5', 'EVIP5 - 5%', 5, true, '{"discount_percent": 5}'),
('common', 'discount_code', 'EVIP6', 'EVIP6 - 6%', 6, true, '{"discount_percent": 6}'),
('common', 'discount_code', 'EVIP7', 'EVIP7 - 7%', 7, true, '{"discount_percent": 7}'),
('common', 'discount_code', 'EVIP8', 'EVIP8 - 8%', 8, true, '{"discount_percent": 8}'),
('common', 'discount_code', 'EVIP9', 'EVIP9 - 9%', 9, true, '{"discount_percent": 9}'),
('common', 'discount_code', 'EVIP10', 'EVIP10 - 10%', 10, true, '{"discount_percent": 10}'),
('common', 'discount_code', 'EVIP11', 'EVIP11 - 11%', 11, true, '{"discount_percent": 11}'),
('common', 'discount_code', 'EVIP12', 'EVIP12 - 12%', 12, true, '{"discount_percent": 12}'),
('common', 'discount_code', 'EVIP13', 'EVIP13 - 13%', 13, true, '{"discount_percent": 13}'),
('common', 'discount_code', 'EVIP14', 'EVIP14 - 14%', 14, true, '{"discount_percent": 14}'),
('common', 'discount_code', 'EVIP15', 'EVIP15 - 15%', 15, true, '{"discount_percent": 15}')
ON CONFLICT (category, field_name, option_value) DO NOTHING;

-- ============================================================================
-- STEP 12: VERIFICATION
-- ============================================================================

-- Display summary
DO $$
DECLARE
  total_count INTEGER;
  category_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM dropdown_options WHERE is_active = true;
  SELECT COUNT(DISTINCT category) INTO category_count FROM dropdown_options WHERE is_active = true;
  
  RAISE NOTICE '✅ Complete dropdown setup finished!';
  RAISE NOTICE '   Total options: %', total_count;
  RAISE NOTICE '   Total categories: %', category_count;
END $$;

-- Show summary by category
SELECT 
  category,
  COUNT(DISTINCT field_name) as field_count,
  COUNT(*) as option_count
FROM dropdown_options 
WHERE is_active = true
GROUP BY category
ORDER BY category;

