-- ============================================================================
-- ADD PAYMENT MODE AND PAYMENT STATUS TO SALE_ORDERS
-- ============================================================================
-- This migration adds payment_mode and payment_status columns to sale_orders
-- to support the new workflow: cash vs online payment

-- Add payment_mode column (without CHECK constraint - add constraint separately)
ALTER TABLE sale_orders 
ADD COLUMN IF NOT EXISTS payment_mode text DEFAULT 'cash';

-- Add CHECK constraint for payment_mode
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sale_orders_payment_mode_check'
  ) THEN
    ALTER TABLE sale_orders 
    ADD CONSTRAINT sale_orders_payment_mode_check 
    CHECK (payment_mode IN ('cash', 'online'));
  END IF;
END $$;

-- Add payment_status column (without CHECK constraint - add constraint separately)
ALTER TABLE sale_orders 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';

-- Add CHECK constraint for payment_status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sale_orders_payment_status_check'
  ) THEN
    ALTER TABLE sale_orders 
    ADD CONSTRAINT sale_orders_payment_status_check 
    CHECK (payment_status IN ('pending', 'cash_pending', 'advance_paid', 'fully_paid'));
  END IF;
END $$;

-- Update status comment to reflect new workflow
COMMENT ON COLUMN sale_orders.status IS 'Workflow: pending_review -> staff_approved -> awaiting_payment/confirmed -> in_production -> qc_complete -> out_for_delivery -> completed';

-- Add comments
COMMENT ON COLUMN sale_orders.payment_mode IS 'Payment method: cash (COD) or online (gateway)';
COMMENT ON COLUMN sale_orders.payment_status IS 'Payment status: pending, cash_pending, advance_paid (50%), fully_paid';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_sale_orders_payment_mode ON sale_orders(payment_mode);
CREATE INDEX IF NOT EXISTS idx_sale_orders_payment_status ON sale_orders(payment_status);

