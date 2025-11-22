# ⚡ Quick Setup: Vercel Environment Variables

## 🎯 Add These 3 Variables to Vercel

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Click on your project: `estre-configurator-pro`
3. Click **Settings** → **Environment Variables**

### Step 2: Add Variables (Click "Add New" for each)

#### Variable 1: VITE_SUPABASE_URL
```
Key: VITE_SUPABASE_SERVICE_ROLE_KEY
Value: https://ljgmqwnamffvvrwgprsd.supabase.co
Environment: Production, Preview, Development
```

#### Variable 2: VITE_SUPABASE_ANON_KEY
```
Key: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZ21xd25hbWZmdnZyd2dwcnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMDA2NTQsImV4cCI6MjA3Nzc3NjY1NH0.uUCG7yiFk0qzECtQLTVVdEE2Qz5bUwY7KFHqkIlO34M
Environment: Production, Preview, Development
```

#### Variable 3: VITE_SUPABASE_SERVICE_ROLE_KEY ⚠️
```
Key: VITE_SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZ21xd25hbWZmdnZyd2dwcnNkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjIwMDY1NCwiZXhwIjoyMDc3Nzc2NjU0fQ.Z7RrNcRj1ImUNCU9VUh9ORVNwwaj4gCOgamuNCuWrsY
Environment: Production, Preview, Development
```

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait 1-2 minutes

### ✅ Done!
After redeployment, admin user management will work.

---

**Full Guide:** See `VERCEL_ENVIRONMENT_SETUP.md` for detailed instructions.

