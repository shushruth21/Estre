-- ============================================================================
-- UPDATE PILLOW TYPES AND PRICING STRUCTURE
-- ============================================================================
-- This migration updates pillow types and pricing to be size-dependent
-- Pricing and fabric requirements vary by both pillow type AND size
-- ============================================================================

-- ============================================================================
-- STEP 1: UPDATE SOFA PILLOW TYPES
-- ============================================================================

-- Disable all existing pillow types for sofa
UPDATE dropdown_options
SET is_active = false,
    updated_at = NOW()
WHERE category = 'sofa'
  AND field_name = 'pillow_type';

-- Insert new pillow types for sofa
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'pillow_type', 'Simple pillow', 'Simple pillow', 1, true, '{"default": true}'),
('sofa', 'pillow_type', 'Diamond quilted pillow', 'Diamond quilted pillow', 2, true, '{}'),
('sofa', 'pillow_type', 'Diamond with pipen quilted pillow', 'Diamond with pipen quilted pillow', 3, true, '{}'),
('sofa', 'pillow_type', 'Belt overlapping pillow', 'Belt overlapping pillow', 4, true, '{}'),
('sofa', 'pillow_type', 'Tassels with pillow', 'Tassels with pillow', 5, true, '{}'),
('sofa', 'pillow_type', 'Tassels without pillow', 'Tassels without pillow', 6, true, '{}')
ON CONFLICT (category, field_name, option_value) 
DO UPDATE SET 
  display_label = EXCLUDED.display_label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- STEP 2: UPDATE SOFA PILLOW SIZES WITH PRICING AND FABRIC METADATA
-- ============================================================================

-- Disable existing pillow sizes
UPDATE dropdown_options
SET is_active = false,
    updated_at = NOW()
WHERE category = 'sofa'
  AND field_name = 'pillow_size';

-- Insert updated pillow sizes with pricing and fabric metadata
-- Metadata structure: {"price_matrix": {"Simple pillow": 1200, "Diamond quilted pillow": 3500, ...}, "fabric_matrix": {"Simple pillow": 0.6, ...}}
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofa', 'pillow_size', '18 in X 18 in', '18 in X 18 in', 1, true, '{
  "default": true,
  "price_matrix": {
    "Simple pillow": 1200,
    "Diamond quilted pillow": 3500,
    "Diamond with pipen quilted pillow": 3500,
    "Belt overlapping pillow": 4000,
    "Tassels with pillow": 2500,
    "Tassels without pillow": 2500
  },
  "fabric_matrix": {
    "Simple pillow": 0.6,
    "Diamond quilted pillow": 0.7,
    "Diamond with pipen quilted pillow": 0.7,
    "Belt overlapping pillow": 1.5,
    "Tassels with pillow": 0.6,
    "Tassels without pillow": 0.6
  }
}'),
('sofa', 'pillow_size', '20 in X 20 in', '20 in X 20 in', 2, true, '{
  "price_matrix": {
    "Simple pillow": 1500,
    "Diamond quilted pillow": 4000,
    "Diamond with pipen quilted pillow": 4000,
    "Belt overlapping pillow": 4500,
    "Tassels with pillow": 3000,
    "Tassels without pillow": 3000
  },
  "fabric_matrix": {
    "Simple pillow": 0.7,
    "Diamond quilted pillow": 0.8,
    "Diamond with pipen quilted pillow": 0.8,
    "Belt overlapping pillow": 1.5,
    "Tassels with pillow": 0.7,
    "Tassels without pillow": 0.7
  }
}'),
('sofa', 'pillow_size', '16 in X 24 in', '16 in X 24 in', 3, true, '{
  "price_matrix": {
    "Simple pillow": 1500,
    "Diamond quilted pillow": 4000,
    "Diamond with pipen quilted pillow": 4000,
    "Belt overlapping pillow": 4500,
    "Tassels with pillow": 3000,
    "Tassels without pillow": 3000
  },
  "fabric_matrix": {
    "Simple pillow": 0.8,
    "Diamond quilted pillow": 0.9,
    "Diamond with pipen quilted pillow": 0.9,
    "Belt overlapping pillow": 2.0,
    "Tassels with pillow": 0.8,
    "Tassels without pillow": 0.8
  }
}')
ON CONFLICT (category, field_name, option_value) 
DO UPDATE SET 
  display_label = EXCLUDED.display_label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- STEP 3: UPDATE SOFABED PILLOW TYPES
-- ============================================================================

-- Disable all existing pillow types for sofabed
UPDATE dropdown_options
SET is_active = false,
    updated_at = NOW()
