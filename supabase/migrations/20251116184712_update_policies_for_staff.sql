-- ===============================================
-- UPDATE POLICIES AND FUNCTIONS TO USE 'staff' ENUM
-- ===============================================
-- This migration updates RLS policies and functions to include 'staff' enum value.
-- It runs AFTER the enum value has been committed in a previous migration.

-- Update the is_staff function to include 'staff'
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role IN ('staff', 'factory_staff')
  );
$$;

-- Update the is_staff_or_admin function to include 'staff'
CREATE OR REPLACE FUNCTION public.is_staff_or_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role IN ('staff', 'admin', 'factory_staff')
  );
$$;

-- Update the "Staff and admins can view all profiles" policy to include 'staff'
DROP POLICY IF EXISTS "Staff and admins can view all profiles" ON public.profiles;
CREATE POLICY "Staff and admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'staff', 'factory_staff')
  )
);

-- ===============================================
-- UPDATE ALL RLS POLICIES TO INCLUDE 'staff'
-- ===============================================
-- Update all policies that check for staff/admin roles to include 'staff'

-- ORDERS TABLE POLICIES
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
);

DROP POLICY IF EXISTS "Customers can create own orders" ON public.orders;
CREATE POLICY "Customers can create own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
);

DROP POLICY IF EXISTS "Customers can update own orders" ON public.orders;
CREATE POLICY "Customers can update own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
)
WITH CHECK (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
);

DROP POLICY IF EXISTS "Staff and admins can view all orders" ON public.orders;
CREATE POLICY "Staff and admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
);

DROP POLICY IF EXISTS "Staff and admins can update all orders" ON public.orders;
CREATE POLICY "Staff and admins can update all orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
);

-- ORDER_ITEMS TABLE POLICIES
DROP POLICY IF EXISTS "Customers can view own order items" ON public.order_items;
CREATE POLICY "Customers can view own order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND o.customer_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
);

DROP POLICY IF EXISTS "Staff and admins can view all order items" ON public.order_items;
CREATE POLICY "Staff and admins can view all order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
);

DROP POLICY IF EXISTS "Staff and admins can update all order items" ON public.order_items;
CREATE POLICY "Staff and admins can update all order items"
ON public.order_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
);

-- JOB_CARDS TABLE POLICIES
DROP POLICY IF EXISTS "Customers can view own job cards" ON public.job_cards;
CREATE POLICY "Customers can view own job cards"
ON public.job_cards
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = job_cards.order_id
    AND o.customer_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
);

DROP POLICY IF EXISTS "Staff and admins can view all job cards" ON public.job_cards;
CREATE POLICY "Staff and admins can view all job cards"
ON public.job_cards
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
);

DROP POLICY IF EXISTS "Staff and admins can update all job cards" ON public.job_cards;
CREATE POLICY "Staff and admins can update all job cards"
ON public.job_cards
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
);

DROP POLICY IF EXISTS "Staff and admins can create job cards" ON public.job_cards;
CREATE POLICY "Staff and admins can create job cards"
ON public.job_cards
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
);

-- ORDER_TIMELINE TABLE POLICIES
DROP POLICY IF EXISTS "Customers can view own order timeline" ON public.order_timeline;
CREATE POLICY "Customers can view own order timeline"
ON public.order_timeline
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_timeline.order_id
    AND o.customer_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
);

DROP POLICY IF EXISTS "Staff and admins can view all order timeline" ON public.order_timeline;
CREATE POLICY "Staff and admins can view all order timeline"
ON public.order_timeline
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
);

DROP POLICY IF EXISTS "Staff and admins can create order timeline" ON public.order_timeline;
CREATE POLICY "Staff and admins can create order timeline"
ON public.order_timeline
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
);

DROP POLICY IF EXISTS "Staff and admins can update order timeline" ON public.order_timeline;
CREATE POLICY "Staff and admins can update order timeline"
ON public.order_timeline
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
);

-- PAYMENT_TRANSACTIONS TABLE POLICIES
DROP POLICY IF EXISTS "Customers can view own payment transactions" ON public.payment_transactions;
CREATE POLICY "Customers can view own payment transactions"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = payment_transactions.order_id
    AND o.customer_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
);

DROP POLICY IF EXISTS "Staff and admins can view all payment transactions" ON public.payment_transactions;
CREATE POLICY "Staff and admins can view all payment transactions"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin', 'factory_staff')
  )
);

