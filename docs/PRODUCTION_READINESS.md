# Production Readiness Checklist

This document outlines the mandatory checks and gates that must be passed before deploying `estre-configurator-pro` to production.

## 1. Automated Preflight Checks

We have a built-in preflight script that verifies critical infrastructure:
- **Environment Variables**: Checks for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Database Schema**: Verifies that the remote database schema version matches the application's expected version (`src/config/schema.ts`).
- **Storage Buckets**: Ensures required buckets (e.g., `sale-orders`) exist.

### How to Run
Run this command locally or in your CI/CD pipeline before building:

```bash
npm run preflight
```

**If this command fails, DO NOT DEPLOY.**

## 2. Runtime Safety

The application includes a fail-fast mechanism (`src/lib/env-check.ts`) that will:
1.  Check for critical environment variables immediately up on load.
2.  Display a fatal error overlay if they are missing, preventing the app from starting in a broken state.

## 3. Manual Deployment Checklist

Before promoting a build to production, ensure:

- [ ] **Migrations Applied**: Run any pending Supabase migrations on the production project.
- [ ] **Schema Version**: If you added migrations, ensure `src/config/schema.ts` has been updated to the new version number.
- [ ] **Edge Functions**: Deploy any updated edge functions using `supabase functions deploy`.
- [ ] **Secrets**: Ensure production secrets (Stripe keys, SMTP credentials) are set in the Supabase Dashboard > Edge Functions > Secrets.
- [ ] **CORS**: Verify that the production domain is in the Supabase CORS allowlist (if restricted).

## 4. Troubleshooting

### "Schema mismatch! DB: vX, App: vY"
- **Cause**: The database thinks it is at version X, but the code expects version Y.
- **Fix**: 
    - If `DB < App`: Run the migration scripts on the database.
    - If `DB > App`: You might be deploying old code against a newer database. Ensure backward compatibility.

### "Missing required storage buckets"
- **Cause**: The `sale-orders` bucket does not exist.
- **Fix**: Create the bucket in the Supabase Storage dashboard (set to Public or Private as per RLS policy).

### "App shows Configuration Error overlay"
- **Cause**: Runtime verifier found missing env vars.
- **Fix**: Check `.env` (local) or Vercel/Netlify environment variable settings.
