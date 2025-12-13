# Visual DNS Fix Guide

## What You'll See in Hostinger DNS Manager

---

## Current State (BEFORE Changes)

```
┌─────────────────────────────────────────────────────────────┐
│ DNS Records for estre.app                                    │
├──────┬───────────────┬──────────────────────────────────────┤
│ Type │ Name          │ Content                              │
├──────┼───────────────┼──────────────────────────────────────┤
│ TXT  │ @             │ v=spf1                               │
│      │               │ include:_spf.mail.hostinger.com      │
│      │               │ include:_spf.resend.com ~all         │ ← WRONG!
│      │               │                                      │
├──────┼───────────────┼──────────────────────────────────────┤
│ TXT  │ resend.       │ p=MIGfMA0GCSqGSIb3DQEB...          │
│      │ _domainkey    │                                      │ ← Good!
│      │               │                                      │
└──────┴───────────────┴──────────────────────────────────────┘

Missing: _dmarc record
```

---

## Target State (AFTER Changes)

```
┌─────────────────────────────────────────────────────────────┐
│ DNS Records for estre.app                                    │
├──────┬───────────────┬──────────────────────────────────────┤
│ Type │ Name          │ Content                              │
├──────┼───────────────┼──────────────────────────────────────┤
│ TXT  │ @             │ v=spf1                               │
│      │               │ include:_spf.mail.hostinger.com      │
│      │               │ include:amazonses.com ~all           │ ← FIXED!
│      │               │                                      │
├──────┼───────────────┼──────────────────────────────────────┤
│ TXT  │ _dmarc        │ v=DMARC1; p=quarantine;             │ ← NEW!
│      │               │ rua=mailto:dmarc-reports@estre.app; │
│      │               │ pct=100; adkim=r; aspf=r            │
│      │               │                                      │
├──────┼───────────────┼──────────────────────────────────────┤
│ TXT  │ resend.       │ p=MIGfMA0GCSqGSIb3DQEB...          │
│      │ _domainkey    │                                      │ ← Keep!
│      │               │                                      │
└──────┴───────────────┴──────────────────────────────────────┘
```

---

## Step-by-Step Visual Instructions

### Step 1: Find the SPF Record

Look for a record that looks like this:

```
[TXT] [@] [v=spf1 include:_spf.mail.hostinger.com include:_spf.resend.com ~all]
       ↑                                             ↑
    This is                                    This is WRONG
    the Name
```

Click the **Edit** or **✏️** button next to this record.

---

### Step 2: Edit the SPF Content

**OLD VALUE (delete this part):**
```
include:_spf.resend.com
```

**NEW VALUE (replace with this):**
```
include:amazonses.com
```

**Full corrected SPF record:**
```
v=spf1 include:_spf.mail.hostinger.com include:amazonses.com ~all
```

**Click:** Save / Update

---

### Step 3: Add DMARC Record

Click: **"Add Record"** or **"+ Add New Record"** button

**Fill in the form:**

```
┌─────────────────────────────────────────┐
│ Add DNS Record                          │
├─────────────────────────────────────────┤
│ Type:    [TXT ▼]                        │
│                                         │
│ Name:    [_dmarc          ]             │
│                                         │
│ Content: [v=DMARC1; p=quarantine;      ]│
│          [rua=mailto:dmarc-reports@    ]│
│          [estre.app; pct=100;          ]│
│          [adkim=r; aspf=r              ]│
│                                         │
│ TTL:     [3600 ▼]                       │
│                                         │
│          [Cancel]  [Save Record]        │
└─────────────────────────────────────────┘
```

**Click:** Save Record / Add

---

## Verification After Changes

### Check 1: Look at Your DNS Records

Your DNS records should now show:

```
✓ TXT  @                v=spf1 include:_spf.mail.hostinger.com include:amazonses.com ~all
✓ TXT  _dmarc           v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@estre.app...
✓ TXT  resend._domainkey  p=MIGfMA0GCSqGSIb3DQEB...
```

---

### Check 2: Test with Online Tool

