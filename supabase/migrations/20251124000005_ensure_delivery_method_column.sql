-- ============================================================================
-- ENSURE DELIVERY_METHOD AND DELIVERY_DATE COLUMNS EXIST IN ORDERS TABLE
-- ============================================================================
-- This migration ensures delivery_method and delivery_date columns exist
-- to prevent 400 errors when querying orders

-- Add delivery_method column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'delivery_method'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN delivery_method TEXT;
    COMMENT ON COLUMN public.orders.delivery_method IS 'Delivery method (e.g., Safe Express, Blue Dart, etc.)';
  END IF;
END $$;

-- Add delivery_date column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'orders' 
    AND column_name = 'delivery_date'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN delivery_date DATE;
    COMMENT ON COLUMN public.orders.delivery_date IS 'Actual delivery date (when order was delivered)';
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_orders_delivery_method ON public.orders(delivery_method) WHERE delivery_method IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON public.orders(delivery_date) WHERE delivery_date IS NOT NULL;

