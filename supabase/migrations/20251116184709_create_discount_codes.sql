-- ===============================================
-- CREATE DISCOUNT CODES TABLE
-- ===============================================
-- This migration creates the discount_codes table and seeds default codes

-- 1. Create discount code type enum
DO $$ BEGIN
  CREATE TYPE discount_code_type AS ENUM ('percent', 'fixed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create discount_codes table
CREATE TABLE IF NOT EXISTS public.discount_codes (
  code TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  percent NUMERIC(5,2) DEFAULT 0,
  type discount_code_type DEFAULT 'percent',
  value NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  usage_count INTEGER DEFAULT 0,
  max_usage INTEGER,
  expires_at TIMESTAMPTZ,
  description TEXT
);

-- 3. Create index for active codes lookup
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON public.discount_codes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_discount_codes_type ON public.discount_codes(type);

-- 4. Enable RLS
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
-- Customers can only read active discount codes
CREATE POLICY "Customers can view active discount codes"
ON public.discount_codes
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (expires_at IS NULL OR expires_at > now())
  AND (max_usage IS NULL OR usage_count < max_usage)
);

-- Staff can read all discount codes
CREATE POLICY "Staff can view all discount codes"
ON public.discount_codes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin')
  )
);

-- Staff and admins can insert discount codes
CREATE POLICY "Staff and admins can create discount codes"
ON public.discount_codes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin')
  )
);

-- Staff and admins can update discount codes
CREATE POLICY "Staff and admins can update discount codes"
ON public.discount_codes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('staff', 'admin')
  )
);

-- Only admins can delete discount codes
CREATE POLICY "Admins can delete discount codes"
ON public.discount_codes
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'admin'
  )
);

-- 6. Create trigger to update updated_at
CREATE TRIGGER update_discount_codes_updated_at
BEFORE UPDATE ON public.discount_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Seed default discount codes (EVIP, EVIP2, ... EVIP15)
INSERT INTO public.discount_codes (code, label, percent, type, is_active, description)
VALUES
  ('EVIP', 'EVIP - 1% Discount', 1.00, 'percent', true, 'VIP customer discount - 1%'),
  ('EVIP2', 'EVIP2 - 2% Discount', 2.00, 'percent', true, 'VIP customer discount - 2%'),
  ('EVIP3', 'EVIP3 - 3% Discount', 3.00, 'percent', true, 'VIP customer discount - 3%'),
  ('EVIP4', 'EVIP4 - 4% Discount', 4.00, 'percent', true, 'VIP customer discount - 4%'),
  ('EVIP5', 'EVIP5 - 5% Discount', 5.00, 'percent', true, 'VIP customer discount - 5%'),
  ('EVIP6', 'EVIP6 - 6% Discount', 6.00, 'percent', true, 'VIP customer discount - 6%'),
  ('EVIP7', 'EVIP7 - 7% Discount', 7.00, 'percent', true, 'VIP customer discount - 7%'),
  ('EVIP8', 'EVIP8 - 8% Discount', 8.00, 'percent', true, 'VIP customer discount - 8%'),
  ('EVIP9', 'EVIP9 - 9% Discount', 9.00, 'percent', true, 'VIP customer discount - 9%'),
  ('EVIP10', 'EVIP10 - 10% Discount', 10.00, 'percent', true, 'VIP customer discount - 10%'),
  ('EVIP11', 'EVIP11 - 11% Discount', 11.00, 'percent', true, 'VIP customer discount - 11%'),
  ('EVIP12', 'EVIP12 - 12% Discount', 12.00, 'percent', true, 'VIP customer discount - 12%'),
  ('EVIP13', 'EVIP13 - 13% Discount', 13.00, 'percent', true, 'VIP customer discount - 13%'),
  ('EVIP14', 'EVIP14 - 14% Discount', 14.00, 'percent', true, 'VIP customer discount - 14%'),
  ('EVIP15', 'EVIP15 - 15% Discount', 15.00, 'percent', true, 'VIP customer discount - 15%')
ON CONFLICT (code) DO NOTHING;

