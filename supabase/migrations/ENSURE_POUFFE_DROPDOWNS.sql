-- Ensure Pouffe dropdown options exist

-- Fabric Cladding Plan
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('database_pouffes', 'fabric_cladding_plan', 'Single Colour', 'Single Colour', 1, true, '{"default": true}'),
  ('database_pouffes', 'fabric_cladding_plan', 'Dual Colour', 'Dual Colour', 2, true, '{}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label, sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active, metadata = EXCLUDED.metadata;

-- Foam Type
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('database_pouffes', 'foam_type', 'Firm', 'Firm', 1, true, '{"default": true, "price": 0}'),
  ('database_pouffes', 'foam_type', 'Soft', 'Soft', 2, true, '{"price": 0}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label, sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active, metadata = EXCLUDED.metadata;

-- Seat Depth
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('database_pouffes', 'seat_depth', '22 in', '22 inches', 1, true, '{"default": true, "upgrade_percent": 0.0}'),
  ('database_pouffes', 'seat_depth', '24 in', '24 inches', 2, true, '{"upgrade_percent": 0.0}'),
  ('database_pouffes', 'seat_depth', '26 in', '26 inches', 3, true, '{"upgrade_percent": 0.03}'),
  ('database_pouffes', 'seat_depth', '28 in', '28 inches', 4, true, '{"upgrade_percent": 0.06}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label, sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active, metadata = EXCLUDED.metadata;

-- Seat Width
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('database_pouffes', 'seat_width', '22 in', '22 inches', 1, true, '{"default": true, "upgrade_percent": 0.0}'),
  ('database_pouffes', 'seat_width', '24 in', '24 inches', 2, true, '{"upgrade_percent": 0.0}'),
  ('database_pouffes', 'seat_width', '26 in', '26 inches', 3, true, '{"upgrade_percent": 0.065}'),
  ('database_pouffes', 'seat_width', '30 in', '30 inches', 4, true, '{"upgrade_percent": 0.195}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label, sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active, metadata = EXCLUDED.metadata;

-- Seat Height
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('database_pouffes', 'seat_height', '16 in', '16 inches', 1, true, '{}'),
  ('database_pouffes', 'seat_height', '18 in', '18 inches', 2, true, '{"default": true}'),
  ('database_pouffes', 'seat_height', '20 in', '20 inches', 3, true, '{}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label, sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active, metadata = EXCLUDED.metadata;

-- Leg Type
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('database_pouffes', 'leg_type', 'Cylinder Leg (3 in)', 'Cylinder Leg (3 in)', 1, true, '{"size": "3 in"}'),
  ('database_pouffes', 'leg_type', 'L Shape-Chrome Finish (2 in)', 'L Shape-Chrome Finish (2 in)', 2, true, '{"size": "2 in"}'),
  ('database_pouffes', 'leg_type', 'L Shape-Gold Finish (2 in)', 'L Shape-Gold Finish (2 in)', 3, true, '{"size": "2 in"}'),
  ('database_pouffes', 'leg_type', 'L Shape-Rose Gold (2 in)', 'L Shape-Rose Gold (2 in)', 4, true, '{"size": "2 in"}'),
  ('database_pouffes', 'leg_type', 'Wooden Leg with Brown Polish (2 INCH/ 3 INCH)', 'Wooden Leg with Brown Polish (2 INCH/ 3 INCH)', 5, true, '{"size": "2 in / 3 in"}'),
  ('database_pouffes', 'leg_type', 'Wooden Leg with Black Polish (2 INCH/ 3 INCH)', 'Wooden Leg with Black Polish (2 INCH/ 3 INCH)', 6, true, '{"size": "2 in / 3 in"}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label, sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active, metadata = EXCLUDED.metadata;

-- Discount Approver
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('database_pouffes', 'discount_approver', 'Sales Executive', 'Sales Executive', 1, true, '{}'),
  ('database_pouffes', 'discount_approver', 'Store Manager', 'Store Manager', 2, true, '{}'),
  ('database_pouffes', 'discount_approver', 'Sales Head', 'Sales Head', 3, true, '{}'),
  ('database_pouffes', 'discount_approver', 'Director', 'Director', 4, true, '{"default": true}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label, sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active, metadata = EXCLUDED.metadata;

-- Discount Codes
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
  ('database_pouffes', 'discount_code', 'EVIP', 'EVIP (1%)', 1, true, '{"percentage": 0.01}'),
  ('database_pouffes', 'discount_code', 'EVIP2', 'EVIP2 (2%)', 2, true, '{"percentage": 0.02}'),
  ('database_pouffes', 'discount_code', 'EVIP3', 'EVIP3 (3%)', 3, true, '{"percentage": 0.03}'),
  ('database_pouffes', 'discount_code', 'EVIP4', 'EVIP4 (4%)', 4, true, '{"percentage": 0.04}'),
  ('database_pouffes', 'discount_code', 'EVIP5', 'EVIP5 (5%)', 5, true, '{"percentage": 0.05}'),
  ('database_pouffes', 'discount_code', 'EVIP6', 'EVIP6 (6%)', 6, true, '{"percentage": 0.06}'),
  ('database_pouffes', 'discount_code', 'EVIP7', 'EVIP7 (7%)', 7, true, '{"percentage": 0.07}'),
  ('database_pouffes', 'discount_code', 'EVIP8', 'EVIP8 (8%)', 8, true, '{"percentage": 0.08}'),
  ('database_pouffes', 'discount_code', 'EVIP9', 'EVIP9 (9%)', 9, true, '{"percentage": 0.09}'),
  ('database_pouffes', 'discount_code', 'EVIP10', 'EVIP10 (10%)', 10, true, '{"percentage": 0.10}'),
  ('database_pouffes', 'discount_code', 'EVIP11', 'EVIP11 (11%)', 11, true, '{"percentage": 0.11}'),
  ('database_pouffes', 'discount_code', 'EVIP12', 'EVIP12 (12%)', 12, true, '{"percentage": 0.12}'),
  ('database_pouffes', 'discount_code', 'EVIP13', 'EVIP13 (13%)', 13, true, '{"percentage": 0.13}'),
  ('database_pouffes', 'discount_code', 'EVIP14', 'EVIP14 (14%)', 14, true, '{"percentage": 0.14}'),
  ('database_pouffes', 'discount_code', 'EVIP15', 'EVIP15 (15%)', 15, true, '{"percentage": 0.15}')
ON CONFLICT (category, field_name, option_value) DO UPDATE SET
  display_label = EXCLUDED.display_label, sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active, metadata = EXCLUDED.metadata;

