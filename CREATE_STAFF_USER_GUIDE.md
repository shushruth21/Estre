# 👤 Create Staff User: newstaff@estre.in

## 📋 Two Methods to Create Staff User

### Method 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication**
   - Click **Authentication** in the left sidebar
   - Click **Users** tab

3. **Create New User**
   - Click **"Add User"** button (top right)
   - Click **"Create new user"**
   - Fill in:
     - **Email:** `newstaff@estre.in`
     - **Password:** `Securestaff123!`
     - **Auto Confirm User:** ✅ (check this box)
   - Click **"Create user"**

4. **Set Staff Role**
   - After user is created, run the SQL script below

### Method 2: Using Admin Panel (If User Management Works)

1. **Login as Admin**
   - Login with `newadmin@estre.in`

2. **Go to User Management**
   - Navigate to: Admin → Users

3. **Create User**
   - Click **"+ Add New User"**
   - Fill in:
     - **Email:** `newstaff@estre.in`
     - **Password:** `Securestaff123!`
     - **Role:** Staff
   - Click **"Create User"**

## 🔧 Set Staff Role (SQL)

After creating the user, run this SQL in Supabase SQL Editor:

```sql
-- Set staff role for newstaff@estre.in
DO $$
DECLARE
    v_user_id uuid;
    v_email text := 'newstaff@estre.in';
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '❌ User not found. Create user first!';
    END IF;
    
    -- Set staff role
    INSERT INTO profiles (user_id, role, full_name)
    VALUES (v_user_id, 'staff'::app_role, 'Staff User')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        role = 'staff'::app_role,
        full_name = COALESCE(profiles.full_name, 'Staff User');
    
    RAISE NOTICE '✅ Staff role set successfully!';
END $$;

-- Verify
SELECT 
    u.email,
    p.role,
    CASE 
        WHEN p.role = 'staff' THEN '✅ SUCCESS'
        ELSE '❌ Role is: ' || p.role
    END as status
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'newstaff@estre.in';
```

## ✅ Verification

After completing the steps:

1. **Check Database:**
   ```sql
   SELECT u.email, p.role 
   FROM auth.users u
   LEFT JOIN profiles p ON p.user_id = u.id
   WHERE u.email = 'newstaff@estre.in';
   ```
   Should show: `newstaff@estre.in | staff`

2. **Test Login:**
   - Email: `newstaff@estre.in`
   - Password: `Securestaff123!`
   - Should redirect to `/staff/dashboard`

## 📝 Quick Reference

| Field | Value |
|-------|-------|
| Email | `newstaff@estre.in` |
| Password | `Securestaff123!` |
| Role | `staff` |
| Redirects to | `/staff/dashboard` |

---

**File:** `CREATE_STAFF_USER_NEWSTAFF.sql` - Run this after creating the user


