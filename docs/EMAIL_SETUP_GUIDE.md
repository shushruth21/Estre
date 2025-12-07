# Email Setup Guide - Estre Application

This guide explains how to set up email functionality for sending PDFs and notifications from **no-reply@estre.app**.

---

## Overview

The application uses **Resend** as the email service provider to send:
- Sale Order PDFs
- Job Card PDFs
- OTP verification codes
- Order confirmations
- Custom notifications

**Sender Email**: `no-reply@estre.app`

---

## Prerequisites

1. **Domain Ownership**: You must own the domain `estre.app`
2. **Resend Account**: Create a free account at [resend.com](https://resend.com)
3. **Supabase Project**: Your Supabase project with Edge Functions enabled

---

## Step 1: Set Up Resend Account

### 1.1 Create Resend Account
1. Go to [resend.com](https://resend.com)
2. Sign up with your email
3. Verify your email address

### 1.2 Add Your Domain
1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain: `estre.app`
4. Resend will provide DNS records to add

### 1.3 Configure DNS Records
Add these DNS records to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):

**Example DNS Records from Resend:**
```
Type: TXT
Name: @ (or estre.app)
Value: resend-domain-verify=xxxxxxxxxxxxx
TTL: 3600

Type: MX
Name: @ (or estre.app)
Value: mx.resend.com
Priority: 10
TTL: 3600

Type: TXT
Name: @ (or estre.app)
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600

Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4... (long key)
TTL: 3600
```

**Important:** Wait 24-48 hours for DNS propagation. Resend will verify automatically.

### 1.4 Get API Key
1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Name it: `Estre Production`
4. Select permissions: **Full Access** or **Sending Access**
5. Copy the API key (starts with `re_`)

**Example API Key:** `re_123456789abcdefghijklmnop`

---

## Step 2: Configure Supabase

### 2.1 Add Resend API Key to Supabase Secrets

**Via Supabase Dashboard:**
1. Go to your Supabase project
2. Navigate to **Project Settings** → **Edge Functions**
3. Scroll to **Secrets**
4. Add new secret:
   - **Name**: `RESEND_API_KEY`
   - **Value**: Your Resend API key (e.g., `re_123456789...`)
5. Click **Save**

**Via Supabase CLI:**
```bash
supabase secrets set RESEND_API_KEY=re_123456789abcdefghijklmnop
```

### 2.2 Deploy the Email Edge Function

Deploy the new dedicated email function:

```bash
# Navigate to project directory
cd /path/to/project

# Deploy the send-email-with-pdf function
supabase functions deploy send-email-with-pdf

# Verify deployment
supabase functions list
```

### 2.3 Update Existing Functions

The following functions have been updated to use `no-reply@estre.app`:
- `generate-sale-order-pdf`
- `generate-job-card-pdf`

Redeploy them:

```bash
supabase functions deploy generate-sale-order-pdf
supabase functions deploy generate-job-card-pdf
```

---

## Step 3: Test Email Sending

### 3.1 Test via Supabase Functions UI

1. Go to **Edge Functions** in Supabase dashboard
2. Select `send-email-with-pdf`
3. Click **Invoke Function**
4. Use this test payload:

```json
{
  "type": "otp",
  "to": "your-email@example.com",
  "customerName": "Test Customer",
  "otp": "123456"
}
```

5. Check your inbox for the test email

### 3.2 Test Sale Order Email

```json
{
  "type": "sale_order",
  "to": "customer@example.com",
  "customerName": "John Doe",
  "orderNumber": "SO-12345",
  "pdfUrl": "https://your-pdf-url.com/sale-order.pdf",
  "otp": "654321"
}
```

### 3.3 Test from Application

1. Place a test order in your application
2. Check that the email is sent from `no-reply@estre.app`
3. Verify PDF attachment is received
4. Check OTP delivery

---

## Step 4: Usage in Application

### 4.1 From Frontend (React)

Send sale order email:

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
      pdfUrl: pdfUrl,
      pdfBase64: pdfBase64, // Optional: include PDF as attachment
      pdfFileName: `sale-order-${orderNumber}.pdf`,
      otp: otpCode,
    }),
  }
);

