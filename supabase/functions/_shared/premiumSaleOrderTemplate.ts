/**
 * Premium Sale Order Template
 * Luxury green & gold branding, all master prompt features
 * Schema-aligned to actual sale_orders table structure
 */

import { LOGO_BASE64 } from "./logoBase64.ts";

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

    // Financial
    finalPrice: number;
    basePrice: number;
    discount: number;

    // Dynamic content
    productsTableHTML: string;
    costBreakdownHTML: string;
    paymentScheduleHTML: string;
    jobCardsHTML: string;
    termsHTML: string;
}

export function generatePremiumSaleOrderHTML(data: SaleOrderTemplateData): string {
    const {
        orderNumber,
        orderDate,
        deliveryDate,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        finalPrice,
        basePrice,
        discount,
        productsTableHTML,
        costBreakdownHTML,
        paymentScheduleHTML,
        jobCardsHTML,
        termsHTML,
    } = data;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sale Order - ${orderNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
      background: #ffffff;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 15mm;
      background: white;
    }
    
    /* HEADER */
    .header {
      text-align: center;
      margin-bottom: 8mm;
      padding-bottom: 6mm;
      border-bottom: 3px double #006400;
    }
    
    .logo {
      height: 50px;
      margin-bottom: 8px;
    }
    
    .company-name {
      font-size: 22pt;
      font-weight: bold;
      color: #006400;
      letter-spacing: 1px;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    
    .company-tagline {
      font-size: 9pt;
      color: #D4AF37;
      font-style: italic;
      margin-bottom: 8px;
    }
    
    .company-address {
      font-size: 9pt;
      color: #666;
      line-height: 1.4;
    }
    
    .document-title {
      font-size: 18pt;
      font-weight: bold;
      color: #006400;
      text-transform: uppercase;
      margin-top: 8px;
      letter-spacing: 2px;
      border-top: 2px solid #D4AF37;
      border-bottom: 2px solid #D4AF37;
      padding: 8px 0;
      background: linear-gradient(to right, #f9f9f9, white, #f9f9f9);
    }
    
    /* SECTIONS */
    .section-header {
      font-size: 13pt;
      font-weight: bold;
      color: white;
      background: linear-gradient(135deg, #006400 0%, #004d00 100%);
      padding: 8px 12px;
      margin: 10mm 0 4mm 0;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 2px 4px rgba(0,100,0,0.2);
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6mm;
      margin-bottom: 8mm;
    }
    
    .info-box {
      border: 2px solid #006400;
      padding: 8px;
      border-radius: 4px;
      background: #f9f9f9;
    }
    
    .info-box-title {
      font-size: 11pt;
      font-weight: bold;
      color: #006400;
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1px solid #D4AF37;
    }
    
    /* TABLES */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6mm;
      font-size: 10pt;
    }
    
    table th {
      background: linear-gradient(135deg, #006400 0%, #004d00 100%);
      color: white;
      padding: 8px 10px;
      text-align: left;
      font-weight: bold;
      border: 1px solid #004d00;
    }
    
    table td {
      padding: 6px 10px;
      border: 1px solid #ddd;
      background: white;
    }
    
    table tbody tr:nth-child(even) {
      background: #f9f9f9;
    }
    
    table td:last-child,
    table th:last-child {
      text-align: right;
      font-weight: bold;
    }
    
    /* COST SUMMARY */
    .cost-summary {
      background: #f9f9f9;
      padding: 10px;
      border: 2px solid #006400;
      border-radius: 4px;
      margin-bottom: 8mm;
    }
    
    .cost-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 8px;
      border-bottom: 1px dotted #ddd;
      font-size: 11pt;
    }
    
    .cost-row.total {
      font-size: 14pt;
      font-weight: bold;
      color: #006400;
      border-top: 2px solid #006400;
      border-bottom: 2px solid #006400;
      background: white;
      margin-top: 6px;
      padding-top: 8px;
    }
    
    /* SIGNATURE */
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12mm;
      margin-top: 12mm;
    }
    
    .signature-box {
      border: 2px solid #006400;
      padding: 12px;
      border-radius: 4px;
      background: white;
      min-height: 100px;
    }
    
    .signature-box-title {
      font-weight: bold;
      color: #006400;
      margin-bottom: 8px;
      font-size: 11pt;
    }
    
    .signature-line {
      border-top: 2px dotted #333;
      margin-top: 50px;
      padding-top: 6px;
      text-align: center;
      font-size: 9pt;
      color: #666;
    }
    
    /* FOOTER */
    .footer {
      margin-top: 12mm;
      text-align: center;
      padding-top: 8px;
      border-top: 2px solid #006400;
      font-size: 8pt;
      color: #666;
    }
    
    .text-gold { color: #D4AF37; }
    .text-green { color: #006400; }
    
    @media print {
      .page { margin: 0; padding: 10mm; }
      .page-break { page-break-after: always; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- HEADER -->
    <div class="header">
      <img src="data:image/jpeg;base64,${LOGO_BASE64}" class="logo" alt="Estre Logo">
      <div class="company-name">ESTRE GLOBAL PRIVATE LIMITED</div>
      <div class="company-tagline">Luxury Furniture Crafted with Excellence</div>
      <div class="company-address">
        Near Dhoni Public School, AECS Layout-A Block<br>
        Revenue Layout, Near Kudlu Gate, Singhasandra<br>
        Bengaluru - 560 068, Karnataka, India<br>
        Ph: +91 87 22 200 100 | Email: support@estre.in
      </div>
      <div class="document-title">SALE ORDER</div>
    </div>

    <!-- ORDER & CUSTOMER INFO -->
    <div class="info-grid">
      <div class="info-box">
        <div class="info-box-title">📋 ORDER DETAILS</div>
        <table>
          <tr><td><strong>S.O. Number:</strong></td><td>${orderNumber}</td></tr>
          <tr><td><strong>Order Date:</strong></td><td>${orderDate}</td></tr>
          <tr><td><strong>Delivery Date:</strong></td><td>${deliveryDate}</td></tr>
        </table>
      </div>
      
      <div class="info-box">
        <div class="info-box-title">👤 CUSTOMER INFORMATION</div>
        <table>
          <tr><td><strong>Name:</strong></td><td>${customerName}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${customerEmail}</td></tr>
          <tr><td><strong>Phone:</strong></td><td>${customerPhone}</td></tr>
        </table>
      </div>
    </div>

    <!-- ADDRESS -->
    <div class="info-box" style="margin-bottom: 8mm;">
      <div class="info-box-title">📍 DELIVERY ADDRESS</div>
      <p style="padding: 8px;">${customerAddress}</p>
    </div>

    <!-- PRODUCTS -->
    <div class="section-header">📦 ORDER SUMMARY</div>
    ${productsTableHTML}

    <!-- COST BREAKDOWN -->
    <div class="section-header">💰 COST BREAKDOWN</div>
    ${costBreakdownHTML}

    <!-- PAYMENT SCHEDULE -->
    <div class="section-header">💳 PAYMENT SCHEDULE</div>
    ${paymentScheduleHTML}

    <!-- JOB CARDS -->
    <div class="section-header">🔗 RELATED JOB CARDS</div>
    ${jobCardsHTML}

    <!-- TERMS -->
    <div class="section-header">📜 TERMS & CONDITIONS</div>
    ${termsHTML}

    <!-- SIGNATURES -->
    <div class="signature-grid">
      <div class="signature-box">
        <div class="signature-box-title">CUSTOMER ACCEPTANCE</div>
        <p style="font-size: 9pt; margin-bottom: 8px;">
          I hereby confirm that I have read, understood, and agree to the terms and conditions of this Sale Order.
        </p>
        <div class="signature-line">Customer Signature</div>
      </div>

      <div class="signature-box">
        <div class="signature-box-title">FOR ESTRE GLOBAL PRIVATE LIMITED</div>
        <p style="font-size: 9pt; margin-bottom: 8px;">
          This sale order is authorized and issued on behalf of the company.
        </p>
        <div class="signature-line">Authorized Signatory</div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <p>This is a computer-generated document and does not require a physical signature.</p>
      <p>For queries, contact us at <span class="text-gold">support@estre.in</span> or call <span class="text-gold">+91 87 22 200 100</span></p>
      <p style="margin-top: 4px;"><strong class="text-green">Thank you for choosing Estre!</strong></p>
    </div>
  </div>
</body>
</html>`;
}
