-- ============================================================================
-- FIX ORDER_ITEMS INSERT RLS POLICY
-- ============================================================================
-- This migration adds INSERT policy for order_items so customers can create
-- order items when placing orders.

-- Enable RLS if not already enabled
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing INSERT policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Customers create own order items" ON order_items;

-- Create INSERT policy for customers
-- Customers can insert order_items if the order belongs to them
CREATE POLICY "Customers create own order items" ON order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
  );

-- Also allow staff/admin to insert order_items (for order management)
DROP POLICY IF EXISTS "Staff and admin can insert order items" ON order_items;

CREATE POLICY "Staff and admin can insert order items" ON order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'staff', 'store_manager', 'production_manager', 'sales_executive')
    )
  );

-- Add UPDATE policy for customers (to update their own order items)
DROP POLICY IF EXISTS "Customers update own order items" ON order_items;

CREATE POLICY "Customers update own order items" ON order_items
  FOR UPDATE TO authenticated
  USING (
    order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
  )
  WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
  );

-- Add DELETE policy for customers (to delete their own order items)
DROP POLICY IF EXISTS "Customers delete own order items" ON order_items;

CREATE POLICY "Customers delete own order items" ON order_items
  FOR DELETE TO authenticated
  USING (
    order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
  );

-- Staff and admin can update/delete all order items
DROP POLICY IF EXISTS "Staff and admin can update order items" ON order_items;
DROP POLICY IF EXISTS "Staff and admin can delete order items" ON order_items;

CREATE POLICY "Staff and admin can update order items" ON order_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'staff', 'store_manager', 'production_manager', 'sales_executive')
    )
  );

CREATE POLICY "Staff and admin can delete order items" ON order_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'staff', 'store_manager', 'production_manager', 'sales_executive')
    )
  );

