-- ============================================================================
-- COMPREHENSIVE RLS FIXES & JOB CARD LOGIC FIXES
-- ============================================================================

-- 1. FIX SALE_ORDERS RLS POLICIES
-- Drop existing policies that use wrong profile references
DROP POLICY IF EXISTS "Customers can view own sale orders" ON sale_orders;
DROP POLICY IF EXISTS "Customers can create own sale orders" ON sale_orders;
DROP POLICY IF EXISTS "Customers can update own sale orders" ON sale_orders;
DROP POLICY IF EXISTS "Staff can view all sale orders" ON sale_orders;
DROP POLICY IF EXISTS "Staff can insert sale orders" ON sale_orders;
DROP POLICY IF EXISTS "Staff can update sale orders" ON sale_orders;
DROP POLICY IF EXISTS "Customers can verify OTP" ON sale_orders;
DROP POLICY IF EXISTS "Staff and admins can view all sale orders" ON sale_orders;
DROP POLICY IF EXISTS "Staff and admins can create sale orders" ON sale_orders;
DROP POLICY IF EXISTS "Staff and admins can update all sale orders" ON sale_orders;

-- Recreate with correct helper functions
CREATE POLICY "Customers can view own sale orders"
  ON sale_orders FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Staff and admins can view all sale orders"
  ON sale_orders FOR SELECT TO authenticated
  USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Customers can create own sale orders"
  ON sale_orders FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Staff and admins can create sale orders"
  ON sale_orders FOR INSERT TO authenticated
  WITH CHECK (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Customers can update own sale orders"
  ON sale_orders FOR UPDATE TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Staff and admins can update all sale orders"
  ON sale_orders FOR UPDATE TO authenticated
  USING (public.is_staff_or_admin(auth.uid()))
  WITH CHECK (public.is_staff_or_admin(auth.uid()));

-- 2. FIX JOB_CARDS RLS POLICIES
-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Staff read assigned job cards" ON job_cards;
DROP POLICY IF EXISTS "Staff update assigned job cards" ON job_cards;
DROP POLICY IF EXISTS "Admin full access job cards" ON job_cards;
DROP POLICY IF EXISTS "Customers can view own job cards" ON job_cards;
DROP POLICY IF EXISTS "Staff and admins can view all job cards" ON job_cards;
DROP POLICY IF EXISTS "Staff and admins can update all job cards" ON job_cards;
DROP POLICY IF EXISTS "Staff and admins can create job cards" ON job_cards;
DROP POLICY IF EXISTS "Admins can delete job cards" ON job_cards;
DROP POLICY IF EXISTS "Factory staff can view assigned job cards" ON job_cards;
DROP POLICY IF EXISTS "Factory staff can update assigned job cards" ON job_cards;

-- Factory staff can only see their assigned job cards
CREATE POLICY "Factory staff can view assigned job cards"
  ON job_cards FOR SELECT TO authenticated
  USING (
    (public.get_user_role(auth.uid()) = 'factory_staff' AND assigned_to = auth.uid())
    OR public.is_staff_or_admin(auth.uid())  -- Staff/admin see all
  );

-- Factory staff can update their assigned job cards
CREATE POLICY "Factory staff can update assigned job cards"
  ON job_cards FOR UPDATE TO authenticated
  USING (
    (public.get_user_role(auth.uid()) = 'factory_staff' AND assigned_to = auth.uid())
    OR public.is_staff_or_admin(auth.uid())  -- Staff/admin can update all
  )
  WITH CHECK (
    (public.get_user_role(auth.uid()) = 'factory_staff' AND assigned_to = auth.uid())
    OR public.is_staff_or_admin(auth.uid())
  );

-- Staff and admins can create job cards
CREATE POLICY "Staff and admins can create job cards"
  ON job_cards FOR INSERT TO authenticated
  WITH CHECK (public.is_staff_or_admin(auth.uid()));

-- Admins can delete job cards
CREATE POLICY "Admins can delete job cards"
  ON job_cards FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Customers can view job cards for their orders
CREATE POLICY "Customers can view own job cards"
  ON job_cards FOR SELECT TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id = auth.uid()
    )
  );

-- 3. FIX ORDER_ITEMS RLS POLICIES
-- Ensure staff can insert order items (needed for checkout)
DROP POLICY IF EXISTS "Staff and admin can insert order items" ON order_items;
CREATE POLICY "Staff and admin can insert order items"
  ON order_items FOR INSERT TO authenticated
  WITH CHECK (public.is_staff_or_admin(auth.uid()));

