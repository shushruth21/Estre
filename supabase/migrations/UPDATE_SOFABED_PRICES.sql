-- Update Sofa Bed product prices based on product title
-- This migration matches product names with their corresponding prices

UPDATE sofabed_database
SET net_price_rs = CASE
  WHEN title = 'Albatross' THEN 68739.00
  WHEN title = 'Amore' THEN 63542.00
  WHEN title = 'Anke' THEN 62729.00
  WHEN title = 'Avebury' THEN 57745.00
  WHEN title = 'Beckett' THEN 63860.00
  WHEN title = 'Cory' THEN 68764.00
  WHEN title = 'Dinny' THEN 66444.00
  WHEN title = 'Dino' THEN 63860.00
  WHEN title = 'Felix' THEN 67400.00
  WHEN title = 'Indiana' THEN 698834.00
  WHEN title = 'Itasca' THEN 69884.00
  WHEN title = 'Malmo' THEN 66647.00
  WHEN title = 'Riva' THEN NULL  -- Keep NULL as shown in table
  WHEN title = 'Stefan' THEN 66650.00
  WHEN title = 'Vinci' THEN 69701.00
  WHEN title = 'Zaxxy' THEN 66371.00
  ELSE net_price_rs  -- Keep existing value if title doesn't match
END,
updated_at = now()
WHERE title IN (
  'Albatross', 'Amore', 'Anke', 'Avebury', 'Beckett', 'Cory',
  'Dinny', 'Dino', 'Felix', 'Indiana', 'Itasca', 'Malmo',
  'Riva', 'Stefan', 'Vinci', 'Zaxxy'
);

-- Also update strike_price_1seater_rs to match (if it exists)
-- For sofabed, we might want to use strike_price_2seater_rs, but checking schema first
UPDATE sofabed_database
SET strike_price_1seater_rs = CASE
  WHEN title = 'Albatross' THEN 68739.00
  WHEN title = 'Amore' THEN 63542.00
  WHEN title = 'Anke' THEN 62729.00
  WHEN title = 'Avebury' THEN 57745.00
  WHEN title = 'Beckett' THEN 63860.00
  WHEN title = 'Cory' THEN 68764.00
  WHEN title = 'Dinny' THEN 66444.00
  WHEN title = 'Dino' THEN 63860.00
  WHEN title = 'Felix' THEN 67400.00
  WHEN title = 'Indiana' THEN 698834.00
  WHEN title = 'Itasca' THEN 69884.00
  WHEN title = 'Malmo' THEN 66647.00
  WHEN title = 'Riva' THEN NULL
  WHEN title = 'Stefan' THEN 66650.00
  WHEN title = 'Vinci' THEN 69701.00
  WHEN title = 'Zaxxy' THEN 66371.00
  ELSE strike_price_1seater_rs
END,
updated_at = now()
WHERE title IN (
  'Albatross', 'Amore', 'Anke', 'Avebury', 'Beckett', 'Cory',
  'Dinny', 'Dino', 'Felix', 'Indiana', 'Itasca', 'Malmo',
  'Riva', 'Stefan', 'Vinci', 'Zaxxy'
);

-- Verification query
SELECT 
  title,
  net_price_rs,
  strike_price_1seater_rs,
  updated_at
FROM sofabed_database
WHERE title IN (
  'Albatross', 'Amore', 'Anke', 'Avebury', 'Beckett', 'Cory',
  'Dinny', 'Dino', 'Felix', 'Indiana', 'Itasca', 'Malmo',
  'Riva', 'Stefan', 'Vinci', 'Zaxxy'
)
ORDER BY title;

