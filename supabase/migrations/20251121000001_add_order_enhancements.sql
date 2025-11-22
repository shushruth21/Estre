-- ============================================================================
-- ADD MISSING FIELDS FOR JOB CARD AND SALE ORDER TEMPLATES
-- ============================================================================

-- Add GST fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS buyer_gst text,
ADD COLUMN IF NOT EXISTS dispatch_method text;

-- Add wireframe image URL to order_items table
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS wireframe_image_url text;

-- Add wireframe image URL to job_cards table (for production reference)
ALTER TABLE job_cards
ADD COLUMN IF NOT EXISTS wireframe_image_url text;

-- Add company GST to admin_settings (if not exists)
INSERT INTO admin_settings (setting_key, setting_value, setting_type, description)
VALUES 
  ('company_gst', '', 'text', 'Company GST Number'),
  ('company_name', 'ESTRE GLOBAL PRIVATE LIMITED', 'text', 'Company Name'),
  ('company_address_line1', 'Near Dhoni Public School', 'text', 'Company Address Line 1'),
  ('company_address_line2', 'AECS Layout-A Block, Revenue Layout', 'text', 'Company Address Line 2'),
  ('company_address_line3', 'Near Kudlu Gate, Singhasandra', 'text', 'Company Address Line 3'),
  ('company_city', 'Bengaluru', 'text', 'Company City'),
  ('company_pincode', '560 068', 'text', 'Company Pincode'),
  ('company_phone', '+91 87 22 200 100', 'text', 'Company Phone'),
  ('company_email', 'support@estre.in', 'text', 'Company Email'),
  ('default_dispatch_method', 'Safe Express', 'text', 'Default Dispatch Method'),
  ('default_delivery_days', '30', 'number', 'Default Delivery Days from Order Date')
ON CONFLICT (setting_key) DO NOTHING;

-- Add armrest width to job_cards (can be calculated or stored)
ALTER TABLE job_cards
ADD COLUMN IF NOT EXISTS armrest_width_inches numeric;

-- Add leg height to job_cards
ALTER TABLE job_cards
ADD COLUMN IF NOT EXISTS leg_height_inches numeric;

-- Add calculated dimensions to job_cards
ALTER TABLE job_cards
ADD COLUMN IF NOT EXISTS calculated_dimensions jsonb DEFAULT '{}';

-- Add production notes field (separate from admin_notes)
ALTER TABLE job_cards
ADD COLUMN IF NOT EXISTS production_notes text;

-- Add terms and conditions text to admin_settings
INSERT INTO admin_settings (setting_key, setting_value, setting_type, description)
VALUES 
  ('terms_and_conditions', 
   '1. Delivery Timeline: 30 days from the date of placing order and receiving advance payment
2. Payment Terms: 50% advance on placing Sale Order, Balance 50% upon intimation of product readiness, before dispatch
3. Colour Variation: Fabric colours may vary +/-3% as indicated by supplier
4. Dimension Tolerance: Approximate width may vary +/-5%
5. Warranty: As per company warranty policy
6. Cancellation Policy: Advance payment is non-refundable
7. Return Policy: Products can be returned within 7 days of delivery if defective
8. Installation: Additional charges may apply
9. Transportation: Dispatch through Safe Express or alternative courier
10. Dispute Resolution: Any disputes subject to Bengaluru jurisdiction',
   'text',
   'Terms and Conditions for Sale Orders')
ON CONFLICT (setting_key) DO NOTHING;

-- Create index for dispatch_method
CREATE INDEX IF NOT EXISTS idx_orders_dispatch_method ON orders(dispatch_method);

-- Add comment to columns
COMMENT ON COLUMN orders.buyer_gst IS 'Buyer GST Number';
COMMENT ON COLUMN orders.dispatch_method IS 'Dispatch method (e.g., Safe Express, Other)';
COMMENT ON COLUMN order_items.wireframe_image_url IS 'URL to wireframe/technical drawing image';
COMMENT ON COLUMN job_cards.wireframe_image_url IS 'URL to wireframe/technical drawing image';
COMMENT ON COLUMN job_cards.armrest_width_inches IS 'Armrest width in inches';
COMMENT ON COLUMN job_cards.leg_height_inches IS 'Leg height in inches';
COMMENT ON COLUMN job_cards.calculated_dimensions IS 'Calculated dimensions (front_width, left_width, right_width, total_width)';
COMMENT ON COLUMN job_cards.production_notes IS 'Production notes and instructions';


