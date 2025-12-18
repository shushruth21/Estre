/**
 * Maps sale order data from database schema to template format
 * Aligned with actual sale_orders, orders, and order_items schema
 */

import { SaleOrderTemplateData } from "./premiumSaleOrderTemplate.ts";
import { logError } from "./logger.ts";
// Import date-fns from esm.sh for Deno
import { format } from "https://esm.sh/date-fns@2.30.0";

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
      logError("Error parsing configuration", e);
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
