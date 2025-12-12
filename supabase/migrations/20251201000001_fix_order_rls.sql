-- ============================================================================
-- FIX RLS POLICIES FOR ORDER VISIBILITY
-- ============================================================================
-- This migration fixes "Order Not Found" errors by ensuring:
-- 1. Products are visible to authenticated users even if inactive (for order history)
-- 2. Orders and Sale Orders are correctly visible to customers and staff
-- 3. Sale Order creation is allowed for customers

-- 1. PRODUCTS TABLE
-- Allow authenticated users to view ALL products (active or inactive)
-- This is crucial for order history where products might have been deactivated
DROP POLICY IF EXISTS "Public read active products" ON products;
CREATE POLICY "Public read active products" ON products FOR SELECT TO public USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated can view all products" ON products;
CREATE POLICY "Authenticated can view all products" ON products FOR SELECT TO authenticated USING (true);


-- 2. ORDERS TABLE
-- Ensure customers can view their own orders
DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
CREATE POLICY "Customers can view own orders" ON orders FOR SELECT TO authenticated USING (customer_id = auth.uid());

-- Ensure customers can create their own orders
DROP POLICY IF EXISTS "Customers can create own orders" ON orders;
CREATE POLICY "Customers can create own orders" ON orders FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());


-- 3. SALE_ORDERS TABLE
-- Ensure customers can view their own sale orders
DROP POLICY IF EXISTS "Customers can view own sale orders" ON sale_orders;
CREATE POLICY "Customers can view own sale orders" ON sale_orders FOR SELECT TO authenticated USING (customer_id = auth.uid());

-- Ensure customers can create their own sale orders (CRITICAL for Checkout.tsx)
DROP POLICY IF EXISTS "Customers can create own sale orders" ON sale_orders;
CREATE POLICY "Customers can create own sale orders" ON sale_orders FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());

-- Ensure customers can update their own sale orders (for confirmation/OTP)
DROP POLICY IF EXISTS "Customers can update own sale orders" ON sale_orders;
CREATE POLICY "Customers can update own sale orders" ON sale_orders FOR UPDATE TO authenticated USING (customer_id = auth.uid());


-- 4. DISCOUNT_CODES TABLE
-- Allow authenticated users to view ALL discount codes (to prevent join failures in order history)
-- We rely on application logic to prevent applying inactive codes
DROP POLICY IF EXISTS "Customers can view active discount codes" ON discount_codes;
-- Revert to checking is_active for public/listing, but allow reading specific codes if needed?
-- Actually, let's just allow authenticated users to read all codes.
-- This is safe because applying a code is checked by mutation logic.
DROP POLICY IF EXISTS "Authenticated can view all discount codes" ON discount_codes;
CREATE POLICY "Authenticated can view all discount codes" ON discount_codes FOR SELECT TO authenticated USING (true);