-- 4. ENSURE SALE_ORDER_ID COLUMN EXISTS IN JOB_CARDS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_cards' AND column_name = 'sale_order_id'
  ) THEN
    ALTER TABLE job_cards
    ADD COLUMN sale_order_id uuid REFERENCES sale_orders(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_job_cards_sale_order ON job_cards(sale_order_id);
  END IF;
END $$;

-- 5. ADD MISSING COLUMNS TO SALE_ORDERS IF NEEDED
DO $$
BEGIN
  -- Add order_number if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sale_orders' AND column_name = 'order_number'
  ) THEN
    ALTER TABLE sale_orders ADD COLUMN order_number text;
    CREATE INDEX IF NOT EXISTS idx_sale_orders_order_number ON sale_orders(order_number);
  END IF;

  -- Add customer fields if missing (check each individually)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sale_orders' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE sale_orders ADD COLUMN customer_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sale_orders' AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE sale_orders ADD COLUMN customer_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sale_orders' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE sale_orders ADD COLUMN customer_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sale_orders' AND column_name = 'customer_address'
  ) THEN
    ALTER TABLE sale_orders ADD COLUMN customer_address jsonb;
  END IF;

  -- Add PDF fields if missing (check each individually)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sale_orders' AND column_name = 'draft_pdf_url'
  ) THEN
    ALTER TABLE sale_orders ADD COLUMN draft_pdf_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sale_orders' AND column_name = 'final_pdf_url'
  ) THEN
    ALTER TABLE sale_orders ADD COLUMN final_pdf_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sale_orders' AND column_name = 'draft_html'
  ) THEN
    ALTER TABLE sale_orders ADD COLUMN draft_html text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sale_orders' AND column_name = 'final_html'
  ) THEN
    ALTER TABLE sale_orders ADD COLUMN final_html text;
  END IF;

  -- Add require_otp if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sale_orders' AND column_name = 'require_otp'
  ) THEN
    ALTER TABLE sale_orders ADD COLUMN require_otp boolean DEFAULT false;
  END IF;
END $$;

-- 6. ADD MISSING COLUMNS TO JOB_CARDS IF NEEDED
DO $$
BEGIN
  -- Add customer fields if missing (check each individually)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_cards' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE job_cards ADD COLUMN customer_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_cards' AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE job_cards ADD COLUMN customer_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_cards' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE job_cards ADD COLUMN customer_phone text;
  END IF;

  -- Add HTML fields if missing (check each individually)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_cards' AND column_name = 'draft_html'
  ) THEN
    ALTER TABLE job_cards ADD COLUMN draft_html text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_cards' AND column_name = 'final_html'
  ) THEN
    ALTER TABLE job_cards ADD COLUMN final_html text;
  END IF;

  -- Add so_number if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job_cards' AND column_name = 'so_number'
  ) THEN
    ALTER TABLE job_cards ADD COLUMN so_number text;
  END IF;
END $$;

-- 7. CREATE FUNCTION TO SYNC SALE ORDER DATA FROM ORDERS
CREATE OR REPLACE FUNCTION sync_sale_order_from_order()
RETURNS TRIGGER AS $$
BEGIN
  -- When order is updated, sync to related sale orders
  IF TG_OP = 'UPDATE' THEN
    UPDATE sale_orders
    SET
      customer_name = NEW.customer_name,
      customer_email = NEW.customer_email,
      customer_phone = NEW.customer_phone,
      customer_address = NEW.delivery_address,
      updated_at = NOW()
    WHERE order_id = NEW.id
    AND (
      customer_name IS DISTINCT FROM NEW.customer_name
      OR customer_email IS DISTINCT FROM NEW.customer_email
      OR customer_phone IS DISTINCT FROM NEW.customer_phone
      OR customer_address IS DISTINCT FROM NEW.delivery_address
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync order data to sale orders
DROP TRIGGER IF EXISTS trigger_sync_sale_order_from_order ON orders;
CREATE TRIGGER trigger_sync_sale_order_from_order
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_sale_order_from_order();

-- 8. CREATE FUNCTION TO AUTO-POPULATE SALE ORDER NUMBER
CREATE OR REPLACE FUNCTION set_sale_order_number()
RETURNS TRIGGER AS $$
BEGIN
  -- If order_number is not set, get it from orders table
  IF NEW.order_id IS NOT NULL AND (NEW.order_number IS NULL OR NEW.order_number = '') THEN
    SELECT order_number INTO NEW.order_number
    FROM orders
    WHERE id = NEW.order_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set order_number
DROP TRIGGER IF EXISTS trigger_set_sale_order_number ON sale_orders;
CREATE TRIGGER trigger_set_sale_order_number
  BEFORE INSERT OR UPDATE ON sale_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_sale_order_number();

-- 9. ADD COMMENTS
COMMENT ON POLICY "Factory staff can view assigned job cards" ON job_cards IS 
  'Factory staff can only see job cards assigned to them. Staff/admin can see all.';
COMMENT ON POLICY "Customers can view own job cards" ON job_cards IS 
  'Customers can view job cards for their own orders.';
COMMENT ON FUNCTION sync_sale_order_from_order() IS 
  'Syncs customer data from orders table to sale_orders when order is updated.';
COMMENT ON FUNCTION set_sale_order_number() IS 
  'Auto-populates sale_order.order_number from orders.order_number.';