WHERE category = 'sofabed'
  AND field_name = 'pillow_type';

-- Insert new pillow types for sofabed (same as sofa)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofabed', 'pillow_type', 'Simple pillow', 'Simple pillow', 1, true, '{"default": true}'),
('sofabed', 'pillow_type', 'Diamond quilted pillow', 'Diamond quilted pillow', 2, true, '{}'),
('sofabed', 'pillow_type', 'Diamond with pipen quilted pillow', 'Diamond with pipen quilted pillow', 3, true, '{}'),
('sofabed', 'pillow_type', 'Belt overlapping pillow', 'Belt overlapping pillow', 4, true, '{}'),
('sofabed', 'pillow_type', 'Tassels with pillow', 'Tassels with pillow', 5, true, '{}'),
('sofabed', 'pillow_type', 'Tassels without pillow', 'Tassels without pillow', 6, true, '{}')
ON CONFLICT (category, field_name, option_value) 
DO UPDATE SET 
  display_label = EXCLUDED.display_label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- STEP 4: UPDATE SOFABED PILLOW SIZES WITH PRICING AND FABRIC METADATA
-- ============================================================================

-- Disable existing pillow sizes
UPDATE dropdown_options
SET is_active = false,
    updated_at = NOW()
WHERE category = 'sofabed'
  AND field_name = 'pillow_size';

-- Insert updated pillow sizes (same as sofa)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('sofabed', 'pillow_size', '18 in X 18 in', '18 in X 18 in', 1, true, '{
  "default": true,
  "price_matrix": {
    "Simple pillow": 1200,
    "Diamond quilted pillow": 3500,
    "Diamond with pipen quilted pillow": 3500,
    "Belt overlapping pillow": 4000,
    "Tassels with pillow": 2500,
    "Tassels without pillow": 2500
  },
  "fabric_matrix": {
    "Simple pillow": 0.6,
    "Diamond quilted pillow": 0.7,
    "Diamond with pipen quilted pillow": 0.7,
    "Belt overlapping pillow": 1.5,
    "Tassels with pillow": 0.6,
    "Tassels without pillow": 0.6
  }
}'),
('sofabed', 'pillow_size', '20 in X 20 in', '20 in X 20 in', 2, true, '{
  "price_matrix": {
    "Simple pillow": 1500,
    "Diamond quilted pillow": 4000,
    "Diamond with pipen quilted pillow": 4000,
    "Belt overlapping pillow": 4500,
    "Tassels with pillow": 3000,
    "Tassels without pillow": 3000
  },
  "fabric_matrix": {
    "Simple pillow": 0.7,
    "Diamond quilted pillow": 0.8,
    "Diamond with pipen quilted pillow": 0.8,
    "Belt overlapping pillow": 1.5,
    "Tassels with pillow": 0.7,
    "Tassels without pillow": 0.7
  }
}'),
('sofabed', 'pillow_size', '16 in X 24 in', '16 in X 24 in', 3, true, '{
  "price_matrix": {
    "Simple pillow": 1500,
    "Diamond quilted pillow": 4000,
    "Diamond with pipen quilted pillow": 4000,
    "Belt overlapping pillow": 4500,
    "Tassels with pillow": 3000,
    "Tassels without pillow": 3000
  },
  "fabric_matrix": {
    "Simple pillow": 0.8,
    "Diamond quilted pillow": 0.9,
    "Diamond with pipen quilted pillow": 0.9,
    "Belt overlapping pillow": 2.0,
    "Tassels with pillow": 0.8,
    "Tassels without pillow": 0.8
  }
}')
ON CONFLICT (category, field_name, option_value) 
DO UPDATE SET 
  display_label = EXCLUDED.display_label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- STEP 5: UPDATE RECLINER PILLOW TYPES (if applicable)
-- ============================================================================

-- Disable all existing pillow types for recliner
UPDATE dropdown_options
SET is_active = false,
    updated_at = NOW()
WHERE category = 'recliner'
  AND field_name = 'pillow_type';

-- Insert new pillow types for recliner (same as sofa)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('recliner', 'pillow_type', 'Simple pillow', 'Simple pillow', 1, true, '{"default": true}'),
('recliner', 'pillow_type', 'Diamond quilted pillow', 'Diamond quilted pillow', 2, true, '{}'),
('recliner', 'pillow_type', 'Diamond with pipen quilted pillow', 'Diamond with pipen quilted pillow', 3, true, '{}'),
('recliner', 'pillow_type', 'Belt overlapping pillow', 'Belt overlapping pillow', 4, true, '{}'),
('recliner', 'pillow_type', 'Tassels with pillow', 'Tassels with pillow', 5, true, '{}'),
('recliner', 'pillow_type', 'Tassels without pillow', 'Tassels without pillow', 6, true, '{}')
ON CONFLICT (category, field_name, option_value) 
DO UPDATE SET 
  display_label = EXCLUDED.display_label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- STEP 6: UPDATE RECLINER PILLOW SIZES (if applicable)
