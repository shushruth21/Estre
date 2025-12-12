# Complete Estre Order Workflow - Updated

## Overview

This document describes the complete order lifecycle in the Estre furniture manufacturing system, including customer interactions, staff operations, email notifications, OTP verification, and production workflows.

---

## Workflow Diagram

```
CUSTOMER JOURNEY                    STAFF OPERATIONS                    SYSTEM ACTIONS
═══════════════════════════════════════════════════════════════════════════════════════

1. Browse Products
   └─> Configure Product
   └─> Add to Cart

2. Checkout Flow
   ├─> Delivery Details
   ├─> Review Order
   └─> Accept Terms

3. [Request Staff Review]                                              ├─> Create Order
   ↓                                                                   ├─> Create Sale Order
   STATUS: pending_staff_review                                        └─> Clear Cart
   ↓
   ↓                                    4. View Pending Orders
   ↓                                       └─> Review Details
   ↓                                       └─> Check Configuration
   ↓
   ↓                                    5. Apply Discount (optional)
   ↓                                       └─> Discount Code
   ↓                                       └─> Manual Discount
   ↓
   ↓                                    6. [Approve Order]
   ↓                                       ↓
   ↓                                       STATUS: awaiting_customer_confirmation
   ↓                                                                    ├─> Generate PDF
   ↓                                                                    ├─> Upload to Storage
   ↓                                                                    ├─> Generate OTP (6 digits)
   ↓                                                                    ├─> Set OTP expiry (10 min)
   ↓                                                                    └─> Send Email with PDF + OTP
   ↓                                                                    └─> Log Email
7. Receive Email ◄───────────────────────────────────────────────────┘
   ├─> From: Estre <no-reply@estre.app>
   ├─> Subject: Your Estre Sale Order is Ready
   ├─> PDF Attachment
   ├─> OTP Code (6 digits)
   └─> Download Link

8. View Order in Dashboard
   └─> "Awaiting Your Confirmation" badge
   └─> [Review & Confirm Order]

9. Order Confirmation Page
   ├─> Download PDF
   ├─> View Order Summary
   ├─> View Pricing Breakdown
   └─> Enter OTP

10. [Enter OTP & Confirm]                                              ├─> Verify OTP
    ↓                                                                   ├─> Check Expiry
    IF VALID:                                                           └─> Update Status
    ↓
    STATUS: confirmed_by_customer                                       ├─> Generate Job Cards (auto)
                                                                        ├─> Generate QIRs (auto)
                                                                        └─> Log Email

11. Payment Flow
    ├─> IF payment_mode = 'cash':
    │   └─> STATUS: confirmed_no_payment_required
    │   └─> payment_status: pending
    │   └─> No redirect
    │
    └─> IF payment_mode = 'online':
        └─> STATUS: confirmed_by_customer
        └─> Redirect to Payment Gateway (Future)
        └─> After Payment: STATUS: advance_paid

                                     12. Production Flow
                                         ├─> View Job Cards
                                         ├─> Assign to Production Staff
                                         ├─> Track Progress
                                         └─> Complete Job Cards

                                     13. Quality Inspection
                                         ├─> Fill QIR Forms
                                         ├─> Mark Pass/Fail
                                         └─> Add QC Notes

                                     14. Delivery/Pickup
                                         └─> Mark Order Completed

═══════════════════════════════════════════════════════════════════════════════════════
```

---

## Detailed Status Flow

### Status Progression

```
pending_staff_review
    ↓
    (Staff approves order)
    ↓
awaiting_customer_confirmation
    ↓
    (Customer verifies OTP)
    ↓
confirmed_by_customer
    ↓
    ┌─────────────┴─────────────┐
    │                           │
    (Cash Payment)          (Online Payment)
    │                           │
    ↓                           ↓
confirmed_no_payment_required   advance_paid
    │                           │
    └─────────────┬─────────────┘
                  ↓
            in_production
                  ↓
         quality_inspection
                  ↓
         ready_for_delivery
                  ↓
              completed
```

### Status Definitions

