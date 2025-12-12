# Resend Email Setup Guide for Estre

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








