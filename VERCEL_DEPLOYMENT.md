# 🚀 Vercel Deployment Guide

## ✅ Pre-Deployment Checklist

- ✅ Build successful
- ✅ No linter errors
- ✅ All routes configured
- ✅ Vercel config ready
- ✅ Environment variables documented

## 📋 Step-by-Step Deployment

### Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Vercel deployment"

# Add remote (if not already added)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Login** with GitHub
3. **Click "Add New Project"**
4. **Import your GitHub repository**
5. **Configure Project Settings:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

6. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add:
     ```
     VITE_SUPABASE_URL=https://ljgmqwnamffvvrwgprsd.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZ21xd25hbWZmdnZyd2dwcnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMDA2NTQsImV4cCI6MjA3Nzc3NjY1NH0.uUCG7yiFk0qzECtQLTVVdEE2Qz5bUwY7KFHqkIlO34M
     ```

7. **Click "Deploy"**
8. **Wait for deployment** (usually 1-2 minutes)
9. **Get your live URL** - You'll get a link like `https://your-project.vercel.app`

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? estre-configurator-pro
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add VITE_SUPABASE_URL
# Paste: https://ljgmqwnamffvvrwgprsd.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZ21xd25hbWZmdnZyd2dwcnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMDA2NTQsImV4cCI6MjA3Nzc3NjY1NH0.uUCG7yiFk0qzECtQLTVVdEE2Qz5bUwY7KFHqkIlO34M

# Deploy to production
vercel --prod
```

## 🔧 Vercel Configuration

Your `vercel.json` is already configured:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures:
- ✅ SPA routing works (all routes redirect to index.html)
- ✅ Build output is `dist` folder
- ✅ Framework is detected as Vite

## 🌍 Environment Variables

### Required for Production:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://ljgmqwnamffvvrwgprsd.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### How to Add in Vercel:

1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** `https://ljgmqwnamffvvrwgprsd.supabase.co`
   - **Environment:** Production, Preview, Development
4. Click **Save**
5. **Redeploy** for changes to take effect

## ✅ Post-Deployment Checklist

### 1. Test Your Live Site

- [ ] Homepage loads
- [ ] Products page loads
- [ ] Configurator works
- [ ] Images load correctly
- [ ] Admin pages accessible (if logged in as admin)
- [ ] All routes work (SPA routing)

### 2. Test Admin Access

1. Navigate to your live URL
2. Click "Login"
3. Login with admin credentials
4. Should redirect to `/admin/dashboard`
5. Verify all admin pages work

### 3. Test Images

1. Go to Products page
2. Verify images load from `www.estre.in`
3. Check browser console for errors
4. Images should display or show placeholder

## 🔗 Sharing Your Site

Once deployed, you'll get:
- **Production URL:** `https://your-project.vercel.app`
- **Custom Domain:** (optional) Add your own domain in Vercel settings

**Share this link** with anyone who needs access!

## 🐛 Troubleshooting

### Build Fails

1. Check Vercel build logs
2. Ensure all dependencies are in `package.json`
3. Check for TypeScript errors locally first

### Pages Not Loading

1. Check environment variables are set
2. Verify `vercel.json` rewrites are correct
3. Check browser console for errors

### Images Not Loading

1. Check CORS settings on `www.estre.in`
2. Verify image URLs in database
3. Check browser Network tab for 404s

### Admin Pages Not Accessible

1. Ensure admin role exists in `user_roles` table
2. Check browser console for role loading errors
3. Verify user is logged in
4. Check RLS policies

## 📝 Quick Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View deployments
vercel ls

# View logs
vercel logs
```

## 🎉 Success!

Once deployed, your app will be live at:
**`https://your-project.vercel.app`**

Share this link with your team and customers!

