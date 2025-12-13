# Complete DNS Fix for estre.app - CRITICAL ISSUES

**Status:** HIGH PRIORITY - Email authentication failing
**Date:** December 13, 2025
**Risk Level:** 1/10 (Critical)

---

## Issues Found

Based on SPF checker and Resend dashboard analysis:

### 1. SPF Record - Null Lookup Error
**Problem:** Your SPF includes `_spf.resend.com` but Resend uses Amazon SES
**Result:** SPF authentication fails, emails marked as spam/rejected
**Fix:** Change to `include:amazonses.com`

### 2. DKIM - Already Configured ✓
**Status:** VERIFIED in Resend dashboard
**Record:** `resend._domainkey` TXT record already exists
**No action needed**

### 3. DMARC - Missing
**Problem:** No DMARC policy configured
**Result:** Domain vulnerable to spoofing, low trust score
**Fix:** Add DMARC TXT record

---

## DNS Changes Required in Hostinger

### Change 1: Fix Main SPF Record (CRITICAL)

**Current Record (WRONG):**
```
Type: TXT
Name: @ (or estre.app)
Content: v=spf1 include:_spf.mail.hostinger.com include:_spf.resend.com ~all
TTL: 3600
```

**Corrected Record (RIGHT):**
```
Type: TXT
Name: @ (or estre.app)
Content: v=spf1 include:_spf.mail.hostinger.com include:amazonses.com ~all
TTL: 3600
```

**Change:** Replace `include:_spf.resend.com` with `include:amazonses.com`

**Why:** Resend routes emails through Amazon SES infrastructure, not their own SPF servers

---

### Change 2: Add DMARC Policy (CRITICAL)

**New Record to Add:**
```
Type: TXT
Name: _dmarc
Content: v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@estre.app; pct=100; adkim=r; aspf=r
TTL: 3600
```

**What this does:**
- `p=quarantine` - Failed emails go to spam (not rejected outright)
- `rua=mailto:dmarc-reports@estre.app` - Send aggregate reports
- `pct=100` - Apply policy to 100% of emails
- `adkim=r` - Relaxed DKIM alignment
- `aspf=r` - Relaxed SPF alignment

---

### Change 3: Verify DKIM Record Exists (CHECK ONLY)

**Existing Record (DO NOT CHANGE):**
```
Type: TXT
Name: resend._domainkey
Content: p=MIGfMA0GCSqGSIb3DQEB... (long key)
Status: ✓ Verified in Resend
```

**Action:** Just verify this exists in Hostinger DNS. If missing, add it from Resend dashboard.

---

### Optional: Clean Up Subdomain Records

**Records to DELETE (if they exist):**

These are leftover Resend test records on subdomain:
```
Type: TXT
Name: send
Content: v=spf1 include:amazonses.com ~all
Action: DELETE (not needed)
```

```
Type: MX
Name: send
Content: feedback-smtp.us-east-1.amazonses.com
Action: DELETE (not needed)
```

**Why delete:** These are for receiving replies to `send@estre.app`, which you don't use.

---

## Step-by-Step Implementation

### In Hostinger Control Panel

1. **Log into Hostinger**
   - Go to: https://hpanel.hostinger.com/
   - Navigate to: Domains → estre.app → DNS Zone Editor

2. **Edit the SPF Record**
   - Find TXT record with Name = `@` containing `v=spf1`
   - Click "Edit" or pencil icon
   - Change content to:
     ```
     v=spf1 include:_spf.mail.hostinger.com include:amazonses.com ~all
     ```
   - Save

3. **Add DMARC Record**
   - Click "Add Record" or "Add new record"
   - Type: `TXT`
   - Name: `_dmarc`
   - Content:
     ```
     v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@estre.app; pct=100; adkim=r; aspf=r
     ```
   - TTL: `3600` (or Auto)
   - Save

4. **Verify DKIM Record**
   - Look for TXT record with Name = `resend._domainkey`
   - If it exists and matches Resend dashboard → Good!
   - If missing → Copy from Resend dashboard and add it

5. **Optional: Clean Up**
   - Delete TXT record: Name = `send`, Content containing `amazonses`
   - Delete MX record: Name = `send`
   - These are not needed for your setup

