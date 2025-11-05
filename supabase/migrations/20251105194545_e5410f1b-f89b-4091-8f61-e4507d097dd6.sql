-- Extend customer_orders table
ALTER TABLE customer_orders 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS saved_for_later BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Extend orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS expected_delivery_date DATE,
ADD COLUMN IF NOT EXISTS special_instructions TEXT,
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_gateway TEXT,
ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS invoice_url TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS fabric_availability_checked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS production_capacity_checked BOOLEAN DEFAULT false;

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  payment_gateway TEXT NOT NULL,
  payment_method TEXT,
  amount_rs NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL,
  payment_type TEXT NOT NULL,
  gateway_response JSONB DEFAULT '{}',
  refund_amount_rs NUMERIC DEFAULT 0,
  refund_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create order_timeline table
CREATE TABLE IF NOT EXISTS order_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_timeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_transactions
CREATE POLICY "Customers view own payment transactions"
ON payment_transactions FOR SELECT
USING (
  order_id IN (
    SELECT id FROM orders WHERE customer_id = auth.uid()
  )
);

CREATE POLICY "Admin full access payment transactions"
ON payment_transactions FOR ALL
USING (is_admin_or_manager(auth.uid()));

-- RLS Policies for order_timeline
CREATE POLICY "Customers view own order timeline"
ON order_timeline FOR SELECT
USING (
  order_id IN (
    SELECT id FROM orders WHERE customer_id = auth.uid()
  )
);

CREATE POLICY "Admin full access order timeline"
ON order_timeline FOR ALL
USING (is_admin_or_manager(auth.uid()));

-- Add trigger for payment_transactions updated_at
CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_order_timeline_order_id ON order_timeline(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_orders_share_token ON customer_orders(share_token) WHERE share_token IS NOT NULL;