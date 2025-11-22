-- ============================================================================
-- FIX SALE ORDERS RLS POLICIES
-- ============================================================================
-- The sale_orders RLS policies were checking profiles.id instead of profiles.user_id
-- This migration fixes them to use the correct column and SECURITY DEFINER functions

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Staff can view all sale orders" ON sale_orders;
DROP POLICY IF EXISTS "Staff can insert sale orders" ON sale_orders;
DROP POLICY IF EXISTS "Staff can update sale orders" ON sale_orders;

-- Create SECURITY DEFINER function to check if user is staff or admin
CREATE OR REPLACE FUNCTION public.is_staff_or_admin_for_sale_orders(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id 
    AND role IN ('admin', 'staff', 'factory_staff', 'store_manager', 'production_manager', 'sales_executive')
  );
$$;

-- Recreate policies using SECURITY DEFINER function (prevents RLS recursion)
CREATE POLICY "Staff can view all sale orders"
  ON sale_orders FOR SELECT
  USING (public.is_staff_or_admin_for_sale_orders(auth.uid()));

CREATE POLICY "Staff can insert sale orders"
  ON sale_orders FOR INSERT
  WITH CHECK (
    public.is_staff_or_admin_for_sale_orders(auth.uid())
    OR auth.uid() = customer_id  -- Customers can create their own sale orders
  );

CREATE POLICY "Staff can update sale orders"
  ON sale_orders FOR UPDATE
  USING (public.is_staff_or_admin_for_sale_orders(auth.uid()));

-- Add comment
COMMENT ON FUNCTION public.is_staff_or_admin_for_sale_orders IS 'Check if user is staff or admin for sale_orders RLS policies';

