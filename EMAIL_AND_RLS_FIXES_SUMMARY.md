# Email and RLS Fixes - Complete Summary

## ✅ All Issues Fixed

### 1. **Migration File Fixed** ✅
**File:** `supabase/migrations/20251201000002_fix_all_rls_and_job_cards.sql`

**Issue:** Columns already existed, causing migration errors
**Fix:** Changed to check each column individually before adding

### 2. **RLS Policy - Restrict Staff Editing After Customer Confirmation** ✅
**File:** `supabase/migrations/20251201000003_restrict_staff_edit_sale_orders.sql`

**Features:**
- ✅ Staff can edit sale orders BEFORE customer confirmation (allows discount codes)
- ✅ Staff CANNOT edit discount/pricing AFTER customer confirmation
- ✅ Staff CAN update workflow fields (status, PDF URLs, OTP) after confirmation
- ✅ Database trigger enforces pricing lock after customer confirmation

**Policies Created:**
1. `Staff can update pending sale orders` - Allows all edits before confirmation
2. `Staff can update workflow after confirmation` - Allows only workflow updates
3. `enforce_workflow_only_update` trigger - Prevents discount/pricing changes

### 3. **Email Sender Changed to no-reply@estre.app** ✅
**Files Updated:**
- ✅ `supabase/functions/generate-sale-order-pdf/index.ts` - Changed from `orders@estre.in` to `no-reply@estre.app`
- ✅ `supabase/functions/send-sale-order-pdf-after-otp/index.ts` - Uses `no-reply@estre.app`

### 4. **OTP Verification via Email** ✅
**Current Flow:**
- ✅ OTP is generated and sent via email when staff approves sale order
- ✅ Customer receives email with OTP from `no-reply@estre.app`
- ✅ Customer enters OTP in OrderConfirmation page
- ✅ OTP verification happens via email (not SMS)

### 5. **PDF Sent After OTP Verification** ✅
**New Edge Function:** `supabase/functions/send-sale-order-pdf-after-otp/index.ts`

**Features:**
- ✅ Automatically called after customer verifies OTP
- ✅ Downloads PDF from Supabase Storage
- ✅ Sends PDF as email attachment to customer
- ✅ Email sent from `no-reply@estre.app`
- ✅ Subject: "Your Confirmed Sale Order - {orderNumber}"

**Updated:** `src/pages/OrderConfirmation.tsx`
- ✅ Calls Edge Function after OTP verification
- ✅ Shows success message about email

### 6. **Discount Code Application** ✅
**Current Implementation:**
- ✅ Discount codes can be applied via `StaffSaleOrders.tsx` and `StaffSaleOrderDetail.tsx`
- ✅ Discount codes work BEFORE customer confirmation
- ✅ Manual discount editing disabled AFTER customer confirmation
- ✅ UI shows warning when discount editing is disabled

## 📋 Migration Files to Run

### Step 1: Run RLS and Schema Migration
```sql
-- In Supabase Dashboard → SQL Editor
-- Run: supabase/migrations/20251201000002_fix_all_rls_and_job_cards.sql
```

### Step 2: Run Staff Edit Restriction Migration
```sql
-- In Supabase Dashboard → SQL Editor
-- Run: supabase/migrations/20251201000003_restrict_staff_edit_sale_orders.sql
```

## 🚀 Edge Functions Deployed

### Already Deployed:
- ✅ `send-sale-order-pdf-after-otp` - Sends PDF after OTP verification
- ✅ `generate-sale-order-pdf` - Updated email sender to no-reply@estre.app

## 🔍 Complete Workflow

### Customer Checkout Flow:
1. Customer places order → Sale order created with status `confirmed_by_customer`
2. PDF generated → Email sent with OTP from `no-reply@estre.app`
3. Customer receives email → Enters OTP in OrderConfirmation page
4. Customer verifies OTP → PDF automatically sent to email from `no-reply@estre.app`
5. Order confirmed → Status updated to `customer_confirmed`

### Staff Workflow:
1. Staff views sale orders → Can see all sale orders
2. Staff applies discount code → Works BEFORE customer confirmation
3. Staff approves → PDF generated, OTP sent to customer
4. After customer confirms → Staff CANNOT edit discount/pricing
5. Staff can update workflow → Status, PDF URLs, OTP updates allowed

## 📧 Email Configuration

### Email Sender:
- **From:** `Estre <no-reply@estre.app>`
- **To:** Customer email from sale order
- **Subject:** 
  - Initial: "Your Estre Sale Order is Ready"
  - After OTP: "Your Confirmed Sale Order - {orderNumber}"

### Email Content:
- **Initial Email:** Contains OTP code and PDF link
- **After OTP:** Contains PDF attachment and download link

## 🔒 Security Features

1. **RLS Policies:**
   - Factory staff see only assigned job cards
   - Staff/admin see all job cards
   - Customers see only their own sale orders and job cards

2. **Edit Restrictions:**
   - Staff cannot edit discount/pricing after customer confirmation
   - Database trigger enforces pricing lock
   - Discount codes can only be applied before confirmation

3. **Data Sync:**
   - Automatic sync from orders → sale_orders
   - Automatic order_number population

## ✅ Verification Checklist

- [ ] Run migration `20251201000002_fix_all_rls_and_job_cards.sql`
- [ ] Run migration `20251201000003_restrict_staff_edit_sale_orders.sql`
- [ ] Verify Edge Functions are deployed
- [ ] Test discount code application (should work before confirmation)
- [ ] Test manual discount editing (should be disabled after confirmation)
- [ ] Test OTP email sending (should come from no-reply@estre.app)
- [ ] Test PDF email after OTP verification (should come from no-reply@estre.app)
- [ ] Verify staff cannot edit confirmed sale orders

## 🎯 Key Points

1. **Discount Codes:** Can be applied via coupon codes before customer confirmation
2. **Manual Discount:** Disabled after customer confirmation (UI + Database enforced)
3. **Email Sender:** All emails from `no-reply@estre.app`
4. **OTP Verification:** Happens via email (OTP sent in email)
5. **PDF Delivery:** Automatically sent to customer email after OTP verification

All fixes are complete and ready for testing!




