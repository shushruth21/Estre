# Email Testing Procedure

## After DNS Configuration Fix

This guide helps you verify that emails are being sent and delivered correctly after fixing the DNS SPF record.

---

## Prerequisites

Before testing, ensure:

1. ✅ DNS SPF record updated to include Resend
2. ✅ Waited 30-60 minutes for DNS propagation
3. ✅ `npm run verify-dns` passes all checks
4. ✅ RESEND_API_KEY configured in Supabase Edge Function secrets

---

## Test 1: Verify DNS Configuration

**Run DNS verification:**

```bash
npm run verify-dns
```

**Expected output:**
```
✅ PASSED: Resend is authorized in SPF
✅ PASSED: Hostinger is authorized in SPF
✅ PASSED: No Amazon SES records found
```

**If checks fail:**
- Wait longer for DNS propagation (up to 24 hours)
- Double-check DNS changes in Hostinger dashboard
- Use online tools: https://dnschecker.org/

---

## Test 2: Check Email Logs in Database

**Query recent email attempts:**

```sql
SELECT
    created_at,
    recipient_email,
    subject,
    email_type,
    status,
    error_message,
    provider_message_id
FROM email_logs
ORDER BY created_at DESC
LIMIT 10;
```

**What to look for:**
- ✅ Recent entries with `status = 'sent'`
- ✅ `provider_message_id` populated (Resend message ID)
- ❌ If `status = 'failed'`, check `error_message`

**Common error messages:**

| Error | Cause | Fix |
|-------|-------|-----|
| `RESEND_API_KEY not configured` | Missing API key | Add to Supabase secrets |
| `550 SPF validation failed` | DNS not propagated | Wait longer |
| `Invalid recipient email` | Bad email format | Check customer email |
| `Rate limit exceeded` | Too many emails | Wait or upgrade Resend plan |

---

## Test 3: Send Test Sale Order PDF

### 3.1 From Staff Dashboard

1. **Navigate to Staff Dashboard:**
   - Log in as staff user
   - Go to: `/staff/sale-orders`

2. **Select a Test Order:**
   - Choose any existing sale order
   - Click "View Details"

3. **Generate Final PDF:**
   - Click "Generate Final PDF & Send to Customer"
   - Wait 5-10 seconds for processing

4. **Check Response:**
   ```
   ✅ Success: "Final PDF generated and email sent"
   ❌ Error: Check console logs and email_logs table
   ```

### 3.2 Check Customer Email

**Test email address should receive:**
- **Subject:** "Your Estre Sale Order is Ready"
- **From:** `Estre <no-reply@estre.app>`
- **Content:**
  - Greeting with customer name
  - Link to download PDF
  - OTP code (if OTP was required)
- **Attachment:** `sale-order-[number].pdf`

**Delivery time:** 30 seconds to 2 minutes

### 3.3 Verify in Email Logs

```sql
SELECT * FROM email_logs
WHERE email_type = 'sale_order'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected fields:**
- `status`: `'sent'`
- `provider_message_id`: Should have Resend ID (e.g., `re_123456...`)
- `error_message`: `NULL`

---

## Test 4: Test OTP Email Delivery

### 4.1 Create Test Order Flow

1. **As Customer:**
   - Browse products: `/products`
   - Configure a product
   - Add to cart
   - Complete checkout
   - Provide test email address

2. **Complete Payment:**
   - Enter payment details
   - Submit order

3. **Sale Order Created:**
   - System creates sale order
   - System generates OTP
   - System sends OTP email

### 4.2 Check OTP Email

**Customer should receive:**
- **Subject:** "Your Estre Order Confirmation OTP"
- **From:** `Estre <no-reply@estre.app>`
- **Content:**
  - 6-digit OTP code (large, bold)
  - "Valid for 10 minutes"
  - Instructions to enter OTP

**Delivery time:** 10-30 seconds

### 4.3 Verify OTP

1. **Enter OTP:**
   - Customer redirected to: `/verify-otp/{sale-order-id}`
   - Enter 6-digit code
   - Click "Verify & Confirm Order"

2. **Success:**
   - Order status → `customer_confirmed`
   - Job cards status → `ready_for_production`
   - Confirmation email sent

### 4.4 Check Confirmation Email

**Customer should receive:**
- **Subject:** "Your Confirmed Sale Order - [order-number]"
- **From:** `Estre <no-reply@estre.app>`
- **Content:**
  - Confirmation message
  - Link to download final PDF
- **Attachment:** Final sale order PDF

---

## Test 5: Manual Edge Function Test

**Direct Edge Function invocation:**

```javascript
// From browser console or Node.js script
const { data, error } = await supabase.functions.invoke('generate-sale-order-pdf', {
  body: {
    saleOrderId: 'your-sale-order-uuid',
    mode: 'final',
    requireOTP: false,
    skipEmail: false
  }
});

