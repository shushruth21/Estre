-- ===============================================
-- CREATE system_settings TABLE
-- ===============================================
-- This table stores system-wide settings for the admin panel

CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category) WHERE category IS NOT NULL;

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public read system settings" ON public.system_settings;
CREATE POLICY "Public read system settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
CREATE POLICY "Admins can manage system settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('admin', 'store_manager', 'staff')
  )
);

-- Insert default settings
INSERT INTO public.system_settings (setting_key, setting_value, description, category)
VALUES 
  ('tax_rate', '{"cgst_percent": 9, "sgst_percent": 9, "igst_percent": 18}'::jsonb, 'GST tax rates', 'tax'),
  ('delivery_terms', '{"default_delivery_days": 30, "dispatch_methods": ["Safe Express", "Self Pickup", "Other"]}'::jsonb, 'Default delivery terms', 'delivery'),
  ('company_profile', '{"company_name": "ESTRE GLOBAL PRIVATE LTD", "company_address": "Near Dhoni Public School, AECS Layout-A Block, Revenue Layout, Near Kudlu Gate, Singhasandra, Bengaluru - 560 068", "company_phone": "+91 87 22 200 100", "company_email": "support@estre.in", "company_gst": ""}'::jsonb, 'Company information', 'company'),
  ('discount_defaults', '{"default_discount_percent": 10}'::jsonb, 'Default discount settings', 'discount')
ON CONFLICT (setting_key) DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE '✅ system_settings table created';
  RAISE NOTICE '✅ Default settings inserted';
END $$;

