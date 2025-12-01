# PDF Generation Integration Guide

Complete guide for generating and managing PDFs in the Estre Configurator Pro application.

## System Architecture

### Edge Functions
1. **`generate-sale-order-pdf`** - Generates customer-facing sale order PDFs
2. **`generate-job-card-pdf`** - Generates production job card PDFs
3. **`send-order-email`** - Sends emails with PDF attachments via Hostinger SMTP

### PDF Services (Dual API Support)
- **Primary**: PDFGeneratorAPI (fastest, recommended)
- **Fallback**: Browserless API (backup option)

### Templates
- **Premium Sale Order**: Luxury green & gold design with company branding
- **Job Card**: Technical specifications for production team

---

## Configuration

### Required Supabase Secrets

Set these via CLI or Supabase Dashboard:

```bash
# PDF Generation (choose at least one)
supabase secrets set PDF_GENERATOR_API_KEY=your_key_here        # Recommended
supabase secrets set BROWSERLESS_API_KEY=your_key_here          # Fallback/Alternative

# Email Services
supabase secrets set RESEND_API_KEY=your_resend_key_here        # For Resend emails
# OR use your existing Hostinger SMTP configuration with send-order-email function
```

### Get API Keys

**PDFGeneratorAPI** (Recommended):
1. Sign up at https://pdfgeneratorapi.com
2. Get API key from dashboard
3. Free tier: 100 PDFs/month

**Browserless**:
1. Sign up at https://www.browserless.io
2. Get API token from dashboard
3. Free tier: 1000 requests/month

**Resend**:
1. Sign up at https://resend.com
2. Get API key from dashboard
3. Verify your domain

---

## API Reference

### 1. Generate Sale Order PDF

#### Endpoint
```typescript
supabase.functions.invoke('generate-sale-order-pdf', { body: {...} })
```

#### Parameters
```typescript
{
  saleOrderId: string;      // Required - Sale order UUID
  mode?: 'draft' | 'final'; // Optional - Default: 'final'
  requireOTP?: boolean;     // Optional - Generate OTP for customer, Default: false
  skipEmail?: boolean;      // Optional - Skip email sending, Default: false
}
```

#### Response
```typescript
{
  success: boolean;
  message: string;
  saleOrderId: string;
  pdfUrl: string;          // Public URL to view/download PDF
  pdfBase64: string;       // Base64-encoded PDF for email attachment
  mode: 'draft' | 'final';
  requireOTP: boolean;
  otpGenerated: boolean;
  emailSent: boolean;      // true if email was sent successfully
}
```

#### Example Usage

**Draft Mode** (Preview only, no email):
```typescript
const { data, error } = await supabase.functions.invoke('generate-sale-order-pdf', {
  body: {
    saleOrderId: 'uuid-here',
    mode: 'draft'
  }
});

// Use pdfUrl to show preview
console.log('Preview PDF:', data.pdfUrl);
```

**Final Mode with Email** (Default):
```typescript
const { data, error } = await supabase.functions.invoke('generate-sale-order-pdf', {
  body: {
    saleOrderId: 'uuid-here',
    mode: 'final',
    requireOTP: true  // Customer must enter OTP to confirm
  }
});

console.log('PDF URL:', data.pdfUrl);
console.log('Email sent:', data.emailSent);
```

**Final Mode without Email** (Manual email later):
```typescript
const { data, error } = await supabase.functions.invoke('generate-sale-order-pdf', {
  body: {
    saleOrderId: 'uuid-here',
    mode: 'final',
    skipEmail: true    // Generate PDF but don't send email yet
  }
});

// Later, send email with send-order-email function
const pdfBase64 = data.pdfBase64;
```

---

### 2. Send Order Email

#### Endpoint
```typescript
supabase.functions.invoke('send-order-email', { body: {...} })
```

#### Parameters
```typescript
{
  customerEmail: string;
  orderId: string;
  orderDetails: string;    // Summary text
  pdfBase64: string;       // From generate-sale-order-pdf response
}
```

---

## Integration Examples

### Complete Order Confirmation Flow

