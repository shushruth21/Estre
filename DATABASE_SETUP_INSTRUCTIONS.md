# 🚀 Complete Database Setup Instructions

## Quick Start - Get Your Database Ready in 3 Steps

### Step 1: Run Master Migration (REQUIRED)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `estre-furniture-production`
   - Navigate to: **SQL Editor**

2. **Run Master Setup Script**
   - Open file: `supabase/migrations/MASTER_DATABASE_SETUP.sql`
   - **Copy the ENTIRE file content**
   - Paste into Supabase SQL Editor
   - Click **Run** (or press Cmd/Ctrl + Enter)

3. **Verify Success**
   - You should see: `✅ Sofa dropdown options setup complete!`
   - Check the result table - should show 10 fields with 38 total options

### Step 2: Verify Setup

Run the verification script:
- File: `supabase/migrations/VERIFY_DATABASE_SETUP.sql`
- This will show you:
  - All dropdown options count
  - Missing fields (if any)
  - RLS policy status
  - Table data counts

### Step 3: Test in Application

1. **Refresh your application** (hard refresh: Cmd/Ctrl + Shift + R)
2. **Navigate to a sofa product** configuration page
3. **Check dropdowns** - All should show options (not "No options available")
4. **Open browser console** (F12) - Should see no errors

## What the Master Migration Does

✅ **Creates/Updates RLS Policy** - Ensures public can read dropdown options  
✅ **Populates All Sofa Dropdowns** - 38 options across 10 fields  
✅ **Adds Metadata** - Pricing, percentages, descriptions  
✅ **Idempotent** - Safe to run multiple times (won't create duplicates)  
✅ **Verification** - Shows summary after completion  

## Troubleshooting

### Dropdowns Still Empty After Migration?

1. **Check Browser Console** (F12 → Console)
   - Look for Supabase errors
   - Check network requests to `dropdown_options`

2. **Verify Data in Supabase**
   ```sql
   SELECT * FROM dropdown_options 
   WHERE category = 'sofa' 
   AND is_active = true
   LIMIT 10;
   ```

3. **Check RLS Policy**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'dropdown_options';
   ```
   Should show: `Public read active dropdowns`

4. **Verify Environment Variables**
   - Check `.env.local` has correct Supabase credentials
   - Restart dev server after changing env vars

### Common Issues

**Issue:** "No options available" in all dropdowns
- **Fix:** Run `MASTER_DATABASE_SETUP.sql` migration

**Issue:** Some dropdowns work, others don't
- **Fix:** Check field names match exactly (case-sensitive)
- **Fix:** Verify all fields have data in database

**Issue:** Options show but can't select
- **Fix:** Check RLS policies allow SELECT
- **Fix:** Verify `is_active = true` for all options

## Expected Results

After running migrations, you should have:

- ✅ **10 dropdown fields** for sofa category
- ✅ **38 total options** across all fields
- ✅ **Public read access** enabled
- ✅ **All metadata** properly set (pricing, percentages)
- ✅ **All dropdowns** working in application

## Next Steps

After database is set up:

1. ✅ Test all configurators
2. ✅ Verify pricing calculations
3. ✅ Test add to cart functionality
4. ✅ Check admin panel access
5. ✅ Test production workflow

---

**Need Help?** Check `SUPABASE_SETUP_GUIDE.md` for detailed troubleshooting.