| Status | Description | Triggered By | Next Status |
|--------|-------------|--------------|-------------|
| `pending_staff_review` | Customer submitted order, waiting for staff | Customer clicks "Request Staff Review" | `awaiting_customer_confirmation` |
| `awaiting_customer_confirmation` | Staff approved, waiting for customer OTP | Staff approves order | `confirmed_by_customer` |
| `confirmed_by_customer` | Customer verified OTP | Customer enters valid OTP | `confirmed_no_payment_required` or `advance_paid` |
| `confirmed_no_payment_required` | Cash payment selected | System (if payment_mode = cash) | `in_production` |
| `advance_paid` | Online payment completed | Payment gateway callback (Future) | `in_production` |
| `in_production` | Job cards assigned to production | Staff starts production | `quality_inspection` |
| `quality_inspection` | Products being inspected | Staff completes job cards | `ready_for_delivery` |
| `ready_for_delivery` | QC passed, ready for customer | Staff approves QIR | `completed` |
| `completed` | Order delivered/picked up | Staff marks completed | - |

---

## Email Notifications

### Email Types & Triggers

| Email Type | Triggered When | Recipient | Contains | Logged In |
|------------|----------------|-----------|----------|-----------|
| **Sale Order Email** | Staff approves order | Customer | PDF attachment, OTP code, download link | `email_logs` table |
| **OTP Reminder** (Future) | OTP expires, customer hasn't confirmed | Customer | New OTP, reminder message | `email_logs` table |
| **Order Confirmation** (Future) | Customer verifies OTP | Customer | Confirmation, next steps | `email_logs` table |
| **Job Card Email** (Optional) | Job card created | Customer/Staff | Job card PDF | `email_logs` table |
| **Payment Reminder** (Future) | Payment pending for X days | Customer | Payment link | `email_logs` table |
| **Order Completed** (Future) | Order marked completed | Customer | Thank you, feedback request | `email_logs` table |

### Email Template: Sale Order with OTP

**From:** Estre <no-reply@estre.app>
**Subject:** Your Estre Sale Order is Ready
**Template:** Premium HTML with Estre branding

**Content:**
```
Hello [Customer Name],

Your sale order has been reviewed and approved by our team!

Order Number: [SO-2024-XXXX]

Your confirmation code is:

┌─────────────┐
│   [123456]  │  (Large, readable display)
└─────────────┘

This code expires in 10 minutes.

[Download PDF Button]

Please review the attached sale order PDF and confirm your order by
entering the code above.

Thank you for choosing Estre!

---
Estre Furniture Manufacturing
Phone: [Contact Number]
Email: support@estre.app
```

---

## OTP Verification System

### OTP Generation

**When:** Staff approves order (status → awaiting_customer_confirmation)

**Process:**
1. Generate 6-digit random OTP
2. Set expiry time: `now() + 10 minutes`
3. Store in `sale_orders.otp_code` and `sale_orders.otp_expires_at`
4. Send email with OTP to customer

**OTP Format:**
- 6 digits
- Example: `123456`, `987654`
- Stored as text in database
- Expires after 10 minutes

### OTP Verification

**When:** Customer clicks "Confirm Order" and enters OTP

**Process:**
1. Customer enters OTP in confirmation page
2. Frontend calls `verify-sale-order-otp` edge function
3. Edge function:
   - Fetches sale order
   - Compares OTP: `saleOrder.otp_code === enteredOTP`
   - Checks expiry: `saleOrder.otp_expires_at > now()`
   - If valid:
     - Updates status to `confirmed_by_customer`
     - Clears OTP: `otp_code = null`, `otp_expires_at = null`
     - Generates job cards automatically
     - Generates QIRs automatically
     - Returns success
   - If invalid:
     - Returns error message
     - Customer can retry (until expiry)

**Error Messages:**
- Invalid OTP: "Invalid OTP code"
- Expired OTP: "OTP has expired. Please request a new one."
- Not found: "Sale order not found"

### OTP Expiry Handling

**Current:**
- OTP expires after 10 minutes
- Customer must contact support for new OTP

**Future Enhancement:**
- Add "Resend OTP" button
- Generate new OTP and send new email
- Invalidate previous OTP

---

## Job Card & QIR Generation

### Automatic Job Card Creation

**Triggered:** When customer verifies OTP (status → confirmed_by_customer)

