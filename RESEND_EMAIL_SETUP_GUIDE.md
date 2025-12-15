# Resend Email Setup Guide for Estre

<<<<<<< HEAD
Complete guide to set up Resend email service for `no-reply@estre.app`

## Prerequisites
- Estre.app domain hosted on Hostinger
- Access to Hostinger DNS management
- Supabase project with Edge Functions enabled

## Step 1: Create Resend Account (5 minutes)

1. Visit [resend.com](https://resend.com)
2. Click "Sign Up" and create account
3. Verify your email address
4. Complete account setup

## Step 2: Add Domain in Resend (2 minutes)

1. Log into Resend dashboard
2. Navigate to **Domains** → **Add Domain**
3. Enter: `estre.app`
4. Click **Add Domain**
5. Resend will generate DNS records (SPF, DKIM, DMARC)

## Step 3: Configure DNS in Hostinger (10 minutes)

1. Log into Hostinger DNS management
2. Add these DNS records (values provided by Resend):

### SPF Record (TXT)
- **Name:** `@` or `estre.app`
- **Value:** `v=spf1 include:_spf.resend.com ~all`
- **TTL:** 3600

### DKIM Record (TXT)
- **Name:** `resend._domainkey` (or as provided by Resend)
- **Value:** (Provided by Resend - unique per domain)
- **TTL:** 3600

### DMARC Record (TXT) - Optional but recommended
- **Name:** `_dmarc`
- **Value:** `v=DMARC1; p=quarantine; rua=mailto:dmarc@estre.app`
- **TTL:** 3600

3. Save all DNS changes
4. Wait 15 minutes for DNS propagation

## Step 4: Verify Domain in Resend (1 minute + wait)

1. Return to Resend dashboard
2. Click **Verify Domain** next to `estre.app`
3. Wait for verification (usually 15 minutes to 2 hours)
4. Status will change to "Verified" when complete

## Step 5: Create API Key (2 minutes)

1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Name it: `Estre Production`
4. Select **Full Access** permissions
5. Copy the API key (starts with `re_`)
6. **Important:** Save this key securely - you won't see it again!

## Step 6: Add API Key to Supabase (3 minutes)

1. Open Supabase dashboard → Your Project
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Click **Add Secret**
4. **Name:** `RESEND_API_KEY`
5. **Value:** Paste your Resend API key
6. Click **Save**

## Step 7: Redeploy Edge Functions (2 minutes)

After adding the secret, redeploy your edge functions:

```bash
# If using Supabase CLI
supabase functions deploy send-sale-order-pdf-after-otp
supabase functions deploy generate-sale-order-pdf

# Or redeploy via Supabase dashboard
# Dashboard → Edge Functions → Deploy
```

## Step 8: Test Email Sending (5 minutes)

### Test via Supabase Dashboard
1. Go to **Edge Functions** → `send-sale-order-pdf-after-otp`
2. Click **Invoke**
3. Use test payload:
```json
{
  "saleOrderId": "YOUR_SALE_ORDER_ID"
}
```

### Test via cURL
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-sale-order-pdf-after-otp \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"saleOrderId": "YOUR_SALE_ORDER_ID"}'
```

## Verification Checklist

- [ ] Resend account created
- [ ] Domain `estre.app` added to Resend
- [ ] DNS records added in Hostinger (SPF, DKIM, DMARC)
- [ ] Domain verified in Resend dashboard
- [ ] API key created and saved
- [ ] `RESEND_API_KEY` added to Supabase secrets
- [ ] Edge functions redeployed
- [ ] Test email received successfully
- [ ] Email appears from `Estre <no-reply@estre.app>`
- [ ] PDF attachment opens correctly

## Troubleshooting

### Domain Verification Fails
- Check DNS records are correct in Hostinger
- Wait up to 48 hours for DNS propagation
- Verify TXT records using: `dig TXT estre.app` or `nslookup -type=TXT estre.app`

### Emails Not Sending
- Verify `RESEND_API_KEY` is set in Supabase secrets
- Check Edge Function logs in Supabase dashboard
- Verify domain is verified in Resend dashboard
- Check Resend dashboard for delivery status

### Emails Going to Spam
- Ensure SPF, DKIM, and DMARC records are correct
- Wait for domain reputation to build (24-48 hours)
- Use professional email content (already implemented)

## Support

- Resend Documentation: https://resend.com/docs
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Check email logs in `email_logs` table for debugging








=======
## Overview

This guide will help you set up Resend email service for sending transactional emails from your Estre application using the domain **no-reply@estre.app**.

## Current Implementation Status

✅ **COMPLETED:**
- Email sender configured as "Estre <no-reply@estre.app>" across all email functions
- Professional HTML email templates for sale orders, OTPs, and notifications
- Edge function `send-email-with-pdf` deployed and ready
- Edge function `generate-sale-order-pdf` with email integration
- Support for PDF attachments in emails

🔧 **PENDING:**
- Resend account creation
- DNS verification for estre.app domain
- API key configuration in Supabase

---

## Step 1: Create Resend Account

### 1.1 Sign Up for Resend

1. Visit [resend.com](https://resend.com)
2. Click "Get Started" or "Sign Up"
3. Create account using your email
4. Verify your email address
5. Complete onboarding steps

### 1.2 Navigate to Dashboard

1. Log into Resend dashboard
2. You'll see the main dashboard with email statistics
3. Note: Initially, you'll be in "test mode" until domain is verified

---

## Step 2: Add and Verify Domain

### 2.1 Add Domain in Resend

1. In Resend dashboard, click **"Domains"** in left sidebar
2. Click **"Add Domain"** button
3. Enter domain: **estre.app**
4. Click "Add Domain"
5. Resend will generate DNS records for you

### 2.2 DNS Records You'll Receive

Resend will provide you with the following DNS records (example format):

**SPF Record (TXT):**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

**DKIM Records (TXT):**
You'll receive 2-3 DKIM records like:
```
Type: TXT
Name: resend._domainkey
Value: [Long string provided by Resend]
TTL: 3600
```

**Additional DKIM (if provided):**
```
Type: TXT
Name: resend2._domainkey
Value: [Long string provided by Resend]
TTL: 3600
```

---

## Step 3: Configure DNS in Hostinger

You mentioned you have access to Hostinger DNS panel. Here's how to add the records:

### 3.1 Access DNS Management

1. Log into Hostinger control panel
2. Navigate to **Domains** section
3. Select **estre.app** domain
4. Click **DNS / Nameservers** or **DNS Zone**

### 3.2 Add SPF Record

1. Click **"Add Record"** or **"Manage"**
2. Select record type: **TXT**
3. Enter:
   - **Name/Host:** @ (or leave blank for root domain)
   - **Value:** Copy the SPF value from Resend dashboard
   - **TTL:** 3600 (or Auto)
4. Click **"Add Record"** or **"Save"**

### 3.3 Add DKIM Records

For each DKIM record provided by Resend:

1. Click **"Add Record"**
2. Select record type: **TXT**
3. Enter:
   - **Name/Host:** The subdomain from Resend (e.g., `resend._domainkey`)
   - **Value:** The long string from Resend
   - **TTL:** 3600 (or Auto)
4. Click **"Add Record"** or **"Save"**
5. Repeat for all DKIM records

### 3.4 Update or Add DMARC Record

You mentioned having an existing DMARC record. Update it or add a new one:

1. If updating: Find existing DMARC record and edit
2. If adding new: Click **"Add Record"**
3. Select record type: **TXT**
4. Enter:
   - **Name/Host:** _dmarc
   - **Value:** `v=DMARC1; p=none; rua=mailto:dmarc@estre.app`
   - **TTL:** 3600
5. Save the record

**Note:** You can adjust DMARC policy later:
- `p=none` - Monitor only (recommended initially)
- `p=quarantine` - Send suspicious emails to spam
- `p=reject` - Reject unauthenticated emails

### 3.5 Verify DNS Configuration

After adding all records in Hostinger:

1. Return to Resend dashboard
2. Click **"Verify Domain"** button
3. Resend will check DNS records (may take a few minutes)
4. Status will change to:
   - **Pending** - DNS not yet propagated (wait and retry)
   - **Verified** - Success! Domain is ready

**DNS Propagation Time:** 15 minutes to 48 hours (usually within 1-2 hours)

---

## Step 4: Get API Key from Resend

### 4.1 Create API Key

1. In Resend dashboard, click **"API Keys"** in left sidebar
2. Click **"Create API Key"** button
3. Enter a name: **"Estre Production"**
4. Select permission: **"Full access"** or **"Sending access"**
5. Click **"Create"**
6. **IMPORTANT:** Copy the API key immediately (starts with `re_`)
   - You won't be able to see it again!
   - Store it securely

### 4.2 API Key Format

Your API key will look like:
```
re_123abc456def789ghi012jkl345mno678pqr
```

---

## Step 5: Configure API Key in Supabase

### 5.1 Add Secret to Supabase Edge Functions

1. Open Supabase dashboard at [supabase.com](https://supabase.com)
2. Select your Estre project
3. Navigate to **Project Settings** (gear icon in left sidebar)
4. Click **Edge Functions** tab
5. Scroll to **"Environment Variables"** or **"Secrets"** section
6. Click **"Add Secret"** or **"New Secret"**
7. Enter:
   - **Name:** `RESEND_API_KEY`
   - **Value:** Paste the API key from Resend (starts with `re_`)
8. Click **"Save"** or **"Add"**

### 5.2 Redeploy Edge Functions (if needed)

The secrets are automatically available to edge functions. If you experience issues:

1. In Supabase dashboard, go to **Edge Functions**
2. For each function that uses email:
   - `send-email-with-pdf`
   - `generate-sale-order-pdf`
3. Click **"Deploy"** or wait for automatic redeployment

---

## Step 6: Test Email Sending

### 6.1 Test Sale Order Email

Use this curl command to test (replace with your values):

```bash
curl -X POST https://ljgmqwnamffvvrwgprsd.supabase.co/functions/v1/send-email-with-pdf \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "otp",
    "to": "your-test-email@example.com",
    "customerName": "Test User",
    "otp": "123456"
  }'
