# Environment Variables Setup for Email Integration

## Overview

This document outlines all environment variables needed for the Resend email integration in the Estre application.

---

## Required Environment Variables

### 1. RESEND_API_KEY (Supabase Edge Functions)

**Location:** Supabase Dashboard → Project Settings → Edge Functions → Secrets

**Value:** Your Resend API key (starts with `re_`)

**How to Set:**
1. Log into Supabase dashboard
2. Select your Estre project
3. Go to **Project Settings** (gear icon)
4. Click **Edge Functions** tab
5. Scroll to **"Secrets"** section
6. Click **"Add Secret"**
7. Name: `RESEND_API_KEY`
8. Value: Your Resend API key from resend.com
9. Click **"Save"**

**Example:**
```
RESEND_API_KEY=re_123abc456def789ghi012jkl345mno678pqr
```

**Important:** This is automatically available to all edge functions. No need to redeploy.

---

### 2. VITE_RESEND_API_KEY (Optional - Frontend)

**Location:** Project root `.env` file

**Note:** This is optional and should only be used for development/testing. Production should use edge functions for security.

**How to Set:**
1. Open `.env` file in project root
2. Add:
   ```
   VITE_RESEND_API_KEY=re_your_api_key_here
   ```
3. Restart dev server

**Security Warning:** Never commit API keys to git. The `.env` file is already in `.gitignore`.

---

## Existing Environment Variables

These are already configured in your `.env` file:

```env
VITE_SUPABASE_PROJECT_ID="ljgmqwnamffvvrwgprsd"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGc..."
VITE_SUPABASE_URL=https://ljgmqwnamffvvrwgprsd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**These are used by:**
- Frontend Supabase client
- Authentication
- Database queries
- Storage access

---

## Supabase Edge Functions Environment

Edge functions automatically have access to these environment variables:

### Automatically Available:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `SUPABASE_ANON_KEY` - Anonymous key for public operations

### You Need to Add:
- `RESEND_API_KEY` - Your Resend API key for email sending

---

## Verification

### Check Frontend Environment Variables

Run in your project terminal:

```bash
npm run dev
```

Open browser console and check:
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL);
// Should output: https://ljgmqwnamffvvrwgprsd.supabase.co
```

### Check Edge Function Environment Variables

After adding `RESEND_API_KEY`:

1. Test email sending:
```bash
curl -X POST https://ljgmqwnamffvvrwgprsd.supabase.co/functions/v1/send-email-with-pdf \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"otp","to":"test@example.com","customerName":"Test","otp":"123456"}'
```

2. If you get error "RESEND_API_KEY not configured", the secret wasn't added correctly.

---

## Environment-Specific Configuration

### Development (.env.local - optional)

Create `.env.local` for local overrides (already in .gitignore):

```env
# Local development overrides
VITE_RESEND_API_KEY=re_your_dev_key_here
```

### Production (Vercel/Netlify)

If deploying to Vercel or Netlify, add these environment variables in their dashboards:

**Required:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

**Optional (only if sending emails from frontend):**
- `VITE_RESEND_API_KEY`

**Recommended:** Use edge functions for email sending, not frontend.

---

## Security Best Practices

### DO ✅

- Store API keys in Supabase Edge Functions secrets
- Use service role key only in edge functions (server-side)
- Keep `.env` file in `.gitignore`
- Use different API keys for development and production
- Rotate API keys regularly
- Use restrictive API key permissions

### DON'T ❌

- Commit API keys to git
- Expose service role key in frontend code
- Share API keys in chat/email
- Use production keys in development
- Hardcode API keys in source code
- Log API keys in console

---

## Troubleshooting

### Error: "RESEND_API_KEY not configured"

**Solution:**
1. Verify secret is added in Supabase dashboard
2. Check spelling: `RESEND_API_KEY` (case-sensitive)
3. Ensure API key starts with `re_`
4. Wait 1-2 minutes for secret to propagate
5. Test edge function again

### Error: "Invalid API key"

**Solution:**
1. Verify API key is correct
2. Check if API key is active in Resend dashboard
3. Ensure API key has sending permissions
4. Create a new API key and update

### Error: "Cannot read import.meta.env"

**Solution:**
1. Ensure you're accessing from frontend, not edge function
2. Variables must start with `VITE_` prefix
3. Restart dev server after changing `.env`
4. Clear browser cache

---

## API Key Management

### Creating New API Keys

**Resend:**
1. Log into resend.com
2. Go to **API Keys**
3. Click **"Create API Key"**
4. Name: "Estre Production" or "Estre Development"
5. Permission: **Full access** or **Sending access**
6. Click **"Create"**
7. Copy key immediately (you won't see it again)

### Rotating API Keys

**When to Rotate:**
- Every 90 days (recommended)
- If key is compromised
- When team member leaves
- Before production launch (if using test key)

**How to Rotate:**
1. Create new API key in Resend
2. Update `RESEND_API_KEY` in Supabase secrets
3. Test email sending
4. Delete old API key in Resend
5. Update documentation

---

## Environment Variable Checklist

Before deploying to production:

### Frontend (.env file)
- [ ] `VITE_SUPABASE_URL` is set
- [ ] `VITE_SUPABASE_ANON_KEY` is set
- [ ] `VITE_SUPABASE_PROJECT_ID` is set
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` is set
- [ ] `.env` file is in `.gitignore`
- [ ] No API keys committed to git

### Supabase Edge Functions
- [ ] `RESEND_API_KEY` added to secrets
- [ ] API key is from production Resend account
- [ ] API key has correct permissions
- [ ] Test email sending works

### Production Deployment
- [ ] All environment variables set in hosting platform
- [ ] Using production Supabase project
- [ ] Using production Resend account
- [ ] API keys are secure and not exposed
- [ ] Email domain verified in Resend
- [ ] DNS records configured correctly

---

## Quick Reference

### Add Resend Secret to Supabase

```bash
# If using Supabase CLI (optional)
supabase secrets set RESEND_API_KEY=re_your_key_here
```

Or use the dashboard (recommended):
1. Supabase Dashboard → Project Settings → Edge Functions → Secrets
2. Add: `RESEND_API_KEY` = `re_your_key_here`

### Test Email Sending

```bash
curl -X POST https://ljgmqwnamffvvrwgprsd.supabase.co/functions/v1/send-email-with-pdf \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZ21xd25hbWZmdnZyd2dwcnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMDA2NTQsImV4cCI6MjA3Nzc3NjY1NH0.uUCG7yiFk0qzECtQLTVVdEE2Qz5bUwY7KFHqkIlO34M" \
  -H "Content-Type: application/json" \
  -d '{"type":"otp","to":"YOUR_EMAIL","customerName":"Test User","otp":"123456"}'
```

Replace `YOUR_EMAIL` with your test email address.

---

## Support Resources

- **Resend Documentation:** https://resend.com/docs
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Environment Variables Guide:** https://vitejs.dev/guide/env-and-mode.html

---

## Summary

**Minimum Required:**
1. Add `RESEND_API_KEY` to Supabase Edge Functions secrets
2. Ensure `.env` file has Supabase credentials (already configured)
3. Test email sending

**Total Setup Time:** 5 minutes

---

**Once RESEND_API_KEY is added to Supabase secrets, your email system is ready to send emails!**