**Process:**
1. Edge function `verify-sale-order-otp` is called
2. After OTP verification succeeds
3. System fetches all `order_items` for the order
4. For each order item:
   - Generate job card number: `[Order Number]/01`, `/02`, etc.
   - Parse product configuration
   - Generate technical specifications
   - Create job card HTML (draft and final)
   - Insert into `job_cards` table
5. Job cards status: `pending`

### Automatic QIR Creation

**Triggered:** After job cards are created

**Process:**
1. For each created job card:
   - Generate QIR number: `QIR-[Order Number]-01`, `-02`, etc.
   - Map job card data to QIR format
   - Generate QIR HTML
   - Insert into `quality_inspection_reports` table
2. QIRs status: `pending`

**QIR Fields:**
- Inspection checklist (pre-populated)
- Product dimensions
- Material specifications
- Quality parameters
- Pass/Fail checkboxes
- QC notes field

---

## Payment Flow

### Payment Modes

**1. Cash Payment**
- Selected at checkout: `payment_mode = 'cash'`
- After OTP verification:
  - Status: `confirmed_no_payment_required`
  - Payment status: `pending`
  - No payment gateway redirect
- Payment collected at delivery/pickup

**2. Online Payment (Future)**
- Selected at checkout: `payment_mode = 'online'`
- After OTP verification:
  - Status: `confirmed_by_customer`
  - Redirect to payment gateway
  - Advance payment: 50% (configurable)
  - After payment success:
    - Status: `advance_paid`
    - Payment status: `advance_paid`
    - Store transaction ID and gateway name

### Payment Status

| Payment Status | Description | When |
|----------------|-------------|------|
| `pending` | No payment received | Initial state, cash orders |
| `advance_paid` | 50% advance paid | Online payment completed |
| `fully_paid` | 100% payment received | At delivery or final payment |
| `refunded` | Payment refunded | Cancellation |
| `failed` | Payment failed | Payment gateway error |

---

## Database Schema

### Key Tables

**sale_orders**
- Primary order record
- Contains: customer info, pricing, payment details
- OTP fields: `otp_code`, `otp_expires_at`, `otp_verified_at`
- Payment fields: `payment_mode`, `payment_status`, `advance_amount_rs`
- PDF: `pdf_url`, `draft_html`, `final_html`

**orders**
- Base order with items
- Links to: `order_items`
- Contains: customer details, delivery info

**order_items**
- Individual products in order
- Contains: product details, configuration, pricing

**job_cards**
- Production instructions
- One per order item
- Links to: `sale_order_id`, `order_item_id`
- Contains: technical specs, production notes

**quality_inspection_reports**
- QC records
- One per job card
- Links to: `job_card_id`
- Contains: inspection checklist, QC notes, pass/fail

**email_logs**
- Email tracking
- Logs all sent emails
- Contains: recipient, status, metadata, error messages

---

## Customer Dashboard Views

### Order States in Dashboard

**1. Pending Staff Review**
- Badge: "Pending Review" (yellow)
- Actions: View details only
- Message: "Your order is awaiting staff review"

**2. Awaiting Customer Confirmation**
- Badge: "Awaiting Your Confirmation" (orange)
- Actions:
  - "Review & Confirm Order" button
  - Download PDF
- Message: "Please review and confirm your order"

**3. Confirmed**
- Badge: "Confirmed" (green)
- Actions:
  - View order details
  - Download PDF
  - Track progress
- Message: "Your order is confirmed and in production"

**4. In Production**
- Badge: "In Production" (blue)
- Actions: View job cards, track progress
- Message: "Your order is being manufactured"

**5. Quality Inspection**
- Badge: "Quality Check" (purple)
- Actions: View QIR status
- Message: "Your order is undergoing quality inspection"

**6. Ready for Delivery**
- Badge: "Ready" (green)
- Actions: Schedule pickup/delivery
- Message: "Your order is ready!"

**7. Completed**
- Badge: "Completed" (gray)
- Actions: View history, reorder
- Message: "Thank you for your order!"

---

## Staff Dashboard Operations

### Pending Orders (pending_staff_review)

**View:**
- List of all pending orders
- Customer name, order date, total amount
- "View Details" button

**Actions:**
1. View order configuration
2. Check pricing breakdown
3. Apply discount code
4. Apply manual discount
5. **Approve Order** button

