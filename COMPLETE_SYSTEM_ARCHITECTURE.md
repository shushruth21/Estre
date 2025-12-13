# Complete System Architecture - Estre Furniture E-Commerce Platform

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Application Architecture](#application-architecture)
4. [Authentication & Authorization](#authentication--authorization)
5. [Database Schema](#database-schema)
6. [Business Workflow](#business-workflow)
7. [PDF Generation System](#pdf-generation-system)
8. [Email System](#email-system)
9. [Edge Functions](#edge-functions)
10. [Frontend Architecture](#frontend-architecture)
11. [Deployment Architecture](#deployment-architecture)
12. [Security Model](#security-model)
13. [API Endpoints](#api-endpoints)
14. [Storage Architecture](#storage-architecture)

---

## 1. System Overview

### Purpose
Enterprise-grade furniture e-commerce platform with custom product configurator, order management, manufacturing workflow, and automated document generation.

### Key Features
- Multi-category product configurator (Sofas, Beds, Chairs, etc.)
- Dynamic pricing engine with real-time calculations
- Role-based access control (Customer, Staff, Admin)
- Automated PDF generation (Sale Orders, Job Cards, QIR)
- Email automation with PDF attachments
- Manufacturing workflow management
- Quality inspection tracking
- OAuth & Email/Password authentication

### User Roles
- **Customer**: Browse products, configure, place orders, track status
- **Staff**: Process orders, manage job cards, conduct QC inspections
- **Admin**: Full system access, user management, settings control

---

## 2. Technology Stack

### Frontend
```
Framework:     React 18 + TypeScript
Build Tool:    Vite 5
Router:        React Router v6
State:         React Context API + TanStack Query
UI Library:    Radix UI + shadcn/ui
Styling:       Tailwind CSS 3
Forms:         React Hook Form + Zod
Icons:         Lucide React
```

### Backend & Infrastructure
```
Database:      PostgreSQL (Supabase)
Auth:          Supabase Auth (Email/Password + Google OAuth)
Storage:       Supabase Storage
Functions:     Supabase Edge Functions (Deno)
Email:         Resend API
PDF:           Browserless.io API
Hosting:       Vercel (Frontend)
```

### Development Tools
```
Language:      TypeScript 5
Package Mgr:   npm
Linter:        ESLint 9
Code Style:    Prettier (via ESLint)
```

---

## 3. Application Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  Browser (React SPA) → Vercel CDN → Static Assets           │
│  - Customer Dashboard                                        │
│  - Staff Dashboard                                           │
│  - Admin Dashboard                                           │
│  - Product Configurator                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database (Row Level Security)                    │
│  - Products, Orders, Users, Job Cards                        │
│  - Real-time Subscriptions                                   │
│                                                              │
│  Supabase Storage (Object Storage)                           │
│  - Fabric images, Product images                             │
│  - Generated PDFs (Sale Orders, Job Cards, QIR)             │
│                                                              │
│  Supabase Auth                                               │
│  - Email/Password Authentication                             │
│  - Google OAuth 2.0                                          │
│  - Session Management                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                   EDGE FUNCTIONS LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  Supabase Edge Functions (Deno Runtime)                      │
│  - generate-sale-order-pdf                                   │
│  - generate-job-card-pdf                                     │
│  - send-email-with-pdf                                       │
│  - send-sale-order-pdf-after-otp                            │
│  - verify-sale-order-otp                                     │
│  - admin-create-user                                         │
│  - admin-update-user-role                                    │
│  - admin-delete-user                                         │
│  - admin-list-users                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                          │
├─────────────────────────────────────────────────────────────┤
│  Resend API          →  Transactional Email Delivery         │
│  Browserless.io      →  HTML to PDF Conversion              │
│  Google OAuth        →  Social Authentication                │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow Examples

#### 1. Customer Places Order
```
User → React App → Supabase Client → PostgreSQL (orders table)
                                    ↓
                          Trigger: on_order_confirmed
                                    ↓
                          Edge Function: generate-sale-order-pdf
                                    ↓
                          Browserless API (PDF Generation)
                                    ↓
                          Supabase Storage (save PDF)
                                    ↓
                          Edge Function: send-email-with-pdf
                                    ↓
                          Resend API (send email)
                                    ↓
                          email_logs table (logging)
```

#### 2. Staff Updates Job Card Status
```
Staff → React App → Supabase Client → PostgreSQL (job_cards table)
                                    ↓
                          RLS Policy Check (role = 'staff')
                                    ↓
                          Update job_cards SET status = 'in_production'
                                    ↓
                          Real-time Broadcast to Admin Dashboard
```

#### 3. Customer Configures Product
```
User → Product Configurator Component
     ↓
Dynamic Pricing Engine (Client-side)
     ↓
Pricing Formulas from database
     ↓
Real-time Price Calculation
     ↓
Add to Cart (localStorage)
     ↓
Checkout → Create Order (database)
```

---

## 4. Authentication & Authorization

### Authentication Methods

#### Email/Password
```typescript
// Sign Up
supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password',
  options: {
    data: { full_name: 'John Doe' }
  }
})

// Sign In
supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure_password'
})
```

#### Google OAuth
```typescript
supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://yourdomain.com/auth/callback'
  }
})
```

### Authorization Model

#### Role Hierarchy
```
┌──────────┐
│  Admin   │  ← Full system access
└──────────┘
     ↓
┌──────────┐
│  Staff   │  ← Order processing, QC, Job Cards
└──────────┘
     ↓
┌──────────┐
│ Customer │  ← View own orders, configure products
└──────────┘
```

#### Role Assignment
- Stored in `profiles.role` column
- Enum: `'customer' | 'staff' | 'admin'`
- Default: `'customer'`
- Admin can change via `admin-update-user-role` edge function

### Row Level Security (RLS)

#### Example: Orders Table
```sql
-- Customers can only view their own orders
CREATE POLICY "Customers view own orders"
ON orders FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('staff', 'admin')
  )
);

-- Staff can update order status
CREATE POLICY "Staff can update orders"
ON orders FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('staff', 'admin')
  )
);
```

---

## 5. Database Schema

### Core Tables

#### users (Supabase Auth)
```sql
-- Managed by Supabase Auth
id                uuid PRIMARY KEY
email             text UNIQUE
encrypted_password text
created_at        timestamptz
```

#### profiles
```sql
CREATE TABLE profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id),
  email           text,
  full_name       text,
  phone           text,
  role            user_role DEFAULT 'customer',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TYPE user_role AS ENUM ('customer', 'staff', 'admin');
```

#### products
```sql
CREATE TABLE products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  category        text NOT NULL,
  description     text,
  base_price      numeric(10,2) NOT NULL,
  image_url       text,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Categories: 'sofa', 'bed', 'dining_chair', 'arm_chair',
--             'recliner', 'sofa_bed', 'pouffe', etc.
```

#### orders
```sql
CREATE TABLE orders (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number          text UNIQUE NOT NULL,
  user_id               uuid REFERENCES profiles(id),
  status                order_status DEFAULT 'pending',
  total_amount          numeric(10,2) NOT NULL,
  gst_amount            numeric(10,2),
  final_amount          numeric(10,2),
  discount_code         text,
  discount_amount       numeric(10,2),
  customer_name         text,
  customer_email        text,
  customer_phone        text,
  delivery_address      jsonb,
  delivery_method       text,
  payment_method        text,
  payment_status        text,
  notes                 text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE TYPE order_status AS ENUM (
  'pending',
  'awaiting_customer_confirmation',
  'confirmed_by_customer',
  'processing',
  'manufacturing',
  'quality_check',
  'ready_for_delivery',
  'dispatched',
  'delivered',
  'cancelled'
);
```

#### order_items
```sql
CREATE TABLE order_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id        uuid REFERENCES products(id),
  quantity          integer NOT NULL DEFAULT 1,
  unit_price        numeric(10,2) NOT NULL,
  total_price       numeric(10,2) NOT NULL,
  configuration     jsonb NOT NULL, -- Product-specific config
  created_at        timestamptz DEFAULT now()
);
```

#### sale_orders
```sql
CREATE TABLE sale_orders (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                    uuid REFERENCES orders(id),
  order_number                text UNIQUE NOT NULL,
  status                      text DEFAULT 'draft',
  customer_name               text NOT NULL,
  customer_email              text NOT NULL,
  customer_phone              text,
  billing_address             jsonb,
  shipping_address            jsonb,
  subtotal                    numeric(10,2) NOT NULL,
  gst_amount                  numeric(10,2),
  discount_amount             numeric(10,2),
  total_amount                numeric(10,2) NOT NULL,
  payment_method              text,
  payment_status              text DEFAULT 'pending',
  payment_transaction_id      text,
  delivery_method             text,
  expected_delivery_date      date,
  pdf_url                     text,
  final_pdf_url               text,
  otp_code                    text,
  otp_expires_at              timestamptz,
  otp_verified_at             timestamptz,
  confirmed_at                timestamptz,
  created_at                  timestamptz DEFAULT now(),
  updated_at                  timestamptz DEFAULT now()
);
```

#### job_cards
```sql
CREATE TABLE job_cards (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_order_id           uuid REFERENCES sale_orders(id),
  order_id                uuid REFERENCES orders(id),
  job_card_number         text UNIQUE NOT NULL,
  status                  text DEFAULT 'pending',
  priority                text DEFAULT 'normal',
  customer_name           text NOT NULL,
  customer_email          text,
  customer_phone          text,
  product_details         jsonb NOT NULL,
  technical_specifications jsonb,
  materials_required      jsonb,
  assigned_to             uuid REFERENCES profiles(id),
  production_notes        text,
  quality_check_status    text,
  pdf_url                 text,
  started_at              timestamptz,
  completed_at            timestamptz,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);
```

#### quality_inspection_reports (qir)
```sql
CREATE TABLE quality_inspection_reports (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id           uuid REFERENCES job_cards(id),
  sale_order_id         uuid REFERENCES sale_orders(id),
  inspector_id          uuid REFERENCES profiles(id),
  inspection_date       timestamptz DEFAULT now(),
  overall_status        text DEFAULT 'pending',
  checklist             jsonb NOT NULL,
  defects_found         jsonb,
  corrective_actions    text,
  inspector_notes       text,
  approved_by           uuid REFERENCES profiles(id),
  approved_at           timestamptz,
  pdf_url               text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);
```

#### email_logs
```sql
CREATE TABLE email_logs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_order_id       uuid REFERENCES sale_orders(id),
  job_card_id         uuid REFERENCES job_cards(id),
  email_type          text NOT NULL,
  recipient_email     text NOT NULL,
  subject             text NOT NULL,
  status              text NOT NULL,
  resend_email_id     text,
  error_message       text,
  metadata            jsonb,
  created_at          timestamptz DEFAULT now()
);
```

### Configuration Tables

#### system_settings
```sql
CREATE TABLE system_settings (
  key                 text PRIMARY KEY,
  value               jsonb NOT NULL,
  description         text,
  updated_by          uuid REFERENCES profiles(id),
  updated_at          timestamptz DEFAULT now()
);

-- Examples: 'gst_rate', 'default_delivery_days', 'company_info'
```

#### discount_codes
```sql
CREATE TABLE discount_codes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                text UNIQUE NOT NULL,
  description         text,
  discount_type       text NOT NULL, -- 'percentage' or 'fixed'
  discount_value      numeric(10,2) NOT NULL,
  min_order_amount    numeric(10,2),
  max_discount_amount numeric(10,2),
  valid_from          timestamptz,
  valid_until         timestamptz,
  usage_limit         integer,
  usage_count         integer DEFAULT 0,
  is_active           boolean DEFAULT true,
  created_at          timestamptz DEFAULT now()
);
```

#### Dropdown Options Tables
```sql
-- fabric_options, wood_options, arm_rest_options, etc.
-- Each category has its own dropdown options table

CREATE TABLE fabric_options (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  category        text,
  price_per_sqft  numeric(10,2),
  image_url       text,
  is_available    boolean DEFAULT true,
  sort_order      integer,
  created_at      timestamptz DEFAULT now()
);
```

### Indexes for Performance
```sql
-- Orders
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Order Items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Job Cards
CREATE INDEX idx_job_cards_status ON job_cards(status);
CREATE INDEX idx_job_cards_assigned_to ON job_cards(assigned_to);
CREATE INDEX idx_job_cards_sale_order_id ON job_cards(sale_order_id);

-- Email Logs
CREATE INDEX idx_email_logs_sale_order_id ON email_logs(sale_order_id);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);

-- Products
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
```

---

## 6. Business Workflow

### Order Lifecycle

```
┌──────────────────┐
│  Customer Places │
│     Order        │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Status: Pending  │
│ Generate Draft   │
│   Sale Order     │
└────────┬─────────┘
         ↓
┌──────────────────┐
│  Send OTP to     │
│ Customer Email   │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Customer Verifies│
│      OTP         │
└────────┬─────────┘
         ↓
┌───────────────────────────────┐
│ Status: confirmed_by_customer │
│ Generate Final Sale Order PDF │
│ Send Email with PDF           │
└────────┬──────────────────────┘
         ↓
┌──────────────────┐
│ Staff Reviews    │
│ Status: Processing│
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Generate Job Card│
│ Status: Manufacturing│
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Production Team  │
│ Works on Order   │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ QC Inspector     │
│ Creates QIR      │
│ Status: Quality Check│
└────────┬─────────┘
         ↓
┌──────────────────┐
│ QC Approved      │
│ Status: Ready for│
│    Delivery      │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Status: Dispatched│
│ Tracking Info    │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Status: Delivered│
│ Order Complete   │
└──────────────────┘
```

### Document Generation Flow

```
Order Confirmed
       ↓
┌─────────────────────────────┐
│ Edge Function:              │
│ generate-sale-order-pdf     │
├─────────────────────────────┤
│ 1. Fetch order data         │
│ 2. Generate HTML template   │
│ 3. Call Browserless API     │
│ 4. Receive PDF binary       │
│ 5. Upload to Storage        │
│ 6. Update sale_orders table │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ Edge Function:              │
│ send-sale-order-pdf-after-otp│
├─────────────────────────────┤
│ 1. Download PDF from Storage│
│ 2. Encode as base64         │
│ 3. Generate email HTML      │
│ 4. Call Resend API          │
│ 5. Log to email_logs        │
└─────────────┬───────────────┘
              ↓
┌─────────────────────────────┐
│ Customer receives email     │
│ with PDF attachment         │
└─────────────────────────────┘
```

---

## 7. PDF Generation System

### Architecture

```
┌────────────────────────────────────────────┐
│         Edge Function                       │
│  (generate-sale-order-pdf / job-card-pdf)   │
└────────────────┬───────────────────────────┘
                 ↓
┌────────────────────────────────────────────┐
│  1. Fetch Data from Database               │
│     - Sale order details                    │
│     - Order items with configurations       │
│     - Customer information                  │
│     - Company settings                      │
└────────────────┬───────────────────────────┘
                 ↓
┌────────────────────────────────────────────┐
│  2. Map Data to Template Format            │
│     - mapSaleOrderData()                   │
│     - mapJobCardData()                     │
│     - Technical specs generator            │
└────────────────┬───────────────────────────┘
                 ↓
┌────────────────────────────────────────────┐
│  3. Generate HTML Template                 │
│     - premiumSaleOrderTemplate()           │
│     - Premium styling with Tailwind        │
│     - Company branding (logo base64)       │
└────────────────┬───────────────────────────┘
                 ↓
┌────────────────────────────────────────────┐
│  4. Call Browserless.io API                │
│     POST /pdf                              │
│     Headers: API Key                       │
│     Body: { html, options }                │
└────────────────┬───────────────────────────┘
                 ↓
┌────────────────────────────────────────────┐
│  5. Receive PDF Binary                     │
│     Response: ArrayBuffer                  │
└────────────────┬───────────────────────────┘
                 ↓
┌────────────────────────────────────────────┐
│  6. Upload to Supabase Storage             │
│     Bucket: documents                      │
│     Path: sale-orders/final/{id}.pdf       │
└────────────────┬───────────────────────────┘
                 ↓
┌────────────────────────────────────────────┐
│  7. Update Database with PDF URL           │
│     sale_orders.final_pdf_url = url        │
└────────────────────────────────────────────┘
```

### PDF Templates

#### Sale Order PDF
- **Purpose**: Final invoice for customer
- **Sections**:
  - Company header with logo
  - Sale order number & date
  - Customer details
  - Billing & shipping address
  - Itemized product list with configurations
  - Pricing breakdown (Subtotal, GST, Discount, Total)
  - Payment terms
  - Terms & conditions
  - Company footer with contact info

#### Job Card PDF
- **Purpose**: Manufacturing instructions
- **Sections**:
  - Job card number & priority
  - Customer information
  - Product details & specifications
  - Technical specifications table
  - Materials required
  - Dimensions breakdown
  - Special instructions
  - QC checkpoints
  - Sign-off section

#### QIR PDF
- **Purpose**: Quality inspection report
- **Sections**:
  - Inspection details
  - Product information
  - Checklist with pass/fail
  - Defects found (if any)
  - Corrective actions
  - Inspector signature
  - Approval section

---

## 8. Email System

### Email Architecture

```
┌────────────────────────────────────┐
│     Trigger Event                  │
│  - Order confirmed                 │
│  - Status updated                  │
│  - Manual email request            │
└────────────┬───────────────────────┘
             ↓
┌────────────────────────────────────┐
│  Edge Function                     │
│  send-sale-order-pdf-after-otp     │
│  or send-email-with-pdf            │
└────────────┬───────────────────────┘
             ↓
┌────────────────────────────────────┐
│  1. Validate Request               │
│     - Check authentication         │
│     - Verify sale order exists     │
│     - Check PDF availability       │
└────────────┬───────────────────────┘
             ↓
┌────────────────────────────────────┐
│  2. Download PDF from Storage      │
│     - Get public URL               │
│     - Fetch file content           │
│     - Convert to base64            │
└────────────┬───────────────────────┘
             ↓
┌────────────────────────────────────┐
│  3. Generate Email HTML            │
│     - Premium email template       │
│     - Company branding             │
│     - Order summary                │
│     - Call-to-action buttons       │
└────────────┬───────────────────────┘
             ↓
┌────────────────────────────────────┐
│  4. Call Resend API                │
│     POST /emails                   │
│     Body: {                        │
│       from: 'orders@estrie.in'     │
│       to: customer_email           │
│       subject: 'Sale Order PDF'    │
│       html: email_html             │
│       attachments: [pdf_base64]    │
│     }                              │
└────────────┬───────────────────────┘
             ↓
┌────────────────────────────────────┐
│  5. Log to Database                │
│     email_logs table               │
│     - email_type                   │
│     - recipient_email              │
│     - status: 'sent' | 'failed'    │
│     - resend_email_id              │
│     - error_message (if failed)    │
└────────────┬───────────────────────┘
             ↓
┌────────────────────────────────────┐
│  6. Return Response                │
│     Success: { emailId, status }   │
│     Error: { error, details }      │
└────────────────────────────────────┘
```

### Email Types

#### 1. Order Confirmation Email
- **Trigger**: Customer verifies OTP
- **Template**: Sale order confirmation
- **Attachment**: Final sale order PDF
- **Recipient**: Customer email

#### 2. OTP Verification Email
- **Trigger**: Order placed (pending confirmation)
- **Template**: OTP code email
- **Attachment**: None
- **Recipient**: Customer email

#### 3. Status Update Email
- **Trigger**: Order status changes
- **Template**: Status update notification
- **Attachment**: None or relevant PDF
- **Recipient**: Customer email

#### 4. Job Card Email
- **Trigger**: Manual send by staff
- **Template**: Job card details
- **Attachment**: Job card PDF
- **Recipient**: Production team

### Email Logging & Monitoring

```sql
-- Query email delivery status
SELECT
  email_type,
  recipient_email,
  subject,
  status,
  created_at,
  error_message
FROM email_logs
WHERE sale_order_id = 'xxx'
ORDER BY created_at DESC;
```

**EmailDeliveryMonitor Component** (Staff Dashboard):
- Real-time email status display
- Retry failed emails
- View email history
- Track delivery metrics

---

## 9. Edge Functions

### Function Overview

| Function Name | Purpose | Trigger | Response |
|--------------|---------|---------|----------|
| `generate-sale-order-pdf` | Generate sale order PDF | Manual/Auto | PDF URL |
| `generate-job-card-pdf` | Generate job card PDF | Manual | PDF URL |
| `send-sale-order-pdf-after-otp` | Email PDF to customer | Manual/Auto | Email ID |
| `send-email-with-pdf` | Generic email with PDF | Manual | Email ID |
| `verify-sale-order-otp` | Verify customer OTP | Manual | Success/Fail |
| `admin-create-user` | Create new user account | Admin only | User ID |
| `admin-update-user-role` | Change user role | Admin only | Success |
| `admin-delete-user` | Delete user account | Admin only | Success |
| `admin-list-users` | List all users | Admin only | User array |

### Function Details

#### generate-sale-order-pdf
```typescript
// Endpoint
POST /functions/v1/generate-sale-order-pdf

// Request
{
  "saleOrderId": "uuid"
}

// Response
{
  "pdfUrl": "https://...storage.../sale-orders/final/uuid.pdf",
  "success": true
}

// Process Flow
1. Fetch sale order & items from database
2. Map data to template format
3. Generate HTML with premiumSaleOrderTemplate()
4. Call Browserless API for PDF generation
5. Upload PDF to Storage bucket
6. Update sale_orders.final_pdf_url
7. Return public URL
```

#### send-sale-order-pdf-after-otp
```typescript
// Endpoint
POST /functions/v1/send-sale-order-pdf-after-otp

// Request
{
  "saleOrderId": "uuid"
}

// Response
{
  "emailId": "resend_email_id",
  "success": true,
  "message": "Email sent successfully"
}

// Process Flow
1. Validate sale order exists
2. Check final_pdf_url is populated
3. Download PDF from Storage
4. Convert PDF to base64
5. Generate email HTML template
6. Send via Resend API with attachment
7. Log to email_logs table
8. Return Resend email ID
```

#### admin-update-user-role
```typescript
// Endpoint
POST /functions/v1/admin-update-user-role

// Request
{
  "userId": "uuid",
  "newRole": "staff" | "admin" | "customer"
}

// Response
{
  "success": true,
  "message": "User role updated"
}

// Security
- Requires service_role key
- Only callable by admin users
- Validates role enum
```

### Shared Utilities

All edge functions use shared utility modules in `supabase/functions/_shared/`:

```
_shared/
├── browserlessPdf.ts       - PDF generation wrapper
├── emailLogger.ts          - Email logging utility
├── emailTemplates.ts       - Email HTML templates
├── htmlTemplates.ts        - Generic HTML utilities
├── logoBase64.ts           - Company logo (base64)
├── mapJobCardData.ts       - Job card data mapper
├── mapQIRData.ts           - QIR data mapper
├── mapSaleOrderData.ts     - Sale order data mapper
├── numberFormat.ts         - Number formatting
├── premiumJobCardTemplate.ts   - Job card HTML
├── premiumQIRTemplate.ts       - QIR HTML
├── premiumSaleOrderTemplate.ts - Sale order HTML
├── technicalSpecsGenerator.ts  - Spec generation
├── textUtils.ts            - Text utilities
└── types.ts                - Shared TypeScript types
```

### Environment Variables (Edge Functions)

Set in Supabase Dashboard → Edge Functions → Secrets:

```bash
SUPABASE_URL              # Auto-provided
SUPABASE_ANON_KEY         # Auto-provided
SUPABASE_SERVICE_ROLE_KEY # Auto-provided
SUPABASE_DB_URL           # Auto-provided
RESEND_API_KEY            # Required: Resend API key
BROWSERLESS_API_KEY       # Required: Browserless API key
BROWSERLESS_URL           # Required: Browserless endpoint
```

---

## 10. Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── admin/              - Admin dashboard components
│   │   └── AdminLayout.tsx
│   ├── auth/               - Authentication components
│   │   ├── SecurityIndicator.tsx
│   │   └── SSOButtons.tsx
│   ├── cart/               - Shopping cart components
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   └── SavedForLater.tsx
│   ├── checkout/           - Checkout flow components
│   │   ├── DeliveryStep.tsx
│   │   ├── PaymentStep.tsx
│   │   ├── ReviewStep.tsx
│   │   └── StepIndicator.tsx
│   ├── configurators/      - Product configurators
│   │   ├── SofaConfigurator.tsx
│   │   ├── BedConfigurator.tsx
│   │   ├── ReclinerConfigurator.tsx
│   │   ├── FabricSelector.tsx
│   │   └── PricingSummary.tsx
│   ├── orders/             - Order documents
│   │   ├── JobCardDocument.tsx
│   │   ├── SaleOrderDocument.tsx
│   │   └── PerfectSaleOrder.tsx
│   ├── staff/              - Staff dashboard components
│   │   ├── StaffLayout.tsx
│   │   ├── EmailDeliveryMonitor.tsx
│   │   ├── JobCardsDisplay.tsx
│   │   ├── QCInspectionForm.tsx
│   │   └── SaleOrderDetailsSection.tsx
│   └── ui/                 - Reusable UI components (shadcn)
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── form.tsx
│       └── ... (50+ components)
├── pages/
│   ├── admin/              - Admin pages
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminOrders.tsx
│   │   ├── AdminUsers.tsx
│   │   ├── AdminProducts.tsx
│   │   ├── AdminSettings.tsx
│   │   └── AdminJobCards.tsx
│   ├── staff/              - Staff pages
│   │   ├── StaffDashboard.tsx
│   │   ├── StaffOrders.tsx
│   │   ├── StaffJobCards.tsx
│   │   ├── StaffSaleOrders.tsx
│   │   └── StaffQIRList.tsx
│   ├── Index.tsx           - Homepage
│   ├── Products.tsx        - Product catalog
│   ├── Configure.tsx       - Product configurator
│   ├── Cart.tsx            - Shopping cart
│   ├── Checkout.tsx        - Checkout flow
│   ├── Orders.tsx          - Customer orders list
│   ├── OrderDetail.tsx     - Order details
│   ├── Login.tsx           - Login page
│   └── Signup.tsx          - Registration page
├── context/
│   └── AuthContext.tsx     - Auth state management
├── hooks/
│   ├── useAuth.tsx         - Auth hook
│   ├── useAdminSettings.tsx - Settings hook
│   ├── useDropdownOptions.tsx - Dropdown data hook
│   ├── usePricingFormulas.tsx - Pricing logic hook
│   └── useRealtimeOrders.ts - Real-time subscriptions
├── lib/
│   ├── dynamic-pricing.ts  - Pricing engine
│   ├── email.ts            - Email utilities
│   ├── pdf-download.ts     - PDF download helper
│   ├── pricing-engine.ts   - Core pricing logic
│   ├── validation-engine.ts - Form validation
│   └── utils.ts            - General utilities
└── integrations/
    └── supabase/
        ├── client.ts       - Supabase client
        ├── adminClient.ts  - Admin client (service role)
        └── types.ts        - Generated database types
```

### State Management

#### Auth State (Context API)
```typescript
// AuthContext.tsx
const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
  signUp: async () => {}
});

// Usage
const { user, profile } = useAuth();
```

#### Server State (TanStack Query)
```typescript
// Fetch orders with caching
const { data: orders, isLoading } = useQuery({
  queryKey: ['orders', userId],
  queryFn: async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId);
    return data;
  }
});
```

#### Client State (React useState)
```typescript
// Cart state (localStorage)
const [cart, setCart] = useState<CartItem[]>(() => {
  const saved = localStorage.getItem('cart');
  return saved ? JSON.parse(saved) : [];
});
```

### Routing

```typescript
// App.tsx
<Routes>
  {/* Public routes */}
  <Route path="/" element={<Index />} />
  <Route path="/products" element={<Products />} />
  <Route path="/configure/:productId" element={<Configure />} />
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />

  {/* Protected customer routes */}
  <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
  <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />

  {/* Staff routes */}
  <Route path="/staff/*" element={
    <ProtectedRoute requiredRole="staff">
      <StaffLayout />
    </ProtectedRoute>
  } />

  {/* Admin routes */}
  <Route path="/admin/*" element={
    <ProtectedRoute requiredRole="admin">
      <AdminLayout />
    </ProtectedRoute>
  } />
</Routes>
```

---

## 11. Deployment Architecture

### Production Infrastructure

```
┌─────────────────────────────────────────────────┐
│                 CLIENT BROWSER                   │
└────────────────┬────────────────────────────────┘
                 ↓ HTTPS
┌─────────────────────────────────────────────────┐
│            VERCEL EDGE NETWORK                   │
│  - Global CDN                                    │
│  - SSL/TLS termination                           │
│  - DDoS protection                               │
│  - Automatic compression                         │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│         VERCEL SERVERLESS FUNCTIONS              │
│  - React SPA (Static files)                      │
│  - Client-side routing                           │
│  - Environment variables                         │
└────────────────┬────────────────────────────────┘
                 ↓ API Calls
┌─────────────────────────────────────────────────┐
│          SUPABASE CLOUD                          │
│  ┌──────────────────────────────────┐            │
│  │   PostgreSQL Database            │            │
│  │   - Primary: us-east-1           │            │
│  │   - Read replicas (auto)         │            │
│  │   - Point-in-time recovery       │            │
│  └──────────────────────────────────┘            │
│  ┌──────────────────────────────────┐            │
│  │   Supabase Storage (S3)          │            │
│  │   - documents bucket             │            │
│  │   - public-images bucket         │            │
│  └──────────────────────────────────┘            │
│  ┌──────────────────────────────────┐            │
│  │   Supabase Auth                  │            │
│  │   - JWT token management         │            │
│  │   - OAuth providers              │            │
│  └──────────────────────────────────┘            │
│  ┌──────────────────────────────────┐            │
│  │   Edge Functions (Deno)          │            │
│  │   - Deployed globally            │            │
│  │   - Auto-scaling                 │            │
│  └──────────────────────────────────┘            │
└────────────────┬────────────────────────────────┘
                 ↓ API Calls
┌─────────────────────────────────────────────────┐
│         EXTERNAL SERVICES                        │
│  ┌──────────────┐  ┌──────────────┐             │
│  │   Resend     │  │ Browserless  │             │
│  │   Email API  │  │   PDF API    │             │
│  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────┘
```

### Environment Configuration

#### Vercel Environment Variables
```bash
# Frontend (.env → Vercel Settings)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

#### Supabase Secrets (Edge Functions)
```bash
# Set in Supabase Dashboard → Settings → Edge Functions → Secrets
RESEND_API_KEY=re_xxx
BROWSERLESS_API_KEY=xxx
BROWSERLESS_URL=https://production-sfo.browserless.io
```

### Deployment Process

#### Frontend Deployment (Vercel)
```bash
# Automatic deployment on git push
git push origin main

# Vercel automatically:
1. Detects changes
2. Runs: npm run build
3. Deploys to edge network
4. Updates DNS
5. Invalidates CDN cache
```

#### Edge Functions Deployment
```bash
# Via Supabase CLI
supabase functions deploy function-name

# Deploy all functions
supabase functions deploy

# The CLI:
1. Bundles function code
2. Uploads to Supabase
3. Deploys globally
4. Updates routing
```

#### Database Migrations
```bash
# Apply migration
supabase db push

# Or via Supabase Dashboard:
# SQL Editor → Paste migration → Run
```

### DNS Configuration

```
Domain: estrie.in

DNS Records:
  @ (root)       A      76.76.21.21 (Vercel)
  www            CNAME  cname.vercel-dns.com
  _vercel        TXT    verification-code

Email DNS (Resend):
  @              MX     feedback-smtp.us-east-1.amazonses.com
  resend._domainkey CNAME xxx.dkim.amazonses.com
```

---

## 12. Security Model

### Defense Layers

```
┌─────────────────────────────────────────┐
│  Layer 1: Network Security              │
│  - HTTPS/TLS 1.3 only                   │
│  - CORS configuration                   │
│  - DDoS protection (Vercel)             │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  Layer 2: Authentication                │
│  - Supabase Auth (JWT)                  │
│  - OAuth 2.0 (Google)                   │
│  - Password hashing (bcrypt)            │
│  - Session management                   │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  Layer 3: Authorization (RLS)           │
│  - Row-level security policies          │
│  - Role-based access control            │
│  - User-scoped data access              │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  Layer 4: Input Validation              │
│  - Zod schema validation                │
│  - SQL injection prevention             │
│  - XSS protection                       │
│  - CSRF tokens                          │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│  Layer 5: API Security                  │
│  - Rate limiting                        │
│  - API key rotation                     │
│  - Request signing                      │
└─────────────────────────────────────────┘
```

### Row Level Security (RLS)

#### Principle: Restrictive by Default

```sql
-- Enable RLS on all tables
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Default: NO ACCESS until policies are added
-- Explicitly grant access via policies
```

#### Example Policies

**Orders Table:**
```sql
-- Customers see only their own orders
CREATE POLICY "customers_view_own_orders"
ON orders FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin')
  )
);

-- Only authenticated users can create orders
CREATE POLICY "authenticated_users_create_orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Staff can update order status
CREATE POLICY "staff_update_order_status"
ON orders FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin')
  )
);
```

**Profiles Table:**
```sql
-- Users can view their own profile
CREATE POLICY "users_view_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "users_update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND (OLD.role = NEW.role OR NEW.role IS NULL)
);

-- Only admins can change roles
CREATE POLICY "admins_update_user_roles"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
```

### API Security

#### Rate Limiting
```typescript
// Edge function rate limiting (Supabase built-in)
// Automatic: 100 requests per minute per IP

// Client-side debouncing
const debouncedSearch = useMemo(
  () => debounce((value: string) => {
    performSearch(value);
  }, 300),
  []
);
```

#### Input Validation
```typescript
// Zod schema validation
const orderSchema = z.object({
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
  totalAmount: z.number().positive()
});

// Validate before submitting
const validatedData = orderSchema.parse(formData);
```

### Secret Management

```bash
# NEVER commit secrets to git
# Use environment variables

# Vercel (Frontend)
Dashboard → Settings → Environment Variables

# Supabase (Edge Functions)
Dashboard → Settings → Edge Functions → Secrets

# Or via CLI
supabase secrets set SECRET_NAME=value
```

### CORS Configuration

```typescript
// Edge function CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey'
};

// Handle OPTIONS preflight
if (req.method === 'OPTIONS') {
  return new Response(null, { status: 200, headers: corsHeaders });
}
```

---

## 13. API Endpoints

### Supabase REST API

#### Products
```
GET  /rest/v1/products
GET  /rest/v1/products?id=eq.{uuid}
GET  /rest/v1/products?category=eq.sofa
POST /rest/v1/products
```

#### Orders
```
GET  /rest/v1/orders
GET  /rest/v1/orders?id=eq.{uuid}
GET  /rest/v1/orders?user_id=eq.{uuid}
POST /rest/v1/orders
PATCH /rest/v1/orders?id=eq.{uuid}
```

#### Sale Orders
```
GET  /rest/v1/sale_orders
GET  /rest/v1/sale_orders?id=eq.{uuid}
POST /rest/v1/sale_orders
PATCH /rest/v1/sale_orders?id=eq.{uuid}
```

#### Job Cards
```
GET  /rest/v1/job_cards
GET  /rest/v1/job_cards?sale_order_id=eq.{uuid}
POST /rest/v1/job_cards
PATCH /rest/v1/job_cards?id=eq.{uuid}
```

### Edge Functions API

```
Base URL: https://{project-ref}.supabase.co/functions/v1

POST /generate-sale-order-pdf
  Body: { saleOrderId: string }
  Response: { pdfUrl: string, success: boolean }

POST /generate-job-card-pdf
  Body: { jobCardId: string }
  Response: { pdfUrl: string, success: boolean }

POST /send-sale-order-pdf-after-otp
  Body: { saleOrderId: string }
  Response: { emailId: string, success: boolean }

POST /verify-sale-order-otp
  Body: { saleOrderId: string, otpCode: string }
  Response: { success: boolean, verified: boolean }

POST /admin-create-user
  Body: { email: string, password: string, role: string }
  Response: { userId: string, success: boolean }

POST /admin-update-user-role
  Body: { userId: string, newRole: string }
  Response: { success: boolean }

POST /admin-delete-user
  Body: { userId: string }
  Response: { success: boolean }

GET /admin-list-users
  Response: { users: Array<User> }
```

### Authentication Headers

```bash
# Supabase REST API
Authorization: Bearer {jwt_token}
apikey: {anon_key}

# Edge Functions
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

---

## 14. Storage Architecture

### Supabase Storage Buckets

#### documents (Private with Public Access)
```
Bucket: documents
Path Structure:
  /sale-orders/
    /final/{sale_order_id}.pdf
    /draft/{sale_order_id}.pdf
  /job-cards/{job_card_id}.pdf
  /qir/{qir_id}.pdf

Access Policy:
  - Public read access (RLS not enforced)
  - Authenticated write access
  - Files are immutable after creation
```

#### public-images (Public)
```
Bucket: public-images
Path Structure:
  /products/{product_id}/{image_name}
  /fabrics/{fabric_id}/{image_name}
  /categories/{category_name}/{image_name}

Access Policy:
  - Full public read access
  - Admin-only write access
```

### Storage Policies

```sql
-- Allow public read access to documents
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Allow authenticated users to upload documents
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Allow public read for images
CREATE POLICY "Public read images"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-images');
```

### File Upload Flow

```typescript
// Upload PDF to storage
const { data, error } = await supabase.storage
  .from('documents')
  .upload(`sale-orders/final/${saleOrderId}.pdf`, pdfBlob, {
    contentType: 'application/pdf',
    cacheControl: '3600',
    upsert: true
  });

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('documents')
  .getPublicUrl(`sale-orders/final/${saleOrderId}.pdf`);
```

---

## Summary

This architecture provides:

✅ **Scalability**: Serverless architecture scales automatically
✅ **Security**: Multi-layer security with RLS, JWT, and encryption
✅ **Performance**: Edge deployment, CDN, database indexes
✅ **Maintainability**: Modular code, TypeScript, clear separation
✅ **Reliability**: Automated backups, error logging, monitoring
✅ **Flexibility**: Easy to extend with new features

The system handles the complete furniture e-commerce lifecycle from product configuration to manufacturing and quality control, with full document automation and email notifications.
