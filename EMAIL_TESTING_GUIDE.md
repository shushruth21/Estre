<<<<<<< HEAD
# Email Testing Guide

## Test Scenarios

### 1. OTP Email Test
- Trigger: Customer confirms order with OTP
- Expected: Email with 6-digit OTP code
- Verify: Code works, email renders correctly

### 2. Sale Order PDF Email Test
- Trigger: After OTP verification or manual resend
- Expected: Email with PDF attachment
- Verify: PDF opens, contains correct order details

### 3. Email Logging Test
- Check `email_logs` table after sending
- Verify: Entry created with correct status

## Testing Checklist

- [ ] Email received within 30 seconds
- [ ] Sender shows as "Estre <no-reply@estre.app>"
- [ ] Subject line is correct
- [ ] HTML renders correctly (Gmail, Outlook, mobile)
- [ ] PDF attachment opens correctly
- [ ] Email logged in `email_logs` table
- [ ] No errors in Edge Function logs
- [ ] Email not in spam folder

## Monitoring

Check `email_logs` table:
```sql
SELECT * FROM email_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

Check Resend dashboard for delivery rates and bounces.

## Email Logs Query Examples

### View all sent emails
```sql
SELECT 
  recipient_email,
  subject,
  email_type,
  status,
  created_at,
  sent_at
FROM email_logs
ORDER BY created_at DESC;
```

### Check failed emails
```sql
SELECT 
  recipient_email,
  subject,
  error_message,
  failed_at
FROM email_logs
WHERE status = 'failed'
ORDER BY failed_at DESC;
```

### Email delivery rate
```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM email_logs
GROUP BY status;
```








=======
# Email Testing Guide for Estre

## Quick Test Scripts

This guide provides ready-to-use commands and checklists to test your Resend email integration.

---

## Prerequisites

Before testing, ensure:
- ✅ Resend account created
- ✅ Domain estre.app verified in Resend
- ✅ API key added to Supabase Edge Functions secrets
- ✅ DNS records added and propagated

---

## Test 1: Simple OTP Email

### Command

Replace `YOUR_EMAIL` with your test email address:

```bash
curl -X POST https://ljgmqwnamffvvrwgprsd.supabase.co/functions/v1/send-email-with-pdf \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZ21xd25hbWZmdnZyd2dwcnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMDA2NTQsImV4cCI6MjA3Nzc3NjY1NH0.uUCG7yiFk0qzECtQLTVVdEE2Qz5bUwY7KFHqkIlO34M" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "otp",
    "to": "YOUR_EMAIL",
    "customerName": "Test User",
    "otp": "123456"
  }'
```

### Expected Response

```json
{
  "success": true,
  "message": "Email sent successfully",
  "emailId": "re_abc123...",
  "to": "YOUR_EMAIL",
  "type": "otp"
}
```

### Check Email

1. Open your inbox
2. Look for email from **"Estre <no-reply@estre.app>"**
3. Subject: **"Your Estre Verification Code"**
4. Content should show OTP: **123456**
5. Check spam folder if not in inbox

---

## Test 2: Sale Order Email (Without PDF)

### Command

```bash
curl -X POST https://ljgmqwnamffvvrwgprsd.supabase.co/functions/v1/send-email-with-pdf \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZ21xd25hbWZmdnZyd2dwcnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMDA2NTQsImV4cCI6MjA3Nzc3NjY1NH0.uUCG7yiFk0qzECtQLTVVdEE2Qz5bUwY7KFHqkIlO34M" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sale_order",
    "to": "YOUR_EMAIL",
    "customerName": "Test User",
    "orderNumber": "SO-TEST-001",
    "pdfUrl": "https://example.com/sample.pdf",
    "otp": "654321"
  }'