```typescript
// After order is placed and confirmed by customer
async function sendSaleOrderPDF(saleOrderId: string) {
  try {
    // Step 1: Generate PDF with automatic email
    const { data: pdfData, error: pdfError } = await supabase.functions.invoke(
      'generate-sale-order-pdf',
      {
        body: {
          saleOrderId: saleOrderId,
          mode: 'final',
          requireOTP: false  // or true if you want OTP confirmation
        }
      }
    );

    if (pdfError) {
      console.error('PDF generation failed:', pdfError);
      return { success: false, error: pdfError };
    }

    // Email is automatically sent (unless skipEmail: true)
    console.log('✅ PDF generated:', pdfData.pdfUrl);
    console.log('✅ Email sent:', pdfData.emailSent);

    return { success: true, pdfUrl: pdfData.pdfUrl };
  } catch (error) {
    console.error('Error in order confirmation:', error);
    return { success: false, error };
  }
}
```

### Manual Email Flow (Two-Step)

```typescript
// Use this if you want to generate PDF first, then email later
async function generateAndEmailSeparately(saleOrderId: string, customerEmail: string) {
  // Step 1: Generate PDF without sending email
  const { data: pdfData, error: pdfError } = await supabase.functions.invoke(
    'generate-sale-order-pdf',
    {
      body: {
        saleOrderId: saleOrderId,
        mode: 'final',
        skipEmail: true  // Don't send email yet
      }
    }
  );

  if (pdfError) throw pdfError;

  // Step 2: Send email manually (using Hostinger SMTP)
  const { data: emailData, error: emailError } = await supabase.functions.invoke(
    'send-order-email',
    {
      body: {
        customerEmail: customerEmail,
        orderId: saleOrderId,
        orderDetails: `Sale Order ${pdfData.saleOrderId}`,
        pdfBase64: pdfData.pdfBase64
      }
    }
  );

  if (emailError) throw emailError;

  console.log('✅ Both PDF and Email sent successfully');
}
```

---

## Testing Guide

### 1. Test PDF Generation (Console)

Open browser console on your app:

```javascript
// Get a sale order ID from your database
const testOrderId = 'your-sale-order-uuid';

// Test draft generation
const { data, error } = await supabase.functions.invoke('generate-sale-order-pdf', {
  body: {
    saleOrderId: testOrderId,
    mode: 'draft'
  }
});

console.log('Draft PDF:', data.pdfUrl);
// Open in new tab: window.open(data.pdfUrl)
```

### 2. Verify Storage Upload

1. Go to Supabase Dashboard → Storage → `documents` bucket
2. Check folders:
   - `sale-orders/draft/` - Draft PDFs
   - `sale-orders/final/` - Final PDFs
3. Download and verify PDF quality

### 3. Test Email Delivery

```javascript
// Generate final PDF with email
const { data, error } = await supabase.functions.invoke('generate-sale-order-pdf', {
  body: {
    saleOrderId: testOrderId,
    mode: 'final',
    requireOTP: false
  }
});

console.log('Email sent:', data.emailSent);
// Check your inbox!
```

---

## Troubleshooting

### PDF Generation Fails

**Error: "PDF generation requires either PDF_GENERATOR_API_KEY or BROWSERLESS_API_KEY"**
- **Solution**: Set at least one API key in Supabase secrets

**Error: "PDFGeneratorAPI error: 401"**
- **Solution**: Check if API key is correct and active

**Error: "Browserless API error: Unauthorized"**
- **Solution**: Verify Browserless API token

### Email Not Sending

**Email sent: false**
- Check `RESEND_API_KEY` is set in Supabase secrets
- Verify domain is verified in Resend dashboard
- Check spam folder in customer email

### PDF Quality Issues

**Images not showing**
- Ensure images are accessible publicly
- Check `logoBase64.ts` has valid base64 encoded logo

**Formatting broken**
- Review `premiumSaleOrderTemplate.ts` for CSS issues
- Test in different PDF viewers

---

## Feature Checklist

- ✅ Premium luxury design (green & gold)
- ✅ Dual API support (PDFGeneratorAPI + Browserless)
- ✅ Draft/Final modes
- ✅ Email integration (Resend + Hostinger SMTP)
- ✅ OTP generation for customer confirmation
- ✅ Storage upload to Supabase
- ✅ Base64 return for email attachments
- ✅ Comprehensive error handling
- ✅ Cost breakdown with GST
- ✅ Payment schedule
- ✅ Terms & conditions
- ✅ Customer & company signatures

---

## Next Steps

1. **Set API Keys** in Supabase Dashboard
2. **Test PDF Generation** with a sample order
3. **Verify Email Delivery** to your email
4. **Review PDF Quality** (design, content)
5. **Integrate into Checkout Flow** (e.g., in `Checkout.tsx`)

For additional support, check the edge function code in:
- `supabase/functions/generate-sale-order-pdf/index.ts`
- `supabase/functions/_shared/premiumSaleOrderTemplate.ts`
