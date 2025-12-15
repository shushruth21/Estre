-- ===============================================
-- ADD CUSTOMER FIELDS TO SALE_ORDERS TABLE
-- ===============================================
-- This migration adds customer_email, customer_name, and order_number
-- to sale_orders table for reliable email sending

ALTER TABLE sale_orders 
ADD COLUMN IF NOT EXISTS customer_email text,
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS order_number text;

-- Create index for order_number lookups
CREATE INDEX IF NOT EXISTS idx_sale_orders_order_number ON sale_orders(order_number) WHERE order_number IS NOT NULL;

-- Create index for customer_email lookups
CREATE INDEX IF NOT EXISTS idx_sale_orders_customer_email ON sale_orders(customer_email) WHERE customer_email IS NOT NULL;

-- Backfill existing sale_orders with data from orders table
UPDATE sale_orders so
SET 
  customer_email = o.customer_email,
  customer_name = o.customer_name,
  order_number = o.order_number
FROM orders o
WHERE so.order_id = o.id
AND (so.customer_email IS NULL OR so.customer_name IS NULL OR so.order_number IS NULL);

COMMENT ON COLUMN sale_orders.customer_email IS 'Customer email address for sending sale order PDFs';
COMMENT ON COLUMN sale_orders.customer_name IS 'Customer name for email personalization';
COMMENT ON COLUMN sale_orders.order_number IS 'Order number for email subject and PDF filename';