```

### 6.2 Test OTP Email from Application

1. Log into your Estre application as admin/staff
2. Create a test order
3. Proceed to checkout
4. Enter a valid email address
5. Complete the order
6. Check if OTP email arrives

### 6.3 Test Sale Order PDF Email

1. As staff/admin, approve an order
2. System will generate sale order PDF
3. Email should be sent automatically with PDF attachment
4. Check recipient's inbox

### 6.4 Verification Checklist

✅ Email arrives in inbox (not spam)
✅ Sender shows as "Estre <no-reply@estre.app>"
✅ Subject line is correct
✅ Email content displays properly
✅ PDF attachment opens correctly
✅ OTP code is visible and correct
✅ Links in email work
✅ Email renders well on mobile devices

---

## Step 7: Monitor and Maintain

### 7.1 Monitor Email Delivery

1. Check Resend dashboard regularly for:
   - Email delivery rates
   - Bounce rates
   - Spam complaints
   - Failed sends

### 7.2 Review Email Logs

1. In Resend dashboard, go to **"Logs"**
2. View sent emails, delivery status, and errors
3. Filter by:
   - Date range
   - Status (sent, delivered, bounced, failed)
   - Recipient

### 7.3 Set Up Alerts (Recommended)

1. Configure bounce notifications
2. Set up quota alerts (Resend has sending limits based on plan)
3. Monitor API error rates

### 7.4 Email Sending Limits

**Resend Free Tier:**
- 3,000 emails/month
- 100 emails/day

**Resend Pro Plan:**
- 50,000 emails/month
- No daily limit
- Priority support

**Plan accordingly based on your expected email volume.**

---

## Troubleshooting

### Email Not Sending

**Check 1: Verify API Key**
- Ensure `RESEND_API_KEY` is set in Supabase Edge Functions secrets
- Verify the key is correct (starts with `re_`)

**Check 2: Domain Verification**
- Check Resend dashboard - domain status should be "Verified"
- If "Pending", wait for DNS propagation (up to 48 hours)

**Check 3: Check Edge Function Logs**
```bash
# In your terminal, view logs
supabase functions logs send-email-with-pdf
```

### Email Goes to Spam

**Solution 1: Warm Up Your Domain**
- Start by sending to verified recipients
- Gradually increase volume
- Monitor bounce rates

**Solution 2: Update DMARC Policy**
- Change from `p=none` to `p=quarantine` after testing
- Ensure SPF and DKIM pass authentication

**Solution 3: Add Custom Tracking Domain**
- Set up a custom tracking subdomain (e.g., track.estre.app)
- Improves deliverability reputation

### DNS Not Verifying

**Check 1: Verify Records in Hostinger**
- Use DNS checker tool: [whatsmydns.net](https://www.whatsmydns.net)
- Search for your TXT records
- Ensure they match Resend's values exactly

**Check 2: Wait for Propagation**
- DNS changes can take 24-48 hours
- Try clicking "Verify" in Resend again later

**Check 3: Remove Conflicting Records**
- Check for duplicate SPF records
- Only one SPF record is allowed per domain

---

## Email Types Supported

### 1. OTP/Authentication Emails ✅
- **Function:** `send-email-with-pdf` (type: "otp")
- **Template:** Premium HTML with large OTP display
- **Use case:** Sale order confirmation

### 2. Sale Order Emails ✅
- **Function:** `generate-sale-order-pdf` + `send-email-with-pdf`
- **Template:** Professional with PDF attachment
- **Use case:** Approved orders ready for customer confirmation

### 3. Job Card Emails ✅
- **Function:** `send-email-with-pdf` (type: "job_card")
- **Template:** Customizable HTML
- **Use case:** Production notifications to staff/customers

### 4. Custom Emails ✅
- **Function:** `send-email-with-pdf` (type: "custom")
- **Template:** Fully customizable
- **Use case:** Any custom notification

---

## Future Enhancements (Optional)

### 1. Additional Email Templates

Consider adding:
- Order status updates (processing, shipped, delivered)
- Welcome emails for new customers
- Password reset emails
- Invoice/receipt emails
- Abandoned cart reminders
- Promotional emails

### 2. Email Analytics

Track:
- Open rates
- Click rates
- Conversion rates
- Bounce rates

### 3. Email Scheduling

Implement:
- Delayed sending
- Scheduled campaigns
- Batch processing

### 4. Webhook Integration

Set up webhooks to track:
- Email delivered
- Email opened
- Email bounced
- Link clicked

---

## Support and Resources

### Resend Documentation
- [Getting Started](https://resend.com/docs/introduction)
- [DNS Configuration](https://resend.com/docs/knowledge-base/dns-configuration)
- [API Reference](https://resend.com/docs/api-reference/introduction)

### DNS Tools
- [DNS Checker](https://www.whatsmydns.net)
- [MXToolbox](https://mxtoolbox.com/SuperTool.aspx)
- [DNS Propagation Checker](https://dnschecker.org)

### Supabase Documentation
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Environment Variables](https://supabase.com/docs/guides/functions/secrets)

---

## Quick Reference Commands

### Test OTP Email
```bash
curl -X POST https://ljgmqwnamffvvrwgprsd.supabase.co/functions/v1/send-email-with-pdf \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "otp",
    "to": "test@example.com",
    "customerName": "Test User",
    "otp": "123456"
  }'
