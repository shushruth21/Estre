# Email Error Troubleshooting Guide

## Error: "Edge Function returned a non-2xx status code"

This error occurs when the `send-sale-order-pdf-after-otp` edge function fails to execute successfully.

## Diagnostic Results

**Sale Order Status:**
- ✅ Sale Order exists: `ORD-1765628243331`
- ✅ PDF URL exists: `final_pdf_url` is populated
- ✅ Customer email: `sushruth@estre.in`
- ❌ Email Logs: No entries found (edge function failing before logging)

## Most Likely Cause: Missing RESEND_API_KEY

The edge function requires a Resend API key to send emails. If this is not configured, the function returns a 500 error.

## Solution: Configure Resend API Key

### Step 1: Get Your Resend API Key

1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Login or create an account
3. Click "Create API Key"
4. Give it a name like "Estre Production"
5. Copy the API key (starts with `re_`)

### Step 2: Configure in Supabase

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Secrets** (or **Edge Functions** → **Secrets**)
4. Click **Add Secret**
5. Name: `RESEND_API_KEY`
6. Value: Paste your Resend API key
7. Click **Save**

**Option B: Via Supabase CLI**

```bash
# Set the secret
supabase secrets set RESEND_API_KEY=re_your_api_key_here

# Verify it's set
supabase secrets list
```

### Step 3: Verify Configuration

After setting the API key, test the email function:

1. Go back to your customer dashboard
2. Click "Email PDF" button again
3. Email should now be sent successfully

## Alternative Causes & Solutions

### Issue: PDF File Not Found

**Check:**
```sql
SELECT final_pdf_url FROM sale_orders WHERE order_number = 'ORD-1765628243331';
```

**Solution:** Regenerate the PDF by triggering the `generate-sale-order-pdf` edge function.

### Issue: Invalid Email Address

**Check:**
```sql
SELECT customer_email FROM sale_orders WHERE order_number = 'ORD-1765628243331';
```

**Solution:** Update the customer email address if invalid.

### Issue: Resend API Rate Limiting

**Symptoms:**
- Emails were working but suddenly stopped
- Error message mentions "rate limit"

**Solution:**
- Wait a few minutes and try again
- Upgrade Resend plan if hitting limits frequently
- Check [Resend Dashboard](https://resend.com/overview) for usage stats

### Issue: Edge Function Not Deployed

**Check:**
```bash
supabase functions list
```

**Solution:**
```bash
# Deploy the edge function
supabase functions deploy send-sale-order-pdf-after-otp
```

## Verify Email Logs After Fix

Once the RESEND_API_KEY is configured, you should see entries in the email_logs table:

```sql
SELECT
  email_type,
  recipient_email,
  subject,
  status,
  error_message,
  created_at
FROM email_logs
WHERE sale_order_id IN (
  SELECT id FROM sale_orders WHERE order_number = 'ORD-1765628243331'
)
ORDER BY created_at DESC;
```

**Expected Result:**
- Status should be `'sent'`
- No error_message
- `resend_email_id` should be populated

## Test Email Delivery

1. **Customer Dashboard:**
   - Click "Email PDF" button
   - Should see success message
   - Check inbox for email

2. **Staff Dashboard:**
   - Navigate to Sale Order Detail page
   - Check EmailDeliveryMonitor component
   - Should show "Delivered" status

## Still Having Issues?

### Check Edge Function Logs

1. Go to Supabase Dashboard
2. Navigate to **Edge Functions**
3. Click on `send-sale-order-pdf-after-otp`
4. View **Logs** tab
5. Look for error messages

### Common Log Errors:

**"RESEND_API_KEY not configured"**
- Solution: Follow Step 2 above to configure the API key

**"Sale order not found"**
- Solution: Verify the sale order ID is correct

**"Failed to download PDF"**
- Solution: Check that PDF file exists in Supabase Storage
- Verify storage permissions allow public read access

**"Email failed: Invalid API key"**
- Solution: Double-check your Resend API key is correct
- Generate a new API key if needed

### Manual Email Test

You can manually test the edge function via Supabase Dashboard:

1. Go to **Edge Functions** → `send-sale-order-pdf-after-otp`
2. Click **Invoke**
3. Use this payload:
```json
{
  "saleOrderId": "b4bbe7b0-73f2-44b8-8428-37c6a3c71706"
}
```
4. Click **Invoke Function**
5. Check response for errors

## Quick Fix Checklist

- [ ] Resend API key is configured in Supabase Secrets
- [ ] Edge function `send-sale-order-pdf-after-otp` is deployed
- [ ] PDF URL exists in sale_orders table
- [ ] Customer email address is valid
- [ ] Storage bucket permissions allow public read
- [ ] Not hitting Resend rate limits

## Contact Support

If none of the above solutions work:

1. Check edge function logs for detailed error messages
2. Verify all environment variables are set
3. Test with a different email address
4. Check Resend dashboard for delivery issues

## Expected Behavior After Fix

✅ **Customer Dashboard:**
- Click "Email PDF" → Success message
- Email arrives within 1-2 minutes
- Email contains PDF attachment

✅ **Staff Dashboard:**
- EmailDeliveryMonitor shows "Delivered"
- Email history displays successful send
- No error messages

✅ **Database:**
- email_logs table has entry with status 'sent'
- resend_email_id is populated
- No error_message