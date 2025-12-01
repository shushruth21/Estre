/**
 * Premium Quality Inspection Report (QIR) Template Generator
 * 
 * Generates a formatted HTML report for quality inspection of manufactured products
 */

export interface QIRTemplateData {
    qir_number: string;
    so_number: string;
    jc_number: string;
    so_date: string;
    jc_date: string;
    qir_date: string;
    job_given_to: string;
    delivery_date: string;

    // Product Description
    product_type: string;
    model_name: string;
    sofa_type: string;

    // Seating Configuration
    sections: Array<{
        section: string;
        seater: string;
    }>;

    // Consoles
    console?: {
        required: boolean;
        count: number;
        size: string;
        placements: Array<{
            section: string;
            position: string;
        }>;
    };

    // Loungers
    lounger?: {
        required: boolean;
        count: number;
        size: string;
        positioning: string;
    };

    // Frame
    wood_type: string;

    // Dimensions
    dimensions: {
        seatDepth: number;
        seatWidth: number;
        seatHeight: number;
        frontWidth?: number;
        leftWidth?: number;
        rightWidth?: number;
    };

    // Armrest
    armrest_type: string;
    armrest_width?: number;

    // Stitching
    stitch_type: string;

    // Fabric
    fabric_plan: {
        planType: string;
        fabricCodes: Record<string, string>;
    };

    // Legs
    legs: string;

    // Accessories
    accessories: Array<{
        name: string;
        quantity: number;
    }>;
}

