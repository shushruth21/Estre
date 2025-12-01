import { format } from "date-fns";

// --- Types ---

export interface SaleOrderTemplateData {
    orderNumber: string;
    orderDate: string;
    deliveryDate: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    shippingName: string;
    shippingAddress: string;
    shippingPhone: string;
    shippingEmail: string;
    finalPrice: number;
    basePrice: number;
    discount: number;
    productsTableHTML: string;
    paymentTermsHTML: string;
    dispatchThrough: string;
    estreGst: string;
    buyerGst: string;
}

// --- Logo ---
// Using a placeholder or the actual base64 if available. 
// For now, we'll use a placeholder URL or assume the image is in the public folder if not base64.
// But the template uses base64. I'll use a placeholder for now or try to import it if I can find it.
const LOGO_BASE64 = "/brand-logo.png"; // Using public path for frontend

// --- Helpers ---

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const safe = (val: any, fallback = "") => (val || fallback);
const toTitle = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

// --- Mapping Logic ---

export function mapSaleOrderData(saleOrder: any): SaleOrderTemplateData {
    const order = saleOrder.order || {};
    const orderItems = order.order_items || [];

    // Extract addresses
    const deliveryAddress = order.delivery_address || {};
    const billingAddress = order.billing_address || deliveryAddress;

    const formatAddress = (addr: any) => {
        if (!addr) return "";
        const parts = [
            addr.street || addr.line1,
            addr.line2,
            addr.landmark,
            `${addr.city || ''} - ${addr.pincode || ''}`,
            addr.state
        ].filter(Boolean);
        return parts.join("\n");
    };

    const customerAddress = formatAddress(billingAddress);
    const shippingAddress = formatAddress(deliveryAddress);

    const productsTableHTML = generateProductsTable(orderItems);

    const paymentTermsHTML = `
        1) 50% advance on placing Sale Order<br>
        2) Balance: upon intimation of product readiness, before dispatch
    `;

    return {
        orderNumber: safe(saleOrder.order_number, `SO-${saleOrder.id?.slice(0, 8)}`),
        orderDate: saleOrder.created_at ? format(new Date(saleOrder.created_at), "dd-MMM-yyyy") : "",
        deliveryDate: order.expected_delivery_date ? format(new Date(order.expected_delivery_date), "dd-MMM-yyyy") : "",

        customerName: safe(order.customer_name),
        customerEmail: safe(order.customer_email),
        customerPhone: safe(order.customer_phone),
        customerAddress,

        shippingName: safe(order.customer_name),
        shippingAddress,
        shippingPhone: safe(order.customer_phone),
        shippingEmail: safe(order.customer_email),

        finalPrice: saleOrder.final_price || 0,
        basePrice: saleOrder.base_price || 0,
        discount: saleOrder.discount || 0,

        productsTableHTML,
        paymentTermsHTML,

        dispatchThrough: order.logistics_partner || "Safe Express",
        estreGst: "29AAMCE9846D1ZU",
        buyerGst: order.buyer_gst || "",
    };
}

function generateProductsTable(orderItems: any[]): string {
    if (!orderItems || orderItems.length === 0) {
        return `<tr><td colspan="4" style="text-align: center; padding: 20px;">No products in this order</td></tr>`;
    }

    return orderItems.map((item, index) => {
        const productTitle = safe(item.product_title, safe(item.product_name, "Product"));
        const category = safe(item.product_category, "Furniture");
        const total = item.total_price_rs || 0;

        let config: any = {};
        try {
            config = typeof item.configuration === 'string'
                ? JSON.parse(item.configuration)
                : item.configuration || {};
        } catch (e) {
            console.error("Error parsing configuration", e);
        }

        const descriptionHTML = generateDetailedDescription(productTitle, category, config);

        return `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td>
          ${descriptionHTML}
        </td>
        <td style="text-align: right;">${formatCurrency(total)}</td>
        <td style="text-align: right;">${formatCurrency(total)}</td>
      </tr>
    `;
    }).join("");
}

