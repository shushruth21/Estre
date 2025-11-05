-- Enable RLS on customer_orders table (cart functionality)

ALTER TABLE customer_orders ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own draft orders (cart items)
CREATE POLICY "Users view own cart items" ON customer_orders
FOR SELECT TO authenticated
USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users create own cart items" ON customer_orders
FOR INSERT TO authenticated
WITH CHECK (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users update own cart items" ON customer_orders
FOR UPDATE TO authenticated
USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users delete own cart items" ON customer_orders
FOR DELETE TO authenticated
USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Admins can view all cart items for customer support
CREATE POLICY "Admin full access customer orders" ON customer_orders
FOR ALL TO authenticated
USING (public.is_admin_or_manager(auth.uid()));