export function generateQIRHTML(data: QIRTemplateData): string {
    const consolePlacementsHTML = data.console?.placements
        ?.map((p, idx) => `
      <tr>
        <td style="padding: 4px 8px;">${p.section} Console ${idx + 1}</td>
        <td style="padding: 4px 8px;">:</td>
        <td style="padding: 4px 8px;">${p.position}</td>
        <td style="padding: 4px 8px; text-align: center;">☐</td>
      </tr>
    `).join('') || '';

    const sectionRowsHTML = data.sections
        ?.map(s => `
      <tr>
        <td style="padding: 4px 8px; text-transform: capitalize;">${s.section}</td>
        <td style="padding: 4px 8px;">:</td>
        <td style="padding: 4px 8px;">${s.seater}</td>
        <td style="padding: 4px 8px; text-align: center;">☐</td>
      </tr>
    `).join('') || '';

    const fabricCodesHTML = Object.entries(data.fabric_plan.fabricCodes || {})
        .map(([key, value]) => `
      <tr>
        <td style="padding: 4px 8px; text-transform: capitalize;">${key}</td>
        <td style="padding: 4px 8px;">:</td>
        <td style="padding: 4px 8px;">${value}</td>
        <td style="padding: 4px 8px; text-align: center;">☐</td>
      </tr>
    `).join('');

    const accessoriesHTML = data.accessories
        ?.map(acc => `
      <tr>
        <td style="padding: 4px 8px;" colspan="3">${acc.name} (${acc.quantity})</td>
        <td style="padding: 4px 8px; text-align: center;">☐</td>
      </tr>
    `).join('') || '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quality Inspection Report - ${data.qir_number}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      padding: 20px;
      background: white;
      color: #222;
      font-size: 12px;
      line-height: 1.4;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 3px solid #664331;
      padding-bottom: 10px;
    }
    
    .header h1 {
      font-size: 18px;
      font-weight: bold;
      color: #664331;
      margin-bottom: 4px;
    }
    
    .header h2 {
      font-size: 14px;
      color: #937867;
      margin-bottom: 4px;
    }
    
    .metadata {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      margin-bottom: 20px;
      background: #F4F5F0;
      padding: 10px;
      border: 1px solid #D6B485;
    }
    
    .metadata-item {
      display: flex;
      gap: 8px;
    }
    
    .metadata-item strong {
      min-width: 80px;
      color: #664331;
    }
    
    .section {
      margin-bottom: 15px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 13px;
      font-weight: bold;
      color: #664331;
      border-bottom: 2px solid #D6B485;
      padding: 6px 0;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    
    table tr {
      border-bottom: 1px solid #eee;
    }
    
    table td {
      padding: 4px 8px;
      vertical-align: top;
    }
    
    table td:first-child {
      font-weight: 600;
      color: #664331;
    }
    
    table td:last-child {
      width: 40px;
      text-align: center;
      font-size: 16px;
    }
    
    .checkbox {
      width: 16px;
      height: 16px;
      border: 2px solid #664331;
      display: inline-block;
    }
    
    @media print {
      body {
        padding: 10px;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>QUALITY INSPECTION REPORT</h1>
      <h2>ESTRE GLOBAL PRIVATE LIMITED</h2>
    </div>
    
    <div class="metadata">
      <div class="metadata-item">
        <strong>S.O. No:</strong>
        <span>${data.so_number}</span>
      </div>
      <div class="metadata-item">
        <strong>J.C. No:</strong>
        <span>${data.jc_number}</span>
      </div>
      <div class="metadata-item">
        <strong>QIR No:</strong>
        <span>${data.qir_number}</span>
      </div>
      <div class="metadata-item">
        <strong>S.O. Date:</strong>
        <span>${data.so_date}</span>
      </div>
      <div class="metadata-item">
        <strong>J.C. Date:</strong>
        <span>${data.jc_date}</span>
      </div>
      <div class="metadata-item">
        <strong>QIR Date:</strong>
        <span>${data.qir_date}</span>
      </div>
      <div class="metadata-item">
        <strong>Job Given To:</strong>
        <span>${data.job_given_to}</span>
      </div>
      <div class="metadata-item">
        <strong>Delivery Date:</strong>
        <span>${data.delivery_date}</span>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Product Description</div>
      <table>
        <tr>
          <td>Product</td>
          <td>:</td>
          <td>${data.product_type}</td>
          <td>☐</td>
        </tr>
        <tr>
          <td>Model</td>
          <td>:</td>
          <td>${data.model_name}</td>
          <td>☐</td>
        </tr>
        <tr>
          <td>Sofa Type</td>
          <td>:</td>
          <td>${data.sofa_type}</td>
          <td>☐</td>
        </tr>
      </table>
    </div>
    
    ${data.sections && data.sections.length > 0 ? `
    <div class="section">
      <div class="section-title">Seating Configuration</div>
      <table>
        ${sectionRowsHTML}
      </table>
    </div>
    ` : ''}
    
    ${data.console?.required ? `
    <div class="section">
      <div class="section-title">Consoles</div>
      <table>
        <tr>
          <td>No. of Consoles</td>
          <td>:</td>
          <td>${data.console.count} Nos.</td>
          <td>☐</td>
        </tr>
        <tr>
          <td>Console Size</td>
          <td>:</td>
          <td>${data.console.size}</td>
          <td>☐</td>
        </tr>
        <tr>
          <td colspan="4" style="font-weight: bold; padding-top: 8px;">Console Positioning:</td>
        </tr>
        ${consolePlacementsHTML}
      </table>
    </div>
    ` : ''}
    
    ${data.lounger?.required ? `
    <div class="section">
      <div class="section-title">Loungers</div>
      <table>
        <tr>
          <td>No. of Loungers</td>
          <td>:</td>
          <td>${data.lounger.count} No.</td>
          <td>☐</td>
        </tr>
        <tr>
          <td>Lounger Size</td>
          <td>:</td>
          <td>${data.lounger.size}</td>
          <td>☐</td>
        </tr>
        <tr>
          <td>Lounger Positioning</td>
          <td>:</td>
          <td>${data.lounger.positioning}</td>
          <td>☐</td>
        </tr>
      </table>
    </div>
    ` : ''}
    
    <div class="section">
      <div class="section-title">Frame</div>
      <table>
        <tr>
          <td>Wood Type</td>
          <td>:</td>
          <td>${data.wood_type}</td>
          <td>☐</td>
        </tr>
      </table>
    </div>
    
    <div class="section">
      <div class="section-title">Seat Dimensions</div>
      <table>
        <tr>
          <td>Seat Depth</td>
          <td>:</td>
          <td>${data.dimensions.seatDepth} in</td>
          <td>☐</td>
        </tr>
        <tr>
          <td>Seat Width</td>
          <td>:</td>
          <td>${data.dimensions.seatWidth} in</td>
          <td>☐</td>
        </tr>
        <tr>
          <td>Seat Height</td>
          <td>:</td>
          <td>${data.dimensions.seatHeight} in</td>
          <td>☐</td>
        </tr>
      </table>
    </div>
    
    ${data.dimensions.frontWidth ? `
    <div class="section">
      <div class="section-title">Sofa Dimensions</div>
      <table>
        <tr>
          <td>Front Sofa Width</td>
          <td>:</td>
          <td>${data.dimensions.frontWidth} in</td>
          <td>☐</td>
        </tr>
        ${data.dimensions.leftWidth ? `
        <tr>
          <td>Left Sofa Width</td>
          <td>:</td>
          <td>${data.dimensions.leftWidth} in</td>
          <td>☐</td>
        </tr>
        ` : ''}
        ${data.dimensions.rightWidth ? `
        <tr>
          <td>Right Sofa Width</td>
          <td>:</td>
          <td>${data.dimensions.rightWidth} in</td>
          <td>☐</td>
        </tr>
        ` : ''}
      </table>
    </div>
    ` : ''}
    
    <div class="section">
      <div class="section-title">Armrest Description</div>
      <table>
        <tr>
          <td>Armrest Type</td>
          <td>:</td>
          <td>${data.armrest_type}</td>
          <td>☐</td>
        </tr>
        ${data.armrest_width ? `
        <tr>
          <td>Armrest Width</td>
          <td>:</td>
          <td>${data.armrest_width} in each</td>
          <td>☐</td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <div class="section">
      <div class="section-title">Cutting & Stitching Specifications</div>
      <table>
        <tr>
          <td>Stitching Type</td>
          <td>:</td>
          <td>${data.stitch_type}</td>
          <td>☐</td>
        </tr>
      </table>
    </div>
    
    <div class="section">
      <div class="section-title">Fabric Description</div>
      <table>
        <tr>
          <td>Colour Theme</td>
          <td>:</td>
          <td>${data.fabric_plan.planType}</td>
          <td>☐</td>
        </tr>
        ${fabricCodesHTML}
      </table>
    </div>
    
    <div class="section">
      <div class="section-title">Legs</div>
      <table>
        <tr>
          <td>Leg Model</td>
          <td>:</td>
          <td>${data.legs}</td>
          <td>☐</td>
        </tr>
      </table>
    </div>
    
    ${data.accessories && data.accessories.length > 0 ? `
    <div class="section">
      <div class="section-title">Accessories</div>
      <table>
        ${accessoriesHTML}
      </table>
    </div>
    ` : ''}
  </div>
</body>
</html>
  `.trim();
}
