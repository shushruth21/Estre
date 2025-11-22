# 🚀 Edge Function Deployment Guide

## ✅ Status: Ready to Deploy

The Edge Function `generate-sale-order-pdf` has been updated to use **pdf-lib**, which is fully compatible with Deno Edge Functions.

### Changes Made:
- ✅ Replaced PDFKit with pdf-lib (Deno-compatible)
- ✅ Fixed Buffer usage (now uses native Deno methods)
- ✅ Improved async handling (no more setTimeout workaround)
- ✅ Fixed base64 conversion for large PDFs

---

## 📋 Pre-Deployment Checklist

### 1. Database Migration
```sql
-- Run in Supabase SQL Editor
-- File: supabase/migrations/20251121000002_create_sale_orders.sql
```

### 2. Create Storage Bucket
```sql
-- Create documents bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for documents bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');
```

### 3. Install Supabase CLI (if not already installed)
```bash
npm install -g supabase
```

### 4. Login to Supabase
```bash
supabase login
```

### 5. Link Your Project
```bash
# Get your project reference ID from Supabase dashboard
supabase link --project-ref YOUR_PROJECT_REF
```

### 6. Set Environment Variables
```bash
# Set Resend API Key
supabase secrets set RESEND_API_KEY=re_...

# Verify secrets are set
supabase secrets list
```

**Note:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically provided by Supabase - you don't need to set them manually.

---

## 🚀 Deploy the Function

```bash
# Deploy the function
supabase functions deploy generate-sale-order-pdf

# Verify deployment
supabase functions list
```

---

## 🧪 Test the Function

### Option 1: Test via Supabase Dashboard
1. Go to Supabase Dashboard → Edge Functions
2. Click on `generate-sale-order-pdf`
3. Click "Invoke Function"
4. Enter test payload:
```json
{
  "saleOrderId": "your-sale-order-id-here"
}
```

### Option 2: Test via cURL
```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/generate-sale-order-pdf' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"saleOrderId": "your-sale-order-id-here"}'
```

### Option 3: Test from Staff Dashboard
1. Create a sale order via customer checkout
2. Go to `/staff/sale-orders`
3. Apply discount and approve
4. Check function logs for any errors

---

## 📊 Monitor Function Logs

```bash
# View real-time logs
supabase functions logs generate-sale-order-pdf

# View logs with tail
supabase functions logs generate-sale-order-pdf --tail
```

---

## 🔍 Troubleshooting

### Issue: Function fails with "Module not found"
**Solution:** Ensure you're using the correct import URLs. The function uses:
- `https://deno.land/std@0.168.0/http/server.ts`
- `https://esm.sh/@supabase/supabase-js@2`
- `https://esm.sh/pdf-lib@1.17.1`

### Issue: Storage upload fails
**Solution:** 
1. Verify `documents` bucket exists
2. Check RLS policies allow uploads
3. Verify service role key has permissions

### Issue: Email not sending
**Solution:**
1. Verify `RESEND_API_KEY` is set: `supabase secrets list`
2. Check Resend domain is verified
3. Check function logs for email errors

### Issue: PDF generation fails
**Solution:**
1. Check function logs for specific error
2. Verify sale_order data structure matches expected format
3. Ensure order_items are properly linked

---

## ✅ Verification Steps

After deployment, verify:

1. **Function Deployed:**
   ```bash
   supabase functions list
   ```
   Should show `generate-sale-order-pdf` in the list

2. **Secrets Set:**
   ```bash
   supabase secrets list
   ```
   Should show `RESEND_API_KEY` (value hidden)

3. **Storage Bucket Exists:**
   - Go to Supabase Dashboard → Storage
   - Verify `documents` bucket exists

4. **Test End-to-End:**
   - Create test sale order
   - Staff approves with discount
   - Check PDF is generated
   - Verify emails are sent
   - Check OTP is generated

---

## 📝 Function Features

The function performs these steps automatically:

1. ✅ Fetches sale order with customer and order details
2. ✅ Generates PDF using pdf-lib
3. ✅ Uploads PDF to Supabase Storage (`documents` bucket)
4. ✅ Updates `sale_order` with PDF URL
5. ✅ Generates 6-digit OTP (expires in 10 minutes)
6. ✅ Updates `sale_order` status to `awaiting_customer_otp`
7. ✅ Sends PDF email to customer (via Resend)
8. ✅ Sends OTP email to customer (via Resend)

---

## 🔐 Security Notes

- Function uses **service role key** (never expose to client)
- PDFs stored in **public bucket** (accessible via URL)
- OTP expires after **10 minutes**
- Email domain must be **verified** in Resend

---

## 📞 Support

If you encounter issues:
1. Check function logs: `supabase functions logs generate-sale-order-pdf`
2. Verify all prerequisites are met
3. Test with a simple sale order first
4. Check Supabase Edge Functions documentation

---

**Status:** ✅ Ready for Production Deployment

