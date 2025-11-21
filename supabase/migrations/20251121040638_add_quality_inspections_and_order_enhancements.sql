/*
  # Add Quality Inspections and Order Enhancements
  
  1. New Tables
    - `quality_inspections`
      - `id` (uuid, primary key)
      - `job_card_id` (uuid, references job_cards)
      - `order_id` (uuid, references orders)
      - `qc_status` (text: pass, fail, pending)
      - `stitching_rating` (integer, 1-5)
      - `frame_alignment_rating` (integer, 1-5)
      - `lounger_test_rating` (integer, 1-5)
      - `console_alignment_rating` (integer, 1-5)
      - `electrical_test_rating` (integer, 1-5)
      - `overall_rating` (numeric, calculated)
      - `qc_notes` (text)
      - `qc_images` (text array, URLs to Supabase Storage)
      - `inspected_by` (uuid, references auth.users)
      - `inspected_at` (timestamptz)
      - `approved_by` (uuid, references auth.users)
      - `approved_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to orders table
    - Add `pdf_url` (text, Sale Order PDF URL)
    - Add `pdf_generated_at` (timestamptz)
    - Add `pdf_sent_at` (timestamptz)
    - Add `pdf_sent_to` (text, email address)
    - Add `courier_partner` (text)
    - Add `tracking_number` (text)
    - Add `tracking_url` (text)
    - Add `manual_price_override` (numeric, admin override price)
    - Add `override_reason` (text)
    - Add `override_by` (uuid, references auth.users)
    - Add `override_at` (timestamptz)

  3. Changes to job_cards table
    - Add `production_team` (text)
    - Add `estimated_completion_hours` (integer)
    - Add `qc_report_url` (text, QIR PDF/Report URL)

  4. Security
    - Enable RLS on quality_inspections table
    - Add policies for staff and admin to manage QC reports
    - Add policies for customers to view their own QC reports
*/

-- ============================================
-- 1. CREATE QUALITY INSPECTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS quality_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id uuid REFERENCES job_cards(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  
  -- QC Status
  qc_status text DEFAULT 'pending' CHECK (qc_status IN ('pending', 'pass', 'fail')),
  
  -- Rating fields (1-5 scale)
  stitching_rating integer CHECK (stitching_rating >= 1 AND stitching_rating <= 5),
  frame_alignment_rating integer CHECK (frame_alignment_rating >= 1 AND frame_alignment_rating <= 5),
  lounger_test_rating integer CHECK (lounger_test_rating >= 1 AND lounger_test_rating <= 5),
  console_alignment_rating integer CHECK (console_alignment_rating >= 1 AND console_alignment_rating <= 5),
  electrical_test_rating integer CHECK (electrical_test_rating >= 1 AND electrical_test_rating <= 5),
  
  -- Overall rating (calculated from individual ratings)
  overall_rating numeric GENERATED ALWAYS AS (
    (COALESCE(stitching_rating, 0) + 
     COALESCE(frame_alignment_rating, 0) + 
     COALESCE(lounger_test_rating, 0) + 
     COALESCE(console_alignment_rating, 0) + 
     COALESCE(electrical_test_rating, 0)) / 
    NULLIF(
      (CASE WHEN stitching_rating IS NOT NULL THEN 1 ELSE 0 END +
       CASE WHEN frame_alignment_rating IS NOT NULL THEN 1 ELSE 0 END +
       CASE WHEN lounger_test_rating IS NOT NULL THEN 1 ELSE 0 END +
       CASE WHEN console_alignment_rating IS NOT NULL THEN 1 ELSE 0 END +
       CASE WHEN electrical_test_rating IS NOT NULL THEN 1 ELSE 0 END), 0)
  ) STORED,
  
  -- Notes and images
  qc_notes text,
  qc_images text[] DEFAULT '{}',
  
  -- Inspection metadata
  inspected_by uuid REFERENCES auth.users(id),
  inspected_at timestamptz DEFAULT now(),
  
  -- Approval metadata
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quality_inspections_job_card ON quality_inspections(job_card_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_order ON quality_inspections(order_id);
CREATE INDEX IF NOT EXISTS idx_quality_inspections_status ON quality_inspections(qc_status);

-- ============================================
-- 2. ADD COLUMNS TO ORDERS TABLE
-- ============================================

-- PDF tracking columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'pdf_url'
  ) THEN
    ALTER TABLE orders ADD COLUMN pdf_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'pdf_generated_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN pdf_generated_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'pdf_sent_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN pdf_sent_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'pdf_sent_to'
  ) THEN
    ALTER TABLE orders ADD COLUMN pdf_sent_to text;
  END IF;
