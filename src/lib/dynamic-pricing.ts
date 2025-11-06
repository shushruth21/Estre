import { supabase } from "@/integrations/supabase/client";

interface PricingFormula {
  formula_name: string;
  calculation_type: string;
  value: number;
  unit: string;
  applies_to: any;
}

interface AdminSetting {
  setting_key: string;
  setting_value: any;
}

interface ProductData {
  bom_rs?: number;
  adjusted_bom_rs?: number;
  wastage_delivery_gst_rs?: number;
  wastage_delivery_gst_percent?: number;
  markup_percent?: number;
  discount_percent?: number;
  discount_rs?: number;
  strike_price_rs?: number;
  net_price_rs?: number;
  [key: string]: any;
}

const SETTINGS_TABLE_MAP: Record<string, string> = {
  sofa: "sofa_admin_settings",
  recliner: "recliner_admin_settings",
  bed: "bed_admin_settings",
  kids_bed: "kids_bed_admin_settings",
  arm_chairs: "arm_chairs_admin_settings",
  dining_chairs: "dining_chairs_admin_settings",
  benches: "benches_admin_settings",
  cinema_chairs: "cinema_chairs_admin_settings",
};

const PRODUCT_TABLE_MAP: Record<string, string> = {
  sofa: "sofa_database",
  recliner: "recliner_database",
  bed: "bed_database",
  kids_bed: "kids_bed_database",
  arm_chairs: "arm_chairs_database",
  dining_chairs: "dining_chairs_database",
  benches: "benches_database",
  cinema_chairs: "cinema_chairs_database",
};

/**
 * Fetch pricing formulas from database
 */
export const fetchPricingFormulas = async (category: string): Promise<PricingFormula[]> => {
  const { data, error } = await supabase
    .from("pricing_formulas")
    .select("*")
    .eq("category", category)
    .eq("is_active", true);

  if (error) throw error;
  return data || [];
};

/**
 * Fetch admin settings from database
 */
export const fetchAdminSettings = async (category: string): Promise<AdminSetting[]> => {
  const tableName = SETTINGS_TABLE_MAP[category];
  if (!tableName) throw new Error(`No settings table for category: ${category}`);

  const { data, error } = await supabase.from(tableName as any).select("*");

  if (error) throw error;
  return (data || []) as unknown as AdminSetting[];
};

/**
 * Fetch product data from database
 */
export const fetchProductData = async (category: string, productId: string): Promise<ProductData> => {
  const tableName = PRODUCT_TABLE_MAP[category];
  if (!tableName) throw new Error(`No product table for category: ${category}`);

  const { data, error } = await supabase
    .from(tableName as any)
    .select("*")
    .eq("id", productId)
    .single();

  if (error) throw error;
  return data as unknown as ProductData;
};

/**
 * Get formula value by name
 */
export const getFormulaValue = (formulas: PricingFormula[], name: string, defaultValue: number = 0): number => {
  const formula = formulas.find((f) => f.formula_name === name);
  return formula?.value ?? defaultValue;
};

/**
 * Get setting value by key
 */
export const getSettingValue = (settings: AdminSetting[], key: string, defaultValue: any = null): any => {
  const setting = settings.find((s) => s.setting_key === key);
  return setting?.setting_value ?? defaultValue;
};

/**
 * Calculate fabric meters dynamically based on configuration
 */
