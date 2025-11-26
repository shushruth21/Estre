/**
 * Maps sale order data from database schema to template format
 * Aligned with actual sale_orders, orders, and order_items schema
 */

import { formatIndianNumber, formatCurrency } from "./numberFormat.ts";
import { safe, toTitle } from "./textUtils.ts";
import type { SaleOrderTemplateData } from "./premiumSaleOrderTemplate.ts";

/**
 * Generate template data from sale order database record
 * 
 * Expected schema structure:
 * saleOrder {
 *   order_number, final_price, base_price, discount, status, created_at,
 *   order: {
 *     customer_name, customer_email, customer_phone, delivery_address,
 *     order_items: [...],
 *     job_cards: [...]
 *   }
 * }
 */
export function mapSaleOrderData(saleOrder: any): SaleOrderTemplateData {
    const order = saleOrder.order || {};
    const orderItems = order.order_items || [];
    const jobCards = order.job_cards || [];

    // Extract customer address
    const deliveryAddress = order.delivery_address || {};
    const customerAddress = `${safe(deliveryAddress.street)}
${safe(deliveryAddress.city)}, ${safe(deliveryAddress.state)} - ${safe(deliveryAddress.pincode)}`;

    //Generate products table HTML
    const productsTableHTML = generateProductsTable(orderItems);

    // Generate cost breakdown HTML
    const costBreakdownHTML = generateCostBreakdown(saleOrder);

    // Generate payment schedule HTML
    const paymentScheduleHTML = generatePaymentSchedule(saleOrder);

    // Generate job cards HTML
    const jobCardsHTML = generateJobCardsTable(jobCards);

    // Generate terms HTML
    const termsHTML = generateTermsHTML();

    return {
        orderNumber: safe(saleOrder.order_number, `SO-${saleOrder.id?.slice(0, 8)}`),
        orderDate: formatDate(saleOrder.created_at),
        deliveryDate: formatDate(order.expected_delivery_date || order.delivery_date),
        customerName: safe(order.customer_name),
        customerEmail: safe(order.customer_email),
        customerPhone: safe(order.customer_phone),
        customerAddress,
        finalPrice: saleOrder.final_price || 0,
        basePrice: saleOrder.base_price || 0,
        discount: saleOrder.discount || 0,
        productsTableHTML,
        costBreakdownHTML,
        paymentScheduleHTML,
        jobCardsHTML,
        termsHTML,
    };
}