console.log('Result:', data);
console.log('Error:', error);
```

**Expected response:**
```json
{
  "success": true,
  "message": "Final PDF generated and email sent",
  "saleOrderId": "uuid-here",
  "pdfUrl": "https://...",
  "emailSent": true,
  "mode": "final"
}
```

---

## Test 6: Email Deliverability Check

### 6.1 Test with Mail-Tester

1. **Get test email address:**
   - Visit: https://www.mail-tester.com/
   - Copy the test email address shown

2. **Send test email:**
   - Create a sale order with test email as customer
   - Generate and send PDF

3. **Check score:**
   - Refresh mail-tester page
   - **Target score:** 8/10 or higher
   - Review any warnings

### 6.2 Check Spam Folder

**Test with multiple email providers:**
- Gmail: Check inbox AND spam folder
- Outlook: Check inbox AND junk folder
- Yahoo: Check inbox AND spam folder

**Target metrics:**
- Inbox placement: 95%+
- Spam folder: <5%

---

## Test 7: Resend Dashboard Verification

### 7.1 Log into Resend

1. Go to: https://resend.com/
2. Log in with your credentials
3. Navigate to "Emails" or "Logs"

### 7.2 Check Recent Emails

**What to verify:**
- Recent emails show "Delivered" status
- From address: `no-reply@estre.app`
- No bounce or complaint reports

### 7.3 Domain Status

1. Navigate to "Domains"
2. Find `estre.app`
3. Check status: ✅ Verified

**If not verified:**
- Add domain verification TXT record from Resend
- Wait for verification (5-10 minutes)

---

## Troubleshooting Guide

### Issue: Emails Not Received

**Debug steps:**
1. Check email_logs table for error messages
2. Verify DNS propagation: `npm run verify-dns`
3. Check spam/junk folders
4. Verify RESEND_API_KEY is set
5. Check Resend dashboard for bounces

**Common fixes:**
- Wait longer for DNS propagation
- Add DKIM record for better deliverability
- Verify customer email is valid
- Check Resend account limits

### Issue: PDF Not Attached

**Check:**
1. PDF generation successful? (check sale_orders.final_pdf_url)
2. Edge function logs (Supabase dashboard → Edge Functions → Logs)
3. File exists in storage: `documents/sale-orders/final/{id}.pdf`

**Fix:**
- Ensure PDF_GENERATOR_API_KEY or BROWSERLESS_API_KEY set
- Check storage bucket permissions
- Verify PDF size (<10MB for email attachment)

### Issue: OTP Not Working

**Verify:**
1. OTP generated and saved: Check sale_orders.otp_code
2. OTP not expired: Check sale_orders.otp_expires_at
3. Email delivered: Check email_logs

**Bypass for testing:**
- Enter `0000` as OTP (bypass code)
- Check logs for actual OTP value
- Manually update otp_expires_at if expired

---

## Success Criteria

✅ **All tests pass when:**

1. DNS verification passes all checks
2. Email logs show `status = 'sent'`
3. Test emails arrive in inbox within 2 minutes
4. PDFs attached and downloadable
5. OTP codes delivered within 30 seconds
6. Mail-tester score 8/10 or higher
7. No emails in spam folder
8. Resend dashboard shows "Delivered"

---

## Monitoring After Launch

**Daily checks:**
1. Review email_logs for failures
2. Check Resend dashboard for bounces
3. Monitor customer complaints about missing emails

**Weekly checks:**
1. Review email deliverability metrics
2. Check spam reports
3. Verify DNS records still correct

**Monthly checks:**
1. Run full test procedure
2. Review email template effectiveness
3. Check DKIM/DMARC status

---

## Support Contacts

**Resend Support:**
- Email: support@resend.com
- Docs: https://resend.com/docs

**Supabase Support:**
- Dashboard: https://supabase.com/dashboard/support
- Docs: https://supabase.com/docs

**DNS Issues:**
- Hostinger: support@hostinger.com
- DNS Tools: https://mxtoolbox.com/

---

## Next Steps After Successful Testing

1. **Enable for production:**
   - Remove test bypass codes
   - Set up proper monitoring
   - Document runbook

2. **Enhance deliverability:**
   - Add DKIM record
   - Implement DMARC policy
   - Monitor sender reputation

3. **Customer communication:**
   - Inform customers to check spam if not received
   - Provide support email for issues
   - Add "Check spam folder" to order confirmation

---

**Status:** Ready to test after DNS fix
**Last Updated:** 2025-12-13
