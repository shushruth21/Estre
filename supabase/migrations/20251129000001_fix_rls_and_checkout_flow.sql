-- ============================================================================
-- FIX RLS AND CHECKOUT FLOW
-- ============================================================================

-- 1. Update sale_orders policies to allow customers to confirm orders
-- Drop existing update policy for customers if it exists (it was specific to OTP)
DROP POLICY IF EXISTS "Customers can verify OTP" ON sale_orders;

-- Create comprehensive update policy for customers
CREATE POLICY "Customers can update own sale orders"
  ON sale_orders FOR UPDATE
  USING (auth.uid() = customer_id)
  WITH CHECK (
    auth.uid() = customer_id
    AND (
      -- Allow updating status to confirmed/paid
      status IN ('confirmed_by_customer', 'advance_paid', 'awaiting_customer_otp')
      -- Allow updating payment details
      OR payment_transaction_id IS NOT NULL
    )
  );

-- 2. Ensure orders table allows customers to update status (for initial checkout)
-- Drop potentially restrictive policies
DROP POLICY IF EXISTS "Customers can update own orders" ON orders;

CREATE POLICY "Customers can update own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = customer_id)
  WITH CHECK (
    auth.uid() = customer_id
    -- Allow updating status and payment details
  );

-- 3. Add function to handle single-click checkout confirmation
-- This function can be called by the frontend to atomically update everything
CREATE OR REPLACE FUNCTION confirm_sale_order(
  _sale_order_id UUID,
  _payment_method TEXT,
  _transaction_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _sale_order sale_orders%ROWTYPE;
  _order_id UUID;
BEGIN
  -- Get sale order
  SELECT * INTO _sale_order
  FROM sale_orders
  WHERE id = _sale_order_id;

  IF _sale_order.id IS NULL THEN
    RAISE EXCEPTION 'Sale order not found';
  END IF;

  -- Verify ownership
  IF _sale_order.customer_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update sale order status
  UPDATE sale_orders
  SET 
    status = 'confirmed_by_customer',
    payment_method = _payment_method,
    payment_transaction_id = _transaction_id,
    advance_paid_at = NOW(),
    updated_at = NOW()
  WHERE id = _sale_order_id;

  -- Update original order status
  UPDATE orders
  SET 
    status = 'confirmed',
    payment_status = CASE WHEN _payment_method = 'online' THEN 'paid' ELSE 'pending' END,
    updated_at = NOW()
  WHERE id = _sale_order.order_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 4. Add RPC to increment discount usage
CREATE OR REPLACE FUNCTION increment_discount_usage(code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE discount_codes
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE discount_codes.code = increment_discount_usage.code;
END;
$$;

