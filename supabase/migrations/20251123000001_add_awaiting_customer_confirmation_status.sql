-- ============================================================================
-- ADD AWAITING_CUSTOMER_CONFIRMATION STATUS SUPPORT
-- ============================================================================
-- This migration updates sale_orders to support the new workflow status
-- Note: sale_orders.status is text, not enum, so we can add values directly

-- Update any existing orders if needed (optional - for migration)
-- UPDATE sale_orders 
-- SET status = 'awaiting_customer_confirmation'
-- WHERE status = 'awaiting_pdf_generation';

-- Add comment to document the new workflow
COMMENT ON COLUMN sale_orders.status IS 'Workflow status: pending_staff_review -> awaiting_customer_confirmation -> confirmed_by_customer/confirmed_no_payment_required -> advance_paid';

-- Add index for better query performance on new status
CREATE INDEX IF NOT EXISTS idx_sale_orders_awaiting_confirmation 
ON sale_orders(status) 
WHERE status = 'awaiting_customer_confirmation';

