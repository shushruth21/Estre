# 🔄 Google OAuth Flow - Visual Guide

## Complete Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER EXPERIENCE                         │
└─────────────────────────────────────────────────────────────────┘

1. User visits Login/Signup page
   │
   ├─> Sees "Continue with Google" button
   │
2. User clicks button
   │
   ├─> Redirected to Google login
   │
3. User selects Google account
   │
   ├─> Google authenticates user
   │
4. Google redirects back to your app
   │
   ├─> URL: yourapp.com/auth/callback
   │
5. AuthCallback page processes
   │
   ├─> Retrieves session from Supabase
   ├─> Checks if profile exists
   ├─> Creates profile if missing (trigger)
   ├─> Detects user role (admin/staff/customer)
   │
6. User redirected to dashboard
   │
   ├─> Admin → /admin/dashboard
   ├─> Staff → /staff/dashboard
   └─> Customer → /dashboard

⏱️ Total Time: ~10 seconds
```

---

## Technical Flow

```
┌──────────────┐
│  Your App    │
│  (Frontend)  │
└──────┬───────┘
       │
       │ 1. User clicks "Google"
       │ 
       ├──> signInWithOAuth({provider: 'google'})
       │
       ▼
┌──────────────┐
│   Supabase   │
│     Auth     │
└──────┬───────┘
       │
       │ 2. Redirects to Google
       │
       ▼
┌──────────────┐
│    Google    │
│    OAuth     │
└──────┬───────┘
       │
       │ 3. User authenticates
       │ 4. Google redirects back
       │
       ▼
┌──────────────┐
│   Supabase   │
│   Callback   │
└──────┬───────┘
       │
       │ 5. Creates session
       │ 6. Triggers profile creation
       │
       ▼
┌──────────────┐
│  Database    │
│   Trigger    │
└──────┬───────┘
       │
       │ 7. INSERT into profiles
       │    - user_id
       │    - full_name (from Google)
       │    - role: 'customer'
       │
       ▼
┌──────────────┐
│  Your App    │
│ /auth/callback
└──────┬───────┘
       │
       │ 8. Gets session
       │ 9. Gets profile & role
       │ 10. Redirects by role
       │
       ▼
┌──────────────┐
│  Dashboard   │
│ (User Lands) │
└──────────────┘
```

---

## Database Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    WHAT HAPPENS IN DATABASE                  │
└─────────────────────────────────────────────────────────────┘

1. Google authenticates user
   │
2. Supabase creates user in auth.users table
   │
   auth.users:
   ├─ id: uuid
   ├─ email: user@gmail.com
   ├─ raw_user_meta_data: {
   │     full_name: "John Doe"
   │     avatar_url: "https://..."
   │  }
   └─ provider: 'google'
   │
3. Trigger fires: handle_oauth_user()
   │
4. Profile auto-created in public.profiles table
   │
   public.profiles:
   ├─ user_id: (same as auth.users.id)
   ├─ full_name: "John Doe" (from Google)
   ├─ role: 'customer' (default)
   ├─ avatar_url: null
   └─ created_at: now()
   │
5. User session includes profile data
   │
6. App reads role and redirects
```

---

## Code Components

```
┌─────────────────────────────────────────────────────────────┐
│                       FILE STRUCTURE                         │
└─────────────────────────────────────────────────────────────┘

src/
├── pages/
│   ├── Login.tsx
│   │   └── Uses: <SSOButtons />
│   │
│   ├── Signup.tsx
│   │   └── Uses: <SSOButtons />
│   │
│   └── AuthCallback.tsx  ⭐ NEW
│       ├── Gets OAuth session
│       ├── Creates profile if missing
│       ├── Detects role
│       └── Redirects by role
│
├── components/
│   └── auth/
│       └── SSOButtons.tsx
│           ├── Google button
│           ├── Microsoft button
│           └── Apple button
│
└── App.tsx
    └── Routes:
        ├── /login
        ├── /signup
        └── /auth/callback  ⭐ NEW

supabase/
└── migrations/
    └── 20251204000002_oauth_profile_trigger.sql  ⭐ NEW
        └── Creates trigger for auto-profile creation
```

---

## Configuration Required

