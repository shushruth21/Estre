-- ============================================
-- FIX PUBLIC READ POLICIES FOR PRODUCT TABLES
-- ============================================
-- This migration ensures public read access works correctly for product catalog tables
-- Fixes the "Anonymous Access Policies" warnings while maintaining public catalog access

-- Drop existing public read policies and recreate with explicit TO public
DO $$ 
DECLARE
    table_record RECORD;
    policy_name text;
    category_name text;
BEGIN
    -- List of product tables and their category names
    FOR table_record IN 
        SELECT 
            table_name,
            CASE 
                WHEN table_name = 'sofa_database' THEN 'sofa'
                WHEN table_name = 'bed_database' THEN 'bed'
                WHEN table_name = 'recliner_database' THEN 'recliner'
                WHEN table_name = 'cinema_chairs_database' THEN 'cinema_chairs'
                WHEN table_name = 'dining_chairs_database' THEN 'dining_chairs'
                WHEN table_name = 'arm_chairs_database' THEN 'arm_chairs'
                WHEN table_name = 'benches_database' THEN 'benches'
                WHEN table_name = 'kids_bed_database' THEN 'kids_bed'
                WHEN table_name = 'sofabed_database' THEN 'sofabed'
                WHEN table_name = 'database_pouffes' THEN 'pouffes'
                ELSE NULL
            END as category
        FROM information_schema.tables
        WHERE table_schema = 'public' 
        AND table_name IN (
            'sofa_database', 'bed_database', 'recliner_database',
            'cinema_chairs_database', 'dining_chairs_database', 'arm_chairs_database',
            'benches_database', 'kids_bed_database', 'sofabed_database', 'database_pouffes'
        )
    LOOP
        IF table_record.category IS NOT NULL THEN
            -- Drop existing policy
            policy_name := 'Public read active ' || table_record.category;
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_record.table_name);
            
            -- Recreate with explicit TO public for anonymous access
            IF table_record.table_name = 'database_pouffes' THEN
                -- Pouffes doesn't have is_active column
                EXECUTE format('CREATE POLICY %I ON %I FOR SELECT TO public USING (true)', 
                    policy_name, table_record.table_name);
            ELSE
                -- Other tables have is_active column
                EXECUTE format('CREATE POLICY %I ON %I FOR SELECT TO public USING (is_active = true)', 
                    policy_name, table_record.table_name);
            END IF;
            
            RAISE NOTICE 'Fixed policy for table: %', table_record.table_name;
        END IF;
    END LOOP;
END $$;

-- Fix dropdown_options public read policy
DROP POLICY IF EXISTS "Public read active dropdowns" ON dropdown_options;
CREATE POLICY "Public read active dropdowns" ON dropdown_options
    FOR SELECT TO public
    USING (is_active = true);

-- Fix pricing_formulas public read policy
DROP POLICY IF EXISTS "Public read active pricing" ON pricing_formulas;
CREATE POLICY "Public read active pricing" ON pricing_formulas
    FOR SELECT TO public
    USING (is_active = true);

-- Fix fabric_coding public read policy
DROP POLICY IF EXISTS "Public read active fabrics" ON fabric_coding;
CREATE POLICY "Public read active fabrics" ON fabric_coding
    FOR SELECT TO public
    USING (is_active = true);

-- Fix accessories public read policy
DROP POLICY IF EXISTS "Public read active accessories" ON accessories;
CREATE POLICY "Public read active accessories" ON accessories
    FOR SELECT TO public
    USING (is_active = true);

-- Fix accessories_prices public read policy
DROP POLICY IF EXISTS "Public read accessories prices" ON accessories_prices;
CREATE POLICY "Public read accessories prices" ON accessories_prices
    FOR SELECT TO public
    USING (true);

-- Fix legs_prices public read policy
DROP POLICY IF EXISTS "Public read legs prices" ON legs_prices;
CREATE POLICY "Public read legs prices" ON legs_prices
    FOR SELECT TO public
    USING (true);

-- Fix products table public read policy
DROP POLICY IF EXISTS "Public read active products" ON products;
CREATE POLICY "Public read active products" ON products
    FOR SELECT TO public
    USING (is_active = true);

-- Verify policies were created
DO $$
DECLARE
    policy_count integer;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND policyname LIKE 'Public read%';
    
    RAISE NOTICE 'Total public read policies created: %', policy_count;
END $$;

