-- ===============================================
-- UPDATE ORDERS TABLE FOR DISCOUNT CODES
-- ===============================================
-- This migration adds discount_code foreign key and delivery fields to orders table
-- NOTE: This migration must run AFTER discount_codes table is created

-- 1. Add discount_code column (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'discount_code'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN discount_code TEXT;
  END IF;
END $$;

-- 2. Add foreign key constraint to discount_codes (only if discount_codes table exists)
DO $$ 
BEGIN
  -- Check if discount_codes table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'discount_codes'
  ) THEN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND table_name = 'orders' 
      AND constraint_name = 'orders_discount_code_fkey'
    ) THEN
      ALTER TABLE public.orders
      ADD CONSTRAINT orders_discount_code_fkey
      FOREIGN KEY (discount_code) 
      REFERENCES public.discount_codes(code)
      ON DELETE SET NULL;
    END IF;
  ELSE
    RAISE NOTICE 'discount_codes table does not exist yet. Foreign key will be added after discount_codes table is created.';
  END IF;
END $$;

-- 3. Add delivery_method column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'delivery_method'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN delivery_method TEXT;
  END IF;
END $$;

-- 4. Add delivery_date column if not exists (expected_delivery_date already exists, but add delivery_date as well)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'delivery_date'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN delivery_date DATE;
  END IF;
END $$;

-- 5. Create index for discount_code lookups
CREATE INDEX IF NOT EXISTS idx_orders_discount_code ON public.orders(discount_code) WHERE discount_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_delivery_method ON public.orders(delivery_method) WHERE delivery_method IS NOT NULL;