export const calculateFabricMeters = (
  category: string,
  configuration: any,
  settings: AdminSetting[]
): number => {
  let totalMeters = 0;

  switch (category) {
    case "sofa": {
      const seatCount = configuration.seatCount || 1;
      const hasCorner = configuration.cornerSeat || false;
      const backrestCount = configuration.backrestCount || 0;
      const loungerSize = configuration.loungerSize || null;
      const consoleSize = configuration.consoleSize || null;

      // First seat
      const firstSeatMeters = getSettingValue(settings, "fabric_first_seat_mtrs", 5.0);
      totalMeters += firstSeatMeters;

      // Additional seats
      if (seatCount > 1) {
        const additionalSeatMeters = getSettingValue(settings, "fabric_additional_seat_mtrs", 3.0);
        totalMeters += (seatCount - 1) * additionalSeatMeters;
      }

      // Corner seat
      if (hasCorner) {
        const cornerMeters = getSettingValue(settings, "fabric_corner_seat_mtrs", 4.0);
        totalMeters += cornerMeters;
      }

      // Backrests
      if (backrestCount > 0) {
        const backrestMeters = getSettingValue(settings, "fabric_backrest_mtrs", 2.0);
        totalMeters += backrestCount * backrestMeters;
      }

      // Lounger
      if (loungerSize === "6ft") {
        totalMeters += getSettingValue(settings, "fabric_lounger_6ft_mtrs", 5.0);
      } else if (loungerSize === "additional_6") {
        totalMeters += getSettingValue(settings, "fabric_lounger_additional_6_mtrs", 3.0);
      }

      // Console
      if (consoleSize === "6") {
        totalMeters += getSettingValue(settings, "fabric_console_6_mtrs", 1.5);
      } else if (consoleSize === "10") {
        totalMeters += getSettingValue(settings, "fabric_console_10_mtrs", 2.0);
      }

      break;
    }

    case "recliner":
    case "cinema_chairs": {
      const seatCount = configuration.numberOfSeats || 1;
      const consoleSize = configuration.consoleSize || null;
      const consoleQuantity = configuration.consoleQuantity || 0;

      // First recliner
      const firstReclinerMeters = getSettingValue(settings, "fabric_first_recliner_mtrs", 6.0);
      totalMeters += firstReclinerMeters;

      // Additional seats
      if (seatCount > 1) {
        const additionalSeatMeters = getSettingValue(settings, "fabric_additional_seat_mtrs", 3.5);
        totalMeters += (seatCount - 1) * additionalSeatMeters;
      }

      // Consoles
      if (consoleSize === "6" && consoleQuantity > 0) {
        const consoleMeters = getSettingValue(settings, "fabric_console_6_mtrs", 1.5);
        totalMeters += consoleQuantity * consoleMeters;
      } else if (consoleSize === "10" && consoleQuantity > 0) {
        const consoleMeters = getSettingValue(settings, "fabric_console_10_mtrs", 2.0);
        totalMeters += consoleQuantity * consoleMeters;
      }

      break;
    }

    case "bed":
    case "kids_bed": {
      const bedSize = configuration.bedSize || "single";
      
      if (["single", "double", "double_xl"].includes(bedSize)) {
        totalMeters = getSettingValue(settings, "fabric_bed_up_to_double_xl_mtrs", 8.0);
      } else {
        totalMeters = getSettingValue(settings, "fabric_bed_queen_above_mtrs", 10.0);
      }

      break;
    }

    case "arm_chairs":
    case "dining_chairs": {
      const quantity = configuration.quantity || 1;
      
      // First chair
      const firstChairMeters = getSettingValue(settings, "fabric_single_chair_mtrs", 2.5);
      totalMeters += firstChairMeters;

      // Additional chairs
      if (quantity > 1) {
        const additionalChairMeters = getSettingValue(settings, "fabric_additional_chair_mtrs", 2.0);
        totalMeters += (quantity - 1) * additionalChairMeters;
      }

      break;
    }

    case "benches": {
      const seatingCapacity = configuration.seatingCapacity || 1;
      
      // First bench
      const firstBenchMeters = getSettingValue(settings, "fabric_single_bench_mtrs", 3.0);
      totalMeters += firstBenchMeters;

      // Additional seating
      if (seatingCapacity > 1) {
        const additionalSeatMeters = getSettingValue(settings, "fabric_additional_seat_mtrs", 2.0);
        totalMeters += (seatingCapacity - 1) * additionalSeatMeters;
      }

      break;
    }
  }

  return totalMeters;
};

/**
 * Pricing breakdown interface
 */
export interface PricingBreakdown {
  baseSeatPrice: number;
  additionalSeatsPrice: number;
  cornerSeatsPrice: number;
  backrestSeatsPrice: number;
  loungerPrice: number;
  consolePrice: number;
  pillowsPrice: number;
  fabricCharges: number;
  foamUpgrade: number;
  dimensionUpgrade: number;
  accessoriesPrice: number;
  discountAmount: number;
  subtotal: number;
  total: number;
}

/**
 * Calculate dynamic price based on configuration
 * Returns detailed breakdown for pricing summary display
 */
