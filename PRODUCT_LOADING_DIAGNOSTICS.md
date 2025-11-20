# Product Loading Diagnostics Guide

## Issue: Products Not Loading

If products are showing as placeholder cards but not loading actual data, follow these steps:

## Step 1: Check Browser Console

1. Open your browser (Chrome/Firefox)
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Refresh the products page (`/products`)

### Look for these messages:

#### ✅ Success Messages:
- `🔍 Fetching products:` - Query started
- `📦 Raw product data from database:` - Products found and loaded
- `✅ Image parsed successfully:` - Images loading correctly

#### ⚠️ Warning Messages:
- `⚠️ No products found in database:` - Table is empty or all products inactive
- `⚠️ Image parsing failed:` - Image URLs are invalid

#### ❌ Error Messages:
- `❌ Supabase query error:` - Database query failed
- Check the error details:
  - `code: PGRST301` = Permission denied (RLS issue)
  - `code: 42P01` = Table doesn't exist
  - `code: 42703` = Column doesn't exist

## Step 2: Check Network Tab

1. In Developer Tools, go to **Network** tab
2. Refresh the page
3. Look for requests to Supabase (filter by "supabase")
4. Click on a request and check:
   - **Status**: Should be `200 OK`
   - **Response**: Should contain product data
   - **Headers**: Check for authentication headers

## Step 3: Run Diagnostic SQL

Run this in **Supabase SQL Editor**:

```sql
-- Check if products exist
SELECT 
    'sofa_database' as table_name,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE is_active = true) as active_count
FROM sofa_database
UNION ALL
SELECT 'bed_database', COUNT(*), COUNT(*) FILTER (WHERE is_active = true) FROM bed_database
UNION ALL
SELECT 'recliner_database', COUNT(*), COUNT(*) FILTER (WHERE is_active = true) FROM recliner_database;
```

**Expected**: Should show counts > 0 for `active_count`

## Step 4: Test RLS Policies

Run this in **Supabase SQL Editor**:

```sql
-- Test anonymous access
SET ROLE anon;
SELECT COUNT(*) as sofa_count FROM sofa_database WHERE is_active = true;
SELECT id, title FROM sofa_database WHERE is_active = true LIMIT 3;
RESET ROLE;
```

**Expected**: Should return counts and product data without errors

## Step 5: Verify RLS Policies

```sql
-- Check public read policies exist
SELECT 
    tablename,
    policyname,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'sofa_database'
AND policyname LIKE 'Public read%';
```

**Expected**: Should see policy with `roles` containing `{public}` or `{anon}`

## Step 6: Check Column Names

The query selects these columns. Verify they exist:

```sql
-- Check columns exist in sofa_database
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sofa_database'
AND column_name IN (
    'id', 'title', 'images', 
    'net_price_rs', 'strike_price_rs', 
    'discount_percent', 'discount_rs', 'bom_rs', 'is_active'
);
```

**Expected**: All columns should exist

## Common Issues & Fixes

### Issue 1: "No products found"
**Cause**: Table is empty or all products have `is_active = false`

**Fix**:
```sql
-- Check inactive products
SELECT COUNT(*) FROM sofa_database WHERE is_active = false;

-- Activate products
UPDATE sofa_database SET is_active = true WHERE is_active = false;

-- Or add test product
INSERT INTO sofa_database (title, net_price_rs, strike_price_rs, is_active)
VALUES ('Test Sofa', 50000, 60000, true);
```

### Issue 2: "Permission denied" (PGRST301)
**Cause**: RLS policy not allowing anonymous access

**Fix**: Re-run the migration:
```sql
-- Run this from: supabase/migrations/20251120000000_fix_public_read_policies.sql
```

### Issue 3: "Table does not exist" (42P01)
**Cause**: Table name mismatch

**Fix**: Verify table names match exactly (case-sensitive)

### Issue 4: "Column does not exist" (42703)
**Cause**: Column name mismatch

**Fix**: Check column names in Supabase Dashboard → Database → Tables

## Quick Test: Add Sample Product

If tables are empty, add a test product:

```sql
-- Add test sofa
INSERT INTO sofa_database (
    title,
    net_price_rs,
    strike_price_rs,
    discount_percent,
    discount_rs,
    bom_rs,
    images,
    is_active
) VALUES (
    'Test Luxury Sofa',
    75000,
    90000,
    10,
    15000,
    50000,
    ARRAY['https://example.com/sofa.jpg'],
    true
) RETURNING *;
```

Then refresh `/products` - you should see the test product.

## Still Not Working?

1. **Check Supabase Dashboard**:
   - Database → Tables → Verify tables exist
   - Authentication → Policies → Check RLS is enabled
   - Logs → Check for errors

2. **Check Environment Variables**:
   - Verify `.env` file has correct `VITE_SUPABASE_URL`
   - Check `VITE_SUPABASE_ANON_KEY` is set

3. **Clear Browser Cache**:
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

4. **Check Supabase Project Status**:
   - Go to Supabase Dashboard
   - Check if project is active and healthy

## Share Debug Info

If still not working, share:
1. Browser console errors (screenshot)
2. Network tab response (screenshot)
3. Results from diagnostic SQL queries
4. Any error messages from Supabase Dashboard

