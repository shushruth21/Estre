-- ============================================================================
-- UPDATE STATUS WORKFLOW FOR SALE_ORDERS
-- ============================================================================
-- This migration ensures sale_orders.status supports the full state machine
-- as specified in the master prompt

-- Note: Since status is already a text field, we don't need to change the column type
-- We just need to ensure the workflow supports all required statuses:
-- pending_review, staff_editing, staff_pdf_generated, staff_approved, 
-- customer_confirmation_pending, customer_confirmed, payment_pending, 
-- payment_completed, ready_for_production, in_production, qc_pending, 
-- qc_done, ready_for_dispatch, out_for_delivery, delivered, completed

-- Update existing statuses to match new workflow
UPDATE sale_orders 
SET status = 'pending_review' 
WHERE status = 'pending_staff_review';

UPDATE sale_orders 
SET status = 'customer_confirmation_pending' 
WHERE status = 'awaiting_customer_otp';

UPDATE sale_orders 
SET status = 'customer_confirmed' 
WHERE status = 'confirmed_by_customer';

-- Add comment with full status workflow
COMMENT ON COLUMN sale_orders.status IS 'Workflow status: pending_review -> staff_editing -> staff_pdf_generated -> staff_approved -> customer_confirmation_pending -> customer_confirmed -> payment_pending -> payment_completed -> ready_for_production -> in_production -> qc_pending -> qc_done -> ready_for_dispatch -> out_for_delivery -> delivered -> completed';