-- ============================================================================

-- Disable existing pillow sizes
UPDATE dropdown_options
SET is_active = false,
    updated_at = NOW()
WHERE category = 'recliner'
  AND field_name = 'pillow_size';

-- Insert updated pillow sizes (same as sofa)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('recliner', 'pillow_size', '18 in X 18 in', '18 in X 18 in', 1, true, '{
  "default": true,
  "price_matrix": {
    "Simple pillow": 1200,
    "Diamond quilted pillow": 3500,
    "Diamond with pipen quilted pillow": 3500,
    "Belt overlapping pillow": 4000,
    "Tassels with pillow": 2500,
    "Tassels without pillow": 2500
  },
  "fabric_matrix": {
    "Simple pillow": 0.6,
    "Diamond quilted pillow": 0.7,
    "Diamond with pipen quilted pillow": 0.7,
    "Belt overlapping pillow": 1.5,
    "Tassels with pillow": 0.6,
    "Tassels without pillow": 0.6
  }
}'),
('recliner', 'pillow_size', '20 in X 20 in', '20 in X 20 in', 2, true, '{
  "price_matrix": {
    "Simple pillow": 1500,
    "Diamond quilted pillow": 4000,
    "Diamond with pipen quilted pillow": 4000,
    "Belt overlapping pillow": 4500,
    "Tassels with pillow": 3000,
    "Tassels without pillow": 3000
  },
  "fabric_matrix": {
    "Simple pillow": 0.7,
    "Diamond quilted pillow": 0.8,
    "Diamond with pipen quilted pillow": 0.8,
    "Belt overlapping pillow": 1.5,
    "Tassels with pillow": 0.7,
    "Tassels without pillow": 0.7
  }
}'),
('recliner', 'pillow_size', '16 in X 24 in', '16 in X 24 in', 3, true, '{
  "price_matrix": {
    "Simple pillow": 1500,
    "Diamond quilted pillow": 4000,
    "Diamond with pipen quilted pillow": 4000,
    "Belt overlapping pillow": 4500,
    "Tassels with pillow": 3000,
    "Tassels without pillow": 3000
  },
  "fabric_matrix": {
    "Simple pillow": 0.8,
    "Diamond quilted pillow": 0.9,
    "Diamond with pipen quilted pillow": 0.9,
    "Belt overlapping pillow": 2.0,
    "Tassels with pillow": 0.8,
    "Tassels without pillow": 0.8
  }
}')
ON CONFLICT (category, field_name, option_value) 
DO UPDATE SET 
  display_label = EXCLUDED.display_label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- STEP 7: UPDATE ARM CHAIRS PILLOW TYPES
-- ============================================================================

-- Disable all existing pillow types for arm_chairs
UPDATE dropdown_options
SET is_active = false,
    updated_at = NOW()
WHERE category = 'arm_chairs'
  AND field_name = 'pillow_type';

-- Insert new pillow types for arm_chairs (same as sofa)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('arm_chairs', 'pillow_type', 'Simple pillow', 'Simple pillow', 1, true, '{"default": true}'),
('arm_chairs', 'pillow_type', 'Diamond quilted pillow', 'Diamond quilted pillow', 2, true, '{}'),
('arm_chairs', 'pillow_type', 'Diamond with pipen quilted pillow', 'Diamond with pipen quilted pillow', 3, true, '{}'),
('arm_chairs', 'pillow_type', 'Belt overlapping pillow', 'Belt overlapping pillow', 4, true, '{}'),
('arm_chairs', 'pillow_type', 'Tassels with pillow', 'Tassels with pillow', 5, true, '{}'),
('arm_chairs', 'pillow_type', 'Tassels without pillow', 'Tassels without pillow', 6, true, '{}')
ON CONFLICT (category, field_name, option_value) 
DO UPDATE SET 
  display_label = EXCLUDED.display_label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- STEP 8: UPDATE ARM CHAIRS PILLOW SIZES
-- ============================================================================

-- Disable existing pillow sizes
UPDATE dropdown_options
SET is_active = false,
    updated_at = NOW()
WHERE category = 'arm_chairs'
  AND field_name = 'pillow_size';