```

### Expected Email Content

- **Sender:** Estre <no-reply@estre.app>
- **Subject:** Your Estre Sale Order is Ready
- **Content:**
  - Greeting: "Hello Test User"
  - Order number displayed: SO-TEST-001
  - Download PDF button
  - OTP displayed: 654321
  - Professional styling with Estre branding

---

## Test 3: Test from Application UI

### A. Test OTP Email During Checkout

1. Log into Estre as a customer
2. Configure a product and add to cart
3. Go to checkout
4. Fill in delivery details with **your email**
5. Complete checkout
6. System will generate sale order
7. Check your email for OTP
8. Verify OTP to complete order

### B. Test Sale Order Email from Staff Dashboard

1. Log into Estre as staff/admin
2. Navigate to Orders page
3. Select a pending order
4. Click "Generate Sale Order"
5. System sends email with PDF to customer
6. Check customer email inbox

---

## Verification Checklist

### Email Delivery ✅

- [ ] Email arrives in inbox (not spam)
- [ ] Email arrives within 30 seconds
- [ ] Sender shows correctly: "Estre <no-reply@estre.app>"
- [ ] Subject line is correct
- [ ] No error messages in response

### Email Content ✅

- [ ] Customer name displays correctly
- [ ] OTP is visible and readable
- [ ] Order number displays (if applicable)
- [ ] All text is properly formatted
- [ ] No broken HTML or missing styles
- [ ] Colors and branding match Estre design

### Email Rendering ✅

Test on multiple email clients:
- [ ] Gmail (web)
- [ ] Gmail (mobile app)
- [ ] Outlook (web)
- [ ] Outlook (desktop)
- [ ] Apple Mail (iOS)
- [ ] Apple Mail (macOS)

### Links and Buttons ✅

- [ ] "Download PDF" button works
- [ ] PDF link opens correctly
- [ ] Support email link works (support@estre.app)
- [ ] All links use HTTPS

### PDF Attachments ✅

- [ ] PDF is attached to email
- [ ] PDF filename is correct (sale-order-XXX.pdf)
- [ ] PDF opens without errors
- [ ] PDF content is readable and formatted
- [ ] PDF contains all order details

### Spam Testing ✅

- [ ] Email not in spam folder
- [ ] Email passes SPF check
- [ ] Email passes DKIM check
- [ ] Email passes DMARC check
- [ ] No spam warnings in email header

---

## Check Email Authentication

### View Email Headers

1. Open the test email
2. View email headers (varies by client):
   - **Gmail:** Click three dots → "Show original"
   - **Outlook:** File → Properties → Internet headers
   - **Apple Mail:** View → Message → All Headers

### Look for Authentication Results

```
Authentication-Results: spf=pass smtp.mailfrom=estre.app;
  dkim=pass header.d=estre.app;
  dmarc=pass header.from=estre.app;
