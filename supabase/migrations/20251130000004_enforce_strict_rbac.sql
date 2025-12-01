-- ============================================================================
-- ENFORCE STRICT RBAC ON CORE TABLES
-- ============================================================================
-- This migration standardizes RLS policies across orders, sale_orders, and job_cards
-- to use the secure, non-recursive helper functions defined in 20251130000003.

-- 1. ORDERS TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Staff and admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Staff and admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;

-- Customer Policies
CREATE POLICY "Customers can view own orders"
ON public.orders FOR SELECT TO authenticated
USING (customer_id = auth.uid());

CREATE POLICY "Customers can create own orders"
ON public.orders FOR INSERT TO authenticated
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update own orders"
ON public.orders FOR UPDATE TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

-- Staff/Admin Policies (View & Update)
CREATE POLICY "Staff and admins can view all orders"
ON public.orders FOR SELECT TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can update all orders"
ON public.orders FOR UPDATE TO authenticated
USING (public.is_staff_or_admin(auth.uid()))
WITH CHECK (public.is_staff_or_admin(auth.uid()));

-- Admin Policies (Delete)
CREATE POLICY "Admins can delete orders"
ON public.orders FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));


-- 2. SALE_ORDERS TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Customers can view own sale orders" ON public.sale_orders;
DROP POLICY IF EXISTS "Customers can create own sale orders" ON public.sale_orders;
DROP POLICY IF EXISTS "Customers can update own sale orders" ON public.sale_orders;
DROP POLICY IF EXISTS "Customers can verify OTP" ON public.sale_orders;
DROP POLICY IF EXISTS "Staff can view all sale orders" ON public.sale_orders;
DROP POLICY IF EXISTS "Staff can insert sale orders" ON public.sale_orders;
DROP POLICY IF EXISTS "Staff can update sale orders" ON public.sale_orders;

-- Customer Policies
CREATE POLICY "Customers can view own sale orders"
ON public.sale_orders FOR SELECT TO authenticated
USING (customer_id = auth.uid());

CREATE POLICY "Customers can create own sale orders"
ON public.sale_orders FOR INSERT TO authenticated
WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update own sale orders"
ON public.sale_orders FOR UPDATE TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

-- Staff/Admin Policies
CREATE POLICY "Staff and admins can view all sale orders"
ON public.sale_orders FOR SELECT TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can insert sale orders"
ON public.sale_orders FOR INSERT TO authenticated
WITH CHECK (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can update sale orders"
ON public.sale_orders FOR UPDATE TO authenticated
USING (public.is_staff_or_admin(auth.uid()))
WITH CHECK (public.is_staff_or_admin(auth.uid()));

-- Admin Policies (Delete)
CREATE POLICY "Admins can delete sale orders"
ON public.sale_orders FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));


-- 3. JOB_CARDS TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Staff can view all job cards" ON public.job_cards;
DROP POLICY IF EXISTS "Staff can manage job cards" ON public.job_cards;
DROP POLICY IF EXISTS "Customers can view own job cards" ON public.job_cards;

-- Customer Policies (View only, linked via order)
CREATE POLICY "Customers can view own job cards"
ON public.job_cards FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = job_cards.order_id
    AND orders.customer_id = auth.uid()
  )
);

-- Staff/Admin Policies (Full Access)
CREATE POLICY "Staff and admins can view all job cards"
ON public.job_cards FOR SELECT TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can manage job cards"
ON public.job_cards FOR ALL TO authenticated
USING (public.is_staff_or_admin(auth.uid()))
WITH CHECK (public.is_staff_or_admin(auth.uid()));
