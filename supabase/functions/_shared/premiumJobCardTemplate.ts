/**
 * Premium Job Card Template
 * Estre Global Private Ltd - Production Document
 */

import { LOGO_BASE64 } from "./logoBase64.ts";

export interface JobCardTemplateData {
    jobCardNumber: string;
    soNumber: string;
    soDate: string;
    jcIssueDate: string;
    deliveryDate: string;

    productTitle: string;
    productCategory: string;
    model: string;

    // Technical Specs (Flexible key-value pairs)
    specs: {
        category: string;
        items: { label: string; value: string }[];
    }[];

    // Raw HTML for complex tables if needed
    technicalSpecsHTML?: string;
}

export function generatePremiumJobCardHTML(data: JobCardTemplateData): string {
    const {
        jobCardNumber,
        soNumber,
        soDate,
        jcIssueDate,
        deliveryDate,
        productTitle,
        model,
        specs
    } = data;

    // Brand Colors (Same as Sale Order)
    const colors = {
        primary: "#664331", // Dark Brown
        accent: "#D6B485",  // Gold/Beige
        bg: "#F4F5F0",      // Off White
        text: "#1a1a1a",
        border: "#664331"
    };

    // Generate Specs HTML
    const specsHTML = specs.map(section => `
        <div class="section-header">${section.category}</div>
        <div class="spec-grid">
            ${section.items.map(item => `
                <div class="spec-item">
                    <div class="spec-label">${item.label}</div>
                    <div class="spec-value">: ${item.value}</div>
                </div>
            `).join('')}
        </div>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Job Card - ${jobCardNumber}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: ${colors.text};
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid ${colors.primary};
      padding-bottom: 10px;
    }
    .logo { height: 40px; margin-bottom: 5px; }
    .company-name { font-weight: bold; color: ${colors.primary}; font-size: 14pt; }
    .doc-title { font-size: 18pt; font-weight: bold; margin-top: 5px; text-decoration: underline; }
    
    .top-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      border: 1px solid ${colors.accent};
      padding: 10px;
      background: ${colors.bg};
    }
    .info-col { width: 48%; }
    .info-row { display: flex; margin-bottom: 4px; }
    .info-label { font-weight: bold; width: 100px; }
    
    .product-info {
      margin-bottom: 20px;
      padding: 10px;
      background: #eee;
      border-left: 4px solid ${colors.primary};
    }
    
    .section-header {
      background: ${colors.primary};
      color: white;
      padding: 5px 10px;
      font-weight: bold;
      margin-top: 15px;
      margin-bottom: 5px;
    }
    
    .spec-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    .spec-item { display: flex; font-size: 9.5pt; }
    .spec-label { width: 140px; font-weight: bold; color: #444; }
    .spec-value { flex: 1; }
    
    .footer {
      margin-top: 30px;
      border-top: 1px solid #ccc;
      padding-top: 10px;
      font-size: 8pt;
      text-align: center;
      color: #666;
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="company-name">ESTRE GLOBAL PRIVATE LIMITED</div>
    <div class="doc-title">JOB CARD</div>
    <div style="font-size: 12pt; margin-top: 5px; font-weight: bold;">${productTitle.toUpperCase()}</div>
  </div>

  <div class="top-info">
    <div class="info-col">
      <div class="info-row"><div class="info-label">S.O. No:</div><div>${soNumber}</div></div>
      <div class="info-row"><div class="info-label">S.O. Date:</div><div>${soDate}</div></div>
      <div class="info-row"><div class="info-label">Job Team:</div><div>Production</div></div>
    </div>
    <div class="info-col">
      <div class="info-row"><div class="info-label">J.C. No:</div><div>${jobCardNumber}</div></div>
      <div class="info-row"><div class="info-label">Issue Date:</div><div>${jcIssueDate}</div></div>
      <div class="info-row"><div class="info-label">Delivery:</div><div>${deliveryDate}</div></div>
    </div>
  </div>

  <div class="product-info">
    <div class="info-row"><div class="info-label">Product:</div><div>${productTitle}</div></div>
    <div class="info-row"><div class="info-label">Model:</div><div>${model}</div></div>
  </div>

  <!-- SPECS -->
  ${specsHTML}

  <div class="footer">
    Internal Production Document - Estre Global Private Limited
  </div>

</body>
</html>`;
}
