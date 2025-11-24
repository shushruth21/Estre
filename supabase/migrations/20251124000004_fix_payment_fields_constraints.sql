-- ============================================================================
-- FIX PAYMENT FIELDS CONSTRAINTS IN SALE_ORDERS
-- ============================================================================
-- This migration fixes the payment_mode and payment_status columns if they
-- were added without proper constraints or if constraints failed

-- Ensure payment_mode column exists
ALTER TABLE sale_orders 
ADD COLUMN IF NOT EXISTS payment_mode text DEFAULT 'cash';

-- Drop existing constraint if it exists (in case it was created incorrectly)
ALTER TABLE sale_orders DROP CONSTRAINT IF EXISTS sale_orders_payment_mode_check;

-- Add proper CHECK constraint for payment_mode
ALTER TABLE sale_orders 
ADD CONSTRAINT sale_orders_payment_mode_check 
CHECK (payment_mode IN ('cash', 'online'));

-- Ensure payment_status column exists
ALTER TABLE sale_orders 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';

-- Drop existing constraint if it exists (in case it was created incorrectly)
ALTER TABLE sale_orders DROP CONSTRAINT IF EXISTS sale_orders_payment_status_check;

-- Add proper CHECK constraint for payment_status
ALTER TABLE sale_orders 
ADD CONSTRAINT sale_orders_payment_status_check 
CHECK (payment_status IN ('pending', 'cash_pending', 'advance_paid', 'fully_paid'));

-- Update existing NULL values to defaults
UPDATE sale_orders 
SET payment_mode = 'cash' 
WHERE payment_mode IS NULL;

UPDATE sale_orders 
SET payment_status = 'pending' 
WHERE payment_status IS NULL;

-- Add comments
COMMENT ON COLUMN sale_orders.payment_mode IS 'Payment method: cash (COD) or online (gateway)';
COMMENT ON COLUMN sale_orders.payment_status IS 'Payment status: pending, cash_pending, advance_paid (50%), fully_paid';

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_sale_orders_payment_mode ON sale_orders(payment_mode);
CREATE INDEX IF NOT EXISTS idx_sale_orders_payment_status ON sale_orders(payment_status);

