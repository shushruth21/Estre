-- ============================================================================
-- RESTRICT STAFF FROM MANUAL DISCOUNT EDITING AFTER CUSTOMER CREATION
-- BUT ALLOW DISCOUNT CODE APPLICATION
-- ============================================================================

-- Drop existing staff update policy
DROP POLICY IF EXISTS "Staff and admins can update all sale orders" ON sale_orders;

-- Policy 1: Staff can update sale orders BEFORE customer confirmation
-- This allows discount code application and other edits
CREATE POLICY "Staff can update pending sale orders"
  ON sale_orders FOR UPDATE TO authenticated
  USING (
    public.is_staff_or_admin(auth.uid())
    AND status NOT IN ('confirmed_by_customer', 'customer_confirmed', 'advance_paid', 'in_production')
  )
  WITH CHECK (
    public.is_staff_or_admin(auth.uid())
    AND status NOT IN ('confirmed_by_customer', 'customer_confirmed', 'advance_paid', 'in_production')
  );

-- Policy 2: Staff can ONLY update workflow fields AFTER customer confirmation
-- This prevents discount/pricing changes but allows status updates, PDF URLs, OTP
-- Note: We use a function to check if only workflow fields changed
CREATE OR REPLACE FUNCTION check_workflow_only_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If discount, base_price, or final_price changed, reject the update
  IF OLD.discount IS DISTINCT FROM NEW.discount THEN
    RAISE EXCEPTION 'Cannot change discount after customer confirmation';
  END IF;
  
  IF OLD.base_price IS DISTINCT FROM NEW.base_price THEN
    RAISE EXCEPTION 'Cannot change base price after customer confirmation';
  END IF;
  
  IF OLD.final_price IS DISTINCT FROM NEW.final_price THEN
    RAISE EXCEPTION 'Cannot change final price after customer confirmation';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce workflow-only updates after confirmation
DROP TRIGGER IF EXISTS enforce_workflow_only_update ON sale_orders;
CREATE TRIGGER enforce_workflow_only_update
  BEFORE UPDATE ON sale_orders
  FOR EACH ROW
  WHEN (
    OLD.status IN ('confirmed_by_customer', 'customer_confirmed', 'advance_paid', 'in_production')
  )
  EXECUTE FUNCTION check_workflow_only_update();

-- Allow staff to update workflow fields after confirmation
CREATE POLICY "Staff can update workflow after confirmation"
  ON sale_orders FOR UPDATE TO authenticated
  USING (
    public.is_staff_or_admin(auth.uid())
    AND status IN ('confirmed_by_customer', 'customer_confirmed', 'advance_paid', 'in_production')
  )
  WITH CHECK (
    public.is_staff_or_admin(auth.uid())
    AND status IN ('confirmed_by_customer', 'customer_confirmed', 'advance_paid', 'in_production')
  );

COMMENT ON POLICY "Staff can update pending sale orders" ON sale_orders IS 
  'Staff can edit sale orders (including discount codes) before customer confirmation.';
COMMENT ON POLICY "Staff can update workflow after confirmation" ON sale_orders IS 
  'After customer confirmation, staff can only update workflow fields (status, PDF, OTP), not pricing/discount.';
COMMENT ON FUNCTION check_workflow_only_update() IS 
  'Prevents discount/pricing changes after customer confirmation. Allows workflow updates.';




