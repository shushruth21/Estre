# PDF Generation Testing Guide

Quick guide to test PDF generation for both sale orders and job cards.

## Quick Test Methods

### Method 1: Test via App (Recommended)

**Test Sale Order PDF:**
1. Login as customer in your Estre app
2. Add items to cart
3. Complete checkout
4. PDF will be automatically generated
5. Check your email inbox for PDF attachment
6. Or go to Dashboard → View Order → Download PDF

**Test Job Card PDF:**
1. Login as admin/staff
2. Create or view a job card
3. Click "Generate PDF" button (if available)
4. Or use the test script below

---

### Method 2: Test via Script

Use the test script:

```bash
# Test Sale Order PDF
./scripts/test-pdf-generation.sh sale-order <sale_order_id>

# Test Job Card PDF
./scripts/test-pdf-generation.sh job-card <job_card_id>
```

**Get IDs from Supabase SQL Editor:**

```sql
-- Get Sale Order ID
SELECT id, order_number, customer_email, final_pdf_url
FROM sale_orders 
ORDER BY created_at DESC 
LIMIT 5;

-- Get Job Card ID
SELECT id, job_card_number, final_pdf_url
FROM job_cards 
ORDER BY created_at DESC 
LIMIT 5;
```

---

### Method 3: Test via cURL

**Test Sale Order PDF:**

```bash
curl -X POST \
  "https://ljgmqwnamffvvrwgprsd.supabase.co/functions/v1/generate-sale-order-pdf" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZ21xd25hbWZmdnZyd2dwcnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMDA2NTQsImV4cCI6MjA3Nzc3NjY1NH0.uUCG7yiFk0qzECtQLTVVdEE2Qz5bUwY7KFHqkIlO34M" \
  -H "Content-Type: application/json" \
  -d '{
    "saleOrderId": "YOUR_SALE_ORDER_ID",
    "mode": "final",
    "requireOTP": false,
    "skipEmail": true
  }'
```

**Test Job Card PDF:**

```bash
curl -X POST \
  "https://ljgmqwnamffvvrwgprsd.supabase.co/functions/v1/generate-job-card-pdf" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZ21xd25hbWZmdnZyd2dwcnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMDA2NTQsImV4cCI6MjA3Nzc3NjY1NH0.uUCG7yiFk0qzECtQLTVVdEE2Qz5bUwY7KFHqkIlO34M" \
  -H "Content-Type: application/json" \
  -d '{
    "jobCardId": "YOUR_JOB_CARD_ID",
    "mode": "final"
  }'
```

---

## Expected Response

**Success Response:**
```json
{
  "success": true,
  "message": "Final PDF generated successfully",
  "saleOrderId": "...",
  "pdfUrl": "https://ljgmqwnamffvvrwgprsd.supabase.co/storage/v1/object/public/documents/sale-orders/final/...",
  "mode": "final",
  "emailSent": false
}
```

**Error Response:**
```json
{
  "error": "Error message here",
  "details": "..."
}
```

---

## Verification Steps

### 1. Check PDF URL Works
- Copy the `pdfUrl` from response
- Open in browser
- Should display/download PDF

### 2. Check Database Updated
```sql
-- For Sale Orders
SELECT final_pdf_url, final_html IS NOT NULL as has_html
FROM sale_orders 
WHERE id = 'YOUR_SALE_ORDER_ID';

-- For Job Cards
SELECT final_pdf_url, final_html IS NOT NULL as has_html
FROM job_cards 
WHERE id = 'YOUR_JOB_CARD_ID';
```

### 3. Check Email Logs (if email was sent)
```sql
SELECT * FROM email_logs 
WHERE sale_order_id = 'YOUR_SALE_ORDER_ID'
ORDER BY created_at DESC;
```

---

## Troubleshooting

### Error: "Sale order not found"
- Verify the sale order ID exists
- Check RLS policies allow access

### Error: "PDF generation requires Browserless API"
- Set `BROWSERLESS_API_KEY` in Supabase secrets (for job cards)
- Or use PDFGeneratorAPI (for sale orders)

### Error: "RESEND_API_KEY not configured"
- This only affects email sending
- PDF generation will still work
- Set `RESEND_API_KEY` in Supabase secrets to enable email

### PDF URL returns 404
- Check Storage bucket `documents` exists
- Verify bucket is public
- Check file path is correct

---

## Quick Test Checklist

- [ ] Sale Order PDF generates successfully
- [ ] PDF URL opens in browser
- [ ] PDF contains correct order details
- [ ] Database has `final_pdf_url` populated
- [ ] Database has `final_html` populated
- [ ] Email sent (if `skipEmail: false`)
- [ ] Email logged in `email_logs` table

---

## Next Steps

After PDF generation works:
1. Test email sending (set `skipEmail: false`)
2. Test email resend functionality
3. Test PDF download from dashboard
4. Verify email logs are working













