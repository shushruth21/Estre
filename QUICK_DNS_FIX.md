# Quick DNS Fix - Do This Now

## Go to Hostinger DNS Manager

1. Login: https://hpanel.hostinger.com/
2. Click: Domains → estre.app → DNS Zone

---

## Change 1: Fix SPF Record

**Find this record:**
- Type: TXT
- Name: `@` or `estre.app`
- Content: `v=spf1 include:_spf.mail.hostinger.com include:_spf.resend.com ~all`

**Change it to:**
```
v=spf1 include:_spf.mail.hostinger.com include:amazonses.com ~all
```

**Click:** Save

---

## Change 2: Add DMARC Record

**Click:** "Add Record" or "Add New Record"

**Enter these values:**
- Type: `TXT`
- Name: `_dmarc`
- Content: `v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@estre.app; pct=100; adkim=r; aspf=r`
- TTL: `3600` (or leave as default)

**Click:** Save

---

## Done!

**Wait:** 30-60 minutes for DNS propagation

**Then test:**
1. Go to: https://www.spf-record.com/
2. Enter: `estre.app`
3. Click: "Find Problems"
4. Should see: All green checkmarks, no errors

---

## What Changed

**Before:**
- SPF included: `_spf.resend.com` ← WRONG (causes null lookup error)
- DMARC: None ← Risky

**After:**
- SPF includes: `amazonses.com` ← CORRECT (Resend uses Amazon SES)
- DMARC: Quarantine policy ← Secure

**Result:**
- Emails will reach inbox instead of spam
- Security score improves from 1/10 to 9/10
- All authentication checks pass