export const calculateDynamicPrice = async (
  category: string,
  productId: string,
  configuration: any
): Promise<{ breakdown: PricingBreakdown; total: number }> => {
  try {
    // Fetch all required data
    const [formulas, settings, productData] = await Promise.all([
      fetchPricingFormulas(category),
      fetchAdminSettings(category),
      fetchProductData(category, productId),
    ]);

    // Initialize breakdown
    const breakdown: PricingBreakdown = {
      baseSeatPrice: 0,
      additionalSeatsPrice: 0,
      cornerSeatsPrice: 0,
      backrestSeatsPrice: 0,
      loungerPrice: 0,
      consolePrice: 0,
      pillowsPrice: 0,
      fabricCharges: 0,
      foamUpgrade: 0,
      dimensionUpgrade: 0,
      accessoriesPrice: 0,
      discountAmount: 0,
      subtotal: 0,
      total: 0,
    };

    // Get base price from product (use net_price_rs or bom_rs as fallback)
    const basePrice = productData.net_price_rs || productData.bom_rs || 
                     productData.adjusted_bom_rs || 0;

    // Calculate category-specific pricing
    if (category === "sofa") {
      return await calculateSofaPricing(
        configuration,
        productData,
        formulas,
        settings,
        basePrice
      );
    }

    // For other categories, use simplified calculation
    let totalPrice = basePrice;

    // Calculate fabric cost
    const fabricMeters = calculateFabricMeters(category, configuration, settings);
    const fabricPricePerMeter = configuration.fabric?.structureCode 
      ? await getFabricPrice(configuration.fabric.structureCode)
      : 0;
    breakdown.fabricCharges = fabricMeters * fabricPricePerMeter;
    totalPrice += breakdown.fabricCharges;

    // Apply category-specific adjustments
    totalPrice = applyCategoryAdjustments(category, configuration, totalPrice, formulas);

    // Apply wastage, delivery, GST
    const wastagePercent = getFormulaValue(formulas, "wastage_delivery_gst_percent", 
      productData.wastage_delivery_gst_percent || 20);
    const wastageAmount = (totalPrice * wastagePercent) / 100;
    totalPrice += wastageAmount;

    // Apply markup
    const markupPercent = getFormulaValue(formulas, "markup_percent", 
      productData.markup_percent || 270);
    const markupAmount = (totalPrice * markupPercent) / 100;
    totalPrice += markupAmount;

    // Apply discount
    const discountPercent = getFormulaValue(formulas, "discount_percent", 
      productData.discount_percent || 10);
    breakdown.discountAmount = (totalPrice * discountPercent) / 100;
    totalPrice -= breakdown.discountAmount;

    breakdown.subtotal = totalPrice;
    breakdown.total = Math.round(totalPrice);

    return {
      breakdown,
      total: breakdown.total,
    };
  } catch (error) {
    console.error("Error calculating dynamic price:", error);
    throw error;
  }
};

/**
 * Get fabric price by code
 */
async function getFabricPrice(fabricCode: string): Promise<number> {
  const { data, error } = await supabase
    .from("fabric_coding")
    .select("price")
    .eq("estre_code", fabricCode)
    .single();

  if (error || !data) return 0;
  return data.price || 0;
}

/**
 * Calculate sofa-specific pricing with detailed breakdown
 */
