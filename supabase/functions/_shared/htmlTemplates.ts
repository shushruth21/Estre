/**
 * HTML Template Generators for Sale Orders and Job Cards
 * Uses simple string replacement for template rendering
 */

import { PricingBreakdownData } from "../../../src/lib/pricing-breakdown-generator";
import { TechnicalSpecifications } from "../../../src/lib/technical-specifications-generator";

// Sale Order HTML Template
const SALE_ORDER_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sale Order - {{so_number}}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #000; background: #fff; }
        .container { max-width: 210mm; margin: 0 auto; padding: 10mm; }
        .header { text-align: center; margin-bottom: 15mm; }
        .header h1 { font-size: 18pt; font-weight: bold; margin-bottom: 5mm; color: #006400; }
        .company-info { font-size: 10pt; line-height: 1.5; }
        .company-info strong { color: #D4AF37; }
        .order-info { display: flex; justify-content: space-between; margin-bottom: 10mm; border-bottom: 2px solid #006400; padding-bottom: 5mm; }
        .order-info-left { flex: 1; }
        .order-info-right { text-align: right; flex: 1; }
        .order-info-right table { margin-left: auto; }
        .order-info-right td { padding: 2px 10px; text-align: left; }
        .order-info-right td:first-child { font-weight: bold; }
        .customer-section { margin-bottom: 10mm; }
        .customer-section h3 { font-size: 12pt; font-weight: bold; margin-bottom: 3mm; color: #006400; }
        .customer-details { margin-bottom: 5mm; }
        .customer-details p { margin: 2px 0; }
        .product-section { margin-top: 10mm; page-break-inside: avoid; }
        .product-section h2 { font-size: 14pt; font-weight: bold; margin-bottom: 5mm; color: #006400; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 5mm; }
        table th { background-color: #006400; color: #fff; padding: 5px; text-align: left; font-weight: bold; font-size: 10pt; }
        table td { padding: 4px; border-bottom: 1px solid #ddd; font-size: 10pt; }
        table td:last-child { text-align: right; }
        .indent { padding-left: 20px; }
        .total-row { font-weight: bold; background-color: #f0f0f0; border-top: 2px solid #006400; }
        .footer { margin-top: 15mm; text-align: center; font-size: 9pt; color: #666; }
        @media print { .container { padding: 0; } .page-break { page-break-after: always; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SALE ORDER</h1>
            <div class="company-info">
                <strong>ESTRE GLOBAL PRIVATE LTD</strong><br>
                Near Dhoni Public School<br>
                AECS Layout-A Block, Revenue Layout<br>
                Near Kudlu Gate, Singhasandra<br>
                Bengaluru - 560 068<br>
                Ph: +91 87 22 200 100<br>
                Email: support@estre.in
            </div>
        </div>
        <div class="order-info">
            <div class="order-info-left">
                <div class="customer-section">
                    <h3>Invoice to:</h3>
                    <div class="customer-details">
                        <p><strong>{{customer_name}}</strong></p>
                        <p>{{customer_address_street}}</p>
                        <p>{{customer_address_city}}, {{customer_address_state}} - {{customer_address_pincode}}</p>
                        <p>Mobile No.: {{customer_phone}}</p>
                        <p>Email: {{customer_email}}</p>
                    </div>
                </div>
                <div class="customer-section">
                    <h3>To be dispatched to:</h3>
                    <div class="customer-details">
                        <p><strong>{{customer_name}}</strong></p>
                        <p>{{customer_address_street}}</p>
                        <p>{{customer_address_city}}, {{customer_address_state}} - {{customer_address_pincode}}</p>
                        <p>Mobile No.: {{customer_phone}}</p>
                        <p>Email: {{customer_email}}</p>
                    </div>
                </div>
            </div>
            <div class="order-info-right">
                <table>
                    <tr><td>S.O. No.</td><td>{{so_number}}</td></tr>
                    <tr><td>Date</td><td>{{order_date}}</td></tr>
                    <tr><td>Mode of Payment</td><td>1) 50% advance on placing Sale Order<br>2) Balance: upon intimation of product readiness, before dispatch<br>3)</td></tr>
                    <tr><td>Date of Delivery</td><td>{{delivery_date}}</td></tr>
                    <tr><td>Despatch through</td><td>{{dispatch_through}}</td></tr>
                    <tr><td>Estre GST</td><td>{{estre_gst}}</td></tr>
                    <tr><td>Buyer GST</td><td>{{buyer_gst}}</td></tr>
                </table>
            </div>
        </div>
        {{products_section}}
        <div class="footer"><p>Thank you for your order!</p></div>
    </div>
</body>
</html>`;

// Job Card HTML Template
const JOB_CARD_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Job Card - {{job_card_number}}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #000; background: #fff; }
        .container { max-width: 210mm; margin: 0 auto; padding: 10mm; }
        .header { text-align: center; margin-bottom: 15mm; }
        .header h1 { font-size: 18pt; font-weight: bold; margin-bottom: 5mm; color: #006400; }
        .header h2 { font-size: 14pt; font-weight: bold; margin-top: 5mm; color: #006400; text-transform: uppercase; }
        .company-info { font-size: 10pt; line-height: 1.5; }
        .company-info strong { color: #D4AF37; }
        .job-card-info { display: flex; justify-content: space-between; margin-bottom: 10mm; border-bottom: 2px solid #006400; padding-bottom: 5mm; }
        .job-card-info-left { flex: 1; }
        .job-card-info-right { text-align: right; flex: 1; }
        .job-card-info-right table { margin-left: auto; }
        .job-card-info-right td { padding: 2px 10px; text-align: left; }
        .job-card-info-right td:first-child { font-weight: bold; }
        .section { margin-bottom: 8mm; }
        .section h3 { font-size: 12pt; font-weight: bold; margin-bottom: 3mm; color: #006400; }
        .section-content { margin-left: 10mm; }
        .section-content p { margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 5mm; }
        table th { background-color: #006400; color: #fff; padding: 5px; text-align: left; font-weight: bold; font-size: 10pt; }
        table td { padding: 4px; border-bottom: 1px solid #ddd; font-size: 10pt; }
        table td:last-child { text-align: right; }
        .fabric-table { margin-top: 5mm; }
        .fabric-table th:first-child, .fabric-table td:first-child { width: 50%; }
        .fabric-table th:last-child, .fabric-table td:last-child { width: 25%; text-align: right; }
        .indent { padding-left: 20px; }
        .total-row { font-weight: bold; background-color: #f0f0f0; border-top: 2px solid #006400; }
        .footer { margin-top: 15mm; text-align: center; font-size: 9pt; color: #666; }
        @media print { .container { padding: 0; } .page-break { page-break-after: always; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>JOB CARD</h1>
            <div class="company-info"><strong>ESTRE GLOBAL PRIVATE LIMITED</strong></div>
            <h2>{{product_type}}</h2>
        </div>
        <div class="job-card-info">
            <div class="job-card-info-left">
                <div class="section">
                    <h3>Product Description:</h3>
                    <div class="section-content">
                        <p><strong>Product:</strong> {{product_type}}</p>
                        <p><strong>Model:</strong> {{model}}</p>
                        {{sofa_type_section}}
                        <p><strong>No. of seats</strong></p>
                        {{seats_section}}
                    </div>
                </div>
            </div>
            <div class="job-card-info-right">
                <table>
                    <tr><td>S.O. No.</td><td>{{so_number}}</td></tr>
                    <tr><td>J.C. No.</td><td>{{job_card_number}}</td></tr>
                    <tr><td>S.O. Date</td><td>{{so_date}}</td></tr>
                    <tr><td>J.C. ISSUE-Date:</td><td>{{jc_issue_date}}</td></tr>
                    <tr><td>Job given to team:</td><td>{{assigned_to}}</td></tr>
                    <tr><td>Date of Delivery:</td><td>{{delivery_date}}</td></tr>
                </table>
            </div>
        </div>
        {{sections_content}}
        <div class="footer"><p>Job Card Generated by Estre Global Private Limited</p></div>
    </div>
</body>
</html>`;

interface SaleOrderTemplateData {
  so_number: string;
  order_date: string;
  customer_name: string;
  customer_address_street: string;
  customer_address_city: string;
  customer_address_state: string;
  customer_address_pincode: string;
  customer_phone: string;
  customer_email: string;
  delivery_date: string;
  dispatch_through: string;
  estre_gst: string;
  buyer_gst?: string;
  pricing_breakdown: PricingBreakdownData;
}

interface JobCardTemplateData {
  job_card_number: string;
  so_number: string;
  so_date: string;
  jc_issue_date: string;
  assigned_to?: string;
  delivery_date: string;
  technical_specifications: TechnicalSpecifications;
}

function escapeHtml(text: string | number | undefined | null): string {
  if (text === null || text === undefined) return "";
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateSaleOrderHTML(data: SaleOrderTemplateData): string {
  let html = SALE_ORDER_TEMPLATE;

  // Replace basic fields
  html = html.replace(/\{\{so_number\}\}/g, escapeHtml(data.so_number));
  html = html.replace(/\{\{order_date\}\}/g, escapeHtml(data.order_date));
  html = html.replace(/\{\{customer_name\}\}/g, escapeHtml(data.customer_name));
  html = html.replace(/\{\{customer_address_street\}\}/g, escapeHtml(data.customer_address_street));
  html = html.replace(/\{\{customer_address_city\}\}/g, escapeHtml(data.customer_address_city));
  html = html.replace(/\{\{customer_address_state\}\}/g, escapeHtml(data.customer_address_state));
  html = html.replace(/\{\{customer_address_pincode\}\}/g, escapeHtml(data.customer_address_pincode));
  html = html.replace(/\{\{customer_phone\}\}/g, escapeHtml(data.customer_phone));
  html = html.replace(/\{\{customer_email\}\}/g, escapeHtml(data.customer_email));
  html = html.replace(/\{\{delivery_date\}\}/g, escapeHtml(data.delivery_date));
  html = html.replace(/\{\{dispatch_through\}\}/g, escapeHtml(data.dispatch_through));
  html = html.replace(/\{\{estre_gst\}\}/g, escapeHtml(data.estre_gst));
  html = html.replace(/\{\{buyer_gst\}\}/g, escapeHtml(data.buyer_gst || ""));

  // Generate products section
  let productsSection = "";
  data.pricing_breakdown.products.forEach((product, index) => {
    productsSection += generateProductSection(product, index + 1);
  });
  html = html.replace(/\{\{products_section\}\}/g, productsSection);

  return html;
}

function generateProductSection(product: any, index: number): string {
  // This is a simplified version - full implementation would generate complete HTML
  // For now, return a basic structure that can be enhanced
  return `<div class="product-section">
    <h2>${escapeHtml(product.category.toUpperCase())}</h2>
    <table>
        <thead>
            <tr><th>Sl No.</th><th>Description of the product</th><th>Amount (Rs.)</th><th>Amount (Rs.)</th></tr>
        </thead>
        <tbody>
            <tr>
                <td>${index}</td>
                <td>
                    <strong>${escapeHtml(product.category)} ${escapeHtml(product.model)}</strong><br>
                    ${generateProductDetails(product)}
                </td>
                <td>${formatCurrency(product.base_price)}</td>
                <td>${formatCurrency(product.base_price)}</td>
            </tr>
            ${generateProductRows(product)}
            <tr class="total-row">
                <td></td>
                <td><strong>Total Cost</strong></td>
                <td></td>
                <td><strong>${formatCurrency(product.subtotal)}</strong></td>
            </tr>
        </tbody>
    </table>
</div>`;
}

function generateProductDetails(product: any): string {
  let details = "";
  if (product.no_of_seats.front) details += `No. of Seats Front: ${product.no_of_seats.front}<br>`;
  if (product.consoles) details += `No. of Consoles: ${product.consoles.count} Nos.<br>`;
  if (product.lounger) details += `No. of Loungers: ${product.lounger.count} No.<br>`;
  if (product.fabric) details += `Fabric selected: ${product.fabric.selection}<br>`;
  if (product.foam) details += `Foam type selected: ${product.foam.type}<br>`;
  return details;
}

function generateProductRows(product: any): string {
  let rows = "";
  if (product.consoles && product.consoles.total_cost > 0) {
    rows += `<tr><td></td><td class="indent">No. of Consoles: ${product.consoles.count} Nos.</td><td></td><td>${formatCurrency(product.consoles.total_cost)}</td></tr>`;
  }
  if (product.lounger && product.lounger.cost > 0) {
    rows += `<tr><td></td><td class="indent">No. of Loungers: ${product.lounger.count} No.</td><td></td><td>${formatCurrency(product.lounger.cost)}</td></tr>`;
  }
  if (product.fabric && product.fabric.upgrade_charges > 0) {
    rows += `<tr><td></td><td class="indent">Fabric upgrade Charges</td><td></td><td>${formatCurrency(product.fabric.upgrade_charges)}</td></tr>`;
  }
  if (product.foam && product.foam.upgrade_charges > 0) {
    rows += `<tr><td></td><td class="indent">Foam upgrade Charges</td><td></td><td>${formatCurrency(product.foam.upgrade_charges)}</td></tr>`;
  }
  return rows;
}

export function generateJobCardHTML(data: JobCardTemplateData): string {
  let html = JOB_CARD_TEMPLATE;
  const specs = data.technical_specifications;

  // Replace basic fields
  html = html.replace(/\{\{job_card_number\}\}/g, escapeHtml(data.job_card_number));
  html = html.replace(/\{\{so_number\}\}/g, escapeHtml(data.so_number));
  html = html.replace(/\{\{so_date\}\}/g, escapeHtml(data.so_date));
  html = html.replace(/\{\{jc_issue_date\}\}/g, escapeHtml(data.jc_issue_date));
  html = html.replace(/\{\{assigned_to\}\}/g, escapeHtml(data.assigned_to || ""));
  html = html.replace(/\{\{delivery_date\}\}/g, escapeHtml(data.delivery_date));
  html = html.replace(/\{\{product_type\}\}/g, escapeHtml(specs.product_type.toUpperCase()));
  html = html.replace(/\{\{model\}\}/g, escapeHtml(specs.model));

  // Generate sections
  let sofaTypeSection = "";
  if (specs.sofa_type) {
    sofaTypeSection = `<p><strong>Sofa type:</strong> ${escapeHtml(specs.sofa_type)}</p>`;
  }
  html = html.replace(/\{\{sofa_type_section\}\}/g, sofaTypeSection);

  let seatsSection = "";
  if (specs.no_of_seats.front) seatsSection += `<p class="indent">Front: ${escapeHtml(specs.no_of_seats.front)}</p>`;
  if (specs.no_of_seats.front_left) seatsSection += `<p class="indent">Front-Left: ${escapeHtml(specs.no_of_seats.front_left)}</p>`;
  if (specs.no_of_seats.left) seatsSection += `<p class="indent">Left: ${escapeHtml(specs.no_of_seats.left)}</p>`;
  if (specs.no_of_seats.front_right) seatsSection += `<p class="indent">Front-Right: ${escapeHtml(specs.no_of_seats.front_right)}</p>`;
  if (specs.no_of_seats.right) seatsSection += `<p class="indent">Right: ${escapeHtml(specs.no_of_seats.right)}</p>`;
  html = html.replace(/\{\{seats_section\}\}/g, seatsSection);

  // Generate sections content
  let sectionsContent = generateJobCardSections(specs);
  html = html.replace(/\{\{sections_content\}\}/g, sectionsContent);

  return html;
}

function generateJobCardSections(specs: TechnicalSpecifications): string {
  let sections = "";

  if (specs.consoles) {
    sections += `<div class="section"><h3>Consoles:</h3><div class="section-content">`;
    sections += `<p><strong>No. of consoles:</strong> ${specs.consoles.count} Nos.</p>`;
    sections += `<p><strong>Console size:</strong> ${escapeHtml(specs.consoles.size)}</p>`;
    sections += `<p><strong>Console positioning:</strong></p>`;
    specs.consoles.positioning.forEach(pos => {
      sections += `<p class="indent">${escapeHtml(pos.console)}: ${escapeHtml(pos.position)}</p>`;
    });
    sections += `</div></div>`;
  }

  if (specs.loungers) {
    sections += `<div class="section"><h3>Loungers:</h3><div class="section-content">`;
    sections += `<p><strong>No. of loungers:</strong> ${specs.loungers.count} No.</p>`;
    sections += `<p><strong>Lounger Size:</strong> ${escapeHtml(specs.loungers.size)}</p>`;
    sections += `<p><strong>Lounger positioning:</strong> ${escapeHtml(specs.loungers.positioning)}</p>`;
    if (specs.loungers.with_storage) sections += `<p><strong>Longer with Storage?</strong> Yes</p>`;
    sections += `</div></div>`;
  }

  if (specs.recliner) {
    sections += `<div class="section"><h3>Recliner:</h3><div class="section-content">`;
    sections += `<p><strong>Recliner required:</strong> ${specs.recliner.required ? "Yes" : "No"}</p>`;
    if (specs.recliner.required) sections += `<p><strong>Recliner positioning:</strong> ${escapeHtml(specs.recliner.positioning)}</p>`;
    sections += `</div></div>`;
  }

  sections += `<div class="section"><h3>Frame:</h3><div class="section-content">`;
  sections += `<p><strong>Wood type:</strong> ${escapeHtml(specs.frame.wood_type)}</p>`;
  sections += `</div></div>`;

  sections += `<div class="section"><h3>Seat Dimensions:</h3><div class="section-content">`;
  sections += `<p><strong>Seat Depth:</strong> ${escapeHtml(specs.seat_dimensions.depth)}</p>`;
  sections += `<p><strong>Seat Width:</strong> ${escapeHtml(specs.seat_dimensions.width)}</p>`;
  sections += `<p><strong>Seat Height:</strong> ${escapeHtml(specs.seat_dimensions.height)}</p>`;
  sections += `</div></div>`;

  if (specs.sofa_dimensions) {
    sections += `<div class="section"><h3>Sofa Dimensions:</h3><div class="section-content">`;
    sections += `<p><strong>Front sofa width:</strong> ${escapeHtml(specs.sofa_dimensions.front_sofa_width)}</p>`;
    sections += `<p><strong>Left sofa width:</strong> ${escapeHtml(specs.sofa_dimensions.left_sofa_width)}</p>`;
    sections += `<p><strong>Right sofa width:</strong> ${escapeHtml(specs.sofa_dimensions.right_sofa_width)}</p>`;
    sections += `</div></div>`;
  }

  if (specs.sofabed_dimensions) {
    sections += `<div class="section"><h3>Sofabed Dimensions:</h3><div class="section-content">`;
    sections += `<p><strong>Sofabed width:</strong> ${escapeHtml(specs.sofabed_dimensions.sofabed_width)}</p>`;
    sections += `</div></div>`;
  }

  sections += `<div class="section"><h3>Armrest Description:</h3><div class="section-content">`;
  sections += `<p><strong>Armrest type:</strong> ${escapeHtml(specs.armrest.type)}</p>`;
  if (specs.armrest.width) sections += `<p><strong>Armrest width:</strong> ${escapeHtml(specs.armrest.width)}</p>`;
  sections += `</div></div>`;

  sections += `<div class="section"><h3>Cutting & Stitching Specifications:</h3><div class="section-content">`;
  sections += `<p><strong>Stitching type:</strong> ${escapeHtml(specs.cutting_stitching.stitching_type)}</p>`;
  sections += `</div></div>`;

  sections += `<div class="section"><h3>Fabric Description:</h3><div class="section-content">`;
  sections += `<p><strong>Colour Details:</strong> ${escapeHtml(specs.fabric_description.colour_details)}</p>`;
  sections += `<p><strong>Colour breakup:</strong></p>`;
  if (specs.fabric_description.colour_breakup.structure) {
    sections += `<p class="indent">Structure: ${escapeHtml(specs.fabric_description.colour_breakup.structure)}</p>`;
  }
  if (specs.fabric_description.colour_breakup.back_rest_cushion) {
    sections += `<p class="indent">Back Rest/Cushion: ${escapeHtml(specs.fabric_description.colour_breakup.back_rest_cushion)}</p>`;
  }
  if (specs.fabric_description.colour_breakup.seat) {
    sections += `<p class="indent">Seat: ${escapeHtml(specs.fabric_description.colour_breakup.seat)}</p>`;
  }
  if (specs.fabric_description.colour_breakup.headrest) {
    sections += `<p class="indent">Headrest: ${escapeHtml(specs.fabric_description.colour_breakup.headrest)}</p>`;
  }
  if (specs.fabric_description.pillow_colours) {
    sections += `<p><strong>Pillow Colours</strong></p>`;
    specs.fabric_description.pillow_colours.forEach(pc => {
      sections += `<p class="indent">${escapeHtml(pc.label)}: ${escapeHtml(pc.code)}</p>`;
    });
  }
  sections += `</div></div>`;

  sections += `<div class="section"><h3>Legs</h3><div class="section-content">`;
  sections += `<p><strong>Leg model:</strong> ${escapeHtml(specs.legs.leg_model)}</p>`;
  sections += `</div></div>`;

  if (specs.accessories && specs.accessories.length > 0) {
    sections += `<div class="section"><h3>Accessories:</h3><div class="section-content">`;
    specs.accessories.forEach(acc => {
      sections += `<p><strong>${escapeHtml(acc.location)}:</strong> ${escapeHtml(acc.description)}</p>`;
    });
    sections += `</div></div>`;
  }

  if (specs.wireframe) {
    sections += `<div class="section"><h3>Wireframe:</h3><div class="section-content">`;
    if (specs.wireframe.description) sections += `<p>${escapeHtml(specs.wireframe.description)}</p>`;
    sections += `</div></div>`;
  }

  // Fabric requirements table
  sections += `<div class="section fabric-table"><table>`;
  sections += `<thead><tr><th></th><th>Width</th><th>Fabric Req(Mtrs)</th></tr></thead><tbody>`;
  specs.fabric_required_m.components.forEach(comp => {
    sections += `<tr><td>${escapeHtml(comp.name)}</td><td>${escapeHtml(comp.width || "")}</td><td>${comp.fabric_meters}</td></tr>`;
  });
  sections += `<tr class="total-row"><td><strong>Total Fabric Req</strong></td><td></td><td><strong>${specs.fabric_required_m.total}</strong></td></tr>`;
  sections += `</tbody></table></div>`;

  sections += `<div class="section"><h3>Foam type selected:</h3><div class="section-content">`;
  sections += `<p>${escapeHtml(specs.foam.type)}</p>`;
  sections += `</div></div>`;

  sections += `<div class="section"><h3>Overall Specifications</h3><div class="section-content">`;
  sections += `<p><strong>No. of Seats:</strong> ${escapeHtml(specs.overall_specifications.no_of_seats)}</p>`;
  sections += `<p><strong>No. of Loungers:</strong> ${escapeHtml(specs.overall_specifications.no_of_loungers)}</p>`;
  sections += `<p><strong>No. of Consoles:</strong> ${escapeHtml(specs.overall_specifications.no_of_consoles)}</p>`;
  sections += `</div></div>`;

  if (specs.production_notes) {
    sections += `<div class="section"><h3>Production Notes:</h3><div class="section-content">`;
    sections += `<p>${escapeHtml(specs.production_notes)}</p>`;
    sections += `</div></div>`;
  }

  return sections;
}

