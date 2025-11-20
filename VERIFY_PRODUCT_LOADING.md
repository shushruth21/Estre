# Verify Product Loading After Migration

## ✅ Migration Completed Successfully

The RLS policy fix migration has been run. Now let's verify everything is working.

## Verification Steps

### Step 1: Check RLS Policies Are Fixed

Run this query in Supabase SQL Editor to verify policies:

```sql
-- Check that public read policies exist and are correct
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
        WHEN qual LIKE '%is_active%' THEN 'Has is_active filter'
        WHEN qual LIKE '%true%' THEN 'Unrestricted'
        ELSE 'Other'
    END as filter_type
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE 'Public read%'
ORDER BY tablename, policyname;
```

**Expected Result**: You should see policies with `roles` containing `{public}` or `{anon}`.

### Step 2: Test Anonymous Access

Test if anonymous users can read products:

```sql
-- Test anonymous access to sofa products
SET ROLE anon;
SELECT COUNT(*) as sofa_count FROM sofa_database WHERE is_active = true;
SELECT COUNT(*) as bed_count FROM bed_database WHERE is_active = true;
RESET ROLE;
```

**Expected Result**: Should return counts without permission errors.

### Step 3: Verify Products Exist

Check if your product tables have data:

```sql
-- Quick check of all product tables
SELECT 
    'sofa_database' as table_name, 
    COUNT(*) FILTER (WHERE is_active = true) as active_count,
    COUNT(*) as total_count
FROM sofa_database
UNION ALL
SELECT 'bed_database', COUNT(*) FILTER (WHERE is_active = true), COUNT(*) FROM bed_database
UNION ALL
SELECT 'recliner_database', COUNT(*) FILTER (WHERE is_active = true), COUNT(*) FROM recliner_database
UNION ALL
SELECT 'cinema_chairs_database', COUNT(*) FILTER (WHERE is_active = true), COUNT(*) FROM cinema_chairs_database
UNION ALL
SELECT 'dining_chairs_database', COUNT(*) FILTER (WHERE is_active = true), COUNT(*) FROM dining_chairs_database
UNION ALL
SELECT 'arm_chairs_database', COUNT(*) FILTER (WHERE is_active = true), COUNT(*) FROM arm_chairs_database
UNION ALL
SELECT 'benches_database', COUNT(*) FILTER (WHERE is_active = true), COUNT(*) FROM benches_database
UNION ALL
SELECT 'kids_bed_database', COUNT(*) FILTER (WHERE is_active = true), COUNT(*) FROM kids_bed_database
UNION ALL
SELECT 'sofabed_database', COUNT(*) FILTER (WHERE is_active = true), COUNT(*) FROM sofabed_database
UNION ALL
SELECT 'database_pouffes', COUNT(*), COUNT(*) FROM database_pouffes;
```

**Expected Result**: Should show counts for each table. If `active_count` is 0, products exist but are inactive.

### Step 4: Test in Browser

1. **Clear Browser Cache**:
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Or clear cache in browser settings

2. **Open Products Page**:
   - Navigate to `/products` or `/products?category=sofa`
   - Open Browser Console (F12)

3. **Check Console Logs**:
   Look for these messages:
   - ✅ `🔍 Fetching products:` - Query started
   - ✅ `📦 Raw product data from database:` - Success with data count
   - ⚠️ `⚠️ No products found in database:` - Table empty or all inactive
   - ❌ `❌ Supabase query error:` - Error occurred (check details)

4. **Check Network Tab**:
   - Look for requests to Supabase
   - Check if they return 200 OK
   - Verify response contains product data

### Step 5: Test Different Categories

Try switching between categories:
- Sofas
- Beds
- Recliners
- Cinema Chairs
- etc.

Each category should load products if they exist in that table.

## Troubleshooting

### If Products Still Don't Load:

#### Issue 1: "No products found"
**Solution**: Products table is empty or all products are inactive
- Check Supabase Dashboard → Database → Tables
- Verify products exist and `is_active = true`
- Add test products if needed

#### Issue 2: "Permission denied" or RLS error
**Solution**: RLS policies not working correctly
- Re-run the migration
- Check policies with verification query above
- Ensure policies use `TO public`

#### Issue 3: "Table does not exist"
**Solution**: Table name mismatch
- Verify table names match exactly (case-sensitive)
- Check `getCategoryTableName()` function in Products.tsx

#### Issue 4: Network errors
**Solution**: Connection or environment issues
- Check `.env` file has correct Supabase URL
- Verify network connectivity
- Check Supabase project status

### Quick Fix: Add Test Product

If tables are empty, add a test product:

```sql
-- Add test sofa product
INSERT INTO sofa_database (
    title,
    net_price_rs,
    strike_price_rs,
    is_active
) VALUES (
    'Test Sofa',
    50000,
    60000,
    true
) RETURNING *;
```

Then refresh the products page - you should see the test product.

## Success Indicators

✅ Products page loads without errors  
✅ Product cards display with images and prices  
✅ Category switching works  
✅ Console shows successful queries  
✅ Network tab shows 200 OK responses  

## Next Steps

1. ✅ Migration completed
2. ⏳ Verify policies (Step 1)
3. ⏳ Test anonymous access (Step 2)
4. ⏳ Check products exist (Step 3)
5. ⏳ Test in browser (Step 4)
6. ⏳ Test all categories (Step 5)

If everything works, you're done! If not, follow the troubleshooting steps above.

