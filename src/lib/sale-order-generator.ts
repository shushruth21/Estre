import { supabase } from "@/integrations/supabase/client";

export interface SaleOrderData {
  // Header
  soNumber: string;
  date: string;
  validUntil: string;
  category: string;
  
  // Customer Info
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerGstin?: string;
  billingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    mobile?: string;
    email?: string;
  };
  
  // Product Configuration
  productName: string;
  shapeType: string;
  totalSeats: number;
  sections: {
    front?: { type: string; price: number; total: number };
    flCorner?: { type: string; price: number; total: number };
    frCorner?: { type: string; price: number; total: number };
    left?: { type: string; price: number; total: number };
    right?: { type: string; price: number; total: number };
    center1?: { type: string; price: number; total: number };
    center2?: { type: string; price: number; total: number };
  };
  baseSofaTotal: number;
  
  // Consoles
  console: {
    required: string;
    qty: number;
    size: string;
    type: string;
    unitPrice: number;
    total: number;
    placements: Array<{
      section: string;
      position: string;
      accessory?: string;
    }>;
  };
  
  // Loungers
  lounger: {
    required: string;
    qty: number;
    size: string;
    position: string;
    storage: string;
    unitPrice: number;
    total: number;
  };
  
  // Recliners
  recliner: {
    required: string;
    qty: number;
    type: string;
    unitPrice: number;
    total: number;
    positions: {
      front?: { position: string; qty: number };
      left?: { position: string; qty: number };
      right?: { position: string; qty: number };
    };
  };
  
  // Pillows
  pillows: {
    required: string;
    qty: number;
    type: string;
    size: string;
    colorOption: string;
    unitPrice: number;
    total: number;
    fabrics: Array<{
      pillowNumber: number;
      colorNumber: number;
      fabricCode: string;
      fabricName: string;
      color: string;
    }>;
  };
  
  // Fabric
  fabric: {
    claddingPlan: string;
    singleColor?: {
      fabricCode: string;
      fabricName: string;
      srNo: string;
      pricePerMeter: number;
      meters: number;
      total: number;
    };
    multiColor?: {
      structure: { code: string; name: string; srNo: string; price: number; meters: number; total: number };
      backrest: { code: string; name: string; srNo: string; price: number; meters: number; total: number };
      seat: { code: string; name: string; srNo: string; price: number; meters: number; total: number };
      headrest?: { code: string; name: string; srNo: string; price: number; meters: number; total: number };
    };
    upgradeCharges: number;
  };
  
  // Dimensions
  dimensions: {
    seatDepth: { standard: string; selected: string; upgrade: number };
    seatWidth: { standard: string; selected: string; upgrade: number };
    seatHeight: { standard: string; selected: string; upgrade: number };
    totalUpgrade: number;
  };
  
  // Materials
  materials: {
    foamType: string;
    foamUpgrade: number;
    woodType: string;
    woodUpgrade: number;
    armrestType: string;
    armrestWidth?: string;
    armrestUpgrade: number;
    legsType: string;
    legsHeight?: string;
    legsColor?: string;
    legsUpgrade: number;
    stitchType: string;
    stitchUpgrade: number;
  };
  
  // Accessories
  accessories: Array<{
    name: string;
    spec: string;
    qty: number;
    unitPrice: number;
    total: number;
  }>;
  accessoriesTotal: number;
  
  // Approximate Dimensions
  approximateDimensions: {
    front?: { width: number; depth: number; height: number };
    left?: { width: number; depth: number; height: number };
    right?: { width: number; depth: number; height: number };
    center1?: { width: number; depth: number; height: number };
    center2?: { width: number; depth: number; height: number };
  };
  
  // Price Breakdown
  priceBreakdown: {
    baseProductCost: number;
    consoleTotal: number;
    loungerTotal: number;
    reclinerTotal: number;
    pillowTotal: number;
    fabricUpgradeTotal: number;
    dimensionUpgradeTotal: number;
    foamUpgradeTotal: number;
    armrestUpgradeTotal: number;
    stitchTypePrice: number;
    accessoriesTotal: number;
    subtotal: number;
    discount: number;
    total: number;
  };
  
  // Delivery & Payment
  deliveryDays: number;
  expectedDeliveryDate: string;
  logisticsPartner?: string;
  paymentTerms: string;
}

