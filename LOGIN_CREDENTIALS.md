# 🔐 Login Credentials & Role Access Guide

## ✅ Current User Setup

Based on your Supabase database, you have the following users configured:

### Admin User
- **Email:** `admin@estre.in`
- **Role:** `admin`
- **Access:** Full admin panel access
- **Redirects to:** `/admin/dashboard`

### Staff User
- **Email:** `staff@estre.in`
- **Role:** `factory_staff`
- **Access:** Staff dashboard and job cards
- **Redirects to:** `/staff/job-cards`

---

## 🚀 How to Login

### Step 1: Navigate to Login Page
1. Go to your web app URL: `http://localhost:8080/login` (or your deployed URL)
2. Or click "Login" button from the home page

### Step 2: Enter Credentials

#### As Admin:
```
Email: admin@estre.in
Password: [your password]
```

#### As Staff:
```
Email: staff@estre.in
Password: [your password]
```

#### As Customer:
- Sign up via `/signup` page (any email)
- Or login if you've already created an account
- No role assignment needed (defaults to customer)

---

## 📋 Role-Based Access

### Admin (`admin`, `store_manager`, `production_manager`)
**Access:**
- ✅ Full admin dashboard
- ✅ Product management (CRUD)
- ✅ Dropdown options management
- ✅ Order management
- ✅ Job card creation and assignment
- ✅ Staff management
- ✅ Reports and analytics
- ✅ Pricing formulas management

**Pages:**
- `/admin/dashboard` - Main dashboard
- `/admin/products` - Manage products
- `/admin/dropdowns` - Manage dropdown options
- `/admin/orders` - Manage orders
- `/admin/job-cards` - Create and manage job cards
- `/admin/staff` - Staff management
- `/admin/reports` - Analytics and reports

### Factory Staff (`factory_staff`)
**Access:**
- ✅ View assigned job cards
- ✅ Update job card status
- ✅ Mark tasks as complete
- ✅ Add staff notes
- ❌ No access to pricing, orders, or admin settings

**Pages:**
- `/staff/job-cards` - View assigned job cards
- `/staff/job-cards/:id` - Job card details

### Customer (default)
**Access:**
- ✅ Browse products
- ✅ Configure furniture
- ✅ Add to cart
- ✅ Place orders
- ✅ View order history
- ❌ No access to admin or staff pages

**Pages:**
- `/` - Home page
- `/products` - Product catalog
- `/configure/:category/:productId` - Configure products
- `/cart` - Shopping cart
- `/orders` - Order history
- `/checkout` - Checkout

---

## 🔑 Password Reset

If you forgot your password:

1. **Via Supabase Dashboard:**
   - Go to Supabase Dashboard → Authentication → Users
   - Find your user
   - Click "Reset Password"
   - User will receive password reset email

2. **Via App (if password reset is implemented):**
   - Click "Forgot Password" on login page
   - Enter your email
   - Check your email for reset link

---

## 🧪 Testing Different Roles

### Test Admin Access:
```
1. Login with: admin@estre.in
2. Should redirect to: /admin/dashboard
3. Should see full admin navigation sidebar
4. Can access all admin pages
```

### Test Staff Access:
```
1. Login with: staff@estre.in
2. Should redirect to: /staff/job-cards
3. Should see staff navigation sidebar
4. Can only see assigned job cards
```

### Test Customer Access:
```
1. Sign up with any new email (e.g., customer@example.com)
2. Should redirect to: / (home page)
3. Can browse and configure products
4. Cannot access /admin/* or /staff/* pages
```

---

## 📝 Adding New Users & Roles

### Add Admin Role to Existing User:
```sql
-- Replace 'email@example.com' with actual email
DO $$
DECLARE
    v_user_id uuid;
    v_email text := 'email@example.com';
BEGIN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;
    
    IF v_user_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role)
        VALUES (v_user_id, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;
```

### Add Staff Role:
```sql
-- Replace 'email@example.com' with actual email
DO $$
DECLARE
    v_user_id uuid;
    v_email text := 'email@example.com';
BEGIN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;
    
    IF v_user_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role)
        VALUES (v_user_id, 'factory_staff'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;
```

---

## 🔍 Verify Current Roles

Run this SQL to see all users and their roles:

```sql
SELECT 
    u.email,
    ur.role,
    ur.created_at as role_assigned_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY u.email, ur.role;
```

---

## ⚠️ Troubleshooting

### Issue: "Access Denied" after login
**Solution:**
1. Check if role is assigned in `user_roles` table
2. Log out and log back in
3. Clear browser cache
4. Verify role in Supabase SQL Editor

### Issue: Wrong redirect after login
**Solution:**
1. Check `Login.tsx` redirect logic
2. Verify `user_roles` table has correct role
3. Check browser console for errors

### Issue: Can't see admin pages
**Solution:**
1. Verify you have `admin`, `store_manager`, or `production_manager` role
2. Check `AdminLayout.tsx` role check
3. Ensure `useAuth` hook is fetching roles correctly

---

## 📞 Quick Reference

| Role | Email Example | Pages Access |
|------|--------------|--------------|
| Admin | `admin@estre.in` | `/admin/*` |
| Staff | `staff@estre.in` | `/staff/*` |
| Customer | `customer@example.com` | `/`, `/products`, `/cart`, `/orders` |

---

**Last Updated:** Based on current database setup
**Status:** ✅ Roles configured and ready to use

