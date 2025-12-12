# 🏭 Estre Configurator Pro - Complete Workflows

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Customer Order Flow](#customer-order-flow)
3. [Staff Sale Order Flow](#staff-sale-order-flow)
4. [Production Flow](#production-flow)
5. [Admin Configuration Flow](#admin-configuration-flow)
6. [Data Architecture](#data-architecture)
7. [Role-Based Access](#role-based-access)

---

## 🎯 System Overview

### Order Hierarchy

```
1 SALE ORDER = 1 Complete Customer Order
        ↓
Multiple ORDER ITEMS = Multiple Products in Order
        ↓
1 ORDER ITEM = 1 JOB CARD (Auto-created)
```

### Example Order Structure

```
Customer orders 3 products:

📦 Sale Order: SO-2024-001 (Complete Order)
   ├─ Order Item 1: L-Shape Sofa      → Job Card: SO-2024-001-01
   ├─ Order Item 2: Single Recliner   → Job Card: SO-2024-001-02
   └─ Order Item 3: Dining Chair (x4) → Job Card: SO-2024-001-03
```

---

## 🛒 Customer Order Flow

### Complete Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER ORDER JOURNEY                       │
└─────────────────────────────────────────────────────────────────┘

DISCOVERY & CONFIGURATION
─────────────────────────
    Browse Products
         ↓
    Select Product Category (Sofa, Recliner, Chair, etc.)
         ↓
    Configure Product
    • Shape/Model
    • Dimensions
    • Fabric Selection
    • Accessories (Console, Headrest, etc.)
    • Preview Price
         ↓
    Add to Cart (can add multiple products)


CHECKOUT
────────
    Review Cart
         ↓
    Enter Delivery Details
    • Name, Phone, Email
    • Delivery Address
    • Special Instructions
         ↓
    Apply Discount Code (optional)
         ↓
    View Final Price
         ↓
    Place Order ←──── [ ORDER PLACED ]


POST-ORDER (ALL AUTOMATIC)
──────────────────────────
    ┌─────────────────────────────────────────────┐
    │ AUTOMATIC SYSTEM ACTIONS (No Manual Steps)  │
    └─────────────────────────────────────────────┘
         ↓
    1. Order created (orders table)
         ↓
    2. Sale Order created (sale_orders table)
         ↓
    3. Job Cards AUTO-CREATED (one per product)
         ↓
    4. Sale Order PDF generated
         ↓
    5. Order Confirmation Email sent
         ↓
    [ CUSTOMER RECEIVES EMAIL + PDF ]


ORDER TRACKING
──────────────
    Customer Dashboard
    • View all orders
    • Track order status
    • View job cards (production progress)
    • Download PDF invoice
    • See delivery timeline
         ↓
    Real-time Status Updates:
    pending → cutting → stitching → upholstery →
    quality_check → ready → dispatched → delivered
         ↓
    [ ORDER DELIVERED ] ✓
```

### Customer Capabilities

| Action | Allowed | Description |
|--------|---------|-------------|
| Browse products | ✅ | View all available products |
| Configure products | ✅ | Customize dimensions, fabric, etc. |
| Place orders | ✅ | Complete checkout flow |
| Track order status | ✅ | Real-time production updates |
| View job cards | ✅ | Read-only production details |
| Download PDFs | ✅ | Sale order / invoice |
| Modify orders | ❌ | Cannot change after placement |
| Create orders for others | ❌ | Only staff can do this |

---

## 👨‍💼 Staff Sale Order Flow

### Creating Orders for Customers

```
┌─────────────────────────────────────────────────────────────────┐
│               STAFF SALE ORDER CREATION                         │
└─────────────────────────────────────────────────────────────────┘

SALES CONSULTATION
──────────────────
    Staff meets customer (in-store/phone/virtual)
         ↓
    Staff creates Sale Order on system
    • Select products
    • Configure specifications
    • Enter customer details
    • Apply discounts
         ↓
    Generate Quote PDF
         ↓
    Review with customer


CUSTOMER VERIFICATION (OTP)
───────────────────────────
    Staff clicks "Send for Approval"
         ↓
    System sends OTP to customer email
         ↓
    Customer receives email with OTP
         ↓
    Customer enters OTP to confirm
         ↓
    [ ORDER CONFIRMED ]


POST-CONFIRMATION (ALL AUTOMATIC)
─────────────────────────────────
    ┌─────────────────────────────────────────────┐
    │ AUTOMATIC SYSTEM ACTIONS (No Manual Steps)  │
    └─────────────────────────────────────────────┘
         ↓
    1. Sale Order status → 'confirmed'
         ↓
    2. Job Cards AUTO-CREATED (one per product)
         ↓
    3. QIRs AUTO-CREATED (Quality Inspection Reports)
         ↓
    4. Final PDF generated
         ↓
    5. Confirmation email sent to customer
         ↓
    [ PRODUCTION BEGINS ]
```

### Staff Capabilities

| Action | Allowed | Description |
|--------|---------|-------------|
| View confirmed orders | ✅ | Read-only access |
| View job cards | ✅ | See all production items |
| Update job card status | ✅ | Move through pipeline |
| Upload QC photos | ✅ | Quality documentation |
| Create sale orders | ✅ | For walk-in customers |
| Approve/reject orders | ❌ | Only customers via OTP |
| Modify pricing | ❌ | Only admin |
| Regenerate PDFs | ❌ | Auto-generated only |
| Email customers | ❌ | System emails only |

---

## 🏭 Production Flow

### Job Card Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                   PRODUCTION PIPELINE                           │
└─────────────────────────────────────────────────────────────────┘

ORDER CONFIRMED
     ↓
┌─────────────────────────────────────────────────────────────────┐
│ JOB CARD AUTO-CREATED                                           │
│                                                                 │
│ Contains:                                                       │
│ • Customer details          • Technical specifications         │
│ • Product configuration     • Fabric codes & meters            │
│ • Dimensions               • Accessories list                   │
│ • Production notes         • PDF template (ready to print)     │
└─────────────────────────────────────────────────────────────────┘
     ↓
┌─────────┐   ┌─────────┐   ┌───────────┐   ┌─────────────┐
│ PENDING │ → │ CUTTING │ → │ STITCHING │ → │ UPHOLSTERY │
└─────────┘   └─────────┘   └───────────┘   └─────────────┘
   (queue)      (fabric)      (sewing)        (assembly)
                  ↓              ↓                ↓
              Staff updates  Staff updates   Staff updates
              job card       job card        job card
     ↓
┌───────────────┐   ┌─────────┐   ┌────────────┐   ┌───────────┐
│ QUALITY_CHECK │ → │  READY  │ → │ DISPATCHED │ → │ DELIVERED │
└───────────────┘   └─────────┘   └────────────┘   └───────────┘
   (inspection)     (packaged)     (shipped)       (received)
        ↓               ↓              ↓               ↓
    QC photos       Ready for      Tracking         Complete!
    uploaded        pickup         number added
```

### Production Stage Details

| Stage | Description | Staff Action | Customer Sees |
|-------|-------------|--------------|---------------|
| **Pending** | Awaiting production start | Assign to queue | "Order confirmed" |
| **Cutting** | Fabric cutting in progress | Update status | "In production" |
| **Stitching** | Sewing operations | Update status | "In production" |
| **Upholstery** | Assembly and finishing | Update status | "In production" |
| **Quality Check** | Inspection | Upload QC photos | "Quality check" |
| **Ready** | Packaged for delivery | Mark ready | "Ready for delivery" |
| **Dispatched** | Shipped with tracking | Add tracking # | "Dispatched" |
| **Delivered** | Customer received | Mark delivered | "Delivered ✓" |

### Job Card Content

```typescript
{
  // Identification
  job_card_number: "SO-2024-001-01",
  so_number: "SO-2024-001",
  order_id: "uuid",
  
  // Customer Info
  customer_name: "John Doe",
  customer_email: "john@example.com",
  customer_phone: "+91 98765 43210",
  delivery_address: {...},
  
  // Product Details
  product_category: "sofa",
  product_title: "L-Shape Sofa - 3+Lounger",
  configuration: {
    shape: "l_shape",
    size: "3+lounger",
    armrest: "full_arm",
    ...
  },
  
  // Technical Specifications
  technical_specifications: {
    dimensions: {...},
    fabric_requirements: {...},
    production_notes: [...],
  },
  
  // Fabric Plan
  fabric_codes: {
    main_fabric: "FB-001",
    contrast_fabric: "FB-002",
  },
  fabric_meters: {
    main: 12.5,
    contrast: 3.2,
    backing: 8.0,
  },
  
  // Status
  status: "pending", // → cutting → stitching → etc.
  priority: "normal",
  
  // Documents
  final_html: "...", // Ready-to-print job card
}
```

---

## ⚙️ Admin Configuration Flow

### System Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN CAPABILITIES                           │
└─────────────────────────────────────────────────────────────────┘

PRODUCT MANAGEMENT
──────────────────
    • Add/Edit/Delete products
    • Set product categories
    • Configure product options
    • Upload product images
    • Set base pricing

PRICING CONFIGURATION
─────────────────────
    • Configure pricing formulas
    • Set dimension-based pricing
    • Fabric pricing tiers
    • Accessory pricing
    • Margin settings

DROPDOWN OPTIONS
────────────────
    • Shape options (L-shape, Straight, etc.)
    • Size options
    • Fabric options
    • Armrest options
    • Color options
    • Wood types
    • And all other configurables

DISCOUNT MANAGEMENT
───────────────────
    • Create discount codes
    • Set discount amounts/percentages
    • Configure validity periods
    • Usage limits
    • Minimum order requirements

USER MANAGEMENT
───────────────
    • Create staff accounts
    • Assign roles (staff, admin)
    • Manage permissions
    • View user activity

MONITORING & ANALYTICS
──────────────────────
    • View all orders
    • Order statistics
    • Production metrics
    • Revenue reports
    • Performance dashboards

SYSTEM SETTINGS
───────────────
    • Email configuration
    • PDF templates
    • Business details
    • Tax settings
    • Delivery zones
```

### Admin Permissions

| Action | Admin | Staff | Customer |
|--------|-------|-------|----------|
| Manage products | ✅ | ❌ | ❌ |
| Set pricing | ✅ | ❌ | ❌ |
| Configure dropdowns | ✅ | ❌ | ❌ |
| Create discount codes | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| View all orders | ✅ | ✅ | Own only |
| Update job cards | ✅ | ✅ | ❌ |
| Approve orders | ✅ | ❌ | ❌ |
| Override restrictions | ✅ | ❌ | ❌ |

---

## 🗄️ Data Architecture

### Database Schema Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE RELATIONSHIPS                       │
└─────────────────────────────────────────────────────────────────┘

profiles (user accounts)
    └── role: admin | staff | customer

orders (main order record)
    ├── customer_id → profiles.user_id
    ├── order_number: "ORD-2024-001"
    ├── status: pending | confirmed | completed | cancelled
    └── has_many: order_items, job_cards, sale_orders

order_items (products in order)
    ├── order_id → orders.id
    ├── product_id → products.id
    ├── configuration: JSON
    └── has_one: job_card

sale_orders (invoice/quote)
    ├── order_id → orders.id
    ├── order_number: "SO-2024-001"
    ├── status: draft | pending_approval | confirmed | cancelled
    └── pdf_url: signed URL

job_cards (production items)
    ├── order_id → orders.id
    ├── order_item_id → order_items.id
    ├── sale_order_id → sale_orders.id
    ├── job_card_number: "SO-2024-001-01"
    ├── status: pending | cutting | stitching | upholstery | 
    │           quality_check | ready | dispatched | delivered
    └── technical_specifications: JSON

quality_inspection_reports (QIRs)
    ├── job_card_id → job_cards.id
    ├── qir_number: "QIR-2024-001-01"
    ├── status: pending | passed | failed
    └── inspection_data: JSON
```

### Key Relationships

```
1 Order → 1 Sale Order → Multiple Order Items → Multiple Job Cards
                                   ↓
                         1 Order Item = 1 Job Card
                                   ↓
                         1 Job Card = 1 QIR
```

---

## 🔐 Role-Based Access

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

LOGIN OPTIONS
─────────────
    1. Email/Password Login
    2. Google OAuth (one-click)
    3. (Optional) Microsoft/Apple OAuth

ROLE DETECTION
──────────────
    User logs in
         ↓
    System checks profiles.role
         ↓
    ┌───────────────────────────────────────┐
    │ ROLE-BASED REDIRECT                   │
    │                                       │
    │ admin      → /admin/dashboard         │
    │ staff      → /staff/dashboard         │
    │ customer   → /dashboard               │
    └───────────────────────────────────────┘

NEW USER (OAuth)
────────────────
    User signs up via Google
         ↓
    Profile AUTO-CREATED (database trigger)
         ↓
    Default role: "customer"
         ↓
    Admin can promote to "staff" or "admin"
```

### Access Matrix

| Page/Feature | Customer | Staff | Admin |
|--------------|----------|-------|-------|
| `/` (Home) | ✅ | ✅ | ✅ |
| `/products` | ✅ | ✅ | ✅ |
| `/configure/:id` | ✅ | ✅ | ✅ |
| `/cart` | ✅ | ✅ | ✅ |
| `/checkout` | ✅ | ✅ | ✅ |
| `/dashboard` | ✅ | ❌ | ❌ |
| `/staff/*` | ❌ | ✅ | ✅ |
| `/admin/*` | ❌ | ❌ | ✅ |

---

## 📧 Email & PDF Flow

### Automatic Communications

```
┌─────────────────────────────────────────────────────────────────┐
│              AUTOMATIC EMAIL & PDF GENERATION                   │
└─────────────────────────────────────────────────────────────────┘

CUSTOMER CHECKOUT
─────────────────
    Order placed
         ↓
    Edge Function: generate-sale-order-pdf
         ↓
    ┌─────────────────────────────────┐
    │ 1. Generate PDF (sale order)   │
    │ 2. Upload to Supabase Storage  │
    │ 3. Send email via Resend API   │
    │ 4. Log email in email_logs     │
    └─────────────────────────────────┘
         ↓
    Customer receives: Order confirmation + PDF attachment

STAFF SALE ORDER (OTP)
──────────────────────
    Staff creates order → Send for approval
         ↓
    Edge Function: generate-sale-order-pdf
         ↓
    Customer receives: OTP email with quote PDF
         ↓
    Customer verifies OTP
         ↓
    Edge Function: verify-sale-order-otp
         ↓
    ┌─────────────────────────────────┐
    │ 1. Confirm sale order          │
    │ 2. Create job cards (auto)     │
    │ 3. Create QIRs (auto)          │
    │ 4. Send confirmation email     │
    └─────────────────────────────────┘
```

---

## 🚀 Summary

### Key Points

1. **Fully Automated Flow** - No manual steps from order to job card creation
2. **1 Order = 1 Sale Order** - Complete customer transaction
3. **1 Product = 1 Job Card** - Individual production tracking
4. **Role-Based Access** - Customer, Staff, Admin with clear boundaries
5. **Real-Time Updates** - Customers see production progress
6. **OTP Verification** - Security for staff-created orders
7. **Automatic PDFs & Emails** - Generated and sent without intervention
8. **Quality Control** - QIRs auto-created with job cards

### Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18, TypeScript, Vite |
| UI | shadcn/ui, Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Email | Resend API |
| PDF | PDFGeneratorAPI / Browserless |
| Authentication | Supabase Auth (Email + Google OAuth) |

---

*Last Updated: December 2024*