function generateDetailedDescription(title: string, category: string, config: any): string {
    let html = `<strong>${toTitle(category)} – ${title}</strong><br><br>`;

    // 1. Seating
    if (config.seating || config.shape) {
        html += `<div class="sub-header">Seating</div>`;
        if (config.shape) html += `Shape: ${config.shape}<br>`;
        if (config.seating) {
            if (typeof config.seating === 'string') {
                html += `${config.seating}<br>`;
            } else if (typeof config.seating === 'object') {
                Object.entries(config.seating).forEach(([key, val]) => {
                    if (val) html += `${toTitle(key)}: ${val}-Seater<br>`;
                });
            }
        }
        html += `<br>`;
    }

    // 2. Consoles
    if (config.consoles && (Array.isArray(config.consoles) ? config.consoles.length > 0 : config.consoles)) {
        html += `<div class="sub-header">Consoles</div>`;
        if (Array.isArray(config.consoles)) {
            html += `No. of Consoles: ${config.consoles.length} Nos.<br>`;
            config.consoles.forEach((c: any, i: number) => {
                html += `Console ${i + 1}: ${c.size || 'Standard'} (${c.position || 'Default'})<br>`;
            });
        } else {
            html += `Details: ${JSON.stringify(config.consoles)}<br>`;
        }
        html += `<br>`;
    }

    // 3. Loungers
    if (config.loungers && (Array.isArray(config.loungers) ? config.loungers.length > 0 : config.loungers)) {
        html += `<div class="sub-header">Loungers</div>`;
        if (Array.isArray(config.loungers)) {
            html += `No. of Loungers: ${config.loungers.length} No.<br>`;
            config.loungers.forEach((l: any, i: number) => {
                html += `Lounger ${i + 1}: ${l.size || 'Standard'} - ${l.position || 'Default'}<br>`;
            });
        }
        html += `<br>`;
    }

    // 4. Pillows
    if (config.pillows && config.pillows.length > 0) {
        html += `<div class="sub-header">Pillows</div>`;
        config.pillows.forEach((p: any) => {
            html += `${p.quantity || 1} Nos – ${p.type || 'Standard'} (${p.size || '18x18 in'})<br>`;
            if (p.fabric) html += `Fabric: ${p.fabric}<br>`;
        });
        html += `<br>`;
    }

    // 5. Fabric Selection
    if (config.fabric) {
        html += `<div class="sub-header">Fabric Selection</div>`;
        const f = config.fabric;
        if (typeof f === 'string') {
            html += `${f}<br>`;
        } else {
            if (f.structure) html += `Structure – ${f.structure}<br>`;
            if (f.backrest) html += `Backrest – ${f.backrest}<br>`;
            if (f.seat) html += `Seat – ${f.seat}<br>`;
            if (f.headrest) html += `Headrest – ${f.headrest}<br>`;
            if (f.overall) html += `Overall – ${f.overall}<br>`;
        }
        html += `<br>`;
    }

    // 6. Foam
    if (config.foam) {
        html += `<div class="sub-header">Foam</div>`;
        html += `Type: ${config.foam.type || config.foam}<br>`;
        if (config.foam.upgradeCharge) html += `Upgrade: ${formatCurrency(config.foam.upgradeCharge)}<br>`;
        html += `<br>`;
    }

    // 7. Seat Dimensions
    if (config.dimensions) {
        html += `<div class="sub-header">Seat Dimensions</div>`;
        const d = config.dimensions;
        if (d.depth) html += `Depth: ${d.depth} in<br>`;
        if (d.width) html += `Width: ${d.width} in<br>`;
        if (d.height) html += `Height: ${d.height} in<br>`;
        html += `<br>`;
    }

    // 8. Legs
    if (config.legs) {
        html += `<div class="sub-header">Legs</div>`;
        html += `${config.legs}<br><br>`;
    }

    // 9. Accessories
    if (config.accessories && config.accessories.length > 0) {
        html += `<div class="sub-header">Accessories</div>`;
        config.accessories.forEach((acc: any) => {
            html += `${acc.name || acc.type} (${acc.position || 'Default'})<br>`;
        });
        html += `<br>`;
    }

    // 10. Wood Type
    if (config.woodType) {
        html += `<div class="sub-header">Wood Type</div>`;
        html += `${config.woodType}<br><br>`;
    }

    // 11. Stitch Type
    if (config.stitchType) {
        html += `<div class="sub-header">Stitch Type</div>`;
        html += `${config.stitchType}<br><br>`;
    }

    // 12. Approx Width
    if (config.approxWidth) {
        html += `<div class="sub-header">Approx Width</div>`;
        html += `${config.approxWidth} inches (±5%)<br>`;
    }

    return html;
}

// --- Template Generation ---

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
