-- ============================================================================
-- ADD DRAFT PDF AND REQUIRE OTP FIELDS TO SALE_ORDERS
-- ============================================================================
-- This migration adds draft_pdf_url, final_pdf_url, and require_otp columns
-- to support the new workflow: draft PDF preview and optional OTP verification

-- Add draft PDF URL column
ALTER TABLE sale_orders 
ADD COLUMN IF NOT EXISTS draft_pdf_url text;

-- Add final PDF URL column
ALTER TABLE sale_orders 
ADD COLUMN IF NOT EXISTS final_pdf_url text;

-- Add require OTP flag
ALTER TABLE sale_orders 
ADD COLUMN IF NOT EXISTS require_otp boolean DEFAULT false;

-- Migrate existing pdf_url to final_pdf_url (if pdf_url exists and final_pdf_url is null)
UPDATE sale_orders 
SET final_pdf_url = pdf_url 
WHERE pdf_url IS NOT NULL AND final_pdf_url IS NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sale_orders_require_otp ON sale_orders(require_otp);
CREATE INDEX IF NOT EXISTS idx_sale_orders_draft_pdf ON sale_orders(draft_pdf_url) WHERE draft_pdf_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sale_orders_final_pdf ON sale_orders(final_pdf_url) WHERE final_pdf_url IS NOT NULL;

-- Add comments
COMMENT ON COLUMN sale_orders.draft_pdf_url IS 'Draft PDF URL for staff preview (not sent to customer)';
COMMENT ON COLUMN sale_orders.final_pdf_url IS 'Final PDF URL sent to customer after approval';
COMMENT ON COLUMN sale_orders.require_otp IS 'Whether OTP verification is required for customer confirmation (default: false)';

