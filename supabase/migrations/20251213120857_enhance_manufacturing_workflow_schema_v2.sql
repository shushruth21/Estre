/*
  # Enhanced Manufacturing Workflow Schema V2

  This migration enhances the sale_orders, job_cards, and quality_inspections tables
  to support comprehensive manufacturing workflow.

  1. Sale Orders Enhancements
     - Company branding and terms
     - Delivery scheduling
     - Payment tracking
     - Manufacturing specifications

  2. Job Cards Enhancements
     - Fabric meter calculations per item
     - Production timeline tracking
     - Technical specifications
     - Quality checkpoints

  3. Quality Inspections Enhancements
     - Comprehensive checklist structure
     - Defect tracking and categorization
     - Rework recommendations
     - Digital signatures
     - Photo attachments

  4. Security
     - All existing RLS policies remain intact
*/

-- ============================================================================
-- 1. ENHANCE SALE_ORDERS TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_orders' AND column_name = 'company_name') THEN
    ALTER TABLE sale_orders ADD COLUMN company_name text DEFAULT 'Estre';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_orders' AND column_name = 'company_address') THEN
    ALTER TABLE sale_orders ADD COLUMN company_address text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_orders' AND column_name = 'company_phone') THEN
    ALTER TABLE sale_orders ADD COLUMN company_phone text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_orders' AND column_name = 'company_email') THEN
    ALTER TABLE sale_orders ADD COLUMN company_email text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_orders' AND column_name = 'company_gst') THEN
    ALTER TABLE sale_orders ADD COLUMN company_gst text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_orders' AND column_name = 'delivery_date') THEN
    ALTER TABLE sale_orders ADD COLUMN delivery_date date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_orders' AND column_name = 'delivery_terms') THEN
    ALTER TABLE sale_orders ADD COLUMN delivery_terms text DEFAULT 'As per agreed timeline';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_orders' AND column_name = 'payment_terms') THEN
    ALTER TABLE sale_orders ADD COLUMN payment_terms text DEFAULT '50% advance, 50% before delivery';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_orders' AND column_name = 'bank_details') THEN
    ALTER TABLE sale_orders ADD COLUMN bank_details jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_orders' AND column_name = 'terms_and_conditions') THEN
    ALTER TABLE sale_orders ADD COLUMN terms_and_conditions text[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_orders' AND column_name = 'special_instructions') THEN
    ALTER TABLE sale_orders ADD COLUMN special_instructions text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_orders' AND column_name = 'warranty_terms') THEN
    ALTER TABLE sale_orders ADD COLUMN warranty_terms text DEFAULT '1 year manufacturing defects warranty';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_orders' AND column_name = 'prepared_by') THEN
    ALTER TABLE sale_orders ADD COLUMN prepared_by text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_orders' AND column_name = 'approved_by') THEN
    ALTER TABLE sale_orders ADD COLUMN approved_by text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_orders' AND column_name = 'approved_at') THEN
    ALTER TABLE sale_orders ADD COLUMN approved_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_orders' AND column_name = 'draft_pdf_url') THEN
    ALTER TABLE sale_orders ADD COLUMN draft_pdf_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_orders' AND column_name = 'final_pdf_url') THEN
    ALTER TABLE sale_orders ADD COLUMN final_pdf_url text;
  END IF;
END $$;

-- ============================================================================
-- 2. ENHANCE JOB_CARDS TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_cards' AND column_name = 'fabric_calculations') THEN
    ALTER TABLE job_cards ADD COLUMN fabric_calculations jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_cards' AND column_name = 'total_fabric_meters') THEN
    ALTER TABLE job_cards ADD COLUMN total_fabric_meters numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_cards' AND column_name = 'production_start_date') THEN
    ALTER TABLE job_cards ADD COLUMN production_start_date timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_cards' AND column_name = 'technical_specifications') THEN
    ALTER TABLE job_cards ADD COLUMN technical_specifications jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_cards' AND column_name = 'production_notes') THEN
    ALTER TABLE job_cards ADD COLUMN production_notes text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_cards' AND column_name = 'special_requirements') THEN
    ALTER TABLE job_cards ADD COLUMN special_requirements text[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_cards' AND column_name = 'quality_checkpoints') THEN
    ALTER TABLE job_cards ADD COLUMN quality_checkpoints jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_cards' AND column_name = 'materials_issued') THEN
    ALTER TABLE job_cards ADD COLUMN materials_issued boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_cards' AND column_name = 'materials_issued_at') THEN
    ALTER TABLE job_cards ADD COLUMN materials_issued_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_cards' AND column_name = 'materials_issued_by') THEN
    ALTER TABLE job_cards ADD COLUMN materials_issued_by text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_cards' AND column_name = 'customer_email') THEN
    ALTER TABLE job_cards ADD COLUMN customer_email text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_cards' AND column_name = 'sale_order_id') THEN
    ALTER TABLE job_cards ADD COLUMN sale_order_id uuid REFERENCES sale_orders(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_job_cards_sale_order ON job_cards(sale_order_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_cards' AND column_name = 'so_number') THEN
    ALTER TABLE job_cards ADD COLUMN so_number text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_cards' AND column_name = 'draft_html') THEN
    ALTER TABLE job_cards ADD COLUMN draft_html text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_cards' AND column_name = 'final_html') THEN
    ALTER TABLE job_cards ADD COLUMN final_html text;
  END IF;
END $$;

-- ============================================================================
-- 3. ENHANCE QUALITY_INSPECTIONS TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'qir_number') THEN
    ALTER TABLE quality_inspections ADD COLUMN qir_number text UNIQUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'sale_order_number') THEN
    ALTER TABLE quality_inspections ADD COLUMN sale_order_number text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'job_card_number') THEN
    ALTER TABLE quality_inspections ADD COLUMN job_card_number text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'inspection_date') THEN
    ALTER TABLE quality_inspections ADD COLUMN inspection_date timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'inspector_name') THEN
    ALTER TABLE quality_inspections ADD COLUMN inspector_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'inspection_data') THEN
    ALTER TABLE quality_inspections ADD COLUMN inspection_data jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'inspector_signature') THEN
    ALTER TABLE quality_inspections ADD COLUMN inspector_signature text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'passed_checks') THEN
    ALTER TABLE quality_inspections ADD COLUMN passed_checks integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'failed_checks') THEN
    ALTER TABLE quality_inspections ADD COLUMN failed_checks integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'total_checks') THEN
    ALTER TABLE quality_inspections ADD COLUMN total_checks integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'defects_found') THEN
    ALTER TABLE quality_inspections ADD COLUMN defects_found jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'defect_categories') THEN
    ALTER TABLE quality_inspections ADD COLUMN defect_categories text[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'rework_required') THEN
    ALTER TABLE quality_inspections ADD COLUMN rework_required boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'rework_instructions') THEN
    ALTER TABLE quality_inspections ADD COLUMN rework_instructions text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'rework_deadline') THEN
    ALTER TABLE quality_inspections ADD COLUMN rework_deadline timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'rework_completed_at') THEN
    ALTER TABLE quality_inspections ADD COLUMN rework_completed_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'photo_urls') THEN
    ALTER TABLE quality_inspections ADD COLUMN photo_urls text[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'reviewed_by') THEN
    ALTER TABLE quality_inspections ADD COLUMN reviewed_by text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'reviewed_at') THEN
    ALTER TABLE quality_inspections ADD COLUMN reviewed_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'customer_notified') THEN
    ALTER TABLE quality_inspections ADD COLUMN customer_notified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'customer_notified_at') THEN
    ALTER TABLE quality_inspections ADD COLUMN customer_notified_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'pdf_url') THEN
    ALTER TABLE quality_inspections ADD COLUMN pdf_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quality_inspections' AND column_name = 'html_content') THEN
    ALTER TABLE quality_inspections ADD COLUMN html_content text;
  END IF;
