# Quick Start: Email Setup (30 Minutes)

<<<<<<< HEAD
## TL;DR
1. Create Resend account → resend.com
2. Add domain `estre.app` → Get DNS records
3. Add DNS in Hostinger → SPF, DKIM, DMARC
4. Verify domain → Wait 15 min - 2 hours
5. Create API key → Copy `re_...` key
6. Add to Supabase → Settings → Edge Functions → Secrets → `RESEND_API_KEY`
7. Test → Send test email

## Detailed Steps

### 1. Resend Account (5 min)
- Sign up at resend.com
- Verify email

### 2. Add Domain (2 min)
- Dashboard → Domains → Add `estre.app`
- Copy DNS records shown

### 3. DNS Setup (10 min)
- Hostinger → DNS Management
- Add 3 TXT records (SPF, DKIM, DMARC)
- Save and wait 15 minutes

### 4. Verify Domain (1 min + wait)
- Resend → Click "Verify"
- Wait for green checkmark (15 min - 2 hours)

### 5. API Key (2 min)
- Resend → API Keys → Create
- Copy key (starts with `re_`)

### 6. Supabase Config (3 min)
- Supabase → Settings → Edge Functions → Secrets
- Add: `RESEND_API_KEY` = `your_key_here`

### 7. Test (2 min)
- Use test function or send real email
- Check inbox (and spam folder)

## Done! ✅

Your emails will now send from `Estre <no-reply@estre.app>`

For detailed troubleshooting, see `RESEND_EMAIL_SETUP_GUIDE.md`








=======
## Complete Resend Email Setup in 7 Steps

---

## Step 1: Create Resend Account (5 min)

1. Go to [resend.com](https://resend.com)
2. Click "Sign Up"
3. Verify your email
4. Complete onboarding

---

## Step 2: Add Domain (2 min)

1. In Resend dashboard, click **"Domains"**
2. Click **"Add Domain"**
3. Enter: **estre.app**
4. Click "Add"
5. **Keep this page open** - you'll need the DNS records

---

## Step 3: Configure DNS in Hostinger (10 min)

You already have Hostinger access. Add these records:

### SPF Record
- **Type:** TXT
- **Name:** @ (or blank)
- **Value:** Copy from Resend (looks like: `v=spf1 include:_spf.resend.com ~all`)
- **TTL:** 3600

### DKIM Records (Usually 2 records)
- **Type:** TXT
- **Name:** Copy from Resend (e.g., `resend._domainkey`)
- **Value:** Copy long string from Resend
- **TTL:** 3600

Repeat for all DKIM records provided.

### DMARC Record
- **Type:** TXT
- **Name:** _dmarc
- **Value:** `v=DMARC1; p=none; rua=mailto:dmarc@estre.app`
- **TTL:** 3600

**Save all records.**

---

## Step 4: Verify Domain (1 min + wait)

1. Return to Resend dashboard
2. Click **"Verify Domain"**
3. Wait for verification

**DNS Propagation Time:** 15 minutes - 48 hours (usually 1-2 hours)

**Status will show:**
- Pending → Verifying → Verified ✅

---

## Step 5: Create API Key (2 min)

**IMPORTANT:** Do this AFTER domain is verified (or while waiting).

1. In Resend, click **"API Keys"**
2. Click **"Create API Key"**
3. Name: **"Estre Production"**
4. Permission: **"Full access"**
5. Click **"Create"**
6. **COPY THE KEY** (starts with `re_`)
7. Store it securely (you won't see it again!)

---

## Step 6: Add API Key to Supabase (3 min)

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your **Estre project**
3. Click **Project Settings** (gear icon, bottom left)
4. Click **Edge Functions** tab
5. Scroll to **"Secrets"** section
6. Click **"Add Secret"**
7. Enter:
   - **Name:** `RESEND_API_KEY`
   - **Value:** Paste your Resend API key
8. Click **"Save"**

**Done!** No need to redeploy - it's automatic.

---

## Step 7: Test Email (2 min)

Replace `YOUR_EMAIL` with your email address:

```bash
curl -X POST https://ljgmqwnamffvvrwgprsd.supabase.co/functions/v1/send-email-with-pdf \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZ21xd25hbWZmdnZyd2dwcnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMDA2NTQsImV4cCI6MjA3Nzc3NjY1NH0.uUCG7yiFk0qzECtQLTVVdEE2Qz5bUwY7KFHqkIlO34M" \
  -H "Content-Type: application/json" \
  -d '{"type":"otp","to":"YOUR_EMAIL","customerName":"Test User","otp":"123456"}'
```

**Check your inbox!**

You should receive an email from **Estre <no-reply@estre.app>** with OTP: 123456

---

## Troubleshooting

### "Domain not verified"
- Wait longer (DNS takes time)
- Check DNS records in Hostinger match Resend exactly
- Use [whatsmydns.net](https://www.whatsmydns.net) to verify propagation

### "RESEND_API_KEY not configured"
- Verify secret name is exactly: `RESEND_API_KEY`
- Check API key starts with `re_`
- Wait 2 minutes and try again

### Email goes to spam
- Wait until domain is fully verified
- Check SPF/DKIM/DMARC all pass
- Send more emails to warm up domain

---

## What's Configured

✅ **Email sender:** Estre <no-reply@estre.app>
✅ **Email types:** OTP, Sale Orders, Job Cards, Custom
✅ **Templates:** Professional HTML with Estre branding
✅ **PDF attachments:** Fully supported
✅ **Email logging:** Tracks all sent emails in database
✅ **Security:** RLS policies, encrypted API keys

---

## Next Steps

1. ✅ Wait for DNS verification (check Resend dashboard)
2. ✅ Test OTP email (use curl command above)
3. ✅ Test from application (place order as customer)
4. ✅ Review email logs in database
5. ✅ Monitor delivery rates in Resend dashboard

---

## Documentation

**Full Guides:**
- `RESEND_EMAIL_SETUP_GUIDE.md` - Detailed setup with screenshots
- `EMAIL_TESTING_GUIDE.md` - Complete testing procedures
- `ENVIRONMENT_SETUP.md` - Environment variable reference
- `RESEND_IMPLEMENTATION_COMPLETE.md` - Implementation summary

---

## Support

**Resend Help:**
- Dashboard: https://resend.com/dashboard
- Docs: https://resend.com/docs
- Status: https://status.resend.com

**DNS Tools:**
- Check DNS: https://www.whatsmydns.net
- Email tester: https://mxtoolbox.com

---

## Timeline

**Active Work:** 30 minutes
**DNS Wait:** 15 min - 48 hours (usually 1-2 hours)

After DNS verification, your email system is **production-ready**!

---

**Questions? Check the full guides or Resend documentation.**
>>>>>>> d520fc30438a01daeac4e67708effef2a75a7d09