```
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL CONFIGURATION                      │
└─────────────────────────────────────────────────────────────┘

Google Cloud Console:
├── OAuth Client ID created
├── Client Secret generated
└── Redirect URI configured:
    └── https://ljgmqwnamffvvrwgprsd.supabase.co/auth/v1/callback

Supabase Dashboard:
├── Authentication → Providers → Google
├── Enabled: ON
├── Client ID: [from Google]
└── Client Secret: [from Google]

Database (Supabase SQL Editor):
└── Run migration SQL:
    └── Creates handle_oauth_user() function
    └── Creates trigger on auth.users INSERT
```

---

## User Role Mapping

```
┌─────────────────────────────────────────────────────────────┐
│                    ROLE DETERMINATION                        │
└─────────────────────────────────────────────────────────────┘

OAuth User Signs Up
        │
        ├─> Default Role: 'customer'
        │
        └─> Stored in: profiles.role

Admin Can Change Role:
        │
        ├─> Go to Supabase Dashboard
        ├─> profiles table
        ├─> Find user by email
        └─> Update role to:
            ├─> 'admin'
            ├─> 'staff'
            └─> 'customer'

Next Login:
        │
        └─> AuthCallback checks role
            ├─> role === 'admin' → /admin/dashboard
            ├─> role === 'staff' → /staff/dashboard
            └─> role === 'customer' → /dashboard
```

---

## Testing Checklist

```
┌─────────────────────────────────────────────────────────────┐
│                      TEST SCENARIOS                          │
└─────────────────────────────────────────────────────────────┘

✅ Test 1: New User (Google Sign Up)
   1. Go to /signup
   2. Click "Continue with Google"
   3. Select Google account
   4. Should redirect to /dashboard
   5. Check profiles table:
      - User exists
      - role = 'customer'
      - full_name from Google

✅ Test 2: Existing User (Google Sign In)
   1. Go to /login
   2. Click "Continue with Google"
   3. Select same Google account
   4. Should redirect to /dashboard
   5. Profile already exists

✅ Test 3: Role-Based Redirect (Admin)
   1. Create OAuth user
   2. In Supabase → profiles → change role to 'admin'
   3. Sign in with Google again
   4. Should redirect to /admin/dashboard

✅ Test 4: Role-Based Redirect (Staff)
   1. Create OAuth user
   2. In Supabase → profiles → change role to 'staff'
   3. Sign in with Google again
   4. Should redirect to /staff/dashboard

✅ Test 5: Error Handling
   1. Disable Google in Supabase
   2. Try to sign in with Google
   3. Should show error message
   4. Should redirect to /login
```

---

## Troubleshooting Guide

```
┌─────────────────────────────────────────────────────────────┐
│                     COMMON ISSUES                            │
└─────────────────────────────────────────────────────────────┘

❌ Issue: "OAuth failed"
   → Check: Google enabled in Supabase?
   → Check: Credentials correct?
   → Check: Redirect URI matches?

❌ Issue: "Profile not created"
   → Check: Trigger exists in database?
   → Run: SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created_oauth';
   → Fix: Re-run migration SQL

❌ Issue: "Redirects to wrong dashboard"
   → Check: profile.role in database
   → Check: Role is lowercase
   → Fix: UPDATE profiles SET role = 'customer' WHERE user_id = 'xxx';

❌ Issue: "Infinite redirect loop"
   → Check: AuthCallback.tsx logic
   → Check: Browser console for errors
   → Fix: Clear browser cache and cookies

❌ Issue: "Can't read property 'role'"
   → Check: Profile exists in database
   → Fix: Profile will be created on next sign-in
```

---

## Security Considerations

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY NOTES                            │
└─────────────────────────────────────────────────────────────┘

✅ SAFE:
   - Client ID (public, can be exposed)
   - Redirect URI (public)
   - User email (controlled by Google)

❌ KEEP SECRET:
   - Client Secret (NEVER commit to git)
   - Service Role Key (NEVER expose to frontend)
   - Database credentials

🔒 BEST PRACTICES:
   - Use environment variables for secrets
   - Never commit client_secret_*.json files
   - Rotate credentials periodically
   - Monitor OAuth usage in Google Console
   - Check Supabase Auth logs regularly
```

---

## Summary

**Implementation Status:** ✅ COMPLETE

**Your Next Steps:**
1. Apply database migration (3 min)
2. Configure Google in Supabase (5 min)
3. Verify redirect URI (2 min)
4. Test OAuth flow (2 min)

**Total Time:** ~12 minutes

**Result:** One-click Google sign-in for all users! 🎉

