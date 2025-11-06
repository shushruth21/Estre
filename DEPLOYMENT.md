# Deployment Guide - Estre Configurator

## Pre-Deployment Checklist

✅ **All items completed:**
- [x] Removed all Loveable dependencies
- [x] Environment variables configured
- [x] Build optimization (code splitting)
- [x] SPA routing configuration
- [x] Deployment configs created (Vercel & Netlify)

## Quick Deploy

### Vercel (Fastest - Recommended)

1. **Install Vercel CLI** (optional):
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
vercel
```

Or connect via GitHub:
- Go to [vercel.com/new](https://vercel.com/new)
- Import your repository
- Add environment variables in project settings
- Deploy!

### Netlify

1. **Install Netlify CLI** (optional):
```bash
npm i -g netlify-cli
```

2. **Deploy**:
```bash
netlify deploy --prod
```

Or connect via GitHub:
- Go to [app.netlify.com](https://app.netlify.com)
- Add new site → Import from Git
- Configure environment variables
- Deploy!

## Environment Variables Required

Set these in your hosting platform:

```
VITE_SUPABASE_URL=https://ljgmqwnamffvvrwgprsd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZ21xd25hbWZmdnZyd2dwcnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMDA2NTQsImV4cCI6MjA3Nzc3NjY1NH0.uUCG7yiFk0qzECtQLTVVdEE2Qz5bUwY7KFHqkIlO34M
```

## Build Verification

Before deploying, verify the build works locally:

```bash
npm run build
npm run preview
```

Visit `http://localhost:4173` to test the production build.

## Post-Deployment

1. **Test all routes** - Ensure SPA routing works
2. **Verify API connections** - Check Supabase connectivity
3. **Test authentication** - Login/signup flows
4. **Check console** - No errors in browser console
5. **Performance** - Run Lighthouse audit

## Common Issues & Solutions

### Issue: 404 on refresh
**Solution**: Ensure redirect rules are configured (already in `vercel.json` and `netlify.toml`)

### Issue: Environment variables not working
**Solution**: 
- Ensure variables start with `VITE_` prefix
- Restart deployment after adding variables
- Check variable names match exactly

### Issue: Build fails
**Solution**:
- Check Node.js version (should be 18+)
- Clear cache and rebuild: `rm -rf node_modules dist && npm install && npm run build`

### Issue: CORS errors
**Solution**: Configure Supabase CORS settings to allow your domain

## Performance Optimizations Applied

✅ Code splitting by vendor
✅ Asset optimization
✅ Gzip compression
✅ Cache headers for static assets

## Monitoring

After deployment, monitor:
- Build times
- Runtime errors (Sentry recommended)
- Performance metrics
- User analytics

---

**Status**: ✅ Ready for Production Deployment