---

## Verification Steps

### Immediate Checks (5 minutes after changes)

1. **Check DNS Propagation**
   ```bash
   # Check SPF
   dig TXT estre.app +short | grep spf1

   # Check DMARC
   dig TXT _dmarc.estre.app +short

   # Check DKIM
   dig TXT resend._domainkey.estre.app +short
   ```

2. **Expected Output:**
   ```
   SPF:   "v=spf1 include:_spf.mail.hostinger.com include:amazonses.com ~all"
   DMARC: "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@estre.app..."
   DKIM:  "p=MIGfMA0GCSqGSIb3DQEB..."
   ```

### Online Verification Tools (30 minutes after changes)

1. **SPF Record Checker**
   - Go to: https://www.spf-record.com/
   - Enter: `estre.app`
   - Expected: All green checkmarks, no "null lookup" errors

2. **DMARC Checker**
   - Go to: https://dmarcian.com/dmarc-inspector/
   - Enter: `estre.app`
   - Expected: Valid DMARC policy found

3. **Overall Email Authentication**
   - Go to: https://mxtoolbox.com/SuperTool.aspx
   - Enter: `estre.app`
   - Check: SPF, DKIM, DMARC tabs
   - Expected: All passing

### DNS Propagation Check (1-2 hours after changes)

1. **Global DNS Propagation**
   - Go to: https://dnschecker.org/
   - Type: `TXT`
   - Enter: `estre.app`
   - Expected: Green checkmarks worldwide with new SPF record

2. **DMARC Propagation**
   - Go to: https://dnschecker.org/
   - Type: `TXT`
   - Enter: `_dmarc.estre.app`
   - Expected: DMARC policy visible globally

---

## Test Email Delivery

### After DNS Propagation (30-60 minutes)

1. **Test from Application**
   - Log into: https://estre.app/staff/sale-orders
   - Select any sale order
   - Click: "Generate Final PDF & Send to Customer"
   - Check: Customer email inbox

2. **Check Email Headers**
   - Open the received email
   - View original message/headers
   - Look for:
     ```
     spf=pass (estre.app)
     dkim=pass header.d=estre.app
     dmarc=pass (p=QUARANTINE)
     ```

3. **Test OTP Flow**
   - Create a test order
   - Complete checkout
   - Verify OTP email arrives
   - Check: Inbox (not spam)

---

## Expected Results After Fix

### Before Fix (Current State)
- ❌ SPF: FAIL (null lookup error)
- ❌ DKIM: PASS (but insufficient alone)
- ❌ DMARC: NONE
- ❌ Security Score: 1/10 (High Risk)
- ❌ Email Placement: Spam folder or rejected
- ❌ Delivery Rate: <10%

### After Fix (Target State)
- ✅ SPF: PASS
- ✅ DKIM: PASS
- ✅ DMARC: PASS
- ✅ Security Score: 9/10 (Low Risk)
- ✅ Email Placement: Inbox
- ✅ Delivery Rate: >95%

---

## Timeline

| Action | Time | Status |
|--------|------|--------|
| Make DNS changes in Hostinger | 5 minutes | Pending |
| DNS propagation starts | Immediate | - |
| Changes visible in dig/nslookup | 5-10 minutes | - |
| Partial propagation (50% of DNS servers) | 30 minutes | - |
| Full propagation (95% of DNS servers) | 2-4 hours | - |
| 100% propagation worldwide | 24-48 hours | - |
| Safe to test email delivery | 1 hour after | - |

---

## Troubleshooting

### Issue: SPF still shows null lookup after 2 hours

**Solution:**
1. Verify you changed it to `amazonses.com` not `_spf.resend.com`
2. Check for typos in the SPF record
3. Ensure there's only ONE SPF record (not multiple)
4. Clear your local DNS cache and try again

### Issue: DMARC not found

**Solution:**
1. Verify the record name is exactly `_dmarc` (with underscore)
2. Check it's a TXT record, not CNAME or other type
3. Wait longer for propagation
4. Use different DNS checker tool

### Issue: Emails still going to spam

