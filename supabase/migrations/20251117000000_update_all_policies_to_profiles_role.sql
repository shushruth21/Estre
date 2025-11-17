-- ===============================================
-- UPDATE ALL POLICIES TO USE profiles.role
-- ===============================================
-- This migration updates all policies that use old functions
-- to use the new profiles.role system

-- First, update the old helper functions to use profiles.role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id 
    AND role IN ('admin', 'store_manager', 'production_manager', 'staff')
  );
$$;

-- Update job_cards policies to use profiles.role and include 'staff'
DROP POLICY IF EXISTS "Admin full access job cards" ON public.job_cards;
CREATE POLICY "Admin full access job cards"
ON public.job_cards
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'store_manager', 'production_manager', 'staff')
  )
);

DROP POLICY IF EXISTS "Staff read assigned job cards" ON public.job_cards;
CREATE POLICY "Staff read assigned job cards"
ON public.job_cards
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('factory_staff', 'staff')
    AND assigned_to = auth.uid()
  )
);

DROP POLICY IF EXISTS "Staff update assigned job cards" ON public.job_cards;
CREATE POLICY "Staff update assigned job cards"
ON public.job_cards
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('factory_staff', 'staff')
    AND assigned_to = auth.uid()
  )
);

-- Add missing "Staff and admins can create job cards" policy
DROP POLICY IF EXISTS "Staff and admins can create job cards" ON public.job_cards;
CREATE POLICY "Staff and admins can create job cards"
ON public.job_cards
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'staff', 'factory_staff', 'store_manager', 'production_manager')
  )
);

-- Update job_card_tasks policies
DROP POLICY IF EXISTS "Admin full access tasks" ON public.job_card_tasks;
CREATE POLICY "Admin full access tasks"
ON public.job_card_tasks
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'store_manager', 'production_manager', 'staff')
  )
);

-- Update staff_activity_log policies
DROP POLICY IF EXISTS "Admin read all activity logs" ON public.staff_activity_log;
CREATE POLICY "Admin read all activity logs"
ON public.staff_activity_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'store_manager', 'production_manager', 'staff')
  )
);

-- Update all product database policies
DO $$
DECLARE
  table_name text;
  tables text[] := ARRAY[
    'sofa_database', 'bed_database', 'recliner_database', 
    'cinema_chairs_database', 'dining_chairs_database', 
    'arm_chairs_database', 'benches_database', 
    'kids_bed_database', 'sofabed_database', 'database_pouffes'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables
  LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS "Admin full access %s" ON public.%I;
      CREATE POLICY "Admin full access %s"
      ON public.%I
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.user_id = auth.uid()
          AND p.role IN (''admin'', ''store_manager'', ''production_manager'', ''staff'')
        )
      );
    ', table_name, table_name, table_name, table_name);
  END LOOP;
END $$;

-- Update admin settings policies
DO $$
DECLARE
  table_name text;
  tables text[] := ARRAY[
    'sofa_admin_settings', 'bed_admin_settings', 'recliner_admin_settings',
    'cinema_chairs_admin_settings', 'dining_chairs_admin_settings',
    'arm_chairs_admin_settings', 'benches_admin_settings',
    'kids_bed_admin_settings', 'sofabed_admin_settings'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables
  LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS "Admin full access %s" ON public.%I;
      CREATE POLICY "Admin full access %s"
      ON public.%I
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.user_id = auth.uid()
          AND p.role IN (''admin'', ''store_manager'', ''production_manager'', ''staff'')
        )
      );
    ', table_name, table_name, table_name, table_name);
  END LOOP;
END $$;

-- Update accessories_prices and legs_prices
DROP POLICY IF EXISTS "Admin full access accessories prices" ON public.accessories_prices;
CREATE POLICY "Admin full access accessories prices"
ON public.accessories_prices
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'store_manager', 'production_manager', 'staff')
  )
);

DROP POLICY IF EXISTS "Admin full access legs prices" ON public.legs_prices;
CREATE POLICY "Admin full access legs prices"
ON public.legs_prices
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'store_manager', 'production_manager', 'staff')
  )
);

-- Update fabric_coding policy
DROP POLICY IF EXISTS "Admin full access fabric_coding" ON public.fabric_coding;
CREATE POLICY "Admin full access fabric_coding"
ON public.fabric_coding
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'store_manager', 'production_manager', 'staff')
  )
);

-- Update products, dropdown_options, pricing_formulas, accessories policies
DROP POLICY IF EXISTS "Admin full access products" ON public.products;
CREATE POLICY "Admin full access products"
ON public.products
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'store_manager', 'production_manager', 'staff')
  )
);

DROP POLICY IF EXISTS "Admin full access dropdowns" ON public.dropdown_options;
CREATE POLICY "Admin full access dropdowns"
ON public.dropdown_options
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'store_manager', 'production_manager', 'staff')
  )
);

DROP POLICY IF EXISTS "Admin full access pricing" ON public.pricing_formulas;
CREATE POLICY "Admin full access pricing"
ON public.pricing_formulas
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'store_manager', 'production_manager', 'staff')
  )
);

DROP POLICY IF EXISTS "Admin full access accessories" ON public.accessories;
CREATE POLICY "Admin full access accessories"
ON public.accessories
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'store_manager', 'production_manager', 'staff')
  )
);

-- Update orders policies (if they use old functions)
DROP POLICY IF EXISTS "Admin read all orders" ON public.orders;
CREATE POLICY "Admin read all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'store_manager', 'production_manager', 'sales_executive', 'staff')
  )
);

DROP POLICY IF EXISTS "Admin update orders" ON public.orders;
CREATE POLICY "Admin update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'store_manager', 'production_manager', 'staff')
  )
);

-- Update payment_transactions and order_timeline policies
DROP POLICY IF EXISTS "Admin full access payment transactions" ON public.payment_transactions;
CREATE POLICY "Admin full access payment transactions"
ON public.payment_transactions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'store_manager', 'production_manager', 'staff')
  )
);

DROP POLICY IF EXISTS "Admin full access order timeline" ON public.order_timeline;
CREATE POLICY "Admin full access order timeline"
ON public.order_timeline
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'store_manager', 'production_manager', 'staff')
  )
);

DROP POLICY IF EXISTS "Admin full access customer orders" ON public.customer_orders;
CREATE POLICY "Admin full access customer orders"
ON public.customer_orders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'store_manager', 'production_manager', 'staff')
  )
);

DO $$
BEGIN
  RAISE NOTICE '✅ All policies updated to use profiles.role system';
  RAISE NOTICE '✅ Helper functions updated to use profiles table';
  RAISE NOTICE '✅ Missing job_cards policies added';
END $$;