const result = await response.json();
console.log("Email sent:", result);
```

### 4.2 From Edge Functions

Call from another Edge Function:

```typescript
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const emailResponse = await fetch(
  `${supabaseUrl}/functions/v1/send-email-with-pdf`,
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "sale_order",
      to: "customer@example.com",
      customerName: "John Doe",
      orderNumber: "SO-12345",
      pdfBase64: base64PdfContent,
      pdfFileName: "sale-order.pdf",
    }),
  }
);
```

### 4.3 Email Types Supported

**1. Sale Order Email**
```json
{
  "type": "sale_order",
  "to": "customer@example.com",
  "customerName": "John Doe",
  "orderNumber": "SO-12345",
  "pdfUrl": "https://...",
  "pdfBase64": "base64-content",
  "otp": "123456"
}
```

**2. OTP Email**
```json
{
  "type": "otp",
  "to": "customer@example.com",
  "customerName": "John Doe",
  "otp": "123456"
}
```

**3. Job Card Email**
```json
{
  "type": "job_card",
  "to": "customer@example.com",
  "customerName": "John Doe",
  "orderNumber": "JC-12345",
  "pdfBase64": "base64-content",
  "pdfFileName": "job-card.pdf"
}
```

**4. Custom Email**
```json
{
  "type": "custom",
  "to": "customer@example.com",
  "customerName": "John Doe",
  "subject": "Custom Subject",
  "htmlContent": "<h1>Custom HTML</h1>",
  "pdfBase64": "optional-pdf-content"
}
```

---

## Step 5: Monitor Email Delivery

### 5.1 Resend Dashboard
1. Go to [resend.com](https://resend.com) dashboard
2. Navigate to **Emails**
3. See all sent emails with status:
   - ✅ Delivered
   - ⏳ Pending
   - ❌ Failed
4. Click any email to see details:
   - Delivery status
   - Open rate
   - Click rate
   - Bounce/complaint info

### 5.2 Supabase Logs
1. Go to **Edge Functions** → **Logs**
2. Filter by function: `send-email-with-pdf`
3. Check for errors or warnings

### 5.3 Email Deliverability Best Practices
- ✅ **Domain Verified**: Ensure DNS records are correct
- ✅ **SPF Record**: Prevents spoofing
- ✅ **DKIM Record**: Email authentication
- ✅ **Low Bounce Rate**: Clean email list
- ✅ **Unsubscribe Link**: For marketing emails (optional)

---

## Troubleshooting

### Issue: Domain Not Verified
**Solution:**
1. Check DNS records are correctly added
2. Wait 24-48 hours for DNS propagation
3. Use `dig` or `nslookup` to verify:
   ```bash
   dig TXT estre.app
   dig MX estre.app
   ```
4. Contact Resend support if still unverified after 48 hours

### Issue: Emails Not Sending
**Solution:**
1. Check `RESEND_API_KEY` is set in Supabase secrets
2. Verify API key is valid in Resend dashboard
3. Check Supabase Edge Function logs for errors
4. Test API key directly with curl:
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer re_YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "Estre <no-reply@estre.app>",
       "to": "test@example.com",
       "subject": "Test",
       "html": "<p>Test email</p>"
     }'
   ```

### Issue: Emails Going to Spam
**Solution:**
1. Verify all DNS records (SPF, DKIM, MX)
2. Avoid spam trigger words in subject/content
3. Use professional HTML templates (already implemented)
4. Don't send too many emails at once
5. Maintain low bounce rate
6. Consider adding DMARC record:
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:admin@estre.app
   ```

### Issue: PDF Attachment Too Large
**Solution:**
- Resend limit: 40 MB per email
- Optimize PDF generation (compress images)
- For very large PDFs, send download link instead of attachment
- Use `pdfUrl` instead of `pdfBase64`

### Issue: RESEND_API_KEY Not Found
**Solution:**
```bash
# Check if secret exists
supabase secrets list

# Set secret
supabase secrets set RESEND_API_KEY=re_your_key_here

# Restart edge functions
supabase functions deploy send-email-with-pdf --no-verify-jwt
```

---

## Security Considerations

1. **Never expose API keys**: Keep `RESEND_API_KEY` in Supabase secrets only
2. **Rate limiting**: Resend has rate limits (check your plan)
3. **Email validation**: Validate email addresses before sending
4. **Sender reputation**: Monitor bounces and complaints
5. **GDPR compliance**: Add unsubscribe option for marketing emails
6. **no-reply address**: Don't expect replies (use support@estre.app for support)

---

## Resend Pricing

**Free Tier:**
- 100 emails/day
- 3,000 emails/month
- All features included

**Pro Plan ($20/month):**
- 50,000 emails/month
- Custom domains
- Email analytics
- Priority support

**More info:** [resend.com/pricing](https://resend.com/pricing)

---

## Email Templates

All email templates are styled with:
- Responsive design (mobile-friendly)
- Professional branding
- Clear CTAs (buttons)
- OTP display (when needed)
- PDF download links
- Footer with contact info

**Template files:**
- `supabase/functions/send-email-with-pdf/index.ts` (main templates)
- `supabase/functions/_shared/emailTemplates.ts` (legacy templates)

---

## Support

**Resend Support:**
- Email: support@resend.com
- Docs: [resend.com/docs](https://resend.com/docs)

**Supabase Support:**
- Email: support@supabase.com
- Docs: [supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)

---

## Summary

✅ **Sender Email**: `no-reply@estre.app`
✅ **Service**: Resend API
✅ **Edge Function**: `send-email-with-pdf`
✅ **Configuration**: `RESEND_API_KEY` in Supabase secrets
✅ **Email Types**: Sale orders, OTPs, job cards, custom
✅ **Features**: PDF attachments, OTP display, responsive templates

Your email system is now fully configured and ready to send professional emails from `no-reply@estre.app`!