**On Approve:**
- Generate sale order PDF
- Generate OTP
- Send email to customer
- Update status to `awaiting_customer_confirmation`
- Show success message

### Awaiting Confirmation (awaiting_customer_confirmation)

**View:**
- List of orders waiting for customer
- Shows OTP status (pending/expired)
- Time since sent

**Actions:**
- View order details
- Download PDF
- Resend OTP (Future)
- Contact customer

### Confirmed Orders (confirmed_by_customer, advance_paid, etc.)

**View:**
- All confirmed orders
- Filter by status
- Search by order number

**Actions:**
- View job cards
- Assign to production staff
- Update job card status
- Fill QIR forms
- Mark as completed

---

## Production Workflow

### Job Card Lifecycle

```
pending
  ↓
  (Staff assigns to production)
  ↓
in_progress
  ↓
  (Production completes)
  ↓
completed
  ↓
  (Moved to QC)
  ↓
quality_inspection
  ↓
  (QC completes)
  ↓
approved / rejected
```

### QIR Lifecycle

```
pending
  ↓
  (QC inspector starts)
  ↓
in_progress
  ↓
  (Inspector completes checklist)
  ↓
passed / failed
  ↓
  (If failed: rework)
  ↓
passed
  ↓
  (All QIRs passed: order ready)
```

---

## Email Logging & Monitoring

### Email Log Entry

Every email sent creates a log entry:

```typescript
{
  email_type: "sale_order" | "otp" | "job_card" | "custom",
  recipient_email: "customer@example.com",
  recipient_name: "John Doe",
  subject: "Your Estre Sale Order is Ready",
  resend_email_id: "re_abc123...",
  status: "sent" | "delivered" | "bounced" | "failed",
  order_number: "SO-2024-001",
  sale_order_id: "uuid",
  metadata: {
    otp: "123456",
    pdfUrl: "https://...",
    hasAttachment: true
  },
  error_message: null,
  sent_at: "2024-01-15T10:30:00Z"
}
```

### Monitoring Queries

**Recent emails:**
```sql
SELECT email_type, recipient_email, status, sent_at
FROM email_logs
WHERE sent_at > NOW() - INTERVAL '24 hours'
ORDER BY sent_at DESC;
```

**Failed emails:**
```sql
SELECT * FROM email_logs
WHERE status = 'failed'
AND sent_at > NOW() - INTERVAL '7 days';
```

**Email stats:**
```sql
SELECT
  email_type,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
FROM email_logs
WHERE sent_at > NOW() - INTERVAL '30 days'
GROUP BY email_type;
```

---

## Error Handling

### Common Errors & Solutions

**1. OTP Generation Failed**
- Cause: Database error, OTP generation logic error
- Solution: Retry order approval, check logs
- Fallback: Staff manually contacts customer

**2. Email Send Failed**
- Cause: Invalid email, Resend API error, API key issue
- Solution: Check `email_logs` table for error message
- Logged: Yes, with full error details
- Retry: Staff can resend email

**3. OTP Expired**
- Cause: Customer took > 10 minutes to confirm
- Solution:
  - Current: Contact support for new OTP
  - Future: "Resend OTP" button

**4. Job Card Generation Failed**
- Cause: Invalid configuration, template error
- Solution:
  - Order still confirmed (customer verified OTP)
  - Staff manually creates job cards
  - Error logged in edge function logs

**5. PDF Generation Failed**
- Cause: Browserless API error, template error
- Solution:
  - Order approval fails
  - Staff sees error message
  - Can retry approval
  - Check edge function logs

---

## Security Features

### Access Control

**Customer:**
- View own orders only
- View own email logs only
- Cannot access other customers' data

**Staff:**
- View all orders
- View all email logs
- Can approve orders
- Can create job cards
- Can update order status

**Admin:**
- Full access to all data
- Can manage users
- Can configure system settings
- Can view analytics

### RLS Policies

**sale_orders:**
- Customers: SELECT own orders (`customer_id = auth.uid()`)
- Staff/Admin: SELECT all orders
- System: INSERT (for edge functions)
- Staff/Admin: UPDATE

