# Email Setup Completion Guide

Complete step-by-step guide to finish email configuration and test the email flow.

## Prerequisites

- ✅ Resend account created
- ✅ Domain `estre.app` added in Resend dashboard
- ✅ DNS records configured in Hostinger (SPF, DKIM, DMARC)
- ✅ Domain verified in Resend dashboard
- ✅ Resend API key generated

---

## Step 1: Finish Secrets Setup

### In Supabase Dashboard:

1. Navigate to: **Project Settings** → **Edge Functions** → **Secrets**
2. Verify `RESEND_API_KEY` is entered (should start with `re_`)
3. **Click "Save"** to activate the key for all functions

### Verify Secret is Active:

```bash
# Optional: Check secrets (requires Supabase CLI)
supabase secrets list
```

**Expected Output:**
```
RESEND_API_KEY: re_... (hidden)
```

---

## Step 2: Apply Database Migrations

### Run Migrations:

From your project root (where `supabase/` folder is located):

```bash
# Apply all pending migrations including email_logs
supabase db push
```

This will apply:
- ✅ `20251202000001_create_email_logs.sql` - Email logging table
- ✅ `20251202000002_add_customer_fields_to_sale_orders.sql` - Customer fields for email

### Verify Migrations:

Run in **Supabase SQL Editor**:

```sql
-- Check email_logs table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'email_logs';

-- Check sale_orders has customer fields
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'sale_orders' 
AND column_name IN ('customer_email', 'customer_name', 'order_number');
```

**Expected:** Should return all three columns.

---

## Step 3: Redeploy Edge Functions

### Deploy Email Functions:

From your project root:

```bash
# Deploy email-related functions
supabase functions deploy generate-sale-order-pdf
supabase functions deploy send-sale-order-pdf-after-otp

# Or deploy all functions at once
supabase functions deploy
```

### Verify Deployment:

1. Go to **Supabase Dashboard** → **Edge Functions**
2. Check both functions show **"Active"** status:
   - ✅ `generate-sale-order-pdf`
   - ✅ `send-sale-order-pdf-after-otp`

3. Check function logs for any errors:
   - Click on each function → **Logs** tab
   - Should show recent deployments

---

## Step 4: End-to-End Testing

### Test Scenario: Place Order and Verify Email

#### 4.1 Place Test Order

1. **Login** as customer in your Estre app
2. **Add items** to cart
3. **Go to checkout** (`/checkout`)
4. **Fill delivery details**:
   - Street address
   - City, State, Pincode
   - Expected delivery date
   - Special instructions (optional)
5. **Review and confirm** order
6. **Click "Place Order"**

#### 4.2 Verify PDF Generation

Run in **Supabase SQL Editor**:

```sql
-- Check latest sale order
SELECT 
  id,
  order_number,
  customer_email,
  customer_name,
  status,
  final_pdf_url,
  created_at
FROM sale_orders 
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected Results:**
- ✅ `order_number` is set
- ✅ `customer_email` is set
- ✅ `customer_name` is set
- ✅ `final_pdf_url` is not null (PDF generated)
- ✅ `status` is appropriate

#### 4.3 Verify Email Sent

Run in **Supabase SQL Editor**:

```sql
-- Check email logs
SELECT 
  recipient_email,
  subject,
  email_type,
  status,
  error_message,
  provider_message_id,
  created_at
FROM email_logs 
WHERE email_type = 'sale_order'
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected Results:**
- ✅ Rows with `email_type = 'sale_order'`
- ✅ `status = 'sent'` (if successful)
- ✅ `error_message` is null (if successful)
- ✅ `provider_message_id` is set (Resend message ID)

#### 4.4 Check Email Inbox

1. **Check your email inbox** (the email used during checkout)
2. **Look for email from:** `Estre <no-reply@estre.app>`
3. **Subject:** "Your Estre Sale Order is Ready"
4. **Verify:**
   - ✅ Email received
   - ✅ PDF attachment included
   - ✅ PDF opens correctly
   - ✅ Email renders properly