// Helper: Generate products table
function generateProductsTable(orderItems: any[]): string {
    if (!orderItems || orderItems.length === 0) {
        return `<p style="text-align: center; padding: 20px; color: #666;">No products in this order</p>`;
    }

    const rows = orderItems.map((item, index) => {
        const productTitle = safe(item.product_title, safe(item.product_name, "Product"));
        const quantity = item.quantity || 1;
        const price = item.unit_price_rs || item.total_price_rs || 0;
        const total = item.total_price_rs || (quantity * price);

        return `
      <tr>
        <td>${index + 1}</td>
        <td>${productTitle}</td>
        <td>${quantity}</td>
        <td>${formatCurrency(price)}</td>
        <td>${formatCurrency(total)}</td>
      </tr>
    `;
    }).join("");

    return `
    <table>
      <thead>
        <tr>
          <th>Sl No.</th>
          <th>Description</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

// Helper: Generate cost breakdown
function generateCostBreakdown(saleOrder: any): string {
    const basePrice = saleOrder.base_price || 0;
    const discount = saleOrder.discount || 0;
    const finalPrice = saleOrder.final_price || 0;

    // Calculate GST (assuming 18%)
    const gstRate = 18;
    const priceBeforeTax = finalPrice / (1 + gstRate / 100);
    const gstAmount = finalPrice - priceBeforeTax;
    const subtotal = priceBeforeTax + discount;

    return `
    <div class="cost-summary">
      <div class="cost-row">
        <span>Subtotal (Before Tax):</span>
        <span>${formatCurrency(subtotal)}</span>
      </div>
      <div class="cost-row">
        <span>Discount Applied:</span>
        <span class="text-gold">- ${formatCurrency(discount)}</span>
      </div>
      <div class="cost-row">
        <span>Subtotal After Discount:</span>
        <span>${formatCurrency(priceBeforeTax)}</span>
      </div>
      <div class="cost-row">
        <span>GST @ ${gstRate}%:</span>
        <span>${formatCurrency(gstAmount)}</span>
      </div>
      <div class="cost-row total">
        <span>GRAND TOTAL:</span>
        <span>${formatCurrency(finalPrice)}</span>
      </div>
    </div>
  `;
}

// Helper: Generate payment schedule
function generatePaymentSchedule(saleOrder: any): string {
    const finalPrice = saleOrder.final_price || 0;
    const advance = Math.round(finalPrice * 0.5);
    const balance = finalPrice - advance;

    return `
    <table>
      <thead>
        <tr>
          <th>Stage</th>
          <th>Amount</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Advance Payment (50%)</td>
          <td>${formatCurrency(advance)}</td>
          <td>Due on placing Sale Order</td>
        </tr>
        <tr>
          <td>Balance Payment (50%)</td>
          <td>${formatCurrency(balance)}</td>
          <td>Due upon intimation of product readiness, before dispatch</td>
        </tr>
      </tbody>
    </table>
    <p style="margin-top: 8px; font-size: 10pt; color: #666;">
      <strong>Payment Method:</strong> Bank Transfer / UPI / Cash
    </p>
  `;
}

// Helper: Generate job cards table
function generateJobCardsTable(jobCards: any[]): string {
    if (!jobCards || jobCards.length === 0) {
        return `<p style="text-align: center; padding: 20px; color: #666;">No job cards generated yet</p>`;
    }

    const rows = jobCards.map(jc => `
    <tr>
      <td>${safe(jc.job_card_number, `JC-${jc.id?.slice(0, 6)}`)}</td>
      <td>${safe(jc.product_title, safe(jc.product_category))}</td>
      <td>${toTitle(safe(jc.status, "Pending"))}</td>
    </tr>
  `).join("");

    return `
    <table>
      <thead>
        <tr>
          <th>J.C. Number</th>
          <th>Product</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

// Helper: Generate terms & conditions
function generateTermsHTML(): string {
    return `
    <div style="font-size: 10pt; line-height: 1.7; padding: 10px; background: #f9f9f9; border-radius: 4px;">
      <ol style="margin-left: 20px;">
        <li><strong>Payment:</strong> 50% advance payment required at the time of order confirmation. Balance 50% to be paid before dispatch.</li>
        <li><strong>Delivery:</strong> Estimated delivery as per order date. Actual delivery may vary by ±7 days based on production schedule.</li>
        <li><strong>Warranty:</strong> 1-year warranty on manufacturing defects. Warranty does not cover normal wear and tear, misuse, or accidental damage.</li>
        <li><strong>Cancellation:</strong> Order cancellation after advance payment will incur 20% cancellation charges. No cancellation allowed once production starts.</li>
        <li><strong>Customization:</strong> This is a customized order. Minor variations in color, texture, and dimensions (±5%) may occur.</li>
        <li><strong>Installation:</strong> Installation services available at additional cost.</li>
        <li><strong>Returns:</strong> Customized products are non-returnable unless there is a manufacturing defect.</li>
        <li><strong>Complaints:</strong> Any complaints must be raised within 48 hours of delivery with photographic evidence.</li>
        <li><strong>Force Majeure:</strong> Estre shall not be liable for any delay or failure due to circumstances beyond reasonable control.</li>
        <li><strong>Governing Law:</strong> This agreement shall be governed by the laws of India. Disputes subject to Bangalore jurisdiction.</li>
      </ol>
    </div>
  `;
}

// Helper: Format date
function formatDate(dateStr?: string | null): string {
    if (!dateStr) return "—";
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return "—";
    }
}
