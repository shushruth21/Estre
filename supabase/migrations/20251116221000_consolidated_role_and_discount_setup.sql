-- ===============================================
-- CONSOLIDATED MIGRATION: ROLE AND DISCOUNT SETUP
-- ===============================================
-- This migration consolidates all role and discount code setup
-- Based on current schema analysis

-- ===============================================
-- STEP 1: ADD 'staff' TO app_role ENUM
-- ===============================================
-- Must be done first in a separate transaction
DO $$ 
BEGIN
  -- Check if enum type exists
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    -- Add 'staff' if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'staff' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
    ) THEN
      ALTER TYPE public.app_role ADD VALUE 'staff';
    END IF;
  ELSE
    -- Create enum if it doesn't exist (shouldn't happen, but safe)
    CREATE TYPE public.app_role AS ENUM ('admin', 'store_manager', 'production_manager', 'sales_executive', 'factory_staff', 'customer', 'staff');
  END IF;
END $$;

-- ===============================================
-- STEP 2: ADD role COLUMN TO profiles TABLE
-- ===============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN role public.app_role DEFAULT 'customer';
  END IF;
END $$;

-- ===============================================
-- STEP 3: MIGRATE ROLES FROM user_roles TO profiles
-- ===============================================
DO $$
BEGIN
  -- Only migrate if role column exists and user_roles table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
  ) THEN
    -- Migrate existing roles from user_roles to profiles
    -- Priority: admin > store_manager > production_manager > sales_executive > factory_staff > customer
    UPDATE public.profiles p
    SET role = (
      SELECT ur.role 
      FROM public.user_roles ur 
      WHERE ur.user_id = p.user_id 
      ORDER BY 
        CASE ur.role
          WHEN 'admin' THEN 1
          WHEN 'store_manager' THEN 2
          WHEN 'production_manager' THEN 3
          WHEN 'sales_executive' THEN 4
          WHEN 'factory_staff' THEN 5
          WHEN 'customer' THEN 6
        END
      LIMIT 1
    )
    WHERE EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id
    )
    AND p.role IS NULL;
    
    -- Set default 'customer' for profiles without roles
    UPDATE public.profiles
    SET role = 'customer'
    WHERE role IS NULL;
  END IF;
END $$;

-- ===============================================
-- STEP 4: SET NOT NULL CONSTRAINT ON role COLUMN
-- ===============================================
DO $$
BEGIN
  -- Ensure all NULL values are set to 'customer'
  UPDATE public.profiles
  SET role = 'customer'
  WHERE role IS NULL;
  
  -- Add NOT NULL constraint if column exists and is nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.profiles 
    ALTER COLUMN role SET NOT NULL;
  END IF;
END $$;

-- ===============================================
-- STEP 5: CREATE INDEX FOR role LOOKUPS
-- ===============================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ===============================================
-- STEP 6: CREATE AUTO-ASSIGN CUSTOMER ROLE FUNCTION
-- ===============================================
CREATE OR REPLACE FUNCTION public.auto_assign_customer_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If role is not set, default to customer
  IF NEW.role IS NULL THEN
    NEW.role := 'customer';
  END IF;
  RETURN NEW;
END;
$$;

-- ===============================================
-- STEP 7: CREATE TRIGGER FOR AUTO-ASSIGN ROLE
-- ===============================================
DROP TRIGGER IF EXISTS trigger_auto_assign_customer_role ON public.profiles;
CREATE TRIGGER trigger_auto_assign_customer_role
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_customer_role();

-- ===============================================
-- STEP 8: CREATE HELPER FUNCTIONS
-- ===============================================
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_customer(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role = 'customer'
  );
$$;

-- Note: Using 'factory_staff' for now; 'staff' will be available after enum commit
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role = 'factory_staff'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND role IN ('admin', 'factory_staff')
  );
$$;

-- ===============================================
-- STEP 9: UPDATE RLS POLICIES FOR profiles
-- ===============================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff and admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Note: Using 'factory_staff' for now; will be updated in next migration
CREATE POLICY "Staff and admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'factory_staff')
  )
);

CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'admin'
  )
);

-- ===============================================
-- STEP 10: CREATE discount_codes TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS public.discount_codes (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  percent NUMERIC,
  type TEXT NOT NULL CHECK (type IN ('percent', 'fixed')),
  value NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_usage INTEGER,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for active discount codes
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON public.discount_codes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_discount_codes_expires ON public.discount_codes(expires_at) WHERE expires_at IS NOT NULL;

-- Enable RLS on discount_codes
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discount_codes
DROP POLICY IF EXISTS "Authenticated users can read active discount codes" ON public.discount_codes;
DROP POLICY IF EXISTS "Admins can manage all discount codes" ON public.discount_codes;

CREATE POLICY "Authenticated users can read active discount codes"
ON public.discount_codes
FOR SELECT
TO authenticated
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Admins can manage all discount codes"
ON public.discount_codes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'admin'
  )
);

-- ===============================================
-- STEP 11: SEED DEFAULT DISCOUNT CODES
-- ===============================================
INSERT INTO public.discount_codes (code, label, percent, type, value, is_active)
VALUES 
  ('EVIP', 'Early VIP Discount', 10, 'percent', 10, true),
  ('EVIP2', 'Early VIP Discount 2', 12, 'percent', 12, true),
  ('EVIP3', 'Early VIP Discount 3', 15, 'percent', 15, true),
  ('EVIP4', 'Early VIP Discount 4', 18, 'percent', 18, true),
  ('EVIP5', 'Early VIP Discount 5', 20, 'percent', 20, true),
  ('EVIP6', 'Early VIP Discount 6', 10, 'percent', 10, true),
  ('EVIP7', 'Early VIP Discount 7', 12, 'percent', 12, true),
  ('EVIP8', 'Early VIP Discount 8', 15, 'percent', 15, true),
  ('EVIP9', 'Early VIP Discount 9', 18, 'percent', 18, true),
  ('EVIP10', 'Early VIP Discount 10', 20, 'percent', 20, true),
  ('EVIP11', 'Early VIP Discount 11', 10, 'percent', 10, true),
  ('EVIP12', 'Early VIP Discount 12', 12, 'percent', 12, true),
  ('EVIP13', 'Early VIP Discount 13', 15, 'percent', 15, true),
  ('EVIP14', 'Early VIP Discount 14', 18, 'percent', 18, true),
  ('EVIP15', 'Early VIP Discount 15', 20, 'percent', 20, true)
ON CONFLICT (code) DO NOTHING;

-- ===============================================
-- STEP 12: UPDATE orders TABLE FOREIGN KEY
-- ===============================================
-- Add foreign key constraint if discount_codes table exists and constraint doesn't exist
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'discount_codes'
  ) THEN
    -- Check if foreign key already exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND table_name = 'orders' 
      AND constraint_name = 'orders_discount_code_fkey'
    ) THEN
      -- Check if discount_code column exists
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'discount_code'
      ) THEN
        ALTER TABLE public.orders
        ADD CONSTRAINT orders_discount_code_fkey
        FOREIGN KEY (discount_code) 
        REFERENCES public.discount_codes(code)
        ON DELETE SET NULL;
      END IF;
    END IF;
  END IF;
END $$;

-- ===============================================
-- STEP 13: UPDATE RLS POLICIES FOR orders
-- ===============================================
-- Note: These policies use 'factory_staff' for now; will be updated in next migration
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Staff and admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Staff and admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;

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
-- COMPLETION MESSAGE
-- ===============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '✅ Added ''staff'' to app_role enum';
  RAISE NOTICE '✅ Added role column to profiles table';
  RAISE NOTICE '✅ Migrated roles from user_roles to profiles';
  RAISE NOTICE '✅ Created discount_codes table with seed data';
  RAISE NOTICE '✅ Updated RLS policies';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Note: Run the next migration (20251116221001_update_policies_for_staff.sql) to enable ''staff'' role in policies';
END $$;