END $$;

-- ============================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sale_orders_delivery_date ON sale_orders(delivery_date) WHERE delivery_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sale_orders_approved_at ON sale_orders(approved_at) WHERE approved_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_job_cards_production_start ON job_cards(production_start_date) WHERE production_start_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_cards_expected_completion ON job_cards(expected_completion_date) WHERE expected_completion_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_cards_materials_issued ON job_cards(materials_issued) WHERE materials_issued = true;

CREATE INDEX IF NOT EXISTS idx_qir_rework_required ON quality_inspections(rework_required) WHERE rework_required = true;
CREATE INDEX IF NOT EXISTS idx_qir_qir_number ON quality_inspections(qir_number) WHERE qir_number IS NOT NULL;

-- ============================================================================
-- 5. CREATE HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_qir_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_checks > 0 THEN
    NEW.overall_rating := ROUND((NEW.passed_checks::numeric / NEW.total_checks::numeric) * 5, 2);
  END IF;

  IF NEW.failed_checks > 0 THEN
    NEW.rework_required := true;
  END IF;

  IF NEW.overall_rating IS NOT NULL THEN
    IF NEW.overall_rating >= 4.5 THEN
      NEW.qc_status := 'pass';
    ELSIF NEW.overall_rating >= 3.0 THEN
      NEW.qc_status := 'pending';
    ELSE
      NEW.qc_status := 'fail';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_qir_score ON quality_inspections;
