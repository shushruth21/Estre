# ✅ Enterprise Checkout Workflow Implementation

## Overview

This document describes the complete enterprise checkout workflow implementation for Estre, including staff review, PDF generation, OTP verification, and payment integration.

---

## 🗄️ Database Schema

### `sale_orders` Table

Created via migration: `supabase/migrations/20251121000002_create_sale_orders.sql`

**Key Fields:**
- `id` (uuid) - Primary key
- `customer_id` (uuid) - References auth.users
- `order_id` (uuid) - References orders table
- `status` (text) - Workflow status
- `base_price` (numeric) - Original price before discount
- `discount` (numeric) - Discount applied by staff
- `final_price` (numeric) - Final price after discount
- `pdf_url` (text) - URL to generated PDF
- `otp_code` (text) - 6-digit OTP for customer confirmation
- `otp_expires_at` (timestamptz) - OTP expiration (10 minutes)
- `otp_verified_at` (timestamptz) - When OTP was verified
- `advance_amount_rs` (numeric) - 50% advance payment amount
- `advance_paid_at` (timestamptz) - When advance was paid
- `payment_transaction_id` (text) - Payment gateway transaction ID
- `payment_gateway` (text) - Payment gateway used (e.g., "razorpay")

**Status Workflow:**
1. `pending_staff_review` - Initial state after customer checkout
2. `awaiting_pdf_generation` - Staff approved, PDF being generated
3. `pdf_ready` - PDF generated and uploaded
4. `awaiting_customer_otp` - PDF sent, waiting for customer OTP
5. `confirmed_by_customer` - Customer verified OTP
6. `advance_paid` - 50% advance payment received
7. `cancelled` - Order cancelled

---

## 🔄 Workflow Steps

### Step 1: Customer Checkout

**File:** `src/pages/Checkout.tsx`

**Changes:**
- ✅ Removed discount code application from customer UI
- ✅ Removed discount amount calculation
- ✅ Creates `sale_order` with status `pending_staff_review`
- ✅ Shows message: "Your order is being reviewed by Estre Staff"

**Key Code:**
```typescript
// Create sale_order for staff review workflow
const { data: saleOrder, error: saleOrderError } = await supabase
  .from("sale_orders")
  .insert({
    customer_id: user.id,
    order_id: order.id,
    status: "pending_staff_review",
    base_price: subtotal,
    discount: 0,
    final_price: subtotal,
  })
  .select()
  .single();
```

---

### Step 2: Staff Review & Discount Application

**File:** `src/pages/staff/StaffSaleOrders.tsx`

**Features:**
- View all sale orders with status `pending_staff_review`
- Apply discount codes via dropdown selector
- Apply manual discount amounts
- Approve orders (triggers PDF generation)

**Key Functions:**
- `applyDiscountCodeMutation` - Applies discount code and triggers PDF generation
- `applyManualDiscountMutation` - Applies manual discount amount

**Route:** `/staff/sale-orders`

---

### Step 3: PDF Generation

**File:** `supabase/functions/generate-sale-order-pdf/index.ts`

**Edge Function Features:**
1. Fetches sale order data with customer and order details
2. Generates PDF using PDFKit
3. Uploads PDF to Supabase Storage (`documents` bucket)
4. Updates `sale_order` with PDF URL
5. Generates 6-digit OTP
6. Sends email with PDF attachment (via Resend)
7. Sends OTP email (via Resend)

**Deployment:**
```bash
supabase functions deploy generate-sale-order-pdf
```

**Environment Variables Required:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

---

### Step 4: Email Integration

**File:** `src/lib/email.ts`

**Functions:**
- `sendSaleOrderEmail()` - Sends PDF email to customer
- `sendOTPEmail()` - Sends OTP email to customer

