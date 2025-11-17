-- ===============================================
-- UPDATE RLS POLICIES FOR ALL TABLES
-- ===============================================
-- This migration updates RLS policies for orders, order_items, job_cards
-- to support customer, staff, and admin access patterns
-- NOTE: Using 'factory_staff' for now; 'staff' will be added in a later migration (20251116184712)

-- ===============================================
-- ORDERS TABLE POLICIES
-- ===============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;

-- Customers can only read/write their own orders
CREATE POLICY "Customers can view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'factory_staff')
  )
);

CREATE POLICY "Customers can create own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'factory_staff')
  )
);

CREATE POLICY "Customers can update own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'factory_staff')
  )
)
WITH CHECK (
  customer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'factory_staff')
  )
);

-- Staff and admins can view all orders
CREATE POLICY "Staff and admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'factory_staff')
  )
);

-- Staff and admins can update all orders (but not delete)
CREATE POLICY "Staff and admins can update all orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'factory_staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'factory_staff')
  )
);

-- Only admins can delete orders
CREATE POLICY "Admins can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'admin'
  )
);

-- ===============================================
-- ORDER_ITEMS TABLE POLICIES
-- ===============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Customers can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Customers can create own order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can update all order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;

-- Customers can only read/write their own order items
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
    AND p.role IN ('admin', 'factory_staff')
  )
);

CREATE POLICY "Customers can create own order items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND o.customer_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'factory_staff')
  )
);

CREATE POLICY "Customers can update own order items"
ON public.order_items
FOR UPDATE
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
    AND p.role IN ('admin', 'factory_staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND o.customer_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'factory_staff')
  )
);

-- Staff and admins can view all order items
CREATE POLICY "Staff and admins can view all order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'factory_staff')
  )
);

-- Staff and admins can update all order items
CREATE POLICY "Staff and admins can update all order items"
ON public.order_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'factory_staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'factory_staff')
  )
);

-- Only admins can delete order items
CREATE POLICY "Admins can delete order items"
ON public.order_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'admin'
  )
);

-- ===============================================
-- JOB_CARDS TABLE POLICIES
-- ===============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Customers can view own job cards" ON public.job_cards;
DROP POLICY IF EXISTS "Staff can view all job cards" ON public.job_cards;
DROP POLICY IF EXISTS "Staff can update all job cards" ON public.job_cards;
DROP POLICY IF EXISTS "Admins can manage all job cards" ON public.job_cards;

-- Customers can only read their own job cards (via order relationship)
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
    AND p.role IN ('admin', 'factory_staff')
  )
);

-- Staff and admins can view all job cards
CREATE POLICY "Staff and admins can view all job cards"
ON public.job_cards
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'factory_staff')
  )
);

-- Staff and admins can update all job cards
CREATE POLICY "Staff and admins can update all job cards"
ON public.job_cards
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'factory_staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'factory_staff')
  )
);

-- Staff and admins can insert job cards
CREATE POLICY "Staff and admins can create job cards"
ON public.job_cards
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'factory_staff')
  )
);

-- Only admins can delete job cards
CREATE POLICY "Admins can delete job cards"
ON public.job_cards
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'admin'
  )
);

-- ===============================================
-- ORDER_TIMELINE TABLE POLICIES
-- ===============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Customers can view own order timeline" ON public.order_timeline;
DROP POLICY IF EXISTS "Staff can view all order timeline" ON public.order_timeline;
DROP POLICY IF EXISTS "Staff can create order timeline" ON public.order_timeline;
DROP POLICY IF EXISTS "Admins can manage order timeline" ON public.order_timeline;

-- Customers can view their own order timeline
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
    AND p.role IN ('admin', 'factory_staff')
  )
);

-- Staff and admins can view all order timeline
CREATE POLICY "Staff and admins can view all order timeline"
ON public.order_timeline
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'factory_staff')
  )
);

-- Staff and admins can create timeline entries
CREATE POLICY "Staff and admins can create order timeline"
ON public.order_timeline
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'factory_staff')
  )
);

-- Staff and admins can update timeline entries
CREATE POLICY "Staff and admins can update order timeline"
ON public.order_timeline
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'factory_staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'factory_staff')
  )
);

-- Only admins can delete timeline entries
CREATE POLICY "Admins can delete order timeline"
ON public.order_timeline
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'admin'
  )
);

