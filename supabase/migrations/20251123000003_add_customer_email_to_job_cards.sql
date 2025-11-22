-- ============================================================================
-- ADD CUSTOMER_EMAIL TO JOB_CARDS TABLE
-- ============================================================================
-- This migration adds customer_email column to job_cards table for better
-- customer information tracking

ALTER TABLE job_cards 
ADD COLUMN IF NOT EXISTS customer_email text;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_job_cards_customer_email ON job_cards(customer_email);

-- Add comment
COMMENT ON COLUMN job_cards.customer_email IS 'Customer email address (denormalized for staff access)';