**Email Service:** Resend (https://resend.com)

**Setup:**
1. Create account at https://resend.com
2. Get API key
3. Add to `.env.local`: `VITE_RESEND_API_KEY=re_...`
4. Verify domain: `estre.in`

---

### Step 5: OTP Verification

**File:** `src/pages/OrderConfirmation.tsx`

**Features:**
- Customer enters 6-digit OTP
- Validates OTP against database
- Checks OTP expiration (10 minutes)
- Updates status to `confirmed_by_customer`
- Redirects to payment page

**Route:** `/order-confirmation/:saleOrderId`

**OTP Generation:**
```typescript
const otp = Math.floor(100000 + Math.random() * 900000).toString();
const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
```

---

### Step 6: Payment (Razorpay) - TODO

**Status:** Pending implementation

**Planned Features:**
- 50% advance payment
- Razorpay integration
- Payment success callback
- Update `sale_order` status to `advance_paid`

**Route:** `/payment/:saleOrderId`

---

## 📁 Files Created/Modified

### New Files:
1. ✅ `supabase/migrations/20251121000002_create_sale_orders.sql`
2. ✅ `src/pages/staff/StaffSaleOrders.tsx`
3. ✅ `src/pages/OrderConfirmation.tsx`
4. ✅ `supabase/functions/generate-sale-order-pdf/index.ts`
5. ✅ `src/lib/email.ts`

### Modified Files:
1. ✅ `src/pages/Checkout.tsx` - Removed discount, creates sale_order
2. ✅ `src/components/checkout/ReviewStep.tsx` - Removed discount UI
3. ✅ `src/App.tsx` - Added routes for new pages
4. ✅ `src/components/staff/StaffLayout.tsx` - Added Sale Orders nav link

---

## 🚀 Deployment Checklist

### 1. Database Migration
```sql
-- Run in Supabase SQL Editor
-- File: supabase/migrations/20251121000002_create_sale_orders.sql
```

### 2. Supabase Storage Bucket
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

### 3. Edge Function Deployment
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy function
supabase functions deploy generate-sale-order-pdf

# Set environment variables
supabase secrets set RESEND_API_KEY=re_...
```

### 4. Environment Variables
Add to `.env.local`:
```env
VITE_RESEND_API_KEY=re_...
```

### 5. Resend Domain Verification
1. Go to https://resend.com/domains
2. Add domain: `estre.in`
3. Add DNS records as instructed
4. Verify domain

---

## 🧪 Testing Checklist

### Customer Flow:
- [ ] Customer adds products to cart
- [ ] Customer checks out (no discount option visible)
- [ ] Sale order created with status `pending_staff_review`
- [ ] Customer sees "Order submitted" message

### Staff Flow:
- [ ] Staff views `/staff/sale-orders`
- [ ] Staff sees pending sale orders
- [ ] Staff applies discount code
- [ ] Staff applies manual discount
- [ ] Order status changes to `awaiting_pdf_generation`

### PDF Generation:
- [ ] Edge function generates PDF
- [ ] PDF uploaded to Supabase Storage
- [ ] Sale order updated with PDF URL
- [ ] OTP generated and stored
- [ ] Email sent with PDF attachment
- [ ] OTP email sent

### OTP Verification:
- [ ] Customer receives emails
- [ ] Customer navigates to `/order-confirmation/:saleOrderId`
- [ ] Customer enters OTP
- [ ] OTP validated successfully
- [ ] Status changes to `confirmed_by_customer`
- [ ] Redirects to payment page

---

## 🔐 Security Considerations

1. **RLS Policies:** Sale orders are protected by RLS - customers can only see their own orders
2. **OTP Expiration:** OTPs expire after 10 minutes
3. **Service Role Key:** Edge function uses service role key (never expose to client)
4. **Email Verification:** OTPs sent to verified customer email
5. **Payment Gateway:** Razorpay handles secure payment processing

---

## 📊 Status Flow Diagram

```
Customer Checkout
    ↓
Create Sale Order (pending_staff_review)
    ↓
Staff Dashboard → Apply Discount → Approve
    ↓
Status: awaiting_pdf_generation
    ↓
Edge Function: Generate PDF → Upload → Send Email
    ↓
Status: awaiting_customer_otp
    ↓
Customer: Enter OTP → Verify
    ↓
Status: confirmed_by_customer
    ↓
Payment Gateway (50% advance) [TODO]
    ↓
Status: advance_paid
    ↓
Production Pipeline Begins
```

---

## 🐛 Troubleshooting

### PDF Generation Fails:
- Check Edge Function logs: `supabase functions logs generate-sale-order-pdf`
- Verify Supabase Storage bucket exists
- Check service role key permissions

### Emails Not Sending:
- Verify `RESEND_API_KEY` is set
- Check Resend domain verification
- Check Edge Function logs for email errors

### OTP Not Working:
- Check OTP expiration time
- Verify OTP code matches database
- Check customer email matches sale_order customer_id

---

## 📝 Next Steps

1. ✅ Implement sale_orders table
2. ✅ Update checkout flow
3. ✅ Create staff review page
4. ✅ Implement PDF generation
5. ✅ Set up email integration
6. ✅ Create OTP verification
7. ⏳ Implement Razorpay payment (pending)

---

**Status:** ✅ Core workflow implemented | ⏳ Payment integration pending

