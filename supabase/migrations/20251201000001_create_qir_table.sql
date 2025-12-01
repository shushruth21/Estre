-- Create Quality Inspection Reports table
CREATE TABLE IF NOT EXISTS quality_inspection_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  qir_number TEXT NOT NULL UNIQUE,
  sale_order_number TEXT NOT NULL,
  job_card_number TEXT NOT NULL,
  inspection_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  inspector_name TEXT,
  inspection_data JSONB DEFAULT '{}'::jsonb,
  status TEXT CHECK (status IN ('pending', 'passed', 'failed', 'rework_needed')) DEFAULT 'pending',
  qc_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_qir_job_card_id ON quality_inspection_reports(job_card_id);
CREATE INDEX IF NOT EXISTS idx_qir_status ON quality_inspection_reports(status);
CREATE INDEX IF NOT EXISTS idx_qir_sale_order_number ON quality_inspection_reports(sale_order_number);

-- Add RLS policies
ALTER TABLE quality_inspection_reports ENABLE ROW LEVEL SECURITY;

-- Staff and admin can view all QIRs
CREATE POLICY "Staff and admin can view all QIRs"
  ON quality_inspection_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('staff', 'admin', 'production_manager', 'store_manager', 'factory_staff', 'ops_team', 'super_admin')
    )
  );

-- Staff and admin can insert QIRs
CREATE POLICY "Staff and admin can insert QIRs"
  ON quality_inspection_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('staff', 'admin', 'production_manager', 'store_manager', 'factory_staff', 'ops_team', 'super_admin')
    )
  );

-- Staff and admin can update QIRs
CREATE POLICY "Staff and admin can update QIRs"
  ON quality_inspection_reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('staff', 'admin', 'production_manager', 'store_manager', 'factory_staff', 'ops_team', 'super_admin')
    )
  );

-- Staff and admin can delete QIRs
CREATE POLICY "Staff and admin can delete QIRs"
  ON quality_inspection_reports
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_qir_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_qir_timestamp
  BEFORE UPDATE ON quality_inspection_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_qir_updated_at();
