# Fix Admin Redirect and RLS Recursion Issues

## Issues Found:
1. **Infinite recursion in profiles RLS policies** - Policies query profiles table directly, causing recursion
2. **Admin user not redirecting** - Role might not be set correctly or RLS is blocking profile fetch

## Solution Steps:

### Step 1: Run the RLS Fix Migration
Run this migration in Supabase SQL Editor to fix the infinite recursion:

```sql
-- File: supabase/migrations/20251120000001_fix_profiles_rls_recursion.sql
-- This fixes the RLS policies to use SECURITY DEFINER functions
```

### Step 2: Ensure Admin User Has Correct Role
Run this SQL to ensure `newadmin@estre.in` has admin role:

```sql
-- Ensure profile exists and has admin role
INSERT INTO profiles (user_id, role, full_name)
SELECT id, 'admin'::app_role, 'Admin User'
FROM auth.users
WHERE email = 'newadmin@estre.in'
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = 'admin'::app_role,
  full_name = COALESCE(profiles.full_name, 'Admin User');
```

### Step 3: Verify Admin Role
Check if the role is set correctly:

```sql
SELECT 
  u.email,
  p.role,
  p.full_name,
  CASE 
    WHEN p.role = 'admin' THEN '✅ Admin'
    ELSE '❌ Not Admin'
  END as status
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'newadmin@estre.in';
```

### Step 4: Test Login Flow
1. Logout if currently logged in
2. Login with `newadmin@estre.in` / `SecurePassword123!`
3. Check browser console for role detection logs
4. Should redirect to `/admin/dashboard`

## Debugging:
If still not working, check browser console for:
- `🔍 AuthContext Role Check:` - Shows role detection
- `Login redirect check:` - Shows redirect decision
- Any RLS errors about profiles table