```

### Test Sale Order Email
```bash
curl -X POST https://ljgmqwnamffvvrwgprsd.supabase.co/functions/v1/send-email-with-pdf \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sale_order",
    "to": "test@example.com",
    "customerName": "Test User",
    "orderNumber": "SO-2024-001",
    "pdfUrl": "https://example.com/sample.pdf"
  }'
```

### Check DNS Records
```bash
# Check SPF
dig txt estre.app

# Check DKIM
dig txt resend._domainkey.estre.app

# Check DMARC
dig txt _dmarc.estre.app
```

---

## Summary

1. ✅ Create Resend account at resend.com
2. ✅ Add estre.app domain in Resend
3. ✅ Copy DNS records from Resend
4. ✅ Add DNS records in Hostinger (SPF, DKIM, DMARC)
5. ✅ Verify domain in Resend (wait for DNS propagation)
6. ✅ Create API key in Resend
7. ✅ Add RESEND_API_KEY to Supabase Edge Functions secrets
8. ✅ Test email sending
9. ✅ Monitor delivery in Resend dashboard

**Total Active Time:** 30 minutes
**DNS Propagation Wait:** 15 minutes - 48 hours (usually 1-2 hours)

---

**Your email infrastructure is ready to go! Just complete the external setup steps above.**
>>>>>>> d520fc30438a01daeac4e67708effef2a75a7d09