```

All three should show **PASS**.

---

## Debug Failed Emails

### Error: "RESEND_API_KEY not configured"

**Solution:**
1. Check Supabase Edge Functions secrets
2. Ensure secret name is exactly: `RESEND_API_KEY`
3. Verify API key starts with `re_`
4. Redeploy edge functions

### Error: "Domain not verified"

**Solution:**
1. Log into Resend dashboard
2. Check domain status under "Domains"
3. If "Pending", wait for DNS propagation
4. If "Failed", verify DNS records in Hostinger
5. Click "Verify Domain" again

### Error: "Email bounced"

**Solution:**
1. Verify recipient email is valid
2. Check Resend dashboard logs
3. Look for bounce reason
4. Common causes:
   - Invalid email address
   - Mailbox full
   - Domain doesn't exist

### Error: Email goes to spam

**Solution:**
1. Warm up domain by sending to real users gradually
2. Verify SPF, DKIM, DMARC all pass
3. Avoid spam trigger words in subject/content
4. Add "unsubscribe" link for marketing emails
5. Monitor bounce rates in Resend

---

## Test Email Authentication Records

### Check SPF Record

```bash
dig txt estre.app +short | grep "v=spf1"
```

**Expected output:**
```
"v=spf1 include:_spf.resend.com ~all"
```

### Check DKIM Record

```bash
dig txt resend._domainkey.estre.app +short
```

**Expected output:**
```
"v=DKIM1; k=rsa; p=MIGfMA0GCS..."
```

### Check DMARC Record

```bash
dig txt _dmarc.estre.app +short
```

**Expected output:**
```
"v=DMARC1; p=none; rua=mailto:dmarc@estre.app"
```

---

## Online DNS Checkers

Use these tools to verify DNS propagation:

1. **MXToolbox SPF Checker**
   - https://mxtoolbox.com/spf.aspx
   - Enter: estre.app

2. **DKIM Record Lookup**
   - https://mxtoolbox.com/dkim.aspx
   - Enter: resend._domainkey.estre.app

3. **DMARC Checker**
   - https://mxtoolbox.com/dmarc.aspx
   - Enter: estre.app

4. **DNS Propagation Checker**
   - https://www.whatsmydns.net
   - Check if TXT records are visible globally

---

## Monitoring Email Delivery

### View Logs in Resend Dashboard

1. Log into Resend dashboard
2. Click **"Logs"** in sidebar
3. View recent emails:
   - ✅ Green = Delivered
   - ⏳ Yellow = Pending
   - ❌ Red = Failed/Bounced
4. Click on email for details

### Check Supabase Edge Function Logs

```bash
# If you have Supabase CLI installed locally
supabase functions logs send-email-with-pdf --limit 50
```

Or view in Supabase dashboard:
1. Go to Edge Functions
2. Click on `send-email-with-pdf`
3. View logs tab

---

## Production Testing Checklist

Before going live:

### Pre-Production ✅

- [ ] All test emails delivered successfully
- [ ] Email authentication (SPF/DKIM/DMARC) passing
- [ ] PDF attachments working correctly
- [ ] OTP emails arriving within 30 seconds
- [ ] No emails going to spam
- [ ] Mobile rendering tested on iOS and Android
- [ ] Email content reviewed for typos
- [ ] Links and buttons all functional

### Production Launch ✅

- [ ] Monitor first 10 real customer emails
- [ ] Check Resend dashboard for delivery rate
- [ ] Verify no bounce rate spikes
- [ ] Collect customer feedback on email receipt
- [ ] Set up alerts for failed emails
- [ ] Document any issues and resolutions

### Ongoing Monitoring ✅

- [ ] Weekly review of Resend dashboard metrics
- [ ] Monitor bounce and spam complaint rates
- [ ] Track email delivery times
- [ ] Review email logs for errors
- [ ] Update email templates based on feedback
- [ ] Maintain 95%+ delivery rate

---

## Email Templates in Use

### 1. OTP Email
- **Template:** Premium HTML with large OTP display
- **Function:** `send-email-with-pdf` (type: "otp")
- **Use case:** Order confirmation codes

### 2. Sale Order Email
- **Template:** Professional with download button and OTP
- **Function:** `send-email-with-pdf` (type: "sale_order")
- **Use case:** Approved orders with PDF

### 3. Job Card Email
- **Template:** Customizable
- **Function:** `send-email-with-pdf` (type: "job_card")
- **Use case:** Production notifications

---

## Quick Command Reference

```bash
# Test OTP email
curl -X POST https://ljgmqwnamffvvrwgprsd.supabase.co/functions/v1/send-email-with-pdf \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"otp","to":"test@example.com","customerName":"Test","otp":"123456"}'

# Check SPF
dig txt estre.app +short | grep spf

# Check DKIM
dig txt resend._domainkey.estre.app +short

# Check DMARC
dig txt _dmarc.estre.app +short
```

---

## Support

### Resend Support
- Dashboard: https://resend.com/dashboard
- Documentation: https://resend.com/docs
- Status: https://status.resend.com

### DNS Tools
- https://www.whatsmydns.net
- https://mxtoolbox.com
- https://dnschecker.org

---

## Summary

1. ✅ Test OTP email with curl command
2. ✅ Test sale order email with curl command
3. ✅ Test from application UI (checkout flow)
4. ✅ Verify email delivery across multiple clients
5. ✅ Check email authentication (SPF, DKIM, DMARC)
6. ✅ Monitor delivery in Resend dashboard
7. ✅ Complete production testing checklist

**All email tests should pass before production launch!**
>>>>>>> d520fc30438a01daeac4e67708effef2a75a7d09