#### 4.5 Test Email Resend

1. **Go to Dashboard** (`/dashboard`) or **Order Detail** (`/orders/:id`)
2. **Find your test order**
3. **Click "Resend Email"** button
4. **Verify:**
   - ✅ Toast notification shows success
   - ✅ Email received again
   - ✅ New entry in `email_logs` table

---

## Step 5: Troubleshooting

### Issue: "RESEND_API_KEY not configured"

**Symptoms:**
- Email logs show `status = 'failed'`
- Error message: "RESEND_API_KEY not configured"

**Fix:**
1. Go to Supabase Dashboard → Edge Functions → Secrets
2. Verify `RESEND_API_KEY` is saved (click Save again)
3. Redeploy functions: `supabase functions deploy generate-sale-order-pdf`

### Issue: Email Not Received

**Check:**
1. **Spam folder** - Check if email went to spam
2. **Resend Dashboard** - Check email delivery status
3. **Email logs** - Check for error messages:
   ```sql
   SELECT error_message, status 
   FROM email_logs 
   WHERE status = 'failed' 
   ORDER BY created_at DESC;
   ```

**Common Causes:**
- Domain not verified in Resend
- DNS records not propagated
- Email address invalid
- Resend account limits reached

### Issue: "PDF not found" when resending

**Symptoms:**
- Error: "Sale order PDF not found. Please generate PDF first."

**Fix:**
1. Check if `final_pdf_url` is set:
   ```sql
   SELECT final_pdf_url FROM sale_orders WHERE id = 'YOUR_SALE_ORDER_ID';
   ```
2. If null, regenerate PDF from staff dashboard
3. Or trigger PDF generation manually

### Issue: Email Logs Table Missing

**Fix:**
```bash
# Re-run migration
supabase db push

# Or manually run SQL
# Copy contents of: supabase/migrations/20251202000001_create_email_logs.sql
# Paste in Supabase SQL Editor and run
```

---

## Step 6: Monitoring Setup

### Regular Monitoring Queries

```sql
-- Check email sending success rate (last 24 hours)
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM email_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Check failed emails
SELECT 
  recipient_email,
  subject,
  error_message,
  created_at
FROM email_logs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;

-- Check emails sent today
SELECT COUNT(*) as emails_sent_today
FROM email_logs
WHERE status = 'sent'
AND DATE(created_at) = CURRENT_DATE;
```

### Set Up Alerts (Optional)

1. **Resend Dashboard** → **Webhooks**
2. Configure webhook for delivery events
3. Update `email_logs` table with delivery status

---

## Verification Checklist

- [ ] `RESEND_API_KEY` secret saved in Supabase
- [ ] `email_logs` table exists
- [ ] `sale_orders` table has `customer_email`, `customer_name`, `order_number` columns
- [ ] Edge Functions deployed successfully
- [ ] Test order placed successfully
- [ ] PDF generated (`final_pdf_url` exists)
- [ ] Email sent (check `email_logs` table)
- [ ] Email received in inbox
- [ ] PDF attachment opens correctly
- [ ] Email resend works
- [ ] No errors in Edge Function logs

---

## Next Steps

1. **Monitor email delivery** - Check `email_logs` regularly
2. **Set up email analytics** - Track open rates, click rates
3. **Customize email templates** - Update templates in `supabase/functions/_shared/emailTemplates.ts`
4. **Set up webhooks** - For delivery status updates
5. **Create admin dashboard** - View email statistics

---

## Support

If you encounter issues:

1. **Check Edge Function logs** in Supabase Dashboard
2. **Check email_logs table** for error messages
3. **Verify Resend dashboard** for delivery status
4. **Check DNS records** are properly configured
5. **Verify domain** is verified in Resend

---

## Summary

Once all steps are completed:
- ✅ Emails will be automatically sent when orders are placed
- ✅ PDFs will be attached to emails
- ✅ All email attempts will be logged
- ✅ Customers can resend emails from dashboard
- ✅ Staff can monitor email delivery

Your email system is now production-ready! 🎉