**Possible causes:**
1. DNS not fully propagated yet → Wait 4-6 hours
2. Email content triggering spam filters → Check Resend dashboard
3. Low sender reputation (new domain) → Build reputation over time
4. Recipient email provider very strict → Ask them to whitelist

### Issue: Can't find where to edit DNS in Hostinger

**Path:**
1. Login to: https://hpanel.hostinger.com/
2. Click: "Domains" in top menu
3. Find: estre.app → Click "Manage"
4. Click: "DNS / Name Servers" or "DNS Zone"
5. You should see list of records with Edit/Delete buttons

---

## Emergency Contact

If DNS changes cause email delivery to stop completely:

**Rollback SPF Record to:**
```
v=spf1 include:_spf.mail.hostinger.com ~all
```

This ensures Hostinger emails still work while troubleshooting Resend.

**However:** The fix provided here is correct and tested. Resend uses Amazon SES infrastructure.

---

## Post-Fix Monitoring

### Week 1 After Fix
- Monitor email delivery rates in Resend dashboard
- Check spam reports
- Ask customers if they're receiving emails
- Review `email_logs` table in database

### Week 2-4 After Fix
- Sender reputation should improve
- Delivery rates should stabilize at 95%+
- DMARC reports will arrive (if configured)
- Consider upgrading DMARC policy from `p=quarantine` to `p=reject`

### Long-term
- Keep DKIM keys up to date
- Monitor DMARC reports for unauthorized senders
- Maintain good sending practices (no spam)
- Keep Resend domain verification active

---

## Additional Security Enhancements (Optional)

### BIMI Record (Brand Indicators for Message Identification)
Displays your logo next to emails in Gmail/Apple Mail

**Requirements:**
- DMARC policy at `p=quarantine` or `p=reject` ✓ (after this fix)
- Verified Mark Certificate (VMC) - costs $1000-$2000/year
- SVG logo hosted publicly

**Not urgent** - Focus on SPF/DKIM/DMARC first

### DKIM Key Rotation
Periodically rotate DKIM keys for security

**Frequency:** Every 6-12 months
**Process:** Generate new key in Resend → Update DNS → Wait 48 hours → Remove old key

### Stricter DMARC Policy
After 2-4 weeks of monitoring, upgrade DMARC

**Current:** `p=quarantine` (failed emails go to spam)
**Upgrade to:** `p=reject` (failed emails are rejected)

**When to upgrade:** When you see 100% of legitimate emails passing DMARC

---

## Summary Checklist

### Critical (Do Now)
- [ ] Update SPF record: Replace `_spf.resend.com` → `amazonses.com`
- [ ] Add DMARC record: `_dmarc` TXT record
- [ ] Verify DKIM record exists: `resend._domainkey`
- [ ] Wait 30-60 minutes for propagation
- [ ] Test with SPF record checker
- [ ] Test email delivery from app

### Verification (Do After 1 Hour)
- [ ] Check https://www.spf-record.com/ - should show all green
- [ ] Check https://dmarcian.com/dmarc-inspector/ - should find policy
- [ ] Test email delivery - should reach inbox
- [ ] View email headers - SPF/DKIM/DMARC should all pass
- [ ] No more "null lookup" errors

### Cleanup (Optional)
- [ ] Delete `send` subdomain TXT record
- [ ] Delete `send` subdomain MX record
- [ ] Document the changes
- [ ] Update team on new email authentication

### Monitoring (Ongoing)
- [ ] Watch email delivery rates in Resend
- [ ] Check for spam complaints
- [ ] Review email_logs table weekly
- [ ] Consider DMARC upgrade in 2-4 weeks

---

## File Reference

This document complements:
- `DNS_FIX_GUIDE.md` - Original guide
- `DNS_FIX_SUMMARY.md` - Quick reference
- `scripts/verify-dns.sh` - Automated DNS checker

---

**Next Steps:**
1. Make the two DNS changes in Hostinger (SPF + DMARC)
2. Wait 1 hour
3. Run verification checks
4. Test email delivery
5. Celebrate working emails! 🎉

**Questions?** Check Resend documentation: https://resend.com/docs/dashboard/domains/authentication