**email_logs:**
- Customers: SELECT where `recipient_email = user's email`
- Staff/Admin: SELECT all
- Service role: INSERT (for logging)
- Staff/Admin: UPDATE (for status changes)

### OTP Security

- 6 digits (1 million combinations)
- Expires after 10 minutes
- Cleared after successful verification
- Logged in email_logs (for audit)
- Cannot be reused

---

## Future Enhancements

### Phase 1: Email Improvements
- [ ] Resend OTP button
- [ ] OTP expiry warning email (at 8 minutes)
- [ ] Order confirmation email (after OTP verification)
- [ ] Email templates for all status changes

### Phase 2: Payment Integration
- [ ] Razorpay/Stripe integration
- [ ] 50% advance payment
- [ ] Automatic status update after payment
- [ ] Payment receipts via email

### Phase 3: Customer Experience
- [ ] SMS notifications (OTP, status updates)
- [ ] WhatsApp notifications
- [ ] Live order tracking
- [ ] Estimated delivery date

### Phase 4: Staff Tools
- [ ] Mobile app for production staff
- [ ] Barcode scanning for job cards
- [ ] Photo upload for QIR
- [ ] Bulk order operations

### Phase 5: Analytics
- [ ] Email delivery rate dashboard
- [ ] Order conversion funnel
- [ ] Production efficiency metrics
- [ ] Customer satisfaction surveys

---

## Testing Checklist

### Customer Flow
- [ ] Add product to cart
- [ ] Fill delivery details
- [ ] Accept terms
- [ ] Click "Request Staff Review"
- [ ] Order created with correct status

### Staff Flow
- [ ] View pending order
- [ ] Apply discount (optional)
- [ ] Approve order
- [ ] PDF generated successfully
- [ ] Email sent to customer
- [ ] Status updated correctly

### Email Flow
- [ ] Email received in inbox (not spam)
- [ ] Sender: Estre <no-reply@estre.app>
- [ ] PDF attached and downloadable
- [ ] OTP visible and correct
- [ ] Email logged in database

### OTP Verification
- [ ] Enter valid OTP → Success
- [ ] Enter invalid OTP → Error message
- [ ] Enter expired OTP → Expiry message
- [ ] Job cards created automatically
- [ ] QIRs created automatically
- [ ] Status updated correctly

### Production Flow
- [ ] View job cards
- [ ] Update job card status
- [ ] Fill QIR form
- [ ] Mark order completed
- [ ] All statuses update correctly

---

## API Endpoints

### Edge Functions

**send-email-with-pdf**
- Method: POST
- URL: `/functions/v1/send-email-with-pdf`
- Auth: Required (anon key)
- Body:
  ```json
  {
    "type": "sale_order" | "otp" | "job_card",
    "to": "email@example.com",
    "customerName": "John Doe",
    "otp": "123456",
    "orderNumber": "SO-2024-001",
    "pdfUrl": "https://...",
    "pdfBase64": "base64...",
    "pdfFileName": "sale-order.pdf"
  }
  ```

**generate-sale-order-pdf**
- Method: POST
- URL: `/functions/v1/generate-sale-order-pdf`
- Auth: Required (anon key)
- Body:
  ```json
  {
    "saleOrderId": "uuid"
  }
  ```

**verify-sale-order-otp**
- Method: POST
- URL: `/functions/v1/verify-sale-order-otp`
- Auth: Required (anon key)
- Body:
  ```json
  {
    "saleOrderId": "uuid",
    "otpCode": "123456"
  }
  ```

---

## Conclusion

This workflow ensures:

✅ **Clear customer journey** - From product selection to order confirmation
✅ **Staff control** - Review and approve all orders before processing
✅ **Email notifications** - Professional communication at every step
✅ **OTP security** - Verified customer confirmation
✅ **Automatic job cards** - Seamless transition to production
✅ **Quality assurance** - QIR tracking for every product
✅ **Payment flexibility** - Cash and online payment support
✅ **Complete tracking** - Email logs and order history

**Total Automation:** PDF generation, email sending, job card creation, QIR generation
**Total Transparency:** Customers and staff see real-time order status
**Total Security:** RLS policies, OTP verification, secure email communication

---

**Last Updated:** December 12, 2024
**Version:** 2.0 (With Email Integration & OTP Verification)
