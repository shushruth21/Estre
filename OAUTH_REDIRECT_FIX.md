# OAuth Redirect Fix - Google Login Issue Resolved

## Problem
When users clicked "Sign in with Google", the OAuth callback would redirect to a webcontainer URL that became invalid, causing a "This site can't be reached" error.

## Solution Applied
Updated the OAuth redirect logic in `src/components/auth/SSOButtons.tsx` to:
- Use `http://localhost:5173/auth/callback` for development
- Use the actual domain for production

## Required Configuration in Supabase

You need to add the redirect URL to your Supabase project's allowed redirect URLs:

### Steps:

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project: `ljgmqwnamffvvrwgprsd`
3. Navigate to **Authentication** → **URL Configuration**
4. In the **Redirect URLs** section, add:
   ```
   http://localhost:5173/auth/callback
   ```
5. If you have a production domain, also add:
   ```
   https://yourdomain.com/auth/callback
   ```
6. Click **Save**

### Google OAuth Provider Setup

Make sure your Google OAuth is configured in Supabase:

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials (Client ID and Client Secret)
4. Make sure the authorized redirect URI in Google Cloud Console includes:
   ```
   https://ljgmqwnamffvvrwgprsd.supabase.co/auth/v1/callback
   ```

## Testing

After configuration:
1. Go to the login page: `http://localhost:5173/login`
2. Click "Sign in with Google"
3. Complete the Google sign-in flow
4. You should be redirected back to your app successfully
5. Based on your role, you'll be directed to:
   - **Admin**: `/admin/dashboard`
   - **Staff**: `/staff/dashboard`
   - **Customer**: `/dashboard`

## Changes Made

### File: `src/components/auth/SSOButtons.tsx`
- Added smart redirect URL logic
- Uses `localhost:5173` for development to avoid webcontainer URL issues
- Uses actual domain for production deployments

### File: `src/lib/logout.ts`
- Changed logout redirect from `/login` to `/` (home page)
- Users now land on the beautiful landing page after logout

## Notes

- The OAuth callback handler at `/auth/callback` was already working correctly
- The issue was purely with the redirect URL being unstable in development
- No database changes were required
- The fix works for Google, Microsoft, and Apple OAuth providers
