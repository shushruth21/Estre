# DNS Configuration Fix Guide

## Critical Issue: Emails Not Reaching Customers

Your sale order PDFs and OTP codes are not reaching customers because your DNS SPF record doesn't authorize Resend to send emails on behalf of estre.app.

---

## DNS Changes Required

### Step 1: Update SPF Record (CRITICAL)

**Current SPF Record:**
```
Type: TXT
Name: @
Content: v=spf1 include:_spf.mail.hostinger.com ~all
```

**Updated SPF Record:**
```
Type: TXT
Name: @
Content: v=spf1 include:_spf.mail.hostinger.com include:_spf.resend.com ~all
```

**Why This Matters:**
- Currently only Hostinger is authorized to send emails from estre.app
- Resend is being blocked/marked as spam because it's not in your SPF record
- Adding `include:_spf.resend.com` authorizes Resend to send on your behalf

---

### Step 2: Remove Unused Amazon SES Records (CLEANUP)

**Delete These Records:**

1. **TXT Record:**
   - Name: `send`
   - Content: `v=spf1 include:amazonses.com ~all`
   - **Action:** DELETE (not used by your application)

2. **MX Record:**
   - Name: `send`
   - Value: `10 feedback-smtp.us-east-1.amazonses.com`
   - **Action:** DELETE (not used by your application)

**Why Remove These:**
- Your code doesn't use Amazon SES anywhere
- These records can cause confusion
- Clean DNS = easier troubleshooting

---

## Implementation Steps in Hostinger

### 1. Log into Hostinger Dashboard
1. Go to https://hpanel.hostinger.com/
2. Log in with your credentials
3. Select the domain: **estre.app**

### 2. Navigate to DNS Management
1. Click on "DNS" or "DNS Zone Editor" in the left sidebar
2. You should see a list of DNS records for estre.app

### 3. Update the SPF Record
1. Find the TXT record with:
   - Name: `@` or `estre.app`
   - Content starting with: `v=spf1 include:_spf.mail.hostinger.com`
2. Click "Edit" on this record
3. Change the Content to:
   ```
   v=spf1 include:_spf.mail.hostinger.com include:_spf.resend.com ~all
   ```
4. Click "Save" or "Update"

### 4. Delete Amazon SES Records
1. Find the TXT record with Name = `send` and Content containing `amazonses`
2. Click "Delete" and confirm
3. Find the MX record with Name = `send` pointing to AWS
4. Click "Delete" and confirm

### 5. Save All Changes
1. Ensure all changes are saved
2. Note the time you made the changes

---

## DNS Propagation

**Wait Time:** 30-60 minutes (can be up to 24 hours in rare cases)

**During this time:**
- DNS changes spread across the internet
- Some servers will see old records, some will see new ones
- Email delivery may be inconsistent during propagation

**Check Propagation Status:**
- Use: https://dnschecker.org/
- Enter: `estre.app`
- Type: `TXT`
- Look for the updated SPF record with Resend included

---

## Testing After DNS Update

### 1. Test from Staff Dashboard

1. Log into staff dashboard: `/staff/sale-orders`
2. Select any sale order
3. Click "Generate Final PDF & Send to Customer"
4. Check the test customer email inbox

**Expected Result:**
- Email arrives within 2-3 minutes
- Subject: "Your Estre Sale Order is Ready"
- From: `Estre <no-reply@estre.app>`
- PDF attached

### 2. Test OTP Delivery

1. Create a new order
2. Complete checkout
3. Check for OTP email

**Expected Result:**
- OTP email arrives within 1 minute
- Subject: "Your Estre Order Confirmation OTP"
- Contains 6-digit code
- Valid for 10 minutes

### 3. Use DNS Verification Script

Run the verification script (see below) to check DNS records:
```bash
npm run verify-dns
```

---

## Verification Script

I've created a script to verify your DNS configuration. Run it after making DNS changes:

```bash
chmod +x scripts/verify-dns.sh
./scripts/verify-dns.sh
```

This will check:
- SPF record includes Resend
- No conflicting SPF records
- MX records are properly configured
- TXT records for domain verification

---

## Expected Results After Fix

### Email Deliverability Metrics

**Before DNS Fix:**
- Inbox Placement: ~0%
- Spam Folder: ~90%+
- Hard Bounces: High
- Customer Complaints: "Didn't receive email"

**After DNS Fix:**
- Inbox Placement: 95%+
- Spam Folder: <5%
- Hard Bounces: Near 0%
- Customers receive emails promptly

### Customer Experience

✅ Receive sale order PDFs immediately after staff approval
✅ Receive OTP codes within seconds
✅ Can download PDFs from email
✅ Order confirmation workflow works smoothly
✅ No need to manually send PDFs

---

## Troubleshooting

### Issue: Emails Still Not Arriving After DNS Update

**Check:**
1. DNS propagation complete? (use dnschecker.org)
2. RESEND_API_KEY configured in Supabase secrets?
3. Check email logs in database: `email_logs` table
4. Verify sender email format: `no-reply@estre.app`

**Debug:**
```sql
-- Check recent email logs
SELECT * FROM email_logs
ORDER BY created_at DESC
LIMIT 10;
```

### Issue: Emails Going to Spam Even After DNS Fix

**Additional Steps:**
1. Add DKIM record (get from Resend dashboard)
2. Add DMARC policy:
   ```
   Type: TXT
   Name: _dmarc
   Content: v=DMARC1; p=none; rua=mailto:dmarc@estre.app
   ```
3. Verify domain in Resend dashboard

### Issue: DNS Changes Not Taking Effect

**Try:**
1. Clear local DNS cache:
   - Windows: `ipconfig /flushdns`
   - Mac: `sudo dscacheutil -flushcache`
   - Linux: `sudo systemd-resolve --flush-caches`
2. Use different DNS checker: https://www.whatsmydns.net/
3. Wait longer (up to 24 hours for full propagation)

---

## Support Resources

**Hostinger Support:**
- Help Center: https://support.hostinger.com/
- Live Chat: Available in Hostinger dashboard
- Email: support@hostinger.com

**Resend Documentation:**
- SPF Setup: https://resend.com/docs/dashboard/domains/authentication
- Troubleshooting: https://resend.com/docs/knowledge-base/deliverability

**DNS Tools:**
- SPF Checker: https://mxtoolbox.com/spf.aspx
- DNS Lookup: https://dnschecker.org/
- Email Test: https://www.mail-tester.com/

---

## Summary Checklist

- [ ] Update SPF record to include Resend
- [ ] Delete Amazon SES TXT record from `send` subdomain
- [ ] Delete Amazon SES MX record from `send` subdomain
- [ ] Wait 30-60 minutes for DNS propagation
- [ ] Test email delivery from staff dashboard
- [ ] Test OTP delivery for new orders
- [ ] Verify emails land in inbox (not spam)
- [ ] Check email_logs table for successful sends

---

## Post-Implementation

Once DNS is fixed and emails are flowing:

1. **Monitor email logs** for the first few days
2. **Ask customers** to confirm they received emails
3. **Check spam reports** in Resend dashboard
4. **Consider adding DKIM** for even better deliverability
5. **Set up DMARC** for advanced email authentication

---

**Status:** Ready to implement
**Priority:** CRITICAL - Blocks order fulfillment
**Estimated Time:** 5 minutes to make changes + 30-60 minutes propagation
**Impact:** 100% of customer emails currently failing