async function calculateSofaPricing(
  configuration: any,
  productData: ProductData,
  formulas: PricingFormula[],
  settings: AdminSetting[],
  basePrice: number
): Promise<{ breakdown: PricingBreakdown; total: number }> {
  const breakdown: PricingBreakdown = {
    baseSeatPrice: 0,
    additionalSeatsPrice: 0,
    cornerSeatsPrice: 0,
    backrestSeatsPrice: 0,
    loungerPrice: 0,
    consolePrice: 0,
    pillowsPrice: 0,
    fabricCharges: 0,
    foamUpgrade: 0,
    dimensionUpgrade: 0,
    accessoriesPrice: 0,
    discountAmount: 0,
    subtotal: 0,
    total: 0,
  };

  // Parse seat configuration from SofaConfigurator format
  const shape = configuration.shape || "standard";
  const frontSeats = configuration.frontSeats || parseSeatCount(configuration.frontSeatCount) || 2;
  const l1Option = configuration.l1Option || configuration.l1 || "";
  const r1Option = configuration.r1Option || configuration.r1 || "";
  const l2Seats = parseSeatCount(configuration.l2SeatCount || configuration.l2 || 0);
  const r2Seats = parseSeatCount(configuration.r2SeatCount || configuration.r2 || 0);

  // Calculate total seats
  let totalSeats = frontSeats;
  let cornerSeats = 0;
  let backrestSeats = 0;

  if (shape === "l-shape" || shape === "u-shape" || shape === "combo") {
    if (l1Option === "Corner" || l1Option?.toLowerCase().includes("corner")) {
      cornerSeats += 1;
    } else if (l1Option === "Backrest" || l1Option?.toLowerCase().includes("backrest")) {
      backrestSeats += 1;
    }
    totalSeats += l2Seats;
  }

  if (shape === "u-shape" || shape === "combo") {
    if (r1Option === "Corner" || r1Option?.toLowerCase().includes("corner")) {
      cornerSeats += 1;
    } else if (r1Option === "Backrest" || r1Option?.toLowerCase().includes("backrest")) {
      backrestSeats += 1;
    }
    totalSeats += r2Seats;
  }

  // Base seat price (first seat)
  const firstSeatPercent = getFormulaValue(formulas, "first_seat_percent", 100);
  breakdown.baseSeatPrice = (basePrice * firstSeatPercent) / 100;
  let totalPrice = breakdown.baseSeatPrice;

  // Additional front seats (beyond first)
  if (frontSeats > 1) {
    const additionalSeatPercent = getFormulaValue(formulas, "additional_seat_percent", 70);
    const additionalSeatPrice = (basePrice * additionalSeatPercent) / 100;
    breakdown.additionalSeatsPrice = additionalSeatPrice * (frontSeats - 1);
    totalPrice += breakdown.additionalSeatsPrice;
  }

  // Corner seats
  if (cornerSeats > 0) {
    const cornerSeatPercent = getFormulaValue(formulas, "corner_seat_percent", 100);
    const cornerSeatPrice = (basePrice * cornerSeatPercent) / 100;
    breakdown.cornerSeatsPrice = cornerSeatPrice * cornerSeats;
    totalPrice += breakdown.cornerSeatsPrice;
  }

  // Backrest seats (L2/R2 seats when L1/R1 is backrest)
  if (backrestSeats > 0) {
    const backrestSeatPercent = getFormulaValue(formulas, "backrest_seat_percent", 20);
    const backrestSeatPrice = (basePrice * backrestSeatPercent) / 100;
    breakdown.backrestSeatsPrice = backrestSeatPrice * (l2Seats + r2Seats);
    totalPrice += breakdown.backrestSeatsPrice;
  }

  // Lounger pricing
  if (configuration.lounger?.required) {
    let loungerPrice = getFormulaValue(formulas, "lounger_base", 15000);
    const loungerSize = configuration.lounger?.size || "";
    const quantity = configuration.lounger?.quantity || 1;

    // Size-based pricing
    if (loungerSize.includes("5 ft 6 in") || loungerSize.includes("5'6")) {
      loungerPrice += getFormulaValue(formulas, "lounger_additional_6_inch", 1000);
    } else if (loungerSize.includes("6 ft 6 in") || loungerSize.includes("6'6")) {
      loungerPrice += getFormulaValue(formulas, "lounger_additional_6_inch", 1000) * 3;
    } else if (loungerSize.includes("6 ft") || loungerSize.includes("6'")) {
      loungerPrice += getFormulaValue(formulas, "lounger_additional_6_inch", 1000) * 2;
    } else if (loungerSize.includes("7 ft") || loungerSize.includes("7'")) {
      loungerPrice += getFormulaValue(formulas, "lounger_additional_6_inch", 1000) * 4;
    }

    // Storage option
    if (configuration.lounger?.storage === "Yes") {
      loungerPrice += getFormulaValue(formulas, "lounger_storage", 3000);
    }

    breakdown.loungerPrice = loungerPrice * quantity;
    totalPrice += breakdown.loungerPrice;
  }

  // Console pricing
  if (configuration.console?.required) {
    const consoleSize = configuration.console?.size || "";
    const quantity = configuration.console?.quantity || 1;

    let consolePrice = 0;
    if (consoleSize.includes("6") || consoleSize === "6 in" || consoleSize === "Console-6 in") {
      consolePrice = getFormulaValue(formulas, "console_6_inch", 8000);
    } else if (consoleSize.includes("10") || consoleSize === "10 in" || consoleSize === "Console-10 in") {
      consolePrice = getFormulaValue(formulas, "console_10_inch", 12000);
    }

    breakdown.consolePrice = consolePrice * quantity;
    totalPrice += breakdown.consolePrice;
  }

  // Pillows pricing
  if (configuration.additionalPillows?.required) {
    const pillowType = configuration.additionalPillows?.type || "Simple";
    const quantity = configuration.additionalPillows?.quantity || 1;

    let pillowPrice = 1200; // Default
    if (pillowType === "Diamond" || pillowType === "Diamond Quilted") {
      pillowPrice = 3500;
    } else if (pillowType === "Belt" || pillowType === "Belt Quilted") {
      pillowPrice = 4000;
    } else if (pillowType === "Tassels") {
      pillowPrice = 2500;
    }

    breakdown.pillowsPrice = pillowPrice * quantity;
    totalPrice += breakdown.pillowsPrice;
  }

  // Fabric charges
  const fabricMeters = calculateFabricMeters("sofa", configuration, settings);
  const fabricCodes = [
    configuration.fabric?.structureCode,
    configuration.fabric?.backrestCode,
    configuration.fabric?.seatCode,
    configuration.fabric?.headrestCode,
  ].filter(Boolean);

  if (fabricCodes.length > 0) {
    const { data: fabrics } = await supabase
      .from("fabric_coding")
      .select("estre_code, price")
      .in("estre_code", fabricCodes);

    if (fabrics && fabrics.length > 0) {
      const primaryFabric = fabrics.find(f => f.estre_code === configuration.fabric?.structureCode) || fabrics[0];
      const fabricPricePerMeter = primaryFabric.price || 0;
      breakdown.fabricCharges = fabricMeters * fabricPricePerMeter;
      totalPrice += breakdown.fabricCharges;
    }
  }

  // Foam upgrade
  const foamType = configuration.foam?.type || "";
  if (foamType) {
    const foamKey = `foam_${foamType.toLowerCase().replace(/\s+/g, "_")}`;
    breakdown.foamUpgrade = getFormulaValue(formulas, foamKey, 0);
    totalPrice += breakdown.foamUpgrade;
  }

  // Dimension upgrades
  const seatDepth = configuration.seatDepth || configuration.dimensions?.seatDepth || 22;
  const seatWidth = configuration.seatWidth || configuration.dimensions?.seatWidth || 22;
  
  const depthKey = `seat_depth_${seatDepth}`;
  const widthKey = `seat_width_${seatWidth}`;
  const depthUpgradePercent = getFormulaValue(formulas, depthKey, 0);
  const widthUpgradePercent = getFormulaValue(formulas, widthKey, 0);
  
  breakdown.dimensionUpgrade = totalPrice * ((depthUpgradePercent + widthUpgradePercent) / 100);
  totalPrice += breakdown.dimensionUpgrade;

  // Accessories (legs)
  if (configuration.legType || configuration.legsCode) {
    const legCode = configuration.legsCode || configuration.legType;
    const { data: leg } = await supabase
      .from("legs_prices")
      .select("price_rs")
      .eq("code", legCode)
      .eq("is_active", true)
      .single();

    if (leg) {
      breakdown.accessoriesPrice = leg.price_rs || 0;
      totalPrice += breakdown.accessoriesPrice;
    }
  }

  breakdown.subtotal = totalPrice;

  // Discount
  if (configuration.discount?.code) {
    const discountKey = `discount_${configuration.discount.code.toLowerCase()}`;
    const discountPercent = getFormulaValue(formulas, discountKey, 0);
    breakdown.discountAmount = (totalPrice * discountPercent) / 100;
    totalPrice -= breakdown.discountAmount;
  }

  breakdown.total = Math.round(totalPrice);

  return {
    breakdown,
    total: breakdown.total,
  };
}

