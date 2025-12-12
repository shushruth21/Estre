import { format } from "date-fns";

export interface QIRTemplateData {
    reportNumber: string;
    date: string;
    jobCardNumber: string;
    orderNumber: string;
    customerName: string;
    productTitle: string;
    overallRating: number;
    status: string;
    checklistHTML: string;
    imagesHTML: string;
    inspectorName: string;
}

export function mapQIRData(qir: any): QIRTemplateData {
    const jobCard = qir.job_card || {};
    const order = qir.order || {};

    return {
        reportNumber: `QIR-${qir.id.slice(0, 8).toUpperCase()}`,
        date: format(new Date(qir.created_at), "dd-MMM-yyyy"),
        jobCardNumber: jobCard.job_card_number || "N/A",
        orderNumber: order.order_number || "N/A",
        customerName: order.customer?.full_name || "Customer",
        productTitle: jobCard.product_title || "Product",
        overallRating: qir.overall_rating || 0,
        status: qir.qc_status || "pending",
        checklistHTML: generateChecklistHTML(qir.checklist_data),
        imagesHTML: generateImagesHTML(qir.qc_images),
        inspectorName: qir.inspector_name || "Staff",
    };
}

function generateChecklistHTML(checklistData: any): string {
    if (!checklistData) return "";

    let html = "";

    // Assuming checklistData is structured by sections
    Object.entries(checklistData).forEach(([section, items]: [string, any]) => {
        html += `<div class="section-header">${section.replace(/_/g, " ").toUpperCase()}</div>`;
        html += `<table class="checklist-table">`;
        html += `<tr><th>Check Point</th><th>Status</th><th>Remarks</th></tr>`;

        Object.entries(items).forEach(([item, details]: [string, any]) => {
            const statusColor = details.status === "pass" ? "green" : details.status === "fail" ? "red" : "gray";
            html += `
        <tr>
          <td>${item.replace(/_/g, " ")}</td>
          <td style="color: ${statusColor}; font-weight: bold;">${details.status?.toUpperCase()}</td>
          <td>${details.remarks || "-"}</td>
        </tr>
      `;
        });

        html += `</table>`;
    });

    return html;
}

function generateImagesHTML(images: string[]): string {
    if (!images || images.length === 0) return "";

    return `
    <div class="section-header">INSPECTION IMAGES</div>
    <div class="images-grid">
      ${images.map(img => `<div class="image-container"><img src="${img}" alt="Inspection Image" /></div>`).join("")}
    </div>
  `;
}

export function generateQIRHTML(data: QIRTemplateData): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Quality Inspection Report - ${data.reportNumber}</title>
<style>
  body { font-family: sans-serif; padding: 40px; color: #333; }
  .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #D6B485; padding-bottom: 20px; }
  .logo { font-size: 24px; font-weight: bold; color: #937867; }
  .title { font-size: 20px; font-weight: bold; text-align: center; margin-bottom: 30px; }
  
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
  .info-item { margin-bottom: 10px; }
  .label { font-weight: bold; color: #666; font-size: 12px; }
  .value { font-size: 14px; }
  
  .section-header { background: #f5f5f5; padding: 10px; font-weight: bold; margin-top: 20px; border-left: 4px solid #D6B485; }
  
  .checklist-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
  .checklist-table th { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; background: #fafafa; }
  .checklist-table td { padding: 8px; border-bottom: 1px solid #eee; }
  
  .images-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px; }
  .image-container img { width: 100%; height: 150px; object-fit: cover; border-radius: 4px; border: 1px solid #eee; }
  
  .footer { margin-top: 50px; text-align: right; font-size: 12px; color: #666; }
  
  .status-badge { 
    display: inline-block; padding: 5px 10px; border-radius: 4px; color: white; font-weight: bold;
    background: ${data.status === 'pass' ? '#22c55e' : data.status === 'fail' ? '#ef4444' : '#eab308'};
  }
</style>
</head>
<body>

<div class="header">
  <div class="logo">ESTRE</div>
  <div style="text-align: right;">
    <div class="label">REPORT NO</div>
    <div class="value">${data.reportNumber}</div>
  </div>
</div>

<div class="title">QUALITY INSPECTION REPORT</div>

<div class="info-grid">
  <div>
    <div class="info-item"><div class="label">JOB CARD</div><div class="value">${data.jobCardNumber}</div></div>
    <div class="info-item"><div class="label">ORDER NO</div><div class="value">${data.orderNumber}</div></div>
    <div class="info-item"><div class="label">CUSTOMER</div><div class="value">${data.customerName}</div></div>
  </div>
  <div>
    <div class="info-item"><div class="label">PRODUCT</div><div class="value">${data.productTitle}</div></div>
    <div class="info-item"><div class="label">INSPECTION DATE</div><div class="value">${data.date}</div></div>
    <div class="info-item"><div class="label">OVERALL STATUS</div><div class="value"><span class="status-badge">${data.status.toUpperCase()}</span></div></div>
  </div>
</div>

${data.checklistHTML}

${data.imagesHTML}

<div class="footer">
  <p>Inspected by: ${data.inspectorName}</p>
  <p>Date: ${data.date}</p>
</div>

</body>
</html>`;
}
