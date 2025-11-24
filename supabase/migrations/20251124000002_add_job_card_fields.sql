-- ============================================================================
-- ADD MISSING FIELDS TO JOB_CARDS TABLE
-- ============================================================================
-- This migration adds technical_specifications, HTML fields, and product_type
-- to support the complete Job Card workflow

-- Add technical_specifications JSON (stores technical specs, NO pricing)
ALTER TABLE job_cards 
ADD COLUMN IF NOT EXISTS technical_specifications jsonb DEFAULT '{}';

-- Add HTML template fields
ALTER TABLE job_cards 
ADD COLUMN IF NOT EXISTS draft_html text;
ALTER TABLE job_cards 
ADD COLUMN IF NOT EXISTS final_html text;

-- Add product_type field (separate from product_category)
ALTER TABLE job_cards 
ADD COLUMN IF NOT EXISTS product_type text;

-- Verify sale_order_id exists (should already exist from previous migration)
-- If not, add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_cards' AND column_name = 'sale_order_id'
  ) THEN
    ALTER TABLE job_cards 
    ADD COLUMN sale_order_id uuid REFERENCES sale_orders(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_job_cards_sale_order ON job_cards(sale_order_id);
  END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_job_cards_technical_specs ON job_cards USING gin(technical_specifications) WHERE technical_specifications IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_cards_product_type ON job_cards(product_type) WHERE product_type IS NOT NULL;

-- Add comments
COMMENT ON COLUMN job_cards.technical_specifications IS 'Complete technical specifications JSON matching Job Card format (NO pricing)';
COMMENT ON COLUMN job_cards.draft_html IS 'Draft HTML template for staff preview and editing';
COMMENT ON COLUMN job_cards.final_html IS 'Final HTML template used for PDF generation';
COMMENT ON COLUMN job_cards.product_type IS 'Product type (e.g., Standard, Premium) separate from product_category';
COMMENT ON COLUMN job_cards.sale_order_id IS 'Foreign key to sale_orders table for workflow tracking';

