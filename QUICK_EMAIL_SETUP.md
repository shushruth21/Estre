# Quick Email Setup - 5 Steps to Send Emails

Follow these 5 steps to start sending PDFs from **no-reply@estre.app**

---

## Step 1: Create Resend Account (5 minutes)

1. Go to [resend.com](https://resend.com)
2. Sign up (free account)
3. Verify your email

---

## Step 2: Add Domain to Resend (10 minutes)

1. In Resend dashboard → **Domains** → **Add Domain**
2. Enter: `estre.app`
3. Copy the DNS records provided
4. Add these to your domain registrar (GoDaddy, Namecheap, etc.):

**DNS Records to Add:**
```
TXT  @  resend-domain-verify=xxxxx
MX   @  mx.resend.com (Priority: 10)
TXT  @  v=spf1 include:_spf.resend.com ~all
TXT  resend._domainkey  p=MIGfMA0GCS... (long key)
```

**Note**: Wait 24-48 hours for DNS verification

---

## Step 3: Get Resend API Key (2 minutes)

1. In Resend dashboard → **API Keys**
2. Click **Create API Key**
3. Name: `Estre Production`
4. Copy the key (starts with `re_`)

Example: `re_123456789abcdefghijklmnop`

---

## Step 4: Add API Key to Supabase (3 minutes)

**Option A: Via Supabase Dashboard**
1. Go to your Supabase project
2. **Project Settings** → **Edge Functions** → **Secrets**
3. Add secret:
   - Name: `RESEND_API_KEY`
   - Value: Your API key from Step 3
4. Click **Save**

**Option B: Via Supabase CLI**
```bash
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

---

## Step 5: Deploy Edge Function (5 minutes)

```bash
# Navigate to project
cd /path/to/estre-project

# Deploy the new email function
supabase functions deploy send-email-with-pdf

# Redeploy updated functions
supabase functions deploy generate-sale-order-pdf

# Verify deployment
supabase functions list
```

---

## Test It!

### Test via Supabase Dashboard

1. Go to **Edge Functions** → `send-email-with-pdf`
2. Click **Invoke**
3. Use this payload (replace with your email):

```json
{
  "type": "otp",
  "to": "your-email@example.com",
  "customerName": "Test User",
  "otp": "123456"
}
```

4. Check your inbox

### Test Sale Order Email

```json
{
  "type": "sale_order",
  "to": "your-email@example.com",
  "customerName": "John Doe",
  "orderNumber": "SO-12345",
  "pdfUrl": "https://example.com/test.pdf",
  "otp": "654321"
}
```

---

## Verify Email Sent from no-reply@estre.app

Check your test email:
- ✅ Sender shows: **Estre <no-reply@estre.app>**
- ✅ Email has professional template
- ✅ OTP is displayed (if sent)
- ✅ PDF attachment (if included)
- ✅ Not in spam folder

---

## Usage in Your Application

### Send Email from Frontend

```typescript
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email-with-pdf`,
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "sale_order",
      to: customerEmail,
      customerName: customerName,
      orderNumber: orderNumber,
      pdfBase64: pdfBase64Content,
      pdfFileName: "sale-order.pdf",
      otp: otpCode,
    }),
  }
);

const result = await response.json();
console.log("Email sent:", result);
```

---

## Common Issues

### Domain Not Verified
- **Wait**: DNS can take 24-48 hours
- **Check**: Use `dig TXT estre.app` to verify records
- **Contact**: Resend support if stuck

### Email Not Sending
- **Check**: API key is correct in Supabase secrets
- **Verify**: Edge function deployed successfully
- **Test**: API key with curl (see full guide)

### Emails Going to Spam
- **Wait**: Domain needs to be fully verified
- **Check**: All DNS records (SPF, DKIM, MX)
- **Improve**: Email content (avoid spam words)

---

## What's Configured

✅ **Sender**: no-reply@estre.app
✅ **Service**: Resend API
✅ **Function**: send-email-with-pdf
✅ **Templates**: Professional HTML designs
✅ **PDFs**: Attachment support
✅ **OTPs**: Styled display

---

## Files Modified

**Created:**
- `supabase/functions/send-email-with-pdf/index.ts` (new email function)
- `docs/EMAIL_SETUP_GUIDE.md` (detailed guide)
- `EMAIL_IMPLEMENTATION_SUMMARY.md` (technical summary)

**Updated:**
- `supabase/functions/generate-sale-order-pdf/index.ts` (sender email)
- `src/lib/email.ts` (sender email)

---

## Next: Automatic Email Sending

Your application will automatically send emails when:
1. Customer places order → Sale order email with PDF
2. Staff generates sale order → Email with OTP
3. Order confirmed → Confirmation email
4. Job card created → Notification email

All emails will come from **no-reply@estre.app**

---

## Support

- **Detailed Guide**: See `docs/EMAIL_SETUP_GUIDE.md`
- **Resend Help**: support@resend.com
- **Supabase Help**: support@supabase.com

---

## Summary

🎉 **Your email system is ready!**

Just complete Steps 1-5 above, and you'll be sending professional emails from no-reply@estre.app with PDF attachments, OTPs, and beautiful templates.

**Time Required**: ~25 minutes (plus 24-48h for domain verification)
