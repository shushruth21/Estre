-- Create product_urls table for hashed URLs
CREATE TABLE IF NOT EXISTS product_urls (
    hash TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    product_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category, product_id)
);

-- Enable RLS
ALTER TABLE product_urls ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access" ON product_urls
    FOR SELECT USING (true);

-- Function to generate random hash (6 characters)
CREATE OR REPLACE FUNCTION generate_url_hash() RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER := 0;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to populate hashes for a specific table
CREATE OR REPLACE FUNCTION populate_product_hashes(table_name TEXT, cat_name TEXT) RETURNS VOID AS $$
BEGIN
    EXECUTE format('
        INSERT INTO product_urls (hash, category, product_id)
        SELECT generate_url_hash(), %L, id
        FROM %I
        ON CONFLICT (category, product_id) DO NOTHING
    ', cat_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- Populate hashes for all categories
SELECT populate_product_hashes('sofa_database', 'sofa');
SELECT populate_product_hashes('bed_database', 'bed');
SELECT populate_product_hashes('recliner_database', 'recliner');
SELECT populate_product_hashes('cinema_chairs_database', 'cinema_chairs');
SELECT populate_product_hashes('dining_chairs_database', 'dining_chairs');
SELECT populate_product_hashes('arm_chairs_database', 'arm_chairs');
SELECT populate_product_hashes('benches_database', 'benches');
SELECT populate_product_hashes('kids_bed_database', 'kids_bed');
SELECT populate_product_hashes('sofabed_database', 'sofabed');
SELECT populate_product_hashes('database_pouffes', 'database_pouffes');
