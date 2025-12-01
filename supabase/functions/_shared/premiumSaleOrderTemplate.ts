/**
 * Premium Sale Order Template
 * Estre Global Private Ltd - New Branding (Dark Brown & Gold)
 */

// Placeholder for logo if needed, or we pass it in data
// import { LOGO_BASE64 } from "./logoBase64.ts"; 
// We will assume LOGO_BASE64 is handled or passed, or we use a public URL for now to avoid dependency issues.
const LOGO_BASE64 = "https://estre.in/wp-content/uploads/2023/11/Estre-Logo-1.png"; // Fallback or use base64 if available

export interface SaleOrderTemplateData {
  // Order Info
  orderNumber: string;
  orderDate: string;
  deliveryDate: string;

  // Customer
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;

  // Shipping
  shippingName: string;
  shippingAddress: string;
  shippingPhone: string;
  shippingEmail: string;

  // Financial
  finalPrice: number;
  basePrice: number;
  discount: number;
  gstAmount?: number;

  // Dynamic content
  productsTableHTML: string;
  paymentTermsHTML: string;

  // Static/Computed
  dispatchThrough: string;
  estreGst: string;
  buyerGst: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

export function generatePremiumSaleOrderHTML(data: SaleOrderTemplateData): string {
  const {
    orderNumber,
    orderDate,
    deliveryDate,
    customerName,
    customerAddress,
    customerPhone,
    customerEmail,
    shippingName,
    shippingAddress,
    shippingPhone,
    shippingEmail,
    productsTableHTML,
    paymentTermsHTML,
    dispatchThrough,
    estreGst,
    buyerGst,
    finalPrice,
    basePrice,
    discount
  } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Estre – Sale Order ${orderNumber}</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700&family=Montserrat:wght@300;400;600;700&display=swap" rel="stylesheet">

<style>
/* --- BRAND COLOURS (From Estre Brand Sheet) --- */
:root {
  --estre-white: #F4F5F0;
  --estre-gold: #D6B485;
  --estre-brown: #937867;
  --estre-dark: #664331;
  --estre-accent1: #B57454;
  --estre-accent2: #938E6C;

  --font-primary: 'Montserrat', sans-serif;
  --font-secondary: 'Nunito', sans-serif;
}

/* GENERAL */
body {
  font-family: var(--font-primary);
  background: white;
  margin: 0;
  padding: 40px;
  color: #222;
}
.section-title {
  font-family: var(--font-primary);
  font-size: 18px;
  font-weight: 700;
  margin-top: 40px;
  border-bottom: 3px solid var(--estre-gold);
  padding-bottom: 6px;
  color: var(--estre-dark);
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
}
.logo img {
  width: 170px;
  max-height: 80px;
  object-fit: contain;
}
.company-info {
  text-align: right;
  font-size: 13px;
  line-height: 18px;
}

/* SALE ORDER TOP */
.so-box {
  margin-top: 20px;
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 6px;
  background: var(--estre-white);
}
.so-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 6px;
}

/* ADDRESS BLOCKS */
.address-container {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}
.address-box {
  width: 48%;
  background: #fafafa;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.5;
}

/* PRODUCT TABLE */
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  margin-top: 20px;
}
.table th {
  background: var(--estre-gold);
  color: white;
  padding: 10px;
  text-align: left;
}
.table td {
  padding: 10px;
  border-bottom: 1px solid #eee;
  vertical-align: top;
}

/* SUB-SECTION TITLES */
.sub-header {
  margin-top: 15px;
  margin-bottom: 5px;
  font-weight: 700;
  font-size: 15px;
  color: var(--estre-brown);
  border-bottom: 1px dashed #ddd;
  padding-bottom: 2px;
  display: inline-block;
}

/* TOTAL */
.total-box {
  margin-top: 30px;
  padding: 20px;
  background: var(--estre-accent2);
  color: white;
  border-radius: 6px;
  font-size: 18px;
  font-weight: 700;
  text-align: right;
}

/* PRINT OPTIMIZATION */
@media print {
  body {
    margin: 0;
    padding: 20px;
  }
  .no-print {
    display: none;
  }
  .page-break {
    page-break-before: always;
  }
}
</style>
</head>

<body>

<!-- HEADER -->
<div class="header">
  <div class="logo">
    <img src="${LOGO_BASE64}" alt="Estre Logo" />
  </div>
  <div class="company-info">
    <strong>ESTRE GLOBAL PRIVATE LTD</strong><br>
    Near Dhoni Public School, AECS Layout – A Block<br>
    Revenue Layout, Singasandra, Bengaluru – 560068<br>
    Ph: +91 8722200100<br>
    Email: support@estre.in<br>
    Website: www.estre.in<br>
    GST: ${estreGst}
  </div>
</div>

<!-- SALE ORDER TOP -->
<div class="so-box">
  <div class="so-row"><strong>SALE ORDER No:</strong> ${orderNumber}</div>
  <div class="so-row"><strong>Date:</strong> ${orderDate}</div>
  <div class="so-row"><strong>Mode of Payment:</strong> ${paymentTermsHTML}</div>
  <div class="so-row"><strong>Date of Delivery:</strong> ${deliveryDate}</div>
  <div class="so-row"><strong>Despatch Through:</strong> ${dispatchThrough}</div>
  ${buyerGst ? `<div class="so-row"><strong>Buyer GST:</strong> ${buyerGst}</div>` : ''}
</div>

<!-- ADDRESS SECTIONS -->
<div class="address-container">
  <div class="address-box">
    <strong>Invoice To:</strong><br>
    ${customerName}<br>
    ${customerAddress.replace(/\n/g, '<br>')}<br>
    Mobile: ${customerPhone}<br>
    Email: ${customerEmail}
  </div>

  <div class="address-box">
    <strong>To be Dispatched To:</strong><br>
    ${shippingName}<br>
    ${shippingAddress.replace(/\n/g, '<br>')}<br>
    Mobile: ${shippingPhone}<br>
    Email: ${shippingEmail}
  </div>
</div>

<!-- PRODUCT SECTION -->
<div class="section-title">PRODUCT DETAILS</div>

<table class="table">
  <tr>
    <th style="width: 50px;">Sl No.</th>
    <th>Description of the Product</th>
    <th style="width: 120px; text-align: right;">Amount (Rs.)</th>
    <th style="width: 120px; text-align: right;">Total (Rs.)</th>
  </tr>

  ${productsTableHTML}

  <!-- Summary Rows -->
  ${discount > 0 ? `
  <tr>
    <td></td>
    <td style="text-align: right;"><strong>Subtotal</strong></td>
    <td></td>
    <td style="text-align: right;">${formatCurrency(basePrice)}</td>
  </tr>
  <tr>
    <td></td>
    <td style="text-align: right; color: #d9534f;"><strong>Discount</strong></td>
    <td></td>
    <td style="text-align: right; color: #d9534f;">-${formatCurrency(discount)}</td>
  </tr>
  ` : ''}

</table>

<!-- TOTAL -->
<div class="total-box">
  Total Cost: ${formatCurrency(finalPrice)}
</div>

</body>
</html>`;
}
