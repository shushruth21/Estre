
import { format } from "date-fns";

const LOGO_BASE64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcFBgIDBAj/xAAyEAABAwMCBAQEBQUAAAAAAAABAgMEAAURBiESIjFBBxNRYRQycYEjQpGhsRVSYsHR/8QAGAEAAwEBAAAAAAAAAAAAAAAAAgMEBQH/xAAhEQACAgICAgMBAAAAAAAAAAABAgARAyESBEETMVFhwf/aAAwDAQACEQMRAD8A7fhZrOHqHTcyNOlpZkQnkOtLUQAW3AUnb0Ncp7V3ahgF+K0Q4guR3Epb/MgjlB+tZeFcBm3WuSy0Ax55YcWEjrkJR6/SrvIaCMhsYCRxJ+tc1FTLYIEMdoUK6k4rDI5HF/vWafX5R/uvFXQH7e/7oopnxr4wGfb/2gD/xAAbAQADAQEBAQEAAAAAAAAAAAABAgMABAUGB//aAAgBAhAAAAKozE1yJMh1BpP/xAAbAQACAwEBAQAAAAAAAAAAAAAAAQIDBAUGB//aAAgBAxAAAABuGSZEywdQ7kp/2Q==";

export interface JobCardTemplateData {
    jobCardNumber: string;
    soNumber: string;
    soDate: string;
    jcIssueDate: string;
    deliveryDate: string;
    productTitle: string;
    productCategory: string;
    model: string;
    specs: {
        category: string;
        items: { label: string; value: string }[];
    }[];
}

export function mapJobCardData(jobCard: any, saleOrder: any): JobCardTemplateData {
    const specs = jobCard.technical_specifications || {};

    // Helper to format dimensions
    const formatDim = (val: any) => val ? `${val}"` : "-";

    const mappedSpecs = [];

    // 1. General Info
    mappedSpecs.push({
        category: "General Information",
        items: [
            { label: "Product Type", value: specs.product_type || jobCard.product_category || "-" },
            { label: "Sofa Type", value: specs.sofa_type || "-" },
            { label: "Configuration", value: specs.configuration_summary || "-" },
        ]
    });

    // 2. Dimensions
    if (specs.dimensions) {
        mappedSpecs.push({
            category: "Dimensions (Inches)",
            items: [
                { label: "Overall Length", value: formatDim(specs.dimensions.length) },
                { label: "Overall Depth", value: formatDim(specs.dimensions.depth) },
                { label: "Overall Height", value: formatDim(specs.dimensions.height) },
                { label: "Seat Height", value: formatDim(specs.dimensions.seat_height) },
                { label: "Seat Depth", value: formatDim(specs.dimensions.seat_depth) },
                { label: "Arm Height", value: formatDim(specs.dimensions.arm_height) },
            ]
        });
    }

    // 3. Fabric & Upholstery
    if (specs.fabric) {
        mappedSpecs.push({
            category: "Fabric & Upholstery",
            items: [
                { label: "Fabric Name", value: specs.fabric.name || "-" },
                { label: "Color/Code", value: specs.fabric.color || "-" },
                { label: "Supplier", value: specs.fabric.supplier || "-" },
                { label: "Direction", value: specs.fabric.direction || "Standard" },
                { label: "Piping/Welting", value: specs.fabric.piping || "None" },
            ]
        });
    }

    // 4. Structure & Legs
    const structureItems = [];
    if (specs.structure) {
        structureItems.push({ label: "Frame Material", value: specs.structure.material || "Solid Wood + Plywood" });
    }
    if (specs.legs) {
        structureItems.push({ label: "Leg Type", value: specs.legs.type || "-" });
        structureItems.push({ label: "Leg Finish", value: specs.legs.finish || "-" });
        structureItems.push({ label: "Leg Height", value: formatDim(specs.legs.height) });
    }
    if (structureItems.length > 0) {
        mappedSpecs.push({
            category: "Structure & Legs",
            items: structureItems
        });
    }

    // 5. Foam & Comfort
    if (specs.foam) {
        mappedSpecs.push({
            category: "Foam & Comfort",
            items: [
                { label: "Seat Foam", value: specs.foam.seat || "Standard High Density" },
                { label: "Back Foam", value: specs.foam.back || "Soft PU Foam" },
                { label: "Firmness", value: specs.foam.firmness || "Medium" },
            ]
        });
    }

    // 6. Accessories & Features
    if (specs.accessories && specs.accessories.length > 0) {
        mappedSpecs.push({
            category: "Accessories & Features",
            items: specs.accessories.map((acc: any) => ({
                label: acc.name || "Accessory",
                value: acc.description || "Included"
            }))
        });
    }

    // 7. Special Instructions / Notes
    if (specs.notes) {
        mappedSpecs.push({
            category: "Special Instructions",
            items: [
                { label: "Notes", value: specs.notes }
            ]
        });
    }

    return {
        jobCardNumber: jobCard.job_card_number,
        soNumber: saleOrder.order_number || saleOrder.so_number || "-",
        soDate: saleOrder.created_at ? format(new Date(saleOrder.created_at), "dd-MMM-yyyy") : "-",
        jcIssueDate: format(new Date(), "dd-MMM-yyyy"),
        deliveryDate: saleOrder.order?.expected_delivery_date ? format(new Date(saleOrder.order.expected_delivery_date), "dd-MMM-yyyy") : "-",
        productTitle: jobCard.product_title,
        productCategory: jobCard.product_category,
        model: jobCard.product_title,
        specs: mappedSpecs
    };
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
