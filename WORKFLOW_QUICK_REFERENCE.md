# Estre Workflow - Quick Reference

## 30-Second Overview

```
Customer → Configure Product → Add to Cart → Checkout → Request Staff Review
                                                            ↓
Staff → Review Order → Apply Discount → Approve
                                          ↓
System → Generate PDF → Generate OTP → Send Email (PDF + OTP)
                                          ↓
Customer → Receives Email → Review PDF → Enter OTP → Confirm
                                          ↓
System → Create Job Cards → Create QIRs → Start Production
                                          ↓
Staff → Manufacture → Quality Check → Deliver → Complete
```

---

## Status Quick Reference

| Status | Who Sees | What Happens Next |
|--------|----------|-------------------|
| `pending_staff_review` | Staff | Staff reviews and approves |
| `awaiting_customer_confirmation` | Customer | Customer receives email, enters OTP |
| `confirmed_by_customer` | Both | Job cards created, production starts |
| `in_production` | Both | Staff manufactures products |
| `quality_inspection` | Staff | QC team inspects |
| `ready_for_delivery` | Both | Customer schedules pickup/delivery |
| `completed` | Both | Order complete |

---

## Email Flow

### When Email is Sent
✅ **After Staff Approves Order**
- Email type: Sale Order with OTP
- Recipient: Customer
- Contains: PDF attachment, 6-digit OTP, download link
- OTP expires: 10 minutes

### Email Template
```
From: Estre <no-reply@estre.app>
Subject: Your Estre Sale Order is Ready

Hello [Customer],
Your order [SO-2024-XXX] has been approved!

Your confirmation code: [123456]
(Expires in 10 minutes)

[Download PDF Button]

Please review the PDF and confirm your order.
```

---

## OTP Verification

### OTP Details
- **Length:** 6 digits
- **Validity:** 10 minutes
- **Format:** `123456` (numeric only)
- **Delivery:** Via email with PDF

### How It Works
1. Staff approves → System generates OTP
2. Email sent to customer with OTP
3. Customer opens email, sees OTP
4. Customer goes to "Review & Confirm Order" page
5. Customer enters OTP
6. System verifies:
   - OTP matches
   - Not expired
7. If valid:
   - Status → `confirmed_by_customer`
   - Job cards created automatically
   - QIRs created automatically

### Error Messages
- ❌ **Invalid OTP:** "Invalid OTP code"
- ⏰ **Expired:** "OTP has expired. Please request a new one."
- 🔍 **Not Found:** "Sale order not found"

---

## Customer Actions by Status

### pending_staff_review
- ⏳ **Wait** - Staff is reviewing your order
- 👀 **View** - Order details available in dashboard

### awaiting_customer_confirmation
- ✉️ **Check Email** - PDF and OTP sent
- 📄 **Download PDF** - Review order details
- ✅ **Enter OTP** - Confirm order (10 min validity)

### confirmed_by_customer
- ✅ **Confirmed** - Order is confirmed
- 🏭 **Production** - Job cards created
- 📊 **Track** - View production progress

### in_production
- 🔨 **Manufacturing** - Products being made
- 📋 **View Job Cards** - See production details

### ready_for_delivery
- 🚚 **Schedule** - Arrange pickup/delivery
- 💰 **Payment** - Complete payment (if pending)

---

## Staff Actions by Status

### pending_staff_review
- 👁️ **Review** - Check order details
- 💰 **Discount** - Apply discounts (optional)
- ✅ **Approve** - Generate PDF, send email

### awaiting_customer_confirmation
- ⏳ **Wait** - Customer confirming order
- 📧 **Resend** - Resend OTP if needed (Future)
- 📞 **Contact** - Call customer if delayed

### confirmed_by_customer
- 📋 **View Job Cards** - Automatically created
- 👷 **Assign** - Assign to production staff
- 🏭 **Start Production** - Begin manufacturing

### in_production
- ✏️ **Update Status** - Track job card progress
- 📸 **Upload Photos** - Document production (Future)
- ✅ **Complete** - Mark job cards complete

### quality_inspection
- 📝 **Fill QIR** - Complete inspection checklist
- ✅❌ **Pass/Fail** - Mark products as passed/failed
- 🔄 **Rework** - Send back if failed

---

## Payment Flow

### Cash Payment
```
Customer confirms order
    ↓
Status: confirmed_no_payment_required
    ↓
Payment collected at delivery
    ↓
Payment status: fully_paid
```