-- Insert updated pillow sizes (same as sofa)
INSERT INTO dropdown_options (category, field_name, option_value, display_label, sort_order, is_active, metadata) VALUES
('arm_chairs', 'pillow_size', '18 in X 18 in', '18 in X 18 in', 1, true, '{
  "default": true,
  "price_matrix": {
    "Simple pillow": 1200,
    "Diamond quilted pillow": 3500,
    "Diamond with pipen quilted pillow": 3500,
    "Belt overlapping pillow": 4000,
    "Tassels with pillow": 2500,
    "Tassels without pillow": 2500
  },
  "fabric_matrix": {
    "Simple pillow": 0.6,
    "Diamond quilted pillow": 0.7,
    "Diamond with pipen quilted pillow": 0.7,
    "Belt overlapping pillow": 1.5,
    "Tassels with pillow": 0.6,
    "Tassels without pillow": 0.6
  }
}'),
('arm_chairs', 'pillow_size', '20 in X 20 in', '20 in X 20 in', 2, true, '{
  "price_matrix": {
    "Simple pillow": 1500,
    "Diamond quilted pillow": 4000,
    "Diamond with pipen quilted pillow": 4000,
    "Belt overlapping pillow": 4500,
    "Tassels with pillow": 3000,
    "Tassels without pillow": 3000
  },
  "fabric_matrix": {
    "Simple pillow": 0.7,
    "Diamond quilted pillow": 0.8,
    "Diamond with pipen quilted pillow": 0.8,
    "Belt overlapping pillow": 1.5,
    "Tassels with pillow": 0.7,
    "Tassels without pillow": 0.7
  }
}'),
('arm_chairs', 'pillow_size', '16 in X 24 in', '16 in X 24 in', 3, true, '{
  "price_matrix": {
    "Simple pillow": 1500,
    "Diamond quilted pillow": 4000,
    "Diamond with pipen quilted pillow": 4000,
    "Belt overlapping pillow": 4500,
    "Tassels with pillow": 3000,
    "Tassels without pillow": 3000
  },
  "fabric_matrix": {
    "Simple pillow": 0.8,
    "Diamond quilted pillow": 0.9,
    "Diamond with pipen quilted pillow": 0.9,
    "Belt overlapping pillow": 2.0,
    "Tassels with pillow": 0.8,
    "Tassels without pillow": 0.8
  }
}')
ON CONFLICT (category, field_name, option_value) 
DO UPDATE SET 
  display_label = EXCLUDED.display_label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  sofa_pillow_types INTEGER;
  sofabed_pillow_types INTEGER;
  recliner_pillow_types INTEGER;
  arm_chairs_pillow_types INTEGER;
BEGIN
  SELECT COUNT(*) INTO sofa_pillow_types
  FROM dropdown_options
  WHERE category = 'sofa' AND field_name = 'pillow_type' AND is_active = true;
  
  SELECT COUNT(*) INTO sofabed_pillow_types
  FROM dropdown_options
  WHERE category = 'sofabed' AND field_name = 'pillow_type' AND is_active = true;
  
  SELECT COUNT(*) INTO recliner_pillow_types
  FROM dropdown_options
  WHERE category = 'recliner' AND field_name = 'pillow_type' AND is_active = true;
  
  SELECT COUNT(*) INTO arm_chairs_pillow_types
  FROM dropdown_options
  WHERE category = 'arm_chairs' AND field_name = 'pillow_type' AND is_active = true;
  
  RAISE NOTICE 'Active pillow types - Sofa: %, SofaBed: %, Recliner: %, Arm Chairs: %', 
    sofa_pillow_types, sofabed_pillow_types, recliner_pillow_types, arm_chairs_pillow_types;
  
  IF sofa_pillow_types < 6 THEN
    RAISE WARNING 'WARNING: Expected 6 pillow types for sofa, found %', sofa_pillow_types;
  END IF;
END $$;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- Pricing and fabric requirements are now stored in pillow_size metadata as:
-- - price_matrix: Maps pillow type to price for this size
-- - fabric_matrix: Maps pillow type to fabric meters required for this size
--
-- The pricing logic will:
-- 1. Get the selected pillow size
-- 2. Look up the price_matrix in the size's metadata
-- 3. Find the price for the selected pillow type
-- 4. Multiply by quantity
--
-- The fabric calculation will:
-- 1. Get the selected pillow size
-- 2. Look up the fabric_matrix in the size's metadata
-- 3. Find the fabric meters for the selected pillow type
-- 4. Multiply by quantity
-- ============================================================================