CREATE TRIGGER trigger_calculate_qir_score
  BEFORE INSERT OR UPDATE ON quality_inspections
  FOR EACH ROW
  EXECUTE FUNCTION calculate_qir_score();

CREATE OR REPLACE FUNCTION sync_job_card_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qc_status = 'pass' AND (OLD.qc_status IS NULL OR OLD.qc_status != 'pass') THEN
    UPDATE job_cards
    SET 
      actual_completion_date = CURRENT_DATE,
      quality_approved = true,
      quality_approved_at = NOW()
    WHERE id = NEW.job_card_id
    AND actual_completion_date IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_job_card_completion ON quality_inspections;
CREATE TRIGGER trigger_sync_job_card_completion
  AFTER UPDATE ON quality_inspections
  FOR EACH ROW
  EXECUTE FUNCTION sync_job_card_completion();

-- ============================================================================
-- 6. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN sale_orders.company_name IS 'Company name for sale order header';
COMMENT ON COLUMN sale_orders.delivery_date IS 'Scheduled delivery date';
COMMENT ON COLUMN sale_orders.payment_terms IS 'Payment terms and conditions';
COMMENT ON COLUMN sale_orders.bank_details IS 'Bank account details for payment';
COMMENT ON COLUMN sale_orders.terms_and_conditions IS 'Array of terms and conditions';

COMMENT ON COLUMN job_cards.fabric_calculations IS 'Array of fabric calculations per item';
COMMENT ON COLUMN job_cards.total_fabric_meters IS 'Total fabric meters required';
COMMENT ON COLUMN job_cards.technical_specifications IS 'Technical specs from configurator';
COMMENT ON COLUMN job_cards.quality_checkpoints IS 'Production quality checkpoints';

COMMENT ON COLUMN quality_inspections.inspection_data IS 'Structured checklist data';
COMMENT ON COLUMN quality_inspections.defects_found IS 'Array of defects found';
COMMENT ON COLUMN quality_inspections.rework_instructions IS 'Detailed rework instructions';
COMMENT ON COLUMN quality_inspections.photo_urls IS 'Array of inspection photo URLs';

COMMENT ON FUNCTION calculate_qir_score() IS 'Auto-calculates QIR score and determines status';
COMMENT ON FUNCTION sync_job_card_completion() IS 'Updates job card when QIR passes';