export async function generateSaleOrderData(
  order: any,
  orderItem: any,
  configuration: any,
  pricingBreakdown: any
): Promise<SaleOrderData> {
  // Helper to get fabric details
  const getFabricDetails = async (fabricCode: string) => {
    if (!fabricCode) return null;
    const { data } = await supabase
      .from("fabric_coding")
      .select("estre_code, description, colour, sr_no, bom_price")
      .eq("estre_code", fabricCode)
      .single();
    return data;
  };

  // Format date
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  const today = new Date();
  const validUntil = new Date(today);
  validUntil.setDate(validUntil.getDate() + 30); // Valid for 30 days

  // Extract configuration details
  const shape = configuration.shape || "Standard";
  const totalSeats = calculateTotalSeats(configuration);
  
  // Get fabric details
  const fabricPlan = configuration.fabric?.claddingPlan || "Single Colour";
  let fabricDetails: any = {};
  
  if (fabricPlan === "Single Colour" && configuration.fabric?.structureCode) {
    const fabric = await getFabricDetails(configuration.fabric.structureCode);
    if (fabric) {
      fabricDetails.singleColor = {
        fabricCode: fabric.estre_code,
        fabricName: fabric.description || fabric.colour || fabric.estre_code,
        srNo: fabric.sr_no || "",
        pricePerMeter: fabric.bom_price || 0,
        meters: configuration.fabricMeters || 0,
        total: (fabric.bom_price || 0) * (configuration.fabricMeters || 0),
      };
    }
  } else if (fabricPlan === "Multi Colour") {
    const structureFabric = configuration.fabric?.structureCode 
      ? await getFabricDetails(configuration.fabric.structureCode) 
      : null;
    const backrestFabric = configuration.fabric?.backrestCode 
      ? await getFabricDetails(configuration.fabric.backrestCode) 
      : null;
    const seatFabric = configuration.fabric?.seatCode 
      ? await getFabricDetails(configuration.fabric.seatCode) 
      : null;
    const headrestFabric = configuration.fabric?.headrestCode 
      ? await getFabricDetails(configuration.fabric.headrestCode) 
      : null;
    
    fabricDetails.multiColor = {
      structure: structureFabric ? {
        code: structureFabric.estre_code,
        name: structureFabric.description || structureFabric.colour || structureFabric.estre_code,
        srNo: structureFabric.sr_no || "",
        price: structureFabric.bom_price || 0,
        meters: (configuration.fabricMeters || 0) * 0.7,
        total: (structureFabric.bom_price || 0) * (configuration.fabricMeters || 0) * 0.7,
      } : null,
      backrest: backrestFabric ? {
        code: backrestFabric.estre_code,
        name: backrestFabric.description || backrestFabric.colour || backrestFabric.estre_code,
        srNo: backrestFabric.sr_no || "",
        price: backrestFabric.bom_price || 0,
        meters: (configuration.fabricMeters || 0) * 0.12,
        total: (backrestFabric.bom_price || 0) * (configuration.fabricMeters || 0) * 0.12,
      } : null,
      seat: seatFabric ? {
        code: seatFabric.estre_code,
        name: seatFabric.description || seatFabric.colour || seatFabric.estre_code,
        srNo: seatFabric.sr_no || "",
        price: seatFabric.bom_price || 0,
        meters: (configuration.fabricMeters || 0) * 0.21,
        total: (seatFabric.bom_price || 0) * (configuration.fabricMeters || 0) * 0.21,
      } : null,
      headrest: headrestFabric ? {
        code: headrestFabric.estre_code,
        name: headrestFabric.description || headrestFabric.colour || headrestFabric.estre_code,
        srNo: headrestFabric.sr_no || "",
        price: headrestFabric.bom_price || 0,
        meters: (configuration.fabricMeters || 0) * 0.12,
        total: (headrestFabric.bom_price || 0) * (configuration.fabricMeters || 0) * 0.12,
      } : null,
    };
  }

  // Build sale order data
  const saleOrderData: SaleOrderData = {
    soNumber: `SO-${new Date().getFullYear()}-${String(order.order_number).split('-').pop() || 'XXXX'}`,
    date: formatDate(today),
    validUntil: formatDate(validUntil),
    category: orderItem.product_category?.toUpperCase() || "SOFA",
    
    customerName: order.customer_name || "",
    customerEmail: order.customer_email || "",
    customerPhone: order.customer_phone || "",
    billingAddress: {
      line1: order.delivery_address?.street || "",
      line2: order.delivery_address?.landmark || "",
      city: order.delivery_address?.city || "",
      state: order.delivery_address?.state || "",
      pincode: order.delivery_address?.pincode || "",
    },
    shippingAddress: {
      name: order.customer_name || "",
      line1: order.delivery_address?.street || "",
      line2: order.delivery_address?.landmark || "",
      city: order.delivery_address?.city || "",
      state: order.delivery_address?.state || "",
      pincode: order.delivery_address?.pincode || "",
      mobile: order.customer_phone || "",
      email: order.customer_email || "",
    },
    
    productName: orderItem.product_title || "Custom Product",
    shapeType: shape.toUpperCase(),
    totalSeats,
    sections: extractSections(configuration, pricingBreakdown),
    baseSofaTotal: pricingBreakdown.baseSeatPrice + pricingBreakdown.additionalSeatsPrice + 
                   pricingBreakdown.cornerSeatsPrice + pricingBreakdown.backrestSeatsPrice,
    
    console: extractConsoleDetails(configuration, pricingBreakdown),
    lounger: extractLoungerDetails(configuration, pricingBreakdown),
    recliner: extractReclinerDetails(configuration, pricingBreakdown),
    pillows: await extractPillowDetails(configuration, pricingBreakdown, getFabricDetails),
    
    fabric: {
      claddingPlan: fabricPlan,
      ...fabricDetails,
      upgradeCharges: pricingBreakdown.fabricCharges || 0,
    },
    
    dimensions: extractDimensions(configuration, pricingBreakdown),
    materials: extractMaterials(configuration, pricingBreakdown),
    accessories: await extractAccessories(configuration, pricingBreakdown),
    accessoriesTotal: pricingBreakdown.accessoriesPrice || 0,
    
    approximateDimensions: extractApproximateDimensions(configuration),
    
    priceBreakdown: {
      baseProductCost: pricingBreakdown.baseSeatPrice || pricingBreakdown.basePrice || 0,
      consoleTotal: pricingBreakdown.consolePrice || 0,
      loungerTotal: pricingBreakdown.loungerPrice || 0,
      reclinerTotal: pricingBreakdown.mechanismUpgrade || 0,
      pillowTotal: pricingBreakdown.pillowsPrice || 0,
      fabricUpgradeTotal: pricingBreakdown.fabricCharges || 0,
      dimensionUpgradeTotal: pricingBreakdown.dimensionUpgrade || 0,
      foamUpgradeTotal: pricingBreakdown.foamUpgrade || 0,
      armrestUpgradeTotal: pricingBreakdown.armrestUpgrade || 0,
      stitchTypePrice: pricingBreakdown.stitchTypePrice || 0,
      accessoriesTotal: pricingBreakdown.accessoriesPrice || 0,
      subtotal: pricingBreakdown.subtotal || 0,
      discount: pricingBreakdown.discountAmount || 0,
      total: pricingBreakdown.total || 0,
    },
    
    deliveryDays: 30,
    expectedDeliveryDate: order.expected_delivery_date 
      ? formatDate(order.expected_delivery_date) 
      : formatDate(new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)),
    paymentTerms: "1) Advance Payment: 50% upon placing Sale Order\n2) Balance Payment: Upon intimation of product readiness, before dispatch",
  };

  return saleOrderData;
}

// Helper functions
function calculateTotalSeats(config: any): number {
  const frontSeats = config.frontSeats || parseSeatCount(config.frontSeatCount) || 0;
  const l2Seats = parseSeatCount(config.l2SeatCount || config.l2 || 0);
  const r2Seats = parseSeatCount(config.r2SeatCount || config.r2 || 0);
  return frontSeats + l2Seats + r2Seats;
}

function parseSeatCount(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const match = value.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
  return 0;
}

function extractSections(config: any, breakdown: any): any {
  const sections: any = {};
  if (config.frontSeats || config.frontSeatCount) {
    sections.front = {
      type: `${config.frontSeats || parseSeatCount(config.frontSeatCount)} Seater`,
      price: breakdown.baseSeatPrice || 0,
      total: breakdown.baseSeatPrice || 0,
    };
  }
  // Add other sections based on shape
  return sections;
}

function extractConsoleDetails(config: any, breakdown: any): any {
  return {
    required: config.console?.required ? "Yes" : "No",
    qty: config.console?.quantity || 0,
    size: config.console?.size || "",
    type: config.console?.size || "",
    unitPrice: (breakdown.consolePrice || 0) / (config.console?.quantity || 1),
    total: breakdown.consolePrice || 0,
    placements: config.console?.placements || [],
  };
}

function extractLoungerDetails(config: any, breakdown: any): any {
  return {
    required: config.lounger?.required ? "Yes" : "No",
    qty: config.lounger?.quantity || 0,
    size: config.lounger?.size || "",
    position: config.lounger?.placement || "",
    storage: config.lounger?.storage || "No",
    unitPrice: (breakdown.loungerPrice || 0) / (config.lounger?.quantity || 1),
    total: breakdown.loungerPrice || 0,
  };
}

function extractReclinerDetails(config: any, breakdown: any): any {
  return {
    required: config.mechanism?.front || config.mechanism?.left ? "Yes" : "No",
    qty: 0,
    type: config.mechanism?.front || "Manual",
    unitPrice: 0,
    total: breakdown.mechanismUpgrade || 0,
    positions: {},
  };
}

async function extractPillowDetails(config: any, breakdown: any, getFabric: (code: string) => Promise<any>): Promise<any> {
  const pillows = config.additionalPillows || {};
  const fabrics: any[] = [];
  
  if (pillows.fabricColour) {
    const fabric = await getFabric(pillows.fabricColour);
    if (fabric) {
      fabrics.push({
        pillowNumber: 1,
        colorNumber: 1,
        fabricCode: fabric.estre_code,
        fabricName: fabric.description || fabric.colour || fabric.estre_code,
        color: fabric.colour || "",
      });
    }
  }
  
  if (pillows.fabricColour1) {
    const fabric = await getFabric(pillows.fabricColour1);
    if (fabric) {
      fabrics.push({
        pillowNumber: 1,
        colorNumber: 1,
        fabricCode: fabric.estre_code,
        fabricName: fabric.description || fabric.colour || fabric.estre_code,
        color: fabric.colour || "",
      });
    }
  }
  
  if (pillows.fabricColour2) {
    const fabric = await getFabric(pillows.fabricColour2);
    if (fabric) {
      fabrics.push({
        pillowNumber: 1,
        colorNumber: 2,
        fabricCode: fabric.estre_code,
        fabricName: fabric.description || fabric.colour || fabric.estre_code,
        color: fabric.colour || "",
      });
    }
  }
  
  return {
    required: pillows.required ? "Yes" : "No",
    qty: pillows.quantity || 0,
    type: pillows.type || "",
    size: pillows.size || "",
    colorOption: pillows.fabricPlan || "Single Colour",
    unitPrice: (breakdown.pillowsPrice || 0) / (pillows.quantity || 1),
    total: breakdown.pillowsPrice || 0,
    fabrics,
  };
}

function extractDimensions(config: any, breakdown: any): any {
  return {
    seatDepth: {
      standard: "22 in",
      selected: `${config.dimensions?.seatDepth || 22} in`,
      upgrade: 0,
    },
    seatWidth: {
      standard: "22 in",
      selected: `${config.dimensions?.seatWidth || 22} in`,
      upgrade: 0,
    },
    seatHeight: {
      standard: "18 in",
      selected: `${config.dimensions?.seatHeight || 18} in`,
      upgrade: 0,
    },
    totalUpgrade: breakdown.dimensionUpgrade || 0,
  };
}

function extractMaterials(config: any, breakdown: any): any {
  return {
    foamType: config.foam?.type || "Firm",
    foamUpgrade: breakdown.foamUpgrade || 0,
    woodType: config.wood?.type || "Pine (Default)",
    woodUpgrade: 0,
    armrestType: config.armrest?.type || "Default",
    armrestWidth: "",
    armrestUpgrade: breakdown.armrestUpgrade || 0,
    legsType: config.legs?.type || "",
    legsHeight: "",
    legsColor: "",
    legsUpgrade: breakdown.accessoriesPrice || 0,
    stitchType: config.stitch?.type || "",
    stitchUpgrade: breakdown.stitchTypePrice || 0,
  };
}

async function extractAccessories(config: any, breakdown: any): Promise<any[]> {
  const accessories: any[] = [];
  
  if (config.console?.placements) {
    for (const placement of config.console.placements) {
      if (placement.accessoryId) {
        const { data: accessory } = await supabase
          .from("accessories_prices")
          .select("description, sale_price")
          .eq("id", placement.accessoryId)
          .single();
        
        if (accessory) {
          accessories.push({
            name: accessory.description,
            spec: "",
            qty: 1,
            unitPrice: accessory.sale_price || 0,
            total: accessory.sale_price || 0,
          });
        }
      }
    }
  }
  
  return accessories;
}

function extractApproximateDimensions(config: any): any {
  return {
    front: {
      width: (config.dimensions?.seatWidth || 22) * (config.frontSeats || 2),
      depth: config.dimensions?.seatDepth || 22,
      height: config.dimensions?.seatHeight || 18,
    },
  };
}

