# 🔧 Fix Sale Orders RLS Policies

## 🐛 Issue
Staff cannot see sale orders in the review page because the RLS policies were checking `profiles.id` instead of `profiles.user_id`.

## ✅ Solution
Created a migration that:
1. Fixes the RLS policies to use `profiles.user_id` (correct column)
2. Uses `SECURITY DEFINER` functions to prevent RLS recursion
3. Includes all staff/admin roles

## 📋 Steps to Fix

### Option 1: Apply via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `ljgmqwnamffvvrwgprsd`

2. **Navigate to SQL Editor**
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Run the Migration**
   - Copy the contents of `supabase/migrations/20251122000001_fix_sale_orders_rls.sql`
   - Paste into the SQL Editor
   - Click **Run** (or press Cmd/Ctrl + Enter)

4. **Verify Success**
   - You should see "Success. No rows returned"
   - Check the browser console when viewing Staff Sale Orders page
   - You should see: `✅ Sale orders fetched: X orders`

### Option 2: Apply via Supabase CLI

```bash
# Link to your project (if not already linked)
supabase link --project-ref ljgmqwnamffvvrwgprsd

# Apply the migration
supabase db push
```

## 🔍 Verification

After applying the migration:

1. **Login as Staff**
   - Login with: `newstaff@estre.in`
   - Navigate to: `/staff/sale-orders`

2. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for:
     - `🔍 Fetching sale orders...`
     - `✅ Sale orders fetched: X orders`
   - If there's an error, you'll see:
     - `❌ Sale orders query error: ...`

3. **Expected Result**
   - Staff should see all sale orders with `status = 'pending_staff_review'`
   - Orders should appear in the table
   - No "No sale orders pending review" message (if orders exist)

## 🐛 Troubleshooting

### Issue: Still can't see orders after migration

**Check:**
1. **Migration Applied?**
   ```sql
   -- Run this in SQL Editor to check
   SELECT * FROM pg_policies WHERE tablename = 'sale_orders';
   ```
   Should see policies with `is_staff_or_admin_for_sale_orders` function

2. **User Role Correct?**
   ```sql
   -- Check staff user role
   SELECT user_id, role FROM profiles WHERE user_id = (SELECT id FROM auth.users WHERE email = 'newstaff@estre.in');
   ```
   Should show `role = 'staff'`

3. **Sale Orders Exist?**
   ```sql
   -- Check if sale orders exist
   SELECT id, status, customer_id, created_at FROM sale_orders WHERE status = 'pending_staff_review';
   ```

4. **RLS Enabled?**
   ```sql
   -- Check RLS status
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'sale_orders';
   ```
   Should show `rowsecurity = true`

### Issue: Migration fails

**Error: "function already exists"**
- This is OK, the function will be replaced
- Migration should still succeed

**Error: "policy already exists"**
- Drop the old policies first:
  ```sql
  DROP POLICY IF EXISTS "Staff can view all sale orders" ON sale_orders;
  DROP POLICY IF EXISTS "Staff can insert sale orders" ON sale_orders;
  DROP POLICY IF EXISTS "Staff can update sale orders" ON sale_orders;
  ```
- Then run the migration again

## 📝 Migration Details

**File:** `supabase/migrations/20251122000001_fix_sale_orders_rls.sql`

**Changes:**
- ✅ Fixed `profiles.id` → `profiles.user_id`
- ✅ Added `SECURITY DEFINER` function
- ✅ Includes all staff/admin roles
- ✅ Prevents RLS recursion

## ✅ After Fix

Once the migration is applied:
- ✅ Staff can view all sale orders
- ✅ Staff can apply discounts
- ✅ Staff can approve orders
- ✅ No more RLS policy errors

---

**Status:** Ready to apply! Follow steps above to fix the issue.