/**
 * Helper: Parse seat count from string or number
 */
function parseSeatCount(value: string | number | undefined): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const match = value.toString().match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Apply category-specific price adjustments
 */
const applyCategoryAdjustments = (
  category: string,
  configuration: any,
  basePrice: number,
  formulas: PricingFormula[]
): number => {
  let adjustedPrice = basePrice;

  switch (category) {
    case "sofa": {
      // Additional seat cost
      const seatCount = configuration.seatCount || 1;
      if (seatCount > 1) {
        const additionalSeatPercent = getFormulaValue(formulas, "additional_seat_percent", 70);
        const additionalCost = (basePrice * additionalSeatPercent * (seatCount - 1)) / 100;
        adjustedPrice += additionalCost;
      }

      // Corner seat cost
      if (configuration.cornerSeat) {
        const cornerPercent = getFormulaValue(formulas, "corner_seat_percent", 80);
        adjustedPrice += (basePrice * cornerPercent) / 100;
      }

      break;
    }

    case "recliner":
    case "cinema_chairs": {
      // Electric mechanism cost
      if (configuration.mechanism === "electric") {
        const electricCost = getFormulaValue(formulas, "electric_mechanism_cost", 5000);
        adjustedPrice += electricCost;
      }

      break;
    }

    case "bed": {
      // Storage cost
      if (configuration.storage) {
        const storageCost = getFormulaValue(formulas, "storage_cost", 3000);
        adjustedPrice += storageCost;

        // Hydraulic storage additional cost
        if (configuration.storageType === "hydraulic") {
          const hydraulicCost = getFormulaValue(formulas, "hydraulic_storage_cost", 2000);
          adjustedPrice += hydraulicCost;
        }
      }

      break;
    }
  }

  return adjustedPrice;
};
