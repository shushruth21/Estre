-- Enable RLS on remaining admin settings and price tables

-- Admin settings tables
ALTER TABLE sofa_admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bed_admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recliner_admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cinema_chairs_admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dining_chairs_admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE arm_chairs_admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE benches_admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_bed_admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sofabed_admin_settings ENABLE ROW LEVEL SECURITY;

-- Price tables
ALTER TABLE accessories_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE legs_prices ENABLE ROW LEVEL SECURITY;

-- Create admin-only policies for settings tables
CREATE POLICY "Admin full access sofa settings" ON sofa_admin_settings FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin full access bed settings" ON bed_admin_settings FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin full access recliner settings" ON recliner_admin_settings FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin full access cinema_chairs settings" ON cinema_chairs_admin_settings FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin full access dining_chairs settings" ON dining_chairs_admin_settings FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin full access arm_chairs settings" ON arm_chairs_admin_settings FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin full access benches settings" ON benches_admin_settings FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin full access kids_bed settings" ON kids_bed_admin_settings FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin full access sofabed settings" ON sofabed_admin_settings FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));

-- Public read for price tables (needed for configurator)
CREATE POLICY "Public read accessories prices" ON accessories_prices FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access accessories prices" ON accessories_prices FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Public read legs prices" ON legs_prices FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access legs prices" ON legs_prices FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));

-- Fix the function search path warning
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;