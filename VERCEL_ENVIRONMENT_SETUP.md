# 🔐 Vercel Environment Variables Setup

## ⚠️ Important Security Note

The **Service Role Key** has full access to your Supabase project and bypasses all RLS policies. Only use it in trusted admin environments.

---

## 📋 Step-by-Step: Add Environment Variables to Vercel

### Step 1: Get Your Service Role Key

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: `ljgmqwnamffvvrwgprsd`
3. Navigate to **Settings** → **API**
4. Scroll down to **"service_role"** key (NOT the anon key)
5. Click **"Reveal"** and copy the entire key

**Your Service Role Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZ21xd25hbWZmdnZyd2dwcnNkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjIwMDY1NCwiZXhwIjoyMDc3Nzc2NjU0fQ.Z7RrNcRj1ImUNCU9VUh9ORVNwwaj4gCOgamuNCuWrsY
```

---

### Step 2: Add Environment Variables in Vercel Dashboard

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Sign in if needed

2. **Select Your Project**
   - Find `estre-configurator-pro` (or your project name)
   - Click on it

3. **Navigate to Settings**
   - Click **"Settings"** tab at the top
   - Click **"Environment Variables"** in the left sidebar

4. **Add Required Variables**

   **Variable 1: VITE_SUPABASE_URL**
   - Click **"Add New"**
   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** `https://ljgmqwnamffvvrwgprsd.supabase.co`
   - **Environment:** Select all (Production, Preview, Development)
   - Click **"Save"**

   **Variable 2: VITE_SUPABASE_ANON_KEY**
   - Click **"Add New"**
   - **Key:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZ21xd25hbWZmdnZyd2dwcnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMDA2NTQsImV4cCI6MjA3Nzc3NjY1NH0.uUCG7yiFk0qzECtQLTVVdEE2Qz5bUwY7KFHqkIlO34M`
   - **Environment:** Select all (Production, Preview, Development)
   - Click **"Save"**

   **Variable 3: VITE_SUPABASE_SERVICE_ROLE_KEY** ⚠️
   - Click **"Add New"**
   - **Key:** `VITE_SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZ21xd25hbWZmdnZyd2dwcnNkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjIwMDY1NCwiZXhwIjoyMDc3Nzc2NjU0fQ.Z7RrNcRj1ImUNCU9VUh9ORVNwwaj4gCOgamuNCuWrsY`
   - **Environment:** Select all (Production, Preview, Development)
   - ⚠️ **WARNING:** This key has full access - only use in admin environments
   - Click **"Save"**

   **Variable 4: VITE_RESEND_API_KEY** (Optional - for email)
   - Click **"Add New"**
   - **Key:** `VITE_RESEND_API_KEY`
   - **Value:** Your Resend API key (if you have one)
   - **Environment:** Select all
   - Click **"Save"**

---

### Step 3: Redeploy Your Application

After adding environment variables, you **must redeploy** for them to take effect:

1. **Go to "Deployments" tab**
2. Click the **"..."** (three dots) menu on the latest deployment
3. Click **"Redeploy"**
4. Confirm redeployment
5. Wait for deployment to complete (1-2 minutes)

**OR** trigger a new deployment by:
- Pushing a new commit to your repository
- Vercel will automatically redeploy with new environment variables

---

## ✅ Verification Checklist

After redeployment, verify:

- [ ] **Admin User Management Works**
  - Login as admin (`newadmin@estre.in`)
  - Go to Admin → Users
  - Warning message should be gone
  - "Add New User" button should be enabled
  - User list should load

- [ ] **Staff Sale Orders Works**
  - Login as staff (`newstaff@estre.in`)
  - Go to Staff → Sale Orders
  - Should see pending sale orders
  - Discount application should work

- [ ] **PDF Generation Works**
  - Staff approves sale order with discount
  - PDF should be generated
  - Customer should receive emails

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Use service role key only in admin pages
- ✅ Keep it in Vercel environment variables (not in code)
- ✅ Restrict admin access with RLS policies
- ✅ Monitor usage in Supabase dashboard
- ✅ Use different keys for different environments if needed

### ❌ DON'T:
- ❌ Commit service role key to git (already in `.gitignore`)
- ❌ Share the key publicly
- ❌ Use it in client-side code accessible to non-admins
- ❌ Store it in client-side JavaScript files
- ❌ Use it for regular user operations

---

## 🐛 Troubleshooting

### Issue: Environment variables not working after deployment

**Solutions:**
1. **Redeploy** - Environment variables only apply to new deployments
2. **Check variable names** - Must start with `VITE_` for Vite apps
3. **Verify values** - No extra spaces or quotes
4. **Check environment scope** - Ensure variables are set for Production

### Issue: "Service role key required" still shows

**Solutions:**
1. **Redeploy** - Variables only load on new deployments
2. **Check variable name** - Must be exactly `VITE_SUPABASE_SERVICE_ROLE_KEY`
3. **Verify key** - Copy entire key from Supabase dashboard
4. **Clear browser cache** - Hard refresh (Cmd/Ctrl + Shift + R)

### Issue: Admin user management still doesn't work

**Solutions:**
1. **Check browser console** - Look for errors
2. **Verify admin role** - User must have `admin` role in profiles table
3. **Check RLS policies** - Ensure admin can access profiles
4. **Verify key** - Ensure service role key is correct

---

## 📝 Quick Reference

**Required Environment Variables:**

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | `https://ljgmqwnamffvvrwgprsd.supabase.co` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Public anonymous key |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Admin operations only |
| `VITE_RESEND_API_KEY` | `re_...` | Email sending (optional) |

**Where to Add:** Vercel Dashboard → Project → Settings → Environment Variables

**After Adding:** Must redeploy for changes to take effect

---

## 🚀 Next Steps

1. ✅ Add all environment variables in Vercel
2. ✅ Redeploy your application
3. ✅ Test admin user management
4. ✅ Test staff sale orders
5. ✅ Verify PDF generation works

---

**Status:** Ready to configure! Follow steps above to enable admin features in production.

