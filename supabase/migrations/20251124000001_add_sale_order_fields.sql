-- ============================================================================
-- ADD MISSING FIELDS TO SALE_ORDERS TABLE
-- ============================================================================
-- This migration adds order_number, pricing_breakdown, HTML fields, and customer details
-- to support the complete Sale Order workflow

-- Add order_number (unique, format: "001", "002", etc.)
ALTER TABLE sale_orders 
ADD COLUMN IF NOT EXISTS order_number text UNIQUE;

-- Add pricing_breakdown JSON (stores complete pricing breakdown)
ALTER TABLE sale_orders 
ADD COLUMN IF NOT EXISTS pricing_breakdown jsonb DEFAULT '{}';

-- Add HTML template fields
ALTER TABLE sale_orders 
ADD COLUMN IF NOT EXISTS draft_html text;
ALTER TABLE sale_orders 
ADD COLUMN IF NOT EXISTS final_html text;

-- Add customer details fields (denormalized for easier access)
ALTER TABLE sale_orders 
ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE sale_orders 
ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE sale_orders 
ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE sale_orders 
ADD COLUMN IF NOT EXISTS customer_address jsonb;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_sale_orders_order_number ON sale_orders(order_number) WHERE order_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sale_orders_pricing_breakdown ON sale_orders USING gin(pricing_breakdown) WHERE pricing_breakdown IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sale_orders_customer_email ON sale_orders(customer_email) WHERE customer_email IS NOT NULL;

-- Add comments
COMMENT ON COLUMN sale_orders.order_number IS 'Unique sale order number (format: 001, 002, etc.)';
COMMENT ON COLUMN sale_orders.pricing_breakdown IS 'Complete pricing breakdown JSON matching Sale Order format';
COMMENT ON COLUMN sale_orders.draft_html IS 'Draft HTML template for staff preview and editing';
COMMENT ON COLUMN sale_orders.final_html IS 'Final HTML template used for PDF generation';
COMMENT ON COLUMN sale_orders.customer_name IS 'Customer name (denormalized from orders table)';
COMMENT ON COLUMN sale_orders.customer_email IS 'Customer email (denormalized from orders table)';
COMMENT ON COLUMN sale_orders.customer_phone IS 'Customer phone (denormalized from orders table)';
COMMENT ON COLUMN sale_orders.customer_address IS 'Customer address JSON (denormalized from orders table)';

