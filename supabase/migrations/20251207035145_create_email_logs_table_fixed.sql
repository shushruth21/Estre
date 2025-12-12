/*
  # Create email_logs table for tracking sent emails

  1. New Tables
    - `email_logs`
      - `id` (uuid, primary key): Unique identifier for each email log
      - `email_type` (text): Type of email (otp, sale_order, job_card, etc.)
      - `recipient_email` (text): Email address of recipient
      - `recipient_name` (text): Name of recipient
      - `subject` (text): Email subject line
      - `resend_email_id` (text): Resend API response email ID
      - `status` (text): Email status (sent, delivered, bounced, failed)
      - `order_number` (text): Associated order number (if applicable)
      - `sale_order_id` (uuid): Associated sale order ID (if applicable)
      - `metadata` (jsonb): Additional email metadata
      - `error_message` (text): Error details if email failed
      - `sent_at` (timestamptz): When email was sent
      - `created_at` (timestamptz): Record creation timestamp

  2. Security
    - Enable RLS on `email_logs` table
    - Add policy for staff and admin to view all email logs
    - Add policy for customers to view their own email logs

  3. Indexes
    - Index on `recipient_email` for quick lookup
    - Index on `status` for filtering
    - Index on `sent_at` for time-based queries
    - Index on `order_number` for order tracking
*/

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type text NOT NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  subject text NOT NULL,
  resend_email_id text,
  status text DEFAULT 'sent',
  order_number text,
  sale_order_id uuid REFERENCES sale_orders(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  error_message text,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_order_number ON email_logs(order_number);
CREATE INDEX IF NOT EXISTS idx_email_logs_sale_order_id ON email_logs(sale_order_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Staff and admin can view all email logs
CREATE POLICY "Staff and admin can view all email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  );

-- Policy: Customers can view their own email logs (by matching email with auth.users)
CREATE POLICY "Customers can view their own email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (
    recipient_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Policy: System can insert email logs (service role for edge functions)
CREATE POLICY "System can insert email logs"
  ON email_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow service role to insert (for edge functions)
CREATE POLICY "Service role can insert email logs"
  ON email_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Staff and admin can update email status
CREATE POLICY "Staff and admin can update email logs"
  ON email_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('staff', 'admin')
    )
  );

-- Create a function to clean up old email logs (optional - keeps last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_email_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM email_logs
  WHERE sent_at < (now() - interval '90 days');
END;
$$;

-- Add helpful comments for documentation
COMMENT ON TABLE email_logs IS 'Tracks all emails sent by the system for monitoring and analytics';
COMMENT ON COLUMN email_logs.email_type IS 'Type of email: otp, sale_order, job_card, order_confirmation, custom';
COMMENT ON COLUMN email_logs.status IS 'Email delivery status: sent, delivered, bounced, failed';
COMMENT ON COLUMN email_logs.metadata IS 'Additional data like OTP value, PDF URL, attachment info, etc.';
COMMENT ON COLUMN email_logs.resend_email_id IS 'Email ID returned by Resend API for tracking';
