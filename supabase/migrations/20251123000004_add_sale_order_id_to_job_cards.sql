-- ============================================================================
-- ADD SALE_ORDER_ID TO JOB_CARDS TABLE
-- ============================================================================
-- This migration adds sale_order_id foreign key to link job cards to sale orders

ALTER TABLE job_cards 
ADD COLUMN IF NOT EXISTS sale_order_id uuid REFERENCES sale_orders(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_job_cards_sale_order ON job_cards(sale_order_id);

-- Add comment
COMMENT ON COLUMN job_cards.sale_order_id IS 'Foreign key to sale_orders table for workflow tracking';

