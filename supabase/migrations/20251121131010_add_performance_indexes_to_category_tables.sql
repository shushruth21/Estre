/*
  # Add Performance Indexes to Category Tables

  ## Overview
  This migration adds critical performance indexes to all product category tables
  to optimize query performance for the product catalog page.

  ## Changes Made

  1. **is_active Column Indexes**
     - Added indexes on `is_active` column for all category tables
     - These indexes optimize the WHERE clause filtering in product queries
     - Significantly reduces query time when filtering active products

  2. **Composite Indexes**
     - Added composite indexes on (is_active, title) for optimal query performance
     - Supports queries that filter by is_active AND sort by title
     - Covers the exact query pattern used in Products.tsx

  3. **Tables Updated**
     - bed_database
     - recliner_database
     - cinema_chairs_database
     - dining_chairs_database
     - arm_chairs_database
     - benches_database
     - kids_bed_database
     - sofabed_database
     - Note: sofa_database already has idx_sofa_active
     - Note: database_pouffes doesn't have is_active column

  ## Performance Impact
  - Expected query time reduction: 50-80% for product listing queries
  - Enables efficient filtering and sorting in single index scan
  - Reduces database CPU usage for frequently accessed queries

  ## Notes
  - Indexes are created with IF NOT EXISTS to allow safe re-runs
  - Primary key indexes already exist and are not duplicated
  - Title-only indexes are kept for backward compatibility
*/

-- Add is_active indexes for tables that don't have them yet
CREATE INDEX IF NOT EXISTS idx_bed_active 
  ON bed_database(is_active);

CREATE INDEX IF NOT EXISTS idx_recliner_active 
  ON recliner_database(is_active);

CREATE INDEX IF NOT EXISTS idx_cinema_active 
  ON cinema_chairs_database(is_active);

CREATE INDEX IF NOT EXISTS idx_dining_chairs_active 
  ON dining_chairs_database(is_active);

CREATE INDEX IF NOT EXISTS idx_arm_chairs_active 
  ON arm_chairs_database(is_active);

CREATE INDEX IF NOT EXISTS idx_benches_active 
  ON benches_database(is_active);

CREATE INDEX IF NOT EXISTS idx_kids_bed_active 
  ON kids_bed_database(is_active);

CREATE INDEX IF NOT EXISTS idx_sofabed_active 
  ON sofabed_database(is_active);

-- Add composite indexes for optimal query performance (is_active + title sorting)
-- These support: WHERE is_active = true ORDER BY title
CREATE INDEX IF NOT EXISTS idx_sofa_active_title 
  ON sofa_database(is_active, title);

CREATE INDEX IF NOT EXISTS idx_bed_active_title 
  ON bed_database(is_active, title);

CREATE INDEX IF NOT EXISTS idx_recliner_active_title 
  ON recliner_database(is_active, title);

CREATE INDEX IF NOT EXISTS idx_cinema_active_title 
  ON cinema_chairs_database(is_active, title);

CREATE INDEX IF NOT EXISTS idx_dining_chairs_active_title 
  ON dining_chairs_database(is_active, title);

CREATE INDEX IF NOT EXISTS idx_arm_chairs_active_title 
  ON arm_chairs_database(is_active, title);

CREATE INDEX IF NOT EXISTS idx_benches_active_title 
  ON benches_database(is_active, title);

CREATE INDEX IF NOT EXISTS idx_kids_bed_active_title 
  ON kids_bed_database(is_active, title);

CREATE INDEX IF NOT EXISTS idx_sofabed_active_title 
  ON sofabed_database(is_active, title);

-- Add index on database_pouffes title for sorting (no is_active column)
CREATE INDEX IF NOT EXISTS idx_pouffes_title 
  ON database_pouffes(title);
