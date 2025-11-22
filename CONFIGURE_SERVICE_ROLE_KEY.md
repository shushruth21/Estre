# 🔐 Configure Service Role Key for Admin User Management

## ⚠️ Security Warning

The **Service Role Key** has **full access** to your Supabase project and **bypasses all RLS policies**. 

**IMPORTANT:**
- ✅ **ONLY** use this in **trusted admin environments**
- ❌ **NEVER** expose this key in client-side code that users can access
- ❌ **NEVER** commit this key to version control
- ✅ **ONLY** use for admin operations (creating/deleting users)

## 📋 Step-by-Step Configuration

### Step 1: Get Your Service Role Key

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `estre-furniture-production` (or your project name)

2. **Navigate to Settings**
   - Click **Settings** (gear icon) in the left sidebar
   - Click **API** in the settings menu

3. **Copy Service Role Key**
   - Scroll down to find **"service_role"** key (NOT the anon key)
   - Click **"Reveal"** to show the key
   - Copy the entire key (it's a long JWT token)

### Step 2: Configure for Local Development

**Option A: Using `.env.local` file (Recommended)**

1. Create or edit `.env.local` in your project root:
   ```bash
   # Create file if it doesn't exist
   touch .env.local
   ```

2. Add the service role key:
   ```env
   VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. **Restart your dev server:**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart
   npm run dev
   ```

**Option B: Using Environment Variables in Terminal**

```bash
# macOS/Linux
export VITE_SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
npm run dev

# Windows (PowerShell)
$env:VITE_SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
npm run dev
```

### Step 3: Verify Configuration

1. **Restart your dev server** (if using `.env.local`)
2. **Login as admin** (`newadmin@estre.in`)
3. **Navigate to:** Admin → Users
4. **Check:**
   - ✅ Warning message should disappear
   - ✅ "Add New User" button should be enabled
   - ✅ User list should load (if any users exist)

### Step 4: Configure for Production (Vercel/Netlify)

**For Vercel:**

1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Environment Variables**
3. Add new variable:
   - **Key:** `VITE_SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Your service role key
   - **Environment:** Production, Preview, Development
4. Click **Save**
5. **Redeploy** your application

**For Netlify:**

1. Go to your site in Netlify Dashboard
2. Click **Site settings** → **Environment variables**
3. Click **Add variable**
4. Add:
   - **Key:** `VITE_SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** Your service role key
   - **Scopes:** Production, Deploy previews, Branch deploys
5. Click **Save**
6. **Redeploy** your site

## 🔒 Security Best Practices

### ✅ DO:
- Use service role key **only** in admin pages
- Keep it in `.env.local` (already in `.gitignore`)
- Use environment variables in hosting platforms
- Restrict admin access with RLS policies
- Monitor usage in Supabase dashboard

### ❌ DON'T:
- Commit `.env.local` to git (already ignored)
- Share the key publicly
- Use it in client-side code accessible to non-admins
- Store it in client-side JavaScript files
- Use it for regular user operations

## 🛡️ Current Security Measures

The code already has these protections:

1. **Admin-only access:** User Management page is protected by `AdminLayout`
2. **RLS policies:** Regular users can't access admin functions
3. **Environment variable:** Key is only loaded from environment, not hardcoded
4. **Fallback behavior:** App works without key (just can't create/delete users)

## 🧪 Testing

After configuration, test these features:

1. **View Users**
   - Should see list of all users with their roles
   - Should see email addresses and creation dates

2. **Create User**
   - Click "Add New User"
   - Fill in email, password, and role
   - Should create user successfully
   - User should appear in the list

3. **Update Role**
   - Change a user's role using the dropdown
   - Should update immediately
   - User should see new role on next login

4. **Delete User**
   - Click trash icon next to a user
   - Confirm deletion
   - User should be removed from list

## 🐛 Troubleshooting

### Issue: Warning still shows after adding key

**Solutions:**
1. **Restart dev server** - Environment variables load on startup
2. **Check `.env.local` syntax** - No quotes needed, no spaces around `=`
3. **Verify key is correct** - Copy entire key from Supabase dashboard
4. **Check file location** - `.env.local` should be in project root (same folder as `package.json`)

### Issue: "Failed to create user"

**Solutions:**
1. **Check Supabase logs** - Go to Supabase Dashboard → Logs
2. **Verify email format** - Must be valid email
3. **Check password requirements** - Minimum 6 characters
4. **Verify service role key** - Ensure it's correct and active

### Issue: Users list is empty

**Solutions:**
1. **Check RLS policies** - Ensure admin can view profiles
2. **Verify profiles exist** - Check Supabase Dashboard → Table Editor → profiles
3. **Check browser console** - Look for errors
4. **Try refreshing** - Hard refresh (Cmd/Ctrl + Shift + R)

## 📝 Alternative: Use Edge Functions (More Secure)

For better security, consider using Supabase Edge Functions instead of exposing the service role key:

1. Create edge functions for admin operations
2. Deploy functions with service role key (server-side only)
3. Call functions from admin panel (no key in client)

This is more secure but requires additional setup. The current approach works fine for trusted admin environments.

## ✅ Quick Reference

**File to edit:** `.env.local` (create if doesn't exist)

**Variable name:** `VITE_SUPABASE_SERVICE_ROLE_KEY`

**Where to get key:** Supabase Dashboard → Settings → API → service_role key

**After adding:** Restart dev server

---

**Status:** Ready to configure! Follow steps above to enable user management features.


