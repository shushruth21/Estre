-- ============================================================================
-- SALE ORDERS TABLE - Enterprise Checkout Workflow
-- ============================================================================

CREATE TABLE IF NOT EXISTS sale_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Status workflow
  -- Values: pending_staff_review, awaiting_pdf_generation, pdf_ready, 
  --         awaiting_customer_otp, confirmed_by_customer, advance_paid, cancelled
  status text NOT NULL DEFAULT 'pending_staff_review',
  
  -- Pricing
  base_price numeric NOT NULL,
  discount numeric DEFAULT 0,
  final_price numeric NOT NULL,
  
  -- PDF & OTP
  pdf_url text,
  otp_code text,
  otp_expires_at timestamptz,
  otp_verified_at timestamptz,
  
  -- Payment
  advance_amount_rs numeric DEFAULT 0,
  advance_paid_at timestamptz,
  payment_transaction_id text,
  payment_gateway text,
  
  -- Order reference (links to original order)
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  staff_notes text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sale_orders_status ON sale_orders(status);
CREATE INDEX IF NOT EXISTS idx_sale_orders_customer ON sale_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sale_orders_order ON sale_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_sale_orders_otp ON sale_orders(otp_code) WHERE otp_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sale_orders_created ON sale_orders(created_at DESC);

-- Enable RLS
ALTER TABLE sale_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Customers can only view their own sale orders
CREATE POLICY "Customers can view own sale orders"
  ON sale_orders FOR SELECT
  USING (auth.uid() = customer_id);

-- Staff/Admin can view all sale orders
CREATE POLICY "Staff can view all sale orders"
  ON sale_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  );

-- Staff/Admin can insert sale orders (for system use)
CREATE POLICY "Staff can insert sale orders"
  ON sale_orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
    OR auth.uid() = customer_id  -- Customers can create their own sale orders
  );

-- Staff/Admin can update sale orders
CREATE POLICY "Staff can update sale orders"
  ON sale_orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  );

-- Customers can update their own sale orders (for OTP verification)
CREATE POLICY "Customers can verify OTP"
  ON sale_orders FOR UPDATE
  USING (auth.uid() = customer_id)
  WITH CHECK (
    auth.uid() = customer_id
    AND (status = 'awaiting_customer_otp' OR status = 'confirmed_by_customer')
  );

-- Add comments
COMMENT ON TABLE sale_orders IS 'Sale orders table for enterprise checkout workflow with staff review, PDF generation, OTP verification, and payment';
COMMENT ON COLUMN sale_orders.status IS 'Workflow status: pending_staff_review -> awaiting_pdf_generation -> pdf_ready -> awaiting_customer_otp -> confirmed_by_customer -> advance_paid';
COMMENT ON COLUMN sale_orders.base_price IS 'Original price before discount';
COMMENT ON COLUMN sale_orders.discount IS 'Discount amount applied by staff';
COMMENT ON COLUMN sale_orders.final_price IS 'Final price after discount (base_price - discount)';
COMMENT ON COLUMN sale_orders.otp_code IS '6-digit OTP for customer confirmation';
COMMENT ON COLUMN sale_orders.otp_expires_at IS 'OTP expiration timestamp (10 minutes from generation)';

