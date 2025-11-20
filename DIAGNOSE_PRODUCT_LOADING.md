# Diagnose Product Loading Issue

## ✅ Products Exist in Database
You have **85 active products** in `sofa_database`, so the issue is with the query or RLS policies.

## Step 1: Check Column Names

Run this in Supabase SQL Editor to see what columns actually exist:

```sql
-- Check what price columns exist in sofa_database
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sofa_database'
AND column_name LIKE '%price%'
ORDER BY column_name;
```

**The app is trying to query:**
- `net_price_rs` ✅ (should exist)
- `strike_price_1seater_rs` ⚠️ (might not exist!)
- `bom_rs` ⚠️ (might not exist)

## Step 2: Test Anonymous Access

Run this to test if anonymous users can read products:

```sql
SET ROLE anon;

-- Try with the column the app uses
SELECT 
    id, 
    title, 
    images, 
    net_price_rs, 
    strike_price_1seater_rs,  -- This might fail!
    discount_percent, 
    discount_rs, 
    bom_rs
FROM sofa_database
WHERE is_active = true
LIMIT 3;

RESET ROLE;
```

**If this fails**, try with `strike_price_rs` instead:

```sql
SET ROLE anon;
SELECT 
    id, 
    title, 
    images, 
    net_price_rs, 
    strike_price_rs,  -- Try this instead
    discount_percent, 
    discount_rs, 
    bom_rs
FROM sofa_database
WHERE is_active = true
LIMIT 3;
RESET ROLE;
```

## Step 3: Check Browser Console

1. Open `/products` page
2. Press `F12` → Console tab
3. Look for error messages

**Common errors:**
- `column "strike_price_1seater_rs" does not exist` → Column name mismatch
- `permission denied` → RLS policy issue
- `relation "sofa_database" does not exist` → Table name issue

## Step 4: Quick Fix - Update Column Mapping

If `strike_price_1seater_rs` doesn't exist, we need to update the column mapping in `Products.tsx`.

**Share the results from Step 1** and I'll fix the column mapping accordingly.

## Most Likely Issue

Based on the code, the app queries `strike_price_1seater_rs` for sofas, but your database might have:
- `strike_price_rs` (without the "1seater" part)
- Or a different column name

**Run Step 1 and Step 2** and share the results, then I can fix the exact column names.

