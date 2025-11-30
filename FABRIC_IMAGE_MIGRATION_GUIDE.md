# 🖼️ Fabric Image Migration Guide

## ✅ Changes Made

### 1. Updated Migration Function
**File:** `supabase/functions/migrate-images-to-storage/index.ts`

- ✅ Added `fabric_coding` table with `colour_link` column to migration list
- ✅ Updated external URL detection to handle signed URLs properly

### 2. Enhanced Image Utilities
**File:** `src/lib/image-utils.ts`

- ✅ Added `convertSignedUrlToPublic()` function to convert signed URLs to public URLs
- ✅ Updated `normalizeImageUrl()` to automatically convert signed URLs to public URLs
- ✅ This ensures all Supabase Storage signed URLs are converted to public URLs for faster loading

### 3. Created Cleanup Migration
**File:** `supabase/migrations/20251125000002_cleanup_fabric_images.sql`

- ✅ Cleans up #VALUE! errors (1,020 entries)
- ✅ Converts signed URLs to public URLs
- ✅ Updates timestamps

## 🚀 Next Steps

### Step 1: Run Cleanup Migration
Run this SQL in Supabase SQL Editor:
```sql
-- File: supabase/migrations/20251125000002_cleanup_fabric_images.sql
```

This will:
- Clean up 1,020 #VALUE! errors
- Convert any existing signed URLs to public URLs

### Step 2: Deploy Updated Migration Function
```bash
cd /Users/shushruthbharadwaj/Desktop/Estre/estre-configurator-pro
supabase functions deploy migrate-images-to-storage
```

### Step 3: Test with Dry Run
In Supabase Dashboard → Edge Functions → `migrate-images-to-storage` → Invoke:

```json
{
  "table": "fabric_coding",
  "dryRun": true,
  "batchSize": 5
}
```

### Step 4: Run Actual Migration
After verifying dry run, invoke with:

```json
{
  "table": "fabric_coding",
  "dryRun": false,
  "batchSize": 10
}
```

**Expected:** Migrates ~3,364 Google Drive images to Supabase Storage

### Step 5: Verify Results
Run this SQL to check migration status:

```sql
SELECT 
  CASE 
    WHEN colour_link LIKE '%/storage/v1/object/public/%' THEN '✅ Supabase Public URL'
    WHEN colour_link LIKE '%/storage/v1/object/sign/%' THEN '⚠️ Supabase Signed URL'
    WHEN colour_link LIKE '%drive.google.com%' THEN '📥 Google Drive (not migrated)'
    WHEN colour_link IS NULL OR colour_link = '' THEN '❌ No Image'
    ELSE '❓ Other'
  END as image_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM fabric_coding
WHERE is_active = true
GROUP BY 
  CASE 
    WHEN colour_link LIKE '%/storage/v1/object/public/%' THEN '✅ Supabase Public URL'
    WHEN colour_link LIKE '%/storage/v1/object/sign/%' THEN '⚠️ Supabase Signed URL'
    WHEN colour_link LIKE '%drive.google.com%' THEN '📥 Google Drive (not migrated)'
    WHEN colour_link IS NULL OR colour_link = '' THEN '❌ No Image'
    ELSE '❓ Other'
  END
ORDER BY count DESC;
```

## 📊 Current Status

- **Google Drive URLs:** 3,364 (73.21%) - Will be migrated
- **#VALUE! Errors:** 1,020 (22.20%) - Will be cleaned up
- **No Images:** 211 (4.59%) - Expected, some fabrics may not have images

## 🎯 Expected Results After Migration

- ✅ **Supabase Public URLs:** ~73% (migrated from Google Drive)
- ❌ **No Images:** ~27% (includes cleaned #VALUE! entries)
- ⚡ **Faster Loading:** All images load from Supabase Storage (CDN)
- 🔒 **No Expiration:** Public URLs don't expire like signed URLs

## ⚠️ Important Notes

1. **Migration Time:** ~3,364 images × 2-3 seconds each ≈ 2-3 hours
2. **Batch Processing:** Function processes in batches of 10 with delays
3. **Failed Images:** Original URLs are kept if migration fails (can retry)
4. **Storage Space:** Ensure sufficient Supabase Storage space

## 🔧 Troubleshooting

### If migration fails for some images:
- Check Supabase Storage bucket exists and is public
- Verify service role key has storage permissions
- Check function logs for specific error messages

### If images still show signed URLs:
- Run the cleanup migration SQL again
- Or manually convert: `supabase/migrations/20251125000002_cleanup_fabric_images.sql`

### If images don't load after migration:
- Verify bucket is public: `SELECT * FROM storage.buckets WHERE name = 'public';`
- Check image URLs in database: `SELECT estre_code, colour_link FROM fabric_coding LIMIT 10;`
- Verify URLs are accessible in browser

## ✅ Checklist

- [ ] Run cleanup migration SQL
- [ ] Deploy updated migration function
- [ ] Test with dry run
- [ ] Run actual migration
- [ ] Verify migration results
- [ ] Test image loading in app
- [ ] Monitor Supabase Storage usage