### Online Payment (Future)
```
Customer confirms order
    ↓
Redirect to payment gateway
    ↓
Pay 50% advance
    ↓
Status: advance_paid
    ↓
Remaining 50% at delivery
    ↓
Payment status: fully_paid
```

---

## Job Card & QIR

### Automatic Creation
**When:** Customer verifies OTP
**What:**
- 1 Job Card per order item
- 1 QIR per job card
- All created automatically
- Status: `pending`

### Job Card Contents
- Product specifications
- Dimensions
- Materials
- Configuration details
- Production instructions
- Technical drawings (if applicable)

### QIR Contents
- Inspection checklist
- Quality parameters
- Measurements
- Pass/Fail criteria
- QC notes
- Inspector signature

---

## Email Logging

### What Gets Logged
✅ Every email sent by the system
✅ Recipient email and name
✅ Email type (sale_order, otp, job_card)
✅ Resend email ID (for tracking)
✅ Status (sent, delivered, bounced, failed)
✅ OTP code (in metadata)
✅ Error messages (if failed)
✅ Timestamp

### Where
📊 **Database Table:** `email_logs`
🔍 **View:** Staff/Admin dashboard (Future)
📈 **Analytics:** Delivery rates, bounce rates

---

## Common Scenarios

### ✅ Happy Path (Cash Payment)
1. Customer configures product → Adds to cart
2. Customer fills delivery details → Requests staff review
3. Staff reviews → Applies discount → Approves
4. System sends email with PDF + OTP
5. Customer receives email → Enters OTP → Confirms
6. System creates job cards + QIRs
7. Staff manufactures → QC inspects → Delivers
8. Customer pays cash → Order complete

**Time:** ~2-3 weeks

### ⏰ OTP Expired
1. Customer receives email with OTP
2. Customer delays > 10 minutes
3. Customer tries to confirm → "OTP expired" error
4. **Current:** Customer contacts support
5. **Future:** Customer clicks "Resend OTP" button

### ❌ Email Failed
1. Staff approves order → Email sending starts
2. Email fails (invalid email, API error, etc.)
3. Error logged in `email_logs` table
4. Staff sees error message
5. Staff can:
   - Verify customer email
   - Manually resend email
   - Contact customer directly

### 🔄 Order Modification
1. Customer confirms order
2. Customer wants to change something
3. **Current:** Contact staff, staff creates new order
4. **Future:** Cancellation + modification flow

---

## Key Times

| Action | Time |
|--------|------|
| Staff review | 1-2 business days |
| PDF generation | 30 seconds |
| Email delivery | 5-30 seconds |
| OTP validity | 10 minutes |
| Production | 1-2 weeks |
| Quality inspection | 1-2 days |
| Delivery | 1-3 days |

---

## Support Resources

### For Customers
- 📧 Email: support@estre.app
- 📞 Phone: [Contact Number]
- 💬 Chat: Available in dashboard (Future)

### For Staff
- 📖 Documentation: See COMPLETE_WORKFLOW_UPDATED.md
- 🔧 Admin Panel: Access all orders, users, settings
- 📊 Analytics: Email logs, order stats (Future)

---

## Troubleshooting

### "Order not showing in dashboard"
✅ Refresh page
✅ Check order status
✅ Verify you're logged in

### "OTP not received"
✅ Check spam folder
✅ Verify email address
✅ Contact support for resend

### "OTP not working"
✅ Check for typos
✅ Verify OTP hasn't expired (10 min)
✅ Try again or contact support

### "PDF not downloading"
✅ Check browser settings
✅ Try different browser
✅ Contact support for manual send

---

## Quick Commands

### Test Email
```bash
curl -X POST [SUPABASE_URL]/functions/v1/send-email-with-pdf \
  -H "Authorization: Bearer [ANON_KEY]" \
  -d '{"type":"otp","to":"test@example.com","customerName":"Test","otp":"123456"}'
```

### View Recent Emails
```sql
SELECT * FROM email_logs
WHERE sent_at > NOW() - INTERVAL '1 day'
ORDER BY sent_at DESC;
```

### Check Order Status
```sql
SELECT order_number, status, created_at
FROM sale_orders
WHERE customer_id = '[USER_ID]'
ORDER BY created_at DESC;
```

---

**For complete details, see:** `COMPLETE_WORKFLOW_UPDATED.md`

**For email setup, see:** `RESEND_EMAIL_SETUP_GUIDE.md`

**Last Updated:** December 12, 2024
