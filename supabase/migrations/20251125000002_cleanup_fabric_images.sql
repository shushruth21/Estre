-- Migration: Cleanup and Convert Fabric Images
-- Description: Cleans up #VALUE! errors and converts signed URLs to public URLs
-- Date: 2025-11-25

-- Step 1: Clean up #VALUE! errors in fabric_coding
UPDATE fabric_coding
SET 
  colour_link = NULL,
  updated_at = NOW()
WHERE is_active = true
  AND (
    colour_link = '#VALUE!' 
    OR colour_link = 'NULL' 
    OR UPPER(TRIM(colour_link)) = 'NULL'
    OR colour_link = ''
  );

-- Step 2: Convert signed URLs to public URLs
UPDATE fabric_coding
SET 
  colour_link = REGEXP_REPLACE(
    colour_link,
    '/storage/v1/object/sign/([^?]+)\?token=[^&]*',
    '/storage/v1/object/public/\1',
    'g'
  ),
  updated_at = NOW()
WHERE is_active = true
  AND colour_link LIKE '%/storage/v1/object/sign/%'
  AND colour_link IS NOT NULL
  AND colour_link != '';

-- Step 3: Verify cleanup
-- Run this separately to check results:
-- SELECT 
--   COUNT(CASE WHEN colour_link = '#VALUE!' OR colour_link = 'NULL' THEN 1 END) as remaining_errors,
--   COUNT(CASE WHEN colour_link LIKE '%/object/sign/%' THEN 1 END) as remaining_signed_urls,
--   COUNT(CASE WHEN colour_link LIKE '%/object/public/%' THEN 1 END) as public_urls
-- FROM fabric_coding
-- WHERE is_active = true;

