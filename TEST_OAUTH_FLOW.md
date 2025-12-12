# 🧪 OAuth Testing & Verification Guide

## ✅ Pre-Flight Checklist

Before testing, verify these are complete:

- [ ] Database trigger created (`handle_oauth_user`)
- [ ] Google OAuth enabled in Supabase Dashboard
- [ ] Google credentials added (Client ID + Secret)
- [ ] Redirect URI configured in Google Console
- [ ] Dev server running (`npm run dev`)

---

## 🔍 Step-by-Step Verification

### 1. Database Verification (3 min)

Run the verification SQL script in **Supabase SQL Editor**:

**File:** `VERIFY_OAUTH_SETUP.sql`

**Expected Results:**
```
✅ OAuth Trigger Check      → PASS
✅ OAuth Function Check     → PASS  
✅ Profiles Table Check     → PASS
✅ Orphaned OAuth Users     → PASS (0 users)
```

If any checks fail, the setup is incomplete.

---

### 2. Supabase Dashboard Verification (2 min)

**Authentication → Providers → Google:**
```
✅ Enabled: ON
✅ Client ID: 372786827859-xxxxx.apps.googleusercontent.com
✅ Client Secret: GOCSPX-xxxxxxxxxxxxx
✅ Redirect URL: https://ljgmqwnamffvvrwgprsd.supabase.co/auth/v1/callback
```

---

### 3. Frontend Code Verification (1 min)

**Check these files exist:**
```bash
✅ src/pages/AuthCallback.tsx
✅ src/components/auth/SSOButtons.tsx
✅ App.tsx includes /auth/callback route
```

**Verify in browser console:**
1. Open Dev Tools (F12)
2. Go to: http://localhost:8080/login
3. Check for errors (should be none)

---

### 4. Test OAuth Login Flow (5 min)

#### Test #1: New User (Google Sign Up)

1. **Open Incognito/Private Window**
2. **Go to:** `http://localhost:8080/login`
3. **Click:** "Continue with Google" button
4. **Select:** Your Google account
5. **If prompted:** Click "Try another way" → "Use your password"
6. **Expected:** Redirect to `/dashboard`

#### Verify in Database:
```sql
-- Check profile was created
SELECT 
  user_id,
  full_name,
  role,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
- `full_name`: Your Google name
- `role`: `customer`
- `created_at`: Just now

---

#### Test #2: Existing User (Sign In Again)

1. **Sign out** (if logged in)
2. **Go to:** `http://localhost:8080/login`
3. **Click:** "Continue with Google"
4. **Select:** Same Google account
5. **Expected:** Redirect to `/dashboard` (no profile duplication)

---

#### Test #3: Role-Based Redirect (Admin)

1. **In Supabase → profiles table:**
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE user_id = 'YOUR_USER_ID';
   ```

2. **Sign out and sign in again**
3. **Expected:** Redirect to `/admin/dashboard`

---

#### Test #4: Role-Based Redirect (Staff)

1. **In Supabase → profiles table:**
   ```sql
   UPDATE profiles 
   SET role = 'staff' 
   WHERE user_id = 'YOUR_USER_ID';
   ```

2. **Sign out and sign in again**
3. **Expected:** Redirect to `/staff/dashboard`

---

### 5. Error Handling Test (2 min)

#### Test #1: Disabled Provider
1. Temporarily disable Google in Supabase
2. Try to sign in with Google
3. **Expected:** Error message shown

#### Test #2: Invalid Callback
1. Click Google button
2. Cancel at Google login
3. **Expected:** Redirected back to login with error

---

## 🐛 Common Issues & Solutions

### Issue: "OAuth failed" error

**Possible causes:**
- Google not enabled in Supabase
- Invalid credentials
- Redirect URI mismatch

**Solution:**
```sql
-- Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created_oauth';
```

---

### Issue: Profile not created

**Solution:**
```sql
-- Manually create profile for testing
INSERT INTO profiles (user_id, full_name, role)
VALUES (
  'YOUR_USER_ID',
  'Test User',
  'customer'
);
```

---

### Issue: Infinite redirect loop

**Solution:**
- Clear browser cache/cookies
- Check browser console for errors
- Verify AuthCallback.tsx logic

---

### Issue: "Verifying it's you" stuck

**Solution:**
- This is normal Google security
- Click "Try another way"
- Use password instead of passkey

---

## ✅ Success Criteria

Your OAuth setup is working correctly if:

1. ✅ **Trigger Check Passes**
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created_oauth';
   -- Returns 1 row
   ```

2. ✅ **Google Sign-In Works**
   - Button appears on login page
   - Clicking opens Google popup
   - Authentication succeeds
   - Redirects back to app

3. ✅ **Profile Auto-Created**
   ```sql
   SELECT COUNT(*) FROM profiles;
   -- Increases after each new OAuth user
   ```

4. ✅ **Role-Based Redirect Works**
   - Customer → `/dashboard`
   - Admin → `/admin/dashboard`
   - Staff → `/staff/dashboard`

5. ✅ **No Console Errors**
   - Check browser console (F12)
   - Should see: "✅ OAuth session retrieved"
   - Should see: "🔐 OAuth redirect check"
   - Should see: "✅ Redirecting to X dashboard"

---

## 📊 Verification Summary

Run this after testing:

```sql
-- Summary of OAuth setup
SELECT 
  'Total Users' as metric,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'Users with Profiles' as metric,
  COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
  'OAuth Users' as metric,
  COUNT(*) as count
FROM auth.users
WHERE raw_app_meta_data->>'provider' IN ('google', 'azure', 'apple')
UNION ALL
SELECT 
  'Customers' as metric,
  COUNT(*) as count
FROM profiles
WHERE role = 'customer'
UNION ALL
SELECT 
  'Staff' as metric,
  COUNT(*) as count
FROM profiles
WHERE role = 'staff'
UNION ALL
SELECT 
  'Admins' as metric,
  COUNT(*) as count
FROM profiles
WHERE role = 'admin';
```

---

## 🎉 Final Confirmation

If all tests pass, your OAuth is **production ready**! 

**What works:**
- ✅ Google one-click sign-in
- ✅ Auto-profile creation
- ✅ Role-based navigation
- ✅ Error handling
- ✅ Security (RLS policies)

**Optional next steps:**
- Enable Microsoft OAuth (just toggle in Supabase)
- Enable Apple OAuth (just toggle in Supabase)
- Add profile picture sync from Google
- Customize OAuth button styles

---

## 📚 Quick Reference

**Supabase Dashboard:**
- https://supabase.com/dashboard/project/ljgmqwnamffvvrwgprsd

**Local Dev:**
- http://localhost:8080/login
- http://localhost:8080/signup
- http://localhost:8080/auth/callback

**Verification SQL:**
- See: `VERIFY_OAUTH_SETUP.sql`

---

**Need help?** Check browser console and Supabase logs for detailed error messages.

