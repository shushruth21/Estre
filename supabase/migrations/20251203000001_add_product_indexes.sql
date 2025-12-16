-- ===============================================
-- ADD INDEXES FOR PRODUCT QUERY PERFORMANCE
-- ===============================================
-- This migration adds indexes to improve query performance
-- for product listing pages and prevent timeout errors

-- Add index on is_active for sofa_database (most common query)
CREATE INDEX IF NOT EXISTS idx_sofa_database_is_active ON sofa_database(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sofa_database_title ON sofa_database(title);

-- Add indexes for other product tables
CREATE INDEX IF NOT EXISTS idx_bed_database_is_active ON bed_database(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bed_database_title ON bed_database(title);

CREATE INDEX IF NOT EXISTS idx_recliner_database_is_active ON recliner_database(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_recliner_database_title ON recliner_database(title);

CREATE INDEX IF NOT EXISTS idx_cinema_chairs_database_is_active ON cinema_chairs_database(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cinema_chairs_database_title ON cinema_chairs_database(title);

CREATE INDEX IF NOT EXISTS idx_dining_chairs_database_is_active ON dining_chairs_database(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_dining_chairs_database_title ON dining_chairs_database(title);

CREATE INDEX IF NOT EXISTS idx_arm_chairs_database_is_active ON arm_chairs_database(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_arm_chairs_database_title ON arm_chairs_database(title);

CREATE INDEX IF NOT EXISTS idx_benches_database_is_active ON benches_database(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_benches_database_title ON benches_database(title);

CREATE INDEX IF NOT EXISTS idx_kids_bed_database_is_active ON kids_bed_database(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_kids_bed_database_title ON kids_bed_database(title);

CREATE INDEX IF NOT EXISTS idx_sofabed_database_is_active ON sofabed_database(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sofabed_database_title ON sofabed_database(title);

CREATE INDEX IF NOT EXISTS idx_database_pouffes_title ON database_pouffes(title);

-- Add index on product_urls for faster hash lookups
CREATE INDEX IF NOT EXISTS idx_product_urls_product_id ON product_urls(product_id);

COMMENT ON INDEX idx_sofa_database_is_active IS 'Partial index for faster active product queries';
COMMENT ON INDEX idx_sofa_database_title IS 'Index for faster title-based sorting';














