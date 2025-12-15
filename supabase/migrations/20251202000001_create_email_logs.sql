-- ===============================================
-- EMAIL LOGGING TABLE
-- ===============================================

CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Email details
  recipient_email text NOT NULL,
  recipient_name text,
  subject text NOT NULL,
  email_type text NOT NULL, -- 'otp', 'sale_order', 'job_card', 'custom'
  
  -- Related entities
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  sale_order_id uuid REFERENCES sale_orders(id) ON DELETE SET NULL,
  job_card_id uuid REFERENCES job_cards(id) ON DELETE SET NULL,
  
  -- Email status
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'bounced'
  error_message text,
  
  -- Provider details
  provider text DEFAULT 'resend',
  provider_message_id text,
  provider_response jsonb,
  
  -- Metadata
  metadata jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_order ON email_logs(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_logs_sale_order ON email_logs(sale_order_id) WHERE sale_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Customers can view their own email logs
CREATE POLICY "Customers view own email logs"
  ON email_logs FOR SELECT
  USING (
    recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Staff/Admin can view all email logs
CREATE POLICY "Staff view all email logs"
  ON email_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff', 'store_manager', 'production_manager')
    )
  );

-- System can insert email logs (via service role)
CREATE POLICY "System can insert email logs"
  ON email_logs FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS

-- Function to clean up old email logs (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_email_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM email_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

COMMENT ON TABLE email_logs IS 'Logs all emails sent through the system for monitoring and debugging';
COMMENT ON COLUMN email_logs.email_type IS 'Type of email: otp, sale_order, job_card, custom';
COMMENT ON COLUMN email_logs.status IS 'Email status: pending, sent, delivered, failed, bounced';