END $$;

-- Dispatch/courier tracking columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'courier_partner'
  ) THEN
    ALTER TABLE orders ADD COLUMN courier_partner text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'tracking_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN tracking_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'tracking_url'
  ) THEN
    ALTER TABLE orders ADD COLUMN tracking_url text;
  END IF;
END $$;

-- Admin override columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'manual_price_override'
  ) THEN
    ALTER TABLE orders ADD COLUMN manual_price_override numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'override_reason'
  ) THEN
    ALTER TABLE orders ADD COLUMN override_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'override_by'
  ) THEN
    ALTER TABLE orders ADD COLUMN override_by uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'override_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN override_at timestamptz;
  END IF;
END $$;

-- ============================================
-- 3. ADD COLUMNS TO JOB_CARDS TABLE
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_cards' AND column_name = 'production_team'
  ) THEN
    ALTER TABLE job_cards ADD COLUMN production_team text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_cards' AND column_name = 'estimated_completion_hours'
  ) THEN
    ALTER TABLE job_cards ADD COLUMN estimated_completion_hours integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_cards' AND column_name = 'qc_report_url'
  ) THEN
    ALTER TABLE job_cards ADD COLUMN qc_report_url text;
  END IF;
END $$;

-- ============================================
-- 4. ENABLE RLS ON QUALITY_INSPECTIONS
-- ============================================

ALTER TABLE quality_inspections ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS POLICIES FOR QUALITY_INSPECTIONS
-- ============================================

-- Staff and admin can view all QC reports
CREATE POLICY "Staff and admin can view all QC reports"
ON quality_inspections
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'staff', 'store_manager', 'production_manager', 'factory_staff')
  )
);

-- Customers can view QC reports for their own orders
CREATE POLICY "Customers can view own order QC reports"
ON quality_inspections
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = quality_inspections.order_id
    AND o.customer_id = auth.uid()
  )
);

-- Staff can create QC reports
CREATE POLICY "Staff can create QC reports"
ON quality_inspections
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'staff', 'factory_staff', 'store_manager', 'production_manager')
  )
);

-- Staff can update QC reports they created or if they're admin
CREATE POLICY "Staff can update QC reports"
ON quality_inspections
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'staff', 'factory_staff', 'store_manager', 'production_manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'staff', 'factory_staff', 'store_manager', 'production_manager')
  )
);

-- Only admins can delete QC reports
CREATE POLICY "Admins can delete QC reports"
ON quality_inspections
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'admin'
  )
);

-- ============================================
-- 6. CREATE UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_quality_inspections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS quality_inspections_updated_at ON quality_inspections;
CREATE TRIGGER quality_inspections_updated_at
  BEFORE UPDATE ON quality_inspections
  FOR EACH ROW
  EXECUTE FUNCTION update_quality_inspections_updated_at();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Quality inspections table created successfully';
  RAISE NOTICE '✅ Orders table enhanced with PDF, tracking, and override fields';
  RAISE NOTICE '✅ Job cards table enhanced with production team and QC fields';
  RAISE NOTICE '✅ RLS policies configured for quality inspections';
END $$;