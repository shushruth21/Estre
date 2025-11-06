# 🔧 Admin Access Debugging Guide

## Issue: Admin pages not loading even when logged in as admin

## Possible Causes & Solutions

### 1. **User Role Not in Database**

**Check:**
- User is authenticated (Supabase auth)
- BUT user role is missing in `user_roles` table

**Solution:**
```sql
-- Check if user has role in database
SELECT ur.*, u.email 
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'your-admin-email@example.com';

-- If no results, add admin role:
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'your-admin-email@example.com';
```

### 2. **RLS Policy Blocking Role Query**

**Check:**
- `user_roles` table might have RLS blocking the query

**Solution:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_roles';

-- Ensure users can read their own roles:
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### 3. **Loading State Issue**

**Fixed:**
- ✅ AdminLayout now waits for `loading` to complete
- ✅ Shows loading spinner while checking roles
- ✅ Only checks `isAdmin()` after roles are loaded

### 4. **Role Fetch Timing**

**Fixed:**
- ✅ Added debug logging in development
- ✅ Shows user roles in access denied message
- ✅ Better error messages

## Debug Steps

### Step 1: Check Browser Console

Open browser console (F12) and look for:
- ✅ `User roles loaded: ['admin']` - Success
- ⚠️ `No roles found for user: ...` - Role missing
- ❌ `Error fetching user roles: ...` - Query error

### Step 2: Check Database

Run in Supabase SQL Editor:
```sql
-- Get your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Check roles for your user
SELECT ur.*, u.email 
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'your-email@example.com';
```

### Step 3: Add Admin Role (if missing)

If no role found, add it:
```sql
-- Replace USER_ID with your actual user ID from Step 2
INSERT INTO user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;
```

### Step 4: Verify Access

1. Log out and log back in
2. Check browser console for role loading logs
3. Navigate to `/admin/dashboard`
4. Should see admin panel (not "Access Denied")

## Quick Fix SQL Script

```sql
-- Add admin role to your user (replace email)
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'your-admin-email@example.com';
    
    -- Add admin role if user exists
    IF v_user_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role)
        VALUES (v_user_id, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE '✅ Admin role added for user: %', v_user_id;
    ELSE
        RAISE NOTICE '❌ User not found';
    END IF;
END $$;
```

## What Was Fixed

1. ✅ **AdminLayout loading state** - Now waits for roles before checking
2. ✅ **Better error messages** - Shows user roles in access denied
3. ✅ **Debug logging** - Console logs in development mode
4. ✅ **Index page header** - Shows "Admin Panel" link when logged in as admin

## Test Admin Access

1. **Login** → Should redirect to `/admin/dashboard` if admin role exists
2. **Navigate to** `/admin/dashboard` → Should show admin panel
3. **Check console** → Should see "User roles loaded: ['admin']"
4. **If "Access Denied"** → Check console for error or missing role

## Still Not Working?

1. Check browser console for errors
2. Verify user has role in `user_roles` table
3. Check RLS policies on `user_roles` table
4. Try logging out and back in
5. Clear browser cache/localStorage

