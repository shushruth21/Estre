-- Clean up accessories_prices table to only include the specified items
-- This script will:
-- 1. Ensure description has a unique constraint (if not exists)
-- 2. Delete all rows not in the specified list
-- 3. Insert/update the specified items with correct prices

-- Step 0: Handle duplicates and add unique constraint on description
-- First, remove any duplicate descriptions (keep the one with the latest updated_at or created_at)
DELETE FROM accessories_prices
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY description ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST) as rn
    FROM accessories_prices
  ) t
  WHERE rn > 1
);

-- Now add unique constraint on description if it doesn't exist
-- This allows us to use ON CONFLICT (description) for upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'accessories_prices_description_unique'
  ) THEN
    ALTER TABLE accessories_prices 
    ADD CONSTRAINT accessories_prices_description_unique 
    UNIQUE (description);
  END IF;
EXCEPTION
  WHEN others THEN
    -- If constraint already exists or other error, continue
    RAISE NOTICE 'Constraint may already exist or error occurred: %', SQLERRM;
END $$;

-- Step 1: Delete all existing records not in your list
DELETE FROM accessories_prices
WHERE description NOT IN (
  'Single USB Charger-Round shaped, push button',
  'Dual USB Charger-Round shaped Black, Rose Gold border',
  'Dual USB Charger-Round shaped, Black',
  'USB Charger-Square shaped, Black',
  'Wireless Phone charger panel',
  'Wireless Phone charger-S257 round shaped',
  'Wireless Phone charger-S243 round shaped',
  'Wireless Phone charger-S244 rectangle shaped',
  'Dual Motor switch with wireless charger',
  'Wireless Charger',
  'Plastic cup holder-2.5 in PVC',
  'Stainless Steel cup holder-2 Steel colour',
  'Stainless Steel cup holder-2 Gold colour',
  'Chiller cup holder without operating system',
  'Chiller cup holder with operating system',
  'Pressing Cup holder',
  'Mobile holder-D105',
  'Mobile Holder with Wireless charging-Type1',
  'Mobile Holder with Wireless charging-Type2',
  'Writing pad-Plastic',
  'Armrest set with cup holder, mobile holder with wireless charger',
  'Writing pad-Fiber'
);

-- Step 2: Upsert (Insert or Update) the specified items
-- Using description as the unique identifier
INSERT INTO accessories_prices (description, images, sale_price, is_active, created_at, updated_at)
VALUES
  ('Single USB Charger-Round shaped, push button', NULL, 1062, true, now(), now()),
  ('Dual USB Charger-Round shaped Black, Rose Gold border', NULL, 1888, true, now(), now()),
  ('Dual USB Charger-Round shaped, Black', NULL, 1888, true, now(), now()),
  ('USB Charger-Square shaped, Black', NULL, 1888, true, now(), now()),
  ('Wireless Phone charger panel', NULL, 26243, true, now(), now()),
  ('Wireless Phone charger-S257 round shaped', NULL, 2242, true, now(), now()),
  ('Wireless Phone charger-S243 round shaped', NULL, 2478, true, now(), now()),
  ('Wireless Phone charger-S244 rectangle shaped', NULL, 2006, true, now(), now()),
  ('Dual Motor switch with wireless charger', NULL, 5664, true, now(), now()),
  ('Wireless Charger', NULL, 11328, true, now(), now()),
  ('Plastic cup holder-2.5 in PVC', NULL, 35, true, now(), now()),
  ('Stainless Steel cup holder-2 Steel colour', NULL, 212, true, now(), now()),
  ('Stainless Steel cup holder-2 Gold colour', NULL, 189, true, now(), now()),
  ('Chiller cup holder without operating system', NULL, 9204, true, now(), now()),
  ('Chiller cup holder with operating system', NULL, 14632, true, now(), now()),
  ('Pressing Cup holder', NULL, 602, true, now(), now()),
  ('Mobile holder-D105', NULL, 1534, true, now(), now()),
  ('Mobile Holder with Wireless charging-Type1', NULL, 5664, true, now(), now()),
  ('Mobile Holder with Wireless charging-Type2', NULL, 5664, true, now(), now()),
  ('Writing pad-Plastic', NULL, 3988, true, now(), now()),
  ('Armrest set with cup holder, mobile holder with wireless charger', NULL, 13971, true, now(), now()),
  ('Writing pad-Fiber', NULL, 3988, true, now(), now())
ON CONFLICT (description) 
DO UPDATE SET
  sale_price = EXCLUDED.sale_price,
  images = EXCLUDED.images,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Verify the cleanup
SELECT 
  description as "Items",
  images as "Image",
  sale_price as "Price (Rs.)",
  is_active
FROM accessories_prices
ORDER BY description;

-- Count total records (should be 22)
SELECT COUNT(*) as total_accessories FROM accessories_prices;

-- Show summary
SELECT 
  COUNT(*) as total_items,
  SUM(sale_price) as total_value,
  AVG(sale_price) as avg_price,
  MIN(sale_price) as min_price,
  MAX(sale_price) as max_price
FROM accessories_prices
WHERE is_active = true;
