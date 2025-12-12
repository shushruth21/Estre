# Quick Start: Email Setup (30 Minutes)

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