**Go to:** https://www.spf-record.com/

**Enter:** `estre.app`

**Before fix (what you saw in screenshot):**
```
❌ SPF Record Null Value
   A null DNS lookup was found for include (_spf.resend.com)

❌ DMARC Policy Not Enabled
   It is recommended to use a quarantine or reject policy

⚠️  Risk Assessment Level: High
   Score: 1 of 10
```

**After fix (what you should see):**
```
✅ SPF Record Published
   SPF Record found

✅ SPF Record Valid
   The record is valid

✅ No Null Lookups
   All includes resolve properly

✅ DMARC Policy Published
   DMARC Record found with quarantine policy

✅ DKIM Verified
   DKIM signature valid

✅ Risk Assessment Level: Low
   Score: 9 of 10
```

---

## Common Issues

### Issue: Can't find the @ record

**Try looking for:**
- Record with Name = `estre.app` (instead of `@`)
- Record with Name = (blank or empty)
- Record with Type = `TXT` and Content starting with `v=spf1`

### Issue: Multiple SPF records exist

**Fix:**
- There should be ONLY ONE SPF record
- If you see multiple records with `v=spf1`, combine them into one
- Delete the duplicates
- One SPF record can have multiple `include:` statements

### Issue: Can't type in the Name field for DMARC

**Try:**
- Some DNS managers auto-add `.estre.app`
- If you type `_dmarc`, it becomes `_dmarc.estre.app` automatically ✓
- Don't type the full `_dmarc.estre.app`, just `_dmarc`

### Issue: "Record already exists" error

**This means:**
- You already have a DMARC record
- Find it and edit it instead of adding new one
- Or delete the old one and add the new one

---

## Copy-Paste Values

### SPF Record Content (Copy This)
```
v=spf1 include:_spf.mail.hostinger.com include:amazonses.com ~all
```

### DMARC Record Name (Copy This)
```
_dmarc
```

### DMARC Record Content (Copy This)
```
v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@estre.app; pct=100; adkim=r; aspf=r
```

---

## Timeline Visual

```
NOW
 │
 ├─ Make DNS changes (5 min)
 │
 ├─ Changes saved to Hostinger (instant)
 │
 ├─ DNS starts propagating (0-5 min)
 │
 ├─ Visible in dig/nslookup (5-15 min)
 │
 ├─ 50% of internet sees changes (30 min) ← Safe to test now
 │
 ├─ 95% of internet sees changes (2-4 hours)
 │
 └─ 100% worldwide propagation (24-48 hours)
```

**When to test:** 30 minutes after making changes

---

## Success Indicators

### You'll know it's working when:

1. **SPF Checker shows green checkmarks**
   - No "null lookup" errors
   - All includes resolve
   - Record is valid

2. **DMARC Inspector finds your policy**
   - Shows `p=quarantine`
   - No errors or warnings

3. **Test email reaches inbox**
   - Not in spam folder
   - Headers show: `spf=pass dkim=pass dmarc=pass`

4. **Security score improves**
   - From 1/10 → 9/10
   - Risk level: High → Low

---

## Final Checklist

```
[ ] Opened Hostinger DNS Manager
[ ] Found TXT record with Name = @
[ ] Edited SPF record content
[ ] Changed _spf.resend.com → amazonses.com
[ ] Saved SPF record changes
[ ] Clicked "Add Record" button
[ ] Added new TXT record named _dmarc
[ ] Pasted DMARC policy content
[ ] Saved DMARC record
[ ] Waited 30 minutes
[ ] Tested at spf-record.com
[ ] All checks passing ✓
[ ] Tested email delivery from app
[ ] Emails reaching inbox ✓
```

---

## Need Help?

**Hostinger Support:**
- Live Chat: Available in hpanel (bottom right)
- Tickets: https://support.hostinger.com/

**Show them this:**
> "I need to update my SPF record to use amazonses.com instead of _spf.resend.com, and add a DMARC record for email authentication. Can you help me locate and edit these DNS records?"

**They'll understand immediately** - this is a common request.
