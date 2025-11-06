# 🚀 How to Run the SQL Migration

## Step-by-Step Instructions

### Method 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Login with your Supabase account
   - Select your project: **estre-furniture-production** (or your project name)

2. **Navigate to SQL Editor**
   - In the left sidebar, click **SQL Editor**
   - Or go directly to: https://supabase.com/dashboard/project/[your-project-id]/sql/new

3. **Open the Migration File**
   - Open the file: `supabase/migrations/MASTER_DATABASE_SETUP.sql`
   - **Select ALL** the content (Cmd/Ctrl + A)
   - **Copy** it (Cmd/Ctrl + C)

4. **Paste into Supabase SQL Editor**
   - Click in the SQL Editor text area
   - **Paste** the content (Cmd/Ctrl + V)

5. **Run the Migration**
   - Click the **Run** button (or press `Cmd + Enter` on Mac / `Ctrl + Enter` on Windows)
   - Wait for it to complete

6. **Verify Success**
   - You should see a success message: `✅ Sofa dropdown options setup complete!`
   - Check the results table - should show 10 fields with counts
   - No error messages should appear

### Method 2: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Navigate to your project
cd /Users/shushruthbharadwaj/Desktop/Estre/estre-configurator-pro

# Run the migration
supabase db push

# Or run specific migration
supabase migration up
```

### Method 3: Copy-Paste Quick Method

1. **Open the file**: `supabase/migrations/MASTER_DATABASE_SETUP.sql`
2. **Select all** (Cmd/Ctrl + A) and **copy** (Cmd/Ctrl + C)
3. **Go to**: https://supabase.com/dashboard → SQL Editor
4. **Paste** and **Run**

## ✅ What to Expect

After running, you should see:

1. **Success Messages**:
   ```
   ✅ Sofa dropdown options setup complete!
   Total options: 38
   Total fields: 10
   Expected: 38 options across 10 fields
   ```

2. **Result Table** showing:
   - field_name | option_count | options
   - shape | 3 | Standard, L-Shape, U-Shape
   - front_seat_count | 4 | 1-Seater, 2-Seater, 3-Seater, 4-Seater
   - ... and 8 more fields

3. **No Errors** - If you see errors, check the troubleshooting section below

## 🔍 Verification

After running, verify with this query:

```sql
SELECT field_name, COUNT(*) as count
FROM dropdown_options 
WHERE category = 'sofa' AND is_active = true
GROUP BY field_name
ORDER BY field_name;
```

Should return **10 rows** with these fields:
- console_size (2)
- foam_type (5)
- front_seat_count (4)
- leg_type (4)
- lounger_size (2)
- seat_depth (4)
- seat_width (4)
- shape (3)
- stitch_type (6)
- wood_type (4)

## 🐛 Troubleshooting

### Error: "permission denied"
- **Fix**: Make sure you're logged in as project owner/admin
- Check you have the correct project selected

### Error: "relation already exists"
- **Fix**: This is normal - the script is idempotent
- The `ON CONFLICT DO NOTHING` prevents duplicates
- Continue - it's safe to run multiple times

### No data appears after running
- **Check**: Run the verification query above
- **Check**: Ensure category = 'sofa' (lowercase)
- **Check**: Ensure is_active = true

### Dropdowns still empty in app
1. **Hard refresh** browser (Cmd/Ctrl + Shift + R)
2. **Check browser console** (F12) for errors
3. **Verify RLS policy** exists:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'dropdown_options';
   ```
4. **Restart dev server** if needed

## 📸 Visual Guide

**Step 1**: Open Supabase Dashboard
```
https://supabase.com/dashboard
```

**Step 2**: Click "SQL Editor" in left sidebar

**Step 3**: You'll see a text editor - paste your SQL there

**Step 4**: Click "Run" button (or Cmd/Ctrl + Enter)

**Step 5**: See results in the bottom panel

## 🎯 Quick Checklist

- [ ] Opened Supabase Dashboard
- [ ] Navigated to SQL Editor
- [ ] Copied entire `MASTER_DATABASE_SETUP.sql` file
- [ ] Pasted into SQL Editor
- [ ] Clicked Run
- [ ] Saw success message
- [ ] Verified 10 fields exist
- [ ] Refreshed application
- [ ] Tested dropdowns

---

**Need Help?** If you encounter any errors, copy the error message and I'll help you fix it!

