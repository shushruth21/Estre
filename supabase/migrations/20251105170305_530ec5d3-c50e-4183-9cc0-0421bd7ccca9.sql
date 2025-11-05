-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for product categories
CREATE TYPE product_category AS ENUM (
  'sofa', 'sofa_bed', 'recliner', 'cinema_chair', 'bed',
  'kids_bed', 'dining_chair', 'arm_chair', 'pouffe', 'bench'
);

-- =======================
-- TABLE 1: PRODUCTS
-- =======================
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category product_category NOT NULL,
  title text NOT NULL,
  description text,
  images text[] DEFAULT '{}',
  
  -- Pricing
  bom_rs numeric NOT NULL,
  wastage_percent numeric DEFAULT 20.0,
  adjusted_bom_rs numeric GENERATED ALWAYS AS (bom_rs * (1 + wastage_percent / 100)) STORED,
  markup_percent numeric DEFAULT 270.0,
  strike_price_rs numeric,
  discount_percent numeric DEFAULT 10.0,
  net_price_rs numeric,
  
  -- Fabric requirements (meters per component)
  fabric_requirements jsonb DEFAULT '{}',
  
  -- Product features
  comes_with_headrest boolean DEFAULT false,
  available_armrest_types text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  
  -- Status
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_title ON products(title);

-- =======================
-- TABLE 2: DROPDOWN_OPTIONS
-- =======================
CREATE TABLE dropdown_options (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category text NOT NULL,
  field_name text NOT NULL,
  option_value text NOT NULL,
  display_label text,
  sort_order integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category, field_name, option_value)
);

CREATE INDEX idx_dropdown_category_field ON dropdown_options(category, field_name);
CREATE INDEX idx_dropdown_active ON dropdown_options(is_active);

-- =======================
-- TABLE 3: PRICING_FORMULAS
-- =======================
CREATE TYPE calculation_type AS ENUM ('percentage', 'flat_rate', 'multiplier');
CREATE TYPE formula_unit AS ENUM ('percent', 'rupees', 'multiplier');

CREATE TABLE pricing_formulas (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category text NOT NULL,
  formula_name text NOT NULL,
  calculation_type calculation_type NOT NULL,
  value numeric NOT NULL,
  description text,
  unit formula_unit DEFAULT 'percent',
  applies_to jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category, formula_name)
);

CREATE INDEX idx_pricing_formulas_category ON pricing_formulas(category);
CREATE INDEX idx_pricing_formulas_active ON pricing_formulas(is_active);

-- =======================
-- TABLE 4: FABRICS
-- =======================
CREATE TABLE fabrics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  category text,
  price_per_mtr_rs numeric NOT NULL,
  images text[] DEFAULT '{}',
  color_family text,
  material text,
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_fabrics_code ON fabrics(code);
CREATE INDEX idx_fabrics_category ON fabrics(category);
CREATE INDEX idx_fabrics_active ON fabrics(is_active);

-- =======================
-- TABLE 5: ACCESSORIES
-- =======================
CREATE TYPE accessory_type AS ENUM ('leg', 'armrest', 'console', 'pillow', 'other');

CREATE TABLE accessories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type accessory_type NOT NULL,
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  price_rs numeric NOT NULL,
  images text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  compatible_categories text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_accessories_type ON accessories(type);
CREATE INDEX idx_accessories_code ON accessories(code);
CREATE INDEX idx_accessories_active ON accessories(is_active);

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropdown_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessories ENABLE ROW LEVEL SECURITY;

-- Public read access for active catalog data
CREATE POLICY "Public read active products" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read active fabrics" ON fabrics
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read active accessories" ON accessories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read active dropdowns" ON dropdown_options
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read active pricing" ON pricing_formulas
  FOR SELECT USING (is_active = true);

-- Admin full access (using user_metadata role)
CREATE POLICY "Admin full access products" ON products
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'store_manager', 'production_manager')
  );

CREATE POLICY "Admin full access dropdowns" ON dropdown_options
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'store_manager')
  );

CREATE POLICY "Admin full access pricing" ON pricing_formulas
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'store_manager')
  );

CREATE POLICY "Admin full access fabrics" ON fabrics
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'store_manager')
  );

CREATE POLICY "Admin full access accessories" ON accessories
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'store_manager')
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dropdown_options_updated_at BEFORE UPDATE ON dropdown_options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_formulas_updated_at BEFORE UPDATE ON pricing_formulas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fabrics_updated_at BEFORE UPDATE ON fabrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accessories_updated_at BEFORE UPDATE ON accessories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();