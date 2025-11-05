-- Fix security issues: Replace user_metadata references with secure role checking
-- Using correct table names that exist in the database

-- Drop all existing policies that use user_metadata
DROP POLICY IF EXISTS "Admin full access products" ON products;
DROP POLICY IF EXISTS "Admin full access dropdowns" ON dropdown_options;
DROP POLICY IF EXISTS "Admin full access pricing" ON pricing_formulas;
DROP POLICY IF EXISTS "Admin full access accessories" ON accessories;
DROP POLICY IF EXISTS "Admin read all orders" ON orders;
DROP POLICY IF EXISTS "Admin update orders" ON orders;
DROP POLICY IF EXISTS "Admin full access job cards" ON job_cards;
DROP POLICY IF EXISTS "Admin full access tasks" ON job_card_tasks;
DROP POLICY IF EXISTS "Admin read all activity logs" ON staff_activity_log;
DROP POLICY IF EXISTS "Staff read assigned job cards" ON job_cards;
DROP POLICY IF EXISTS "Staff update assigned job cards" ON job_cards;

-- Create new secure policies using has_role function

-- Products policies
CREATE POLICY "Admin full access products" ON products
FOR ALL TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

-- Dropdown options policies  
CREATE POLICY "Admin full access dropdowns" ON dropdown_options
FOR ALL TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

-- Pricing formulas policies
CREATE POLICY "Admin full access pricing" ON pricing_formulas
FOR ALL TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

-- Accessories policies
CREATE POLICY "Admin full access accessories" ON accessories
FOR ALL TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

-- Orders policies
CREATE POLICY "Admin read all orders" ON orders
FOR SELECT TO authenticated
USING (public.is_admin_or_manager(auth.uid()) OR public.has_role(auth.uid(), 'sales_executive'));

CREATE POLICY "Admin update orders" ON orders
FOR UPDATE TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

-- Job cards policies
CREATE POLICY "Admin full access job cards" ON job_cards
FOR ALL TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Staff read assigned job cards" ON job_cards
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'factory_staff') AND assigned_to = auth.uid());

CREATE POLICY "Staff update assigned job cards" ON job_cards
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'factory_staff') AND assigned_to = auth.uid());

-- Job card tasks policies
CREATE POLICY "Admin full access tasks" ON job_card_tasks
FOR ALL TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

-- Staff activity log policies
CREATE POLICY "Admin read all activity logs" ON staff_activity_log
FOR SELECT TO authenticated
USING (public.is_admin_or_manager(auth.uid()));

-- Enable RLS on category database tables and add public read access
ALTER TABLE sofa_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE bed_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE recliner_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE cinema_chairs_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE dining_chairs_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE arm_chairs_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE benches_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids_bed_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE sofabed_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_pouffes ENABLE ROW LEVEL SECURITY;

-- Public read policies for active products
CREATE POLICY "Public read active sofa" ON sofa_database FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active bed" ON bed_database FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active recliner" ON recliner_database FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active cinema_chairs" ON cinema_chairs_database FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active dining_chairs" ON dining_chairs_database FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active arm_chairs" ON arm_chairs_database FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active benches" ON benches_database FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active kids_bed" ON kids_bed_database FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active sofabed" ON sofabed_database FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active pouffes" ON database_pouffes FOR SELECT USING (true);

-- Admin full access to all product databases
CREATE POLICY "Admin full access sofa" ON sofa_database FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin full access bed" ON bed_database FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin full access recliner" ON recliner_database FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin full access cinema_chairs" ON cinema_chairs_database FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin full access dining_chairs" ON dining_chairs_database FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin full access arm_chairs" ON arm_chairs_database FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin full access benches" ON benches_database FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin full access kids_bed" ON kids_bed_database FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin full access sofabed" ON sofabed_database FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));
CREATE POLICY "Admin full access pouffes" ON database_pouffes FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));

-- Enable RLS on fabric_coding table
ALTER TABLE fabric_coding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active fabrics" ON fabric_coding FOR SELECT USING (is_active = true);
CREATE POLICY "Admin full access fabric_coding" ON fabric_coding FOR ALL TO authenticated USING (public.is_admin_or_manager(auth.uid()));