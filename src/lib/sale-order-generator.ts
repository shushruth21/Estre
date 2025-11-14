import { supabase } from "@/integrations/supabase/client";
import { getConsolePositionLabel } from "@/lib/console-validation";
import { generateJobCardData, JobCardGeneratedData } from "@/lib/job-card-generator";
import { PricingBreakdown } from "@/lib/dynamic-pricing";

type SaleOrderStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "IN_PRODUCTION"
  | "READY"
  | "DISPATCHED"
  | "DELIVERED"
  | "CANCELLED";

export interface SaleOrderHeader {
  so_number: string;
  order_date: string;
  company: {
    name: string;
    addressLines: string[];
    phone: string;
    email: string;
    gst: string;
  };
  invoice_to: {
    customer_name: string;
    addressLines: string[];
    city: string;
    pincode: string;
    mobile: string;
    email: string;
  };
  dispatch_to: {
    customer_name: string;
    addressLines: string[];
    city: string;
    pincode: string;
    mobile: string;
    email: string;
  };
  payment_terms: {
    advance_percent: number;
    advance_condition: string;
    balance_condition: string;
    additional_terms?: string;
  };
  delivery_terms: {
    delivery_days: number;
    delivery_date: string;
    dispatch_through: string;
  };
  buyer_gst?: string;
  status: SaleOrderStatus;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface SaleOrderSection {
  section: string;
  section_label: string;
  seater_type: string;
  quantity: number;
  price: number;
}

export interface SaleOrderConsole {
  total_count: number;
  console_size: string;
  total_price: number;
  positions: Array<{
    section: string;
    position_label: string;
  }>;
}

export interface SaleOrderLounger {
  count: number;
  size: string;
  positioning: string;
  storage: string;
  total_price: number;
}

export interface SaleOrderPillow {
  count: number;
  type: string;
  size: string;
  colour_option: string;
  colours: string[];
  total_price: number;
}

export interface SaleOrderFabric {
  plan: "Single Colour" | "Multi Colour" | "Dual Colour";
  single_colour?: {
    fabric_code: string;
    fabric_name: string;
  };
  multi_colour?: {
    structure?: { code: string; name: string };
    backrest?: { code: string; name: string };
    seat?: { code: string; name: string };
    headrest?: { code: string; name: string };
  };
  upgrade_charge: number;
  colour_variance_note: string;
}

export interface SaleOrderAccessory {
  name: string;
  description: string;
  quantity: number;
  price: number;
}

export interface SaleOrderLineItem {
  line_item_id: string;
  so_number: string;
  category:
    | "SOFA"
    | "SOFABED"
    | "RECLINER"
    | "DINING_CHAIR"
    | "ARM_CHAIR"
    | "KIDS_BED"
    | "POUFFE";
  model_name: string;
  shape: string;
  sections: SaleOrderSection[];
  consoles?: SaleOrderConsole;
  loungers?: SaleOrderLounger;
  pillows?: SaleOrderPillow;
  fabric: SaleOrderFabric;
  foam_type?: string;
  foam_upgrade_charge: number;
  seat_dimensions: {
    depth_in: number;
    width_in: number;
    height_in: number;
    depth_upgrade_charge: number;
    width_upgrade_charge: number;
    height_upgrade_charge: number;
  };
  armrest_type: string;
  armrest_charge: number;
  legs: string;
  legs_charge: number;
  accessories: SaleOrderAccessory[];
  wood_type: string;
  stitch_type: string;
  approximate_widths: {
    front_inches?: number;
    left_inches?: number;
    right_inches?: number;
    overall_inches?: number;
  };
  line_total: number;
  reference_image_url?: string;
  wireframe_image_url?: string;
}

export interface SaleOrderTotals {
  so_number: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  advance_amount: number;
  balance_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  cgst_percent?: number;
  cgst_amount?: number;
  sgst_percent?: number;
  sgst_amount?: number;
  igst_percent?: number;
  igst_amount?: number;
  discount_percent?: number;
}

export interface SaleOrderPayment {
  payment_id: string;
  payment_date: string;
  payment_type: string;
  payment_method: string;
  payment_amount: number;
  payment_reference?: string;
  payment_notes?: string;
}

export interface SaleOrderGeneratedData {
  header: SaleOrderHeader;
  lineItems: SaleOrderLineItem[];
  totals: SaleOrderTotals;
  payments: SaleOrderPayment[];
  jobCards: JobCardGeneratedData[];
}

const COMPANY_INFO = {
  name: "ESTRE GLOBAL PRIVATE LTD",
  addressLines: [
    "Near Dhoni Public School",
    "AECS Layout-A Block, Revenue Layout",
    "Near Kudlu Gate, Singhasandra",
    "Bengaluru - 560 068",
  ],
  phone: "+91 87 22 200 100",
  email: "support@estre.in",
  gst: "29AAMCE9846D1ZU",
};

const SECTION_LABELS: Record<string, string> = {
  F: "Front",
  L1: "Left Corner",
  L2: "Left Section",
  R1: "Right Corner",
  R2: "Right Section",
  C1: "Center Backrest",
  C2: "Center Section",
  FL: "Front-Left",
  FR: "Front-Right",
};

const FABRIC_NOTE = "Colours may vary +/- 3% as indicated by supplier";

const DEFAULT_ADVANCE_PERCENT = 50;
const DEFAULT_DELIVERY_DAYS = 30;

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const coerceNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.]/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const generateId = (prefix: string) => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

const getSectionLabel = (key: string) => SECTION_LABELS[key] || key.toUpperCase();

const deriveConsolePositions = (placements: any[] | undefined) => {
  if (!Array.isArray(placements)) return [];

  return placements
    .filter((placement) => placement && placement.position && placement.position !== "none")
    .map((placement) => {
      const section = (placement.section || "").toString().toUpperCase();
      const match = placement.position.match(/(\d+)/);
      const consoleNumber = match ? parseInt(match[1], 10) : 1;
      return {
        section,
        position_label: getConsolePositionLabel(consoleNumber, section),
      };
    });
};

const getFabricDetails = async (code?: string) => {
  if (!code) return null;
  const { data, error } = await supabase
    .from("fabric_coding")
    .select("estre_code, description, colour")
    .eq("estre_code", code)
    .single();
  if (error) return null;
  return data;
};

const normaliseBooleanString = (value: any): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "yes";
  return false;
};

const deriveSeatCountFromSeater = (seater?: string) => {
  if (!seater) return 0;
  const match = seater.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

const calculateOverallWidth = (configuration: any): number => {
  const seatWidth = coerceNumber(configuration.dimensions?.seatWidth, 22);
  const sections = configuration.sections || {};
  let width = 0;

  Object.values(sections).forEach((section: any) => {
    if (!section?.seater || section.seater === "none") return;
    const seatCount = deriveSeatCountFromSeater(section.seater);
    const qty = section.qty || 1;
    width += seatWidth * seatCount * qty;
  });

  return width || seatWidth * 2;
};

const deriveLineItemSections = (configuration: any, basePrice: number): SaleOrderSection[] => {
  const sectionsConfig = configuration.sections || {};
  const activeKeys = Object.keys(sectionsConfig).filter(
    (key) => sectionsConfig[key] && sectionsConfig[key].seater && sectionsConfig[key].seater !== "none"
  );

  if (activeKeys.length === 0 && configuration.shape) {
    return [
      {
        section: "F",
        section_label: getSectionLabel("F"),
        seater_type: configuration.shape,
        quantity: 1,
        price: basePrice,
      },
    ];
  }

  return activeKeys.map((key) => {
    const sectionData = sectionsConfig[key];
    const quantity = sectionData.qty || 1;
    const seater = sectionData.seater;
    return {
      section: key,
      section_label: getSectionLabel(key),
      seater_type: seater,
      quantity,
      price: 0,
    };
  });
};

const deriveConsoleData = (configuration: any, breakdown: any): SaleOrderConsole | undefined => {
  if (!configuration.console?.required) return undefined;

  const positions = deriveConsolePositions(configuration.console.placements);
  const totalCount = positions.length;

  return {
    total_count: totalCount,
    console_size: configuration.console.size || "",
    total_price: breakdown.consolePrice || 0,
    positions,
  };
};

const deriveLoungerData = (configuration: any, breakdown: any): SaleOrderLounger | undefined => {
  if (!normaliseBooleanString(configuration.lounger?.required)) return undefined;

  const loungerConfig = configuration.lounger || {};
  const size = loungerConfig.size || "";
  const positioning = loungerConfig.placement || loungerConfig.position || "";
  const storage = loungerConfig.storage || "No";
  const rawCount = loungerConfig.numberOfLoungers || loungerConfig.quantity || 1;
  const count = typeof rawCount === "string" ? (rawCount.includes("2") ? 2 : 1) : rawCount;

  return {
    count,
    size,
    positioning,
    storage,
    total_price: breakdown.loungerPrice || 0,
  };
};

const derivePillowData = (configuration: any, breakdown: any): SaleOrderPillow | undefined => {
  const pillows = configuration.additionalPillows || {};
  if (!normaliseBooleanString(pillows.required)) return undefined;

  const colourCodes: string[] = [];
  if (pillows.fabricColour) colourCodes.push(pillows.fabricColour);
  if (pillows.fabricColour1) colourCodes.push(pillows.fabricColour1);
  if (pillows.fabricColour2) colourCodes.push(pillows.fabricColour2);

  return {
    count: pillows.quantity || 0,
    type: pillows.type || "",
    size: pillows.size || "",
    colour_option: pillows.fabricPlan || "Single Colour",
    colours: colourCodes,
    total_price: breakdown.pillowsPrice || 0,
  };
};

const deriveFabricData = async (configuration: any, breakdown: any): Promise<SaleOrderFabric> => {
  const plan = (configuration.fabric?.claddingPlan || "Single Colour") as SaleOrderFabric["plan"];
  const fabric: SaleOrderFabric = {
    plan,
    upgrade_charge: breakdown.fabricCharges || 0,
    colour_variance_note: FABRIC_NOTE,
  };

  if (plan === "Single Colour" && configuration.fabric?.structureCode) {
    const structure = await getFabricDetails(configuration.fabric.structureCode);
    if (structure) {
      fabric.single_colour = {
        fabric_code: structure.estre_code,
        fabric_name: structure.description || structure.colour || structure.estre_code,
      };
    }
  } else {
    const structure = await getFabricDetails(configuration.fabric?.structureCode);
    const backrest = await getFabricDetails(configuration.fabric?.backrestCode);
    const seat = await getFabricDetails(configuration.fabric?.seatCode);
    const headrest = await getFabricDetails(configuration.fabric?.headrestCode);
    fabric.multi_colour = {
      structure: structure
        ? {
            code: structure.estre_code,
            name: structure.description || structure.colour || structure.estre_code,
          }
        : undefined,
      backrest: backrest
        ? { code: backrest.estre_code, name: backrest.description || backrest.colour || backrest.estre_code }
        : undefined,
      seat: seat ? { code: seat.estre_code, name: seat.description || seat.colour || seat.estre_code } : undefined,
      headrest: headrest
        ? { code: headrest.estre_code, name: headrest.description || headrest.colour || headrest.estre_code }
        : undefined,
    };
  }

  return fabric;
};

const deriveAccessories = async (configuration: any): Promise<SaleOrderAccessory[]> => {
  const accessories: SaleOrderAccessory[] = [];
  const placements = configuration.console?.placements || [];

  const accessoryIds = Array.from(
    new Set(
      placements
        .map((placement: any) => placement?.accessoryId)
        .filter((id: unknown) => id !== null && id !== undefined && id !== "none")
    )
  );

  if (accessoryIds.length === 0) return accessories;

  const { data, error } = await supabase
    .from("accessories_prices")
    .select("id, description, sale_price")
    .in(
      "id",
      accessoryIds.map((id) => id.toString())
    );

  if (error || !data) return accessories;

  data.forEach((accessory) => {
    accessories.push({
      name: accessory.description || "Accessory",
      description: accessory.description || "",
      quantity: 1,
      price: Number(accessory.sale_price) || 0,
    });
  });

  return accessories;
};

const deriveSeatDimensions = (configuration: any, breakdown: any) => {
  const depth = coerceNumber(configuration.dimensions?.seatDepth, 22);
  const width = coerceNumber(configuration.dimensions?.seatWidth, 22);
  const height = coerceNumber(configuration.dimensions?.seatHeight, 18);

  return {
    depth_in: depth,
    width_in: width,
    height_in: height,
    depth_upgrade_charge: 0,
    width_upgrade_charge: 0,
    height_upgrade_charge: 0,
    total_upgrade: breakdown.dimensionUpgrade || 0,
  };
};

const deriveLineItem = async (
  soNumber: string,
  orderItem: any,
  configuration: any,
  breakdown: PricingBreakdown
): Promise<SaleOrderLineItem> => {
  const category = (orderItem.product_category || "sofa").toUpperCase() as SaleOrderLineItem["category"];
  const sections = deriveLineItemSections(configuration, breakdown.basePrice || 0);
  const fabric = await deriveFabricData(configuration, breakdown);
  const accessories = await deriveAccessories(configuration);
  const seatDimensions = deriveSeatDimensions(configuration, breakdown);
  const overallWidth = calculateOverallWidth(configuration);
  const lineItemId = orderItem.id || `${soNumber}-${Math.random().toString(36).slice(-4)}`;

  return {
    line_item_id: lineItemId,
    so_number: soNumber,
    category,
    model_name: orderItem.product_title || configuration.model || "Custom Model",
    shape: configuration.baseShape || configuration.shape || "",
    sections,
    consoles: deriveConsoleData(configuration, breakdown),
    loungers: deriveLoungerData(configuration, breakdown),
    pillows: derivePillowData(configuration, breakdown),
    fabric,
    foam_type: configuration.foam?.type || "Firm",
    foam_upgrade_charge: breakdown.foamUpgrade || 0,
    seat_dimensions: {
      depth_in: seatDimensions.depth_in,
      width_in: seatDimensions.width_in,
      height_in: seatDimensions.height_in,
      depth_upgrade_charge: seatDimensions.depth_upgrade_charge,
      width_upgrade_charge: seatDimensions.width_upgrade_charge,
      height_upgrade_charge: seatDimensions.height_upgrade_charge,
    },
    armrest_type: configuration.armrest?.type || "Standard Armrest",
    armrest_charge: breakdown.armrestUpgrade || 0,
    legs: configuration.legs?.type || "Standard Legs",
    legs_charge: breakdown.accessoriesPrice || 0,
    accessories,
    wood_type: configuration.wood?.type || "Standard Wood",
    stitch_type: configuration.stitch?.type || "Standard Stitch",
    approximate_widths: {
      front_inches: overallWidth,
      overall_inches: overallWidth,
    },
    line_total: breakdown.total || breakdown.subtotal || 0,
    reference_image_url: orderItem.product_image || configuration.previewImage || undefined,
    wireframe_image_url: configuration.wireframeImage || undefined,
  };
};

const deriveHeader = (soNumber: string, order: any, deliveryDate: Date): SaleOrderHeader => {
  const addressLines = [
    order.delivery_address?.street || "",
    order.delivery_address?.landmark || "",
    `${order.delivery_address?.city || ""}, ${order.delivery_address?.state || ""}`,
  ].filter(Boolean);

  return {
    so_number: soNumber,
    order_date: formatDate(new Date()),
    company: COMPANY_INFO,
    invoice_to: {
      customer_name: order.customer_name || "",
      addressLines,
      city: order.delivery_address?.city || "",
      pincode: order.delivery_address?.pincode || "",
      mobile: order.customer_phone || "",
      email: order.customer_email || "",
    },
    dispatch_to: {
      customer_name: order.customer_name || "",
      addressLines,
      city: order.delivery_address?.city || "",
      pincode: order.delivery_address?.pincode || "",
      mobile: order.customer_phone || "",
      email: order.customer_email || "",
    },
    payment_terms: {
      advance_percent: DEFAULT_ADVANCE_PERCENT,
      advance_condition: "On placing Sale Order",
      balance_condition: "Upon intimation of product readiness, before dispatch",
    },
    delivery_terms: {
      delivery_days: DEFAULT_DELIVERY_DAYS,
      delivery_date: formatDate(deliveryDate),
      dispatch_through: order.logistics_partner || "Safe Express",
    },
    buyer_gst: order.customer_gst,
    status: (order.status || "DRAFT").toUpperCase() as SaleOrderStatus,
    created_at: formatDate(new Date(order.created_at || Date.now())),
    updated_at: formatDate(new Date(order.updated_at || Date.now())),
    created_by: order.created_by || "system",
    updated_by: order.updated_by || order.created_by || "system",
  };
};

const deriveTotals = (
  soNumber: string,
  breakdown: PricingBreakdown,
  advancePercent: number,
  paidAmount: number
): SaleOrderTotals => {
  const subtotal = breakdown.subtotal ?? breakdown.total ?? 0;
  const discount = breakdown.discountAmount ?? 0;
  const total = breakdown.total ?? subtotal - discount;
  const advance = (total * advancePercent) / 100;
  const balance = total - advance;
  const outstanding = total - paidAmount;

  return {
    so_number: soNumber,
    subtotal,
    discount_amount: discount,
    total_amount: total,
    advance_amount: advance,
    balance_amount: balance,
    paid_amount: paidAmount,
    outstanding_amount: outstanding,
    discount_percent: 0,
    cgst_percent: 0,
    cgst_amount: 0,
    sgst_percent: 0,
    sgst_amount: 0,
    igst_percent: 0,
    igst_amount: 0,
  };
};

const derivePayments = (header: SaleOrderHeader, totals: SaleOrderTotals): SaleOrderPayment[] => {
  const payments: SaleOrderPayment[] = [];
  if (totals.advance_amount > 0) {
    payments.push({
      payment_id: generateId("PAY"),
      payment_date: header.order_date,
      payment_type: "ADVANCE",
      payment_method: "BANK_TRANSFER",
      payment_amount: totals.advance_amount,
    });
  }
  if (totals.paid_amount > totals.advance_amount) {
    payments.push({
      payment_id: generateId("PAY"),
      payment_date: header.order_date,
      payment_type: "PARTIAL",
      payment_method: "BANK_TRANSFER",
      payment_amount: totals.paid_amount - totals.advance_amount,
    });
  }
  return payments;
};

const generateSaleOrderNumber = (order: any) => {
  const today = new Date();
  const dateCode = today.toISOString().slice(0, 10).replace(/-/g, "");
  const orderCode = order?.order_number ? String(order.order_number).replace(/\D/g, "").slice(-3) : "001";
  return `SO-${dateCode}-${orderCode.padStart(3, "0")}`;
};

export async function generateSaleOrderData(
  order: any,
  orderItem: any,
  configuration: any,
  pricingBreakdown: PricingBreakdown
): Promise<SaleOrderGeneratedData> {
  const soNumber = generateSaleOrderNumber(order);
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + DEFAULT_DELIVERY_DAYS);

  const header = deriveHeader(soNumber, order, deliveryDate);
  const lineItem = await deriveLineItem(soNumber, orderItem, configuration, pricingBreakdown);
  const totals = deriveTotals(
    soNumber,
    pricingBreakdown,
    header.payment_terms.advance_percent,
    order.paid_amount || 0
  );
  const payments = derivePayments(header, totals);

  const jobCard = await generateJobCardData({
    soNumber,
    lineItemId: lineItem.line_item_id,
    orderId: order.id,
    orderNumber: order.order_number,
    productId: orderItem.product_id,
    category: orderItem.product_category,
    modelName: lineItem.model_name,
    quantity: orderItem.quantity || 1,
    configuration,
    pricingBreakdown,
    totalPrice: pricingBreakdown.total || totals.total_amount,
    customer: {
      name: header.invoice_to.customer_name,
      email: header.invoice_to.email,
      phone: header.invoice_to.mobile,
      address: {
        lines: header.invoice_to.addressLines,
        city: header.invoice_to.city,
        pincode: header.invoice_to.pincode,
      },
    },
  });

  return {
    header,
    lineItems: [lineItem],
    totals,
    payments,
    jobCards: [jobCard],
  };
}

