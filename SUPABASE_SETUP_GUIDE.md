# Complete Supabase Database Setup Guide

## 🎯 Overview

This guide will help you set up your Supabase database completely for the Estre Furniture Configurator system. All dropdown options must be populated for the configurator to work properly.

## 📋 Quick Setup Steps

### Step 1: Run the Complete Sofa Setup Migration

1. **Go to Supabase Dashboard** → SQL Editor
2. **Open the file**: `supabase/migrations/COMPLETE_SOFA_SETUP.sql`
3. **Copy the entire SQL script**
4. **Paste and Run** in Supabase SQL Editor
5. **Verify** by running the verification script (Step 2)

### Step 2: Verify Database Setup

1. **Run the verification script**: `supabase/migrations/VERIFY_DATABASE_SETUP.sql`
2. **Check the results** - You should see:
   - All 10 required fields for sofa dropdowns
   - At least 34 total options
   - All tables have data

### Step 3: Check RLS Policies

Ensure Row Level Security (RLS) allows public read access to dropdown_options:

```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'dropdown_options';

-- If no public read policy exists, create it:
CREATE POLICY "Public read active dropdowns" ON dropdown_options
  FOR SELECT USING (is_active = true);
```

## 📊 Required Dropdown Options for Sofa

The configurator requires these fields in `dropdown_options` table with `category = 'sofa'`:

| Field Name | Required Options | Count |
|------------|----------------|-------|
| `shape` | Standard, L-Shape, U-Shape | 3 |
| `front_seat_count` | 1-Seater, 2-Seater, 3-Seater, 4-Seater | 4 |
| `console_size` | 6", 10" | 2 |
| `lounger_size` | 6ft, additional_6 | 2 |
| `foam_type` | Firm, Soft, Super Soft, Latex Foam, Memory Foam | 5 |
| `seat_depth` | 22 in, 24 in, 26 in, 28 in | 4 |
| `seat_width` | 22 in, 24 in, 26 in, 30 in | 4 |
| `leg_type` | Standard, Premium, Walnut, Chrome | 4 |
| `wood_type` | Pine, Walnut, Oak, Teak | 4 |
| `stitch_type` | Plain seam, Top stitch, Double top stitch, etc. | 6 |

**Total: 38 options across 10 fields**

## 🔍 Troubleshooting Dropdown Loading Issues

### Issue: Dropdowns show "No options available"

**Possible Causes:**
1. **Data not in database** - Run `COMPLETE_SOFA_SETUP.sql`
2. **Wrong category** - Ensure category is `'sofa'` (lowercase)
3. **RLS blocking access** - Check RLS policies
4. **Incorrect field_name** - Verify field names match exactly

**Solution:**
```sql
-- Check if data exists
SELECT * FROM dropdown_options 
WHERE category = 'sofa' 
AND field_name = 'shape'
AND is_active = true;

-- Should return 3 rows
```

### Issue: Dropdowns show "Loading..." forever

**Possible Causes:**
1. **Network error** - Check browser console for errors
2. **Supabase connection** - Verify environment variables
3. **RLS policy blocking** - Check RLS policies

**Solution:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

### Issue: Some dropdowns load, others don't

**Possible Causes:**
1. **Missing field_name** - Some fields might not have data
2. **Case sensitivity** - Field names must match exactly
3. **is_active = false** - Options might be disabled

**Solution:**
```sql
-- Check which fields have data
SELECT field_name, COUNT(*) 
FROM dropdown_options 
WHERE category = 'sofa' 
AND is_active = true
GROUP BY field_name;

-- Compare with required fields above
```

## 📝 Database Tables Checklist

Ensure these tables exist and have data:

- [ ] `dropdown_options` - Contains all dropdown choices
- [ ] `sofa_database` - Sofa products
- [ ] `fabric_coding` - Fabric catalog
- [ ] `legs_prices` - Leg options and pricing
- [ ] `accessories_prices` - Accessories catalog
- [ ] `pricing_formulas` - Pricing calculation rules
- [ ] `sofa_admin_settings` - Admin-configurable settings
- [ ] `orders` - Customer orders
- [ ] `job_cards` - Production workflow
- [ ] `user_roles` - User permissions

## 🚀 Quick Database Setup Script

Run this in Supabase SQL Editor to ensure everything is set up:

```sql
-- 1. Run COMPLETE_SOFA_SETUP.sql (ensures all dropdown options exist)
-- 2. Verify with VERIFY_DATABASE_SETUP.sql
-- 3. Check RLS policies
-- 4. Test in application
```

## 🔧 Testing Dropdowns

After running migrations:

1. **Open your application** in browser
2. **Navigate to a sofa product** configuration page
3. **Open browser DevTools** → Console tab
4. **Check for errors** - Should see no dropdown-related errors
5. **Test each dropdown** - All should show options (not "No options available")
6. **Check Network tab** - Verify API calls to `dropdown_options` succeed

## 📞 Support

If dropdowns still don't load after running migrations:

1. **Check browser console** for specific errors
2. **Verify Supabase connection** - Test with a simple query
3. **Check RLS policies** - Ensure public can read active options
4. **Verify data exists** - Run verification SQL script
5. **Check field names** - Must match exactly (case-sensitive)

## ✅ Verification Checklist

Before considering setup complete:

- [ ] All 10 required fields have data in `dropdown_options`
- [ ] Total of 38+ options for sofa category
- [ ] RLS policy allows public read access
- [ ] No errors in browser console
- [ ] All dropdowns show options (not "No options available")
- [ ] Application loads without errors
- [ ] Configuration can be saved

---

**Status:** Ready for Database Setup

