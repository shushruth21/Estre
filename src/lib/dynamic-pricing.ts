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
  strike_price_1seater_rs?: number;
  net_price_rs?: number;
  net_markup_1seater?: number; // Priority for sofa category
  net_price_single_no_storage_rs?: number;
  net_price?: number;
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
  sofabed: "sofa_admin_settings", // Use sofa settings
  database_pouffes: "benches_admin_settings", // Use benches settings
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
  sofabed: "sofabed_database",
  database_pouffes: "database_pouffes",
};

/**
 * Fetch pricing formulas from database
 */
export const fetchPricingFormulas = async (category: string): Promise<PricingFormula[]> => {
  try {
    const { data, error } = await supabase
      .from("pricing_formulas")
      .select("*")
      .eq("category", category)
      .eq("is_active", true);

    if (error) {
      console.warn(`No pricing formulas found for ${category}, using defaults`);
      return [];
    }
    return data || [];
  } catch (error) {
    console.warn(`Error fetching pricing formulas for ${category}:`, error);
    return [];
  }
};

/**
 * Fetch admin settings from database
 */
export const fetchAdminSettings = async (category: string): Promise<AdminSetting[]> => {
  try {
    const tableName = SETTINGS_TABLE_MAP[category];
    if (!tableName) {
      console.warn(`No settings table for category: ${category}`);
      return [];
    }

    const { data, error } = await supabase.from(tableName as any).select("*");

    if (error) {
      console.warn(`No settings found for ${category}, using defaults`);
      return [];
    }
    return (data || []) as unknown as AdminSetting[];
  } catch (error) {
    console.warn(`Error fetching settings for ${category}:`, error);
    return [];
  }
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
      // Calculate total seats from configuration
      const shape = configuration.shape || "standard";
      const frontSeats = configuration.frontSeats || parseSeatCount(configuration.frontSeatCount) || 1;
      const l2Seats = parseSeatCount(configuration.l2SeatCount || configuration.l2 || 0);
      const r2Seats = parseSeatCount(configuration.r2SeatCount || configuration.r2 || 0);
      
      let totalSeats = frontSeats;
      if (shape === "l-shape" || shape === "u-shape" || shape === "combo") {
        totalSeats += l2Seats;
      }
      if (shape === "u-shape" || shape === "combo") {
        totalSeats += r2Seats;
      }

      // Determine if recliner or standard (check mechanism or default to standard)
      const isRecliner = configuration.mechanism?.toLowerCase().includes("recliner") || 
                        configuration.mechanism?.toLowerCase().includes("electric") ||
                        false;

      // Base fabric: 6m (standard) or 8m (recliner) for 1-seater
      const baseFabricMeters = isRecliner ? 8.0 : 6.0;
      totalMeters += baseFabricMeters;

      // Additional seats: +3m (standard) or +7m (recliner) per seat
      if (totalSeats > 1) {
        const additionalSeatMeters = isRecliner ? 7.0 : 3.0;
        totalMeters += (totalSeats - 1) * additionalSeatMeters;
      }

      // Lounger fabric (by size in inches)
      if (configuration.lounger?.required && configuration.lounger?.size) {
        const loungerSize = configuration.lounger.size;
        const quantity = configuration.lounger?.quantity || 1;
        let loungerMeters = 0;

        // Map lounger sizes to meters
        if (loungerSize.includes("65") || loungerSize.includes("5 ft 5 in") || loungerSize.includes("5'5")) {
          loungerMeters = 6.5;
        } else if (loungerSize.includes("72") || loungerSize.includes("6 ft") || loungerSize.includes("6'")) {
          loungerMeters = 7.2;
        } else if (loungerSize.includes("78") || loungerSize.includes("6 ft 6 in") || loungerSize.includes("6'6")) {
          loungerMeters = 7.8;
        } else if (loungerSize.includes("84") || loungerSize.includes("7 ft") || loungerSize.includes("7'")) {
          loungerMeters = 8.4;
        }

        totalMeters += loungerMeters * quantity;
      }

      // Console fabric (by size and quantity)
      if (configuration.console?.required && configuration.console?.size) {
        const consoleSize = configuration.console.size;
        const quantity = configuration.console?.quantity || 1;
        let consoleMeters = 0;

        // 6-inch console: 1.5 meters, 10-inch console: 2 meters
        if (consoleSize.includes("6") || consoleSize === "6 in" || consoleSize === "Console-6 in") {
          consoleMeters = 1.5;
        } else if (consoleSize.includes("10") || consoleSize === "10 in" || consoleSize === "Console-10 in") {
          consoleMeters = 2.0;
        }

        totalMeters += consoleMeters * quantity;
      }

      break;
    }

    case "recliner":
    case "cinema_chairs": {
      const seatCount = configuration.numberOfSeats || configuration.seats?.length || 1;
      const consoleSize = configuration.console?.size || configuration.consoleSize || null;
      const consoleQuantity = configuration.console?.quantity || configuration.consoleQuantity || 0;

      // First recliner
      const firstReclinerMeters = getSettingValue(settings, "fabric_first_recliner_mtrs", 6.0);
      totalMeters += firstReclinerMeters;

      // Additional seats
      if (seatCount > 1) {
        const additionalSeatMeters = getSettingValue(settings, "fabric_additional_seat_mtrs", 3.5);
        totalMeters += (seatCount - 1) * additionalSeatMeters;
      }

      // Consoles
      if (consoleSize && consoleQuantity > 0) {
        if (consoleSize.includes("6") || consoleSize === "6 in") {
          const consoleMeters = getSettingValue(settings, "fabric_console_6_mtrs", 1.5);
          totalMeters += consoleQuantity * consoleMeters;
        } else if (consoleSize.includes("10") || consoleSize === "10 in") {
          const consoleMeters = getSettingValue(settings, "fabric_console_10_mtrs", 2.0);
          totalMeters += consoleQuantity * consoleMeters;
        }
      }

      break;
    }

    case "bed":
    case "kids_bed": {
      const bedSize = configuration.bedSize || "single";
      
      if (["single", "Single", "double", "Double", "double_xl", "Double XL"].includes(bedSize)) {
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

    case "benches":
    case "database_pouffes": {
      const seatingCapacity = configuration.seatingCapacity || configuration.qty || 1;
      
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

    case "sofabed": {
      // Similar to sofa but with bed mechanism
      const seatCount = configuration.seatCount || configuration.seatType || 1;
      const firstSeatMeters = getSettingValue(settings, "fabric_first_seat_mtrs", 5.0);
      totalMeters += firstSeatMeters;

      if (seatCount > 1) {
        const additionalSeatMeters = getSettingValue(settings, "fabric_additional_seat_mtrs", 3.0);
        totalMeters += (seatCount - 1) * additionalSeatMeters;
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
  basePrice: number;
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
  mechanismUpgrade: number;
  storagePrice: number;
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
      basePrice: 0,
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
      mechanismUpgrade: 0,
      storagePrice: 0,
      discountAmount: 0,
      subtotal: 0,
      total: 0,
    };

    // Get base price from product
    // For sofa category, prioritize net_markup_1seater
    let basePrice = 0;
    if (category === "sofa") {
      basePrice = productData.net_markup_1seater || 
                  productData.net_price_rs || 
                  productData.strike_price_1seater_rs || 
                  productData.bom_rs || 
                  productData.adjusted_bom_rs || 0;
    } else {
      // For other categories, use existing fallback chain
      basePrice = productData.net_price_rs || 
                  productData.bom_rs || 
                  productData.adjusted_bom_rs || 
                  productData.net_price_single_no_storage_rs || 
                  productData.net_price || 0;
    }

    breakdown.basePrice = basePrice;

    // Calculate category-specific pricing
    switch (category) {
      case "sofa":
        return await calculateSofaPricing(configuration, productData, formulas, settings, basePrice);
      case "bed":
      case "kids_bed":
        return await calculateBedPricing(configuration, productData, formulas, settings, basePrice);
      case "recliner":
        return await calculateReclinerPricing(configuration, productData, formulas, settings, basePrice);
      case "cinema_chairs":
        return await calculateCinemaChairPricing(configuration, productData, formulas, settings, basePrice);
      case "dining_chairs":
      case "arm_chairs":
        return await calculateChairPricing(category, configuration, productData, formulas, settings, basePrice);
      case "benches":
      case "database_pouffes":
        return await calculateBenchPricing(category, configuration, productData, formulas, settings, basePrice);
      case "sofabed":
        return await calculateSofabedPricing(configuration, productData, formulas, settings, basePrice);
      default:
        return await calculateGenericPricing(category, configuration, productData, formulas, settings, basePrice);
    }
  } catch (error) {
    console.error("Error calculating dynamic price:", error);
    throw error;
  }
};

/**
 * Get fabric price by code
 */
async function getFabricPrice(fabricCode: string): Promise<number> {
  if (!fabricCode) return 0;
  
  try {
    const { data, error } = await supabase
      .from("fabric_coding")
      .select("price")
      .eq("estre_code", fabricCode)
      .single();

    if (error || !data) return 0;
    return data.price || 0;
  } catch (error) {
    console.warn("Error fetching fabric price:", error);
    return 0;
  }
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
    basePrice: basePrice,
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
    mechanismUpgrade: 0,
    storagePrice: 0,
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

  // Get formula values
  const firstSeatPercent = getFormulaValue(formulas, "first_seat_percent", 100);
  const additionalSeatPercent = getFormulaValue(formulas, "additional_seat_percent", 70);
  const cornerPercent = getFormulaValue(formulas, "corner_seat_percent", 100); // For L1/R1 corner pieces
  const backrestPercent = getFormulaValue(formulas, "backrest_seat_percent", 20); // For L1/R1 backrest pieces

  let totalPrice = 0;

  // ===== F SECTION (Front) - Always contains the first seat =====
  if (frontSeats > 0) {
    // First seat: 100%
    breakdown.baseSeatPrice = (basePrice * firstSeatPercent) / 100;
    totalPrice += breakdown.baseSeatPrice;

    // Additional seats in F: 70% each
    if (frontSeats > 1) {
      const additionalSeatPrice = (basePrice * additionalSeatPercent) / 100;
      breakdown.additionalSeatsPrice = additionalSeatPrice * (frontSeats - 1);
      totalPrice += breakdown.additionalSeatsPrice;
    }
  }

  // ===== L1 SECTION (Corner/Backrest) - Structural piece, NOT seats =====
  if (shape === "l-shape" || shape === "u-shape" || shape === "combo") {
    if (l1Option === "Corner" || l1Option?.toLowerCase().includes("corner")) {
      // Corner piece: 100% of base price (structural, not a seat)
      const cornerPrice = (basePrice * cornerPercent) / 100;
      breakdown.cornerSeatsPrice += cornerPrice;
      totalPrice += cornerPrice;
    } else if (l1Option === "Backrest" || l1Option?.toLowerCase().includes("backrest")) {
      // Backrest piece: 20% of base price (structural, not a seat)
      const backrestPrice = (basePrice * backrestPercent) / 100;
      breakdown.backrestSeatsPrice += backrestPrice;
      totalPrice += backrestPrice;
    }
  }

  // ===== L2 SECTION - All seats are additional (70% each) =====
  // L2 seats come AFTER the first seat (which is in F), so they are all additional
  if (l2Seats > 0 && (shape === "l-shape" || shape === "u-shape" || shape === "combo")) {
    const additionalSeatPrice = (basePrice * additionalSeatPercent) / 100;
    breakdown.additionalSeatsPrice += additionalSeatPrice * l2Seats;
    totalPrice += breakdown.additionalSeatsPrice;
  }

  // ===== R1 SECTION (Corner/Backrest) - Structural piece, NOT seats =====
  if (shape === "u-shape" || shape === "combo") {
    if (r1Option === "Corner" || r1Option?.toLowerCase().includes("corner")) {
      // Corner piece: 100% of base price (structural, not a seat)
      const cornerPrice = (basePrice * cornerPercent) / 100;
      breakdown.cornerSeatsPrice += cornerPrice;
      totalPrice += cornerPrice;
    } else if (r1Option === "Backrest" || r1Option?.toLowerCase().includes("backrest")) {
      // Backrest piece: 20% of base price (structural, not a seat)
      const backrestPrice = (basePrice * backrestPercent) / 100;
      breakdown.backrestSeatsPrice += backrestPrice;
      totalPrice += backrestPrice;
    }
  }

  // ===== R2 SECTION - All seats are additional (70% each) =====
  // R2 seats come AFTER the first seat (which is in F), so they are all additional
  if (r2Seats > 0 && (shape === "u-shape" || shape === "combo")) {
    const additionalSeatPrice = (basePrice * additionalSeatPercent) / 100;
    breakdown.additionalSeatsPrice += additionalSeatPrice * r2Seats;
    totalPrice += breakdown.additionalSeatsPrice;
  }

  // Lounger pricing - Formula: 100% base + 10% per additional 6"
  if (configuration.lounger?.required) {
    let loungerBasePrice = basePrice; // 100% of base price
    const loungerSize = configuration.lounger?.size || "";
    const quantity = configuration.lounger?.quantity || 1;

    // Calculate additional 6" increments
    // Base sizes: 5 ft = 0%, 5'6" = +10%, 6 ft = +20%, 6'6" = +30%, 7 ft = +40%
    let additionalPercent = 0;
    if (loungerSize.includes("5 ft 6 in") || loungerSize.includes("5'6") || loungerSize.includes("5.5")) {
      additionalPercent = 10; // 1 additional 6"
    } else if (loungerSize.includes("6 ft 6 in") || loungerSize.includes("6'6") || loungerSize.includes("6.5")) {
      additionalPercent = 30; // 3 additional 6"
    } else if (loungerSize.includes("6 ft") || loungerSize.includes("6'")) {
      additionalPercent = 20; // 2 additional 6"
    } else if (loungerSize.includes("7 ft") || loungerSize.includes("7'")) {
      additionalPercent = 40; // 4 additional 6"
    }

    // Apply additional percentage (10% per additional 6")
    const additionalPrice = (loungerBasePrice * additionalPercent) / 100;
    let loungerPrice = loungerBasePrice + additionalPrice;

    // Storage option
    if (configuration.lounger?.storage === "Yes") {
      loungerPrice += getFormulaValue(formulas, "lounger_storage", 3000);
    }

    breakdown.loungerPrice = loungerPrice * quantity;
    totalPrice += breakdown.loungerPrice;
  }

  // Console pricing - Fixed price per console based on size
  if (configuration.console?.required) {
    const consoleSize = configuration.console?.size || "";
    const quantity = configuration.console?.quantity || 1;

    let consolePrice = 0;
    if (consoleSize.includes("6") || consoleSize === "6 in" || consoleSize === "Console-6 in") {
      consolePrice = getFormulaValue(formulas, "console_6_inch", 8000);
    } else if (consoleSize.includes("10") || consoleSize === "10 in" || consoleSize === "Console-10 in") {
      consolePrice = getFormulaValue(formulas, "console_10_inch", 12000);
    }

    // Price is per console, multiplied by quantity
    // Placement doesn't affect price, only quantity
    breakdown.consolePrice = consolePrice * quantity;
    totalPrice += breakdown.consolePrice;
  }

  // Pillows pricing - Type-based pricing with quantity multiplier
  if (configuration.additionalPillows?.required) {
    const pillowType = configuration.additionalPillows?.type || "Simple";
    const quantity = configuration.additionalPillows?.quantity || 1;

    // Get pillow price from formulas or use defaults
    let pillowPrice = getFormulaValue(formulas, "pillow_simple_price", 1200); // Default
    
    if (pillowType === "Diamond" || pillowType === "Diamond Quilted") {
      pillowPrice = getFormulaValue(formulas, "pillow_diamond_price", 3500);
    } else if (pillowType === "Belt" || pillowType === "Belt Quilted") {
      pillowPrice = getFormulaValue(formulas, "pillow_belt_price", 4000);
    } else if (pillowType === "Tassels") {
      pillowPrice = getFormulaValue(formulas, "pillow_tassels_price", 2500);
    }

    // Price per pillow, multiplied by quantity
    // Size and fabric plan don't affect base price (admin can adjust formulas if needed)
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
 * Calculate bed-specific pricing
 */
async function calculateBedPricing(
  configuration: any,
  productData: ProductData,
  formulas: PricingFormula[],
  settings: AdminSetting[],
  basePrice: number
): Promise<{ breakdown: PricingBreakdown; total: number }> {
  const breakdown: PricingBreakdown = {
    basePrice: basePrice,
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
    mechanismUpgrade: 0,
    storagePrice: 0,
    discountAmount: 0,
    subtotal: 0,
    total: 0,
  };

  let totalPrice = basePrice;

  // Bed size adjustments
  const bedSize = configuration.bedSize || "Double";
  const sizeMultiplier = getFormulaValue(formulas, `bed_size_${bedSize.toLowerCase()}_multiplier`, 1);
  if (sizeMultiplier !== 1) {
    const sizeAdjustment = basePrice * (sizeMultiplier - 1);
    breakdown.baseSeatPrice = basePrice;
    totalPrice += sizeAdjustment;
  } else {
    breakdown.baseSeatPrice = basePrice;
  }

  // Storage pricing
  if (configuration.storage === "Yes" || configuration.storage === true) {
    const storageCost = getFormulaValue(formulas, "storage_cost", 3000);
    breakdown.storagePrice = storageCost;
    totalPrice += breakdown.storagePrice;

    // Storage type upgrade
    if (configuration.storageType === "hydraulic" || configuration.storageType === "Hydraulic") {
      const hydraulicCost = getFormulaValue(formulas, "hydraulic_storage_cost", 2000);
      breakdown.storagePrice += hydraulicCost;
      totalPrice += hydraulicCost;
    }
  }

  // Fabric charges
  const fabricMeters = calculateFabricMeters("bed", configuration, settings);
  const fabricCode = configuration.fabric?.structureCode || configuration.fabric?.claddingPlan;
  
  if (fabricCode) {
    const fabricPricePerMeter = await getFabricPrice(fabricCode);
    breakdown.fabricCharges = fabricMeters * fabricPricePerMeter;
    totalPrice += breakdown.fabricCharges;
  }

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
 * Calculate recliner-specific pricing
 */
async function calculateReclinerPricing(
  configuration: any,
  productData: ProductData,
  formulas: PricingFormula[],
  settings: AdminSetting[],
  basePrice: number
): Promise<{ breakdown: PricingBreakdown; total: number }> {
  const breakdown: PricingBreakdown = {
    basePrice: basePrice,
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
    mechanismUpgrade: 0,
    storagePrice: 0,
    discountAmount: 0,
    subtotal: 0,
    total: 0,
  };

  const seatCount = configuration.seats?.length || configuration.numberOfSeats || 1;
  
  // Base price for first seat
  breakdown.baseSeatPrice = basePrice;
  let totalPrice = basePrice;

  // Additional seats
  if (seatCount > 1) {
    const additionalSeatPercent = getFormulaValue(formulas, "additional_seat_percent", 70);
    const additionalSeatPrice = (basePrice * additionalSeatPercent) / 100;
    breakdown.additionalSeatsPrice = additionalSeatPrice * (seatCount - 1);
    totalPrice += breakdown.additionalSeatsPrice;
  }

  // Mechanism pricing
  const mechanism = configuration.mechanism?.front || configuration.mechanism || "Manual";
  if (mechanism === "electric" || mechanism === "Electric" || mechanism === "Electric-RRR") {
    const electricCost = getFormulaValue(formulas, "electric_mechanism_cost", 5000);
    breakdown.mechanismUpgrade = electricCost * seatCount;
    totalPrice += breakdown.mechanismUpgrade;
  }

  // Console pricing
  if (configuration.console?.required === "Yes" || configuration.console?.required === true) {
    const consoleSize = configuration.console?.size || "";
    const quantity = configuration.console?.quantity || 1;

    let consolePrice = 0;
    if (consoleSize.includes("6") || consoleSize === "6 in") {
      consolePrice = getFormulaValue(formulas, "console_6_inch", 8000);
    } else if (consoleSize.includes("10") || consoleSize === "10 in") {
      consolePrice = getFormulaValue(formulas, "console_10_inch", 12000);
    }

    breakdown.consolePrice = consolePrice * quantity;
    totalPrice += breakdown.consolePrice;
  }

  // Fabric charges
  const fabricMeters = calculateFabricMeters("recliner", configuration, settings);
  const fabricCode = configuration.fabric?.structureCode || configuration.fabric?.claddingPlan;
  
  if (fabricCode) {
    const fabricPricePerMeter = await getFabricPrice(fabricCode);
    breakdown.fabricCharges = fabricMeters * fabricPricePerMeter;
    totalPrice += breakdown.fabricCharges;
  }

  // Foam upgrade
  const foamType = configuration.foam?.type || "";
  if (foamType) {
    const foamKey = `foam_${foamType.toLowerCase().replace(/\s+/g, "_")}`;
    breakdown.foamUpgrade = getFormulaValue(formulas, foamKey, 0);
    totalPrice += breakdown.foamUpgrade;
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
 * Calculate cinema chair pricing
 */
async function calculateCinemaChairPricing(
  configuration: any,
  productData: ProductData,
  formulas: PricingFormula[],
  settings: AdminSetting[],
  basePrice: number
): Promise<{ breakdown: PricingBreakdown; total: number }> {
  const breakdown: PricingBreakdown = {
    basePrice: basePrice,
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
    mechanismUpgrade: 0,
    storagePrice: 0,
    discountAmount: 0,
    subtotal: 0,
    total: 0,
  };

  const seatCount = configuration.numberOfSeats || configuration.seatCount || 1;
  
  breakdown.baseSeatPrice = basePrice;
  let totalPrice = basePrice;

  // Additional seats
  if (seatCount > 1) {
    const additionalSeatPercent = getFormulaValue(formulas, "additional_seat_percent", 70);
    const additionalSeatPrice = (basePrice * additionalSeatPercent) / 100;
    breakdown.additionalSeatsPrice = additionalSeatPrice * (seatCount - 1);
    totalPrice += breakdown.additionalSeatsPrice;
  }

  // Mechanism pricing
  const mechanism = configuration.mechanism || "Manual";
  if (mechanism === "electric" || mechanism === "Electric") {
    const electricCost = getFormulaValue(formulas, "electric_mechanism_cost", 5000);
    breakdown.mechanismUpgrade = electricCost * seatCount;
    totalPrice += breakdown.mechanismUpgrade;
  }

  // Console pricing
  if (configuration.console?.required === "Yes" || configuration.console?.required === true) {
    const consoleSize = configuration.console?.size || "";
    const quantity = configuration.console?.quantity || 1;

    let consolePrice = 0;
    if (consoleSize.includes("6") || consoleSize === "6 in") {
      consolePrice = getFormulaValue(formulas, "console_6_inch", 8000);
    } else if (consoleSize.includes("10") || consoleSize === "10 in") {
      consolePrice = getFormulaValue(formulas, "console_10_inch", 12000);
    }

    breakdown.consolePrice = consolePrice * quantity;
    totalPrice += breakdown.consolePrice;
  }

  // Fabric charges
  const fabricMeters = calculateFabricMeters("cinema_chairs", configuration, settings);
  const fabricCode = configuration.fabric?.structureCode || configuration.fabric?.claddingPlan;
  
  if (fabricCode) {
    const fabricPricePerMeter = await getFabricPrice(fabricCode);
    breakdown.fabricCharges = fabricMeters * fabricPricePerMeter;
    totalPrice += breakdown.fabricCharges;
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
 * Calculate chair pricing (dining chairs, arm chairs)
 */
async function calculateChairPricing(
  category: string,
  configuration: any,
  productData: ProductData,
  formulas: PricingFormula[],
  settings: AdminSetting[],
  basePrice: number
): Promise<{ breakdown: PricingBreakdown; total: number }> {
  const breakdown: PricingBreakdown = {
    basePrice: basePrice,
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
    mechanismUpgrade: 0,
    storagePrice: 0,
    discountAmount: 0,
    subtotal: 0,
    total: 0,
  };

  const quantity = configuration.quantity || 1;
  
  breakdown.baseSeatPrice = basePrice;
  let totalPrice = basePrice;

  // Additional quantity pricing
  if (quantity > 1) {
    const additionalPercent = getFormulaValue(formulas, "additional_seat_percent", 70);
    const additionalPrice = (basePrice * additionalPercent) / 100;
    breakdown.additionalSeatsPrice = additionalPrice * (quantity - 1);
    totalPrice += breakdown.additionalSeatsPrice;
  }

  // Pillows pricing (for arm chairs)
  if (category === "arm_chairs" && configuration.pillows?.required) {
    const pillowType = configuration.pillows?.type || "Simple";
    const pillowQty = configuration.pillows?.quantity || 1;

    let pillowPrice = 1200;
    if (pillowType === "Diamond" || pillowType === "Diamond Quilted") {
      pillowPrice = 3500;
    } else if (pillowType === "Belt" || pillowType === "Belt Quilted") {
      pillowPrice = 4000;
    } else if (pillowType === "Tassels") {
      pillowPrice = 2500;
    }

    breakdown.pillowsPrice = pillowPrice * pillowQty * quantity;
    totalPrice += breakdown.pillowsPrice;
  }

  // Fabric charges
  const fabricMeters = calculateFabricMeters(category, configuration, settings);
  const fabricCode = configuration.fabric?.structureCode || configuration.fabric?.claddingPlan;
  
  if (fabricCode) {
    const fabricPricePerMeter = await getFabricPrice(fabricCode);
    breakdown.fabricCharges = fabricMeters * fabricPricePerMeter;
    totalPrice += breakdown.fabricCharges;
  }

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
      breakdown.accessoriesPrice = leg.price_rs * quantity;
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
 * Calculate bench pricing
 */
async function calculateBenchPricing(
  category: string,
  configuration: any,
  productData: ProductData,
  formulas: PricingFormula[],
  settings: AdminSetting[],
  basePrice: number
): Promise<{ breakdown: PricingBreakdown; total: number }> {
  const breakdown: PricingBreakdown = {
    basePrice: basePrice,
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
    mechanismUpgrade: 0,
    storagePrice: 0,
    discountAmount: 0,
    subtotal: 0,
    total: 0,
  };

  const seatingCapacity = configuration.seatingCapacity || configuration.qty || 1;
  
  breakdown.baseSeatPrice = basePrice;
  let totalPrice = basePrice;

  // Additional seating pricing
  if (seatingCapacity > 1) {
    const additionalPercent = getFormulaValue(formulas, "additional_seat_percent", 70);
    const additionalPrice = (basePrice * additionalPercent) / 100;
    breakdown.additionalSeatsPrice = additionalPrice * (seatingCapacity - 1);
    totalPrice += breakdown.additionalSeatsPrice;
  }

  // Storage pricing (for benches)
  if (category === "benches" && configuration.storageType && configuration.storageType !== "None") {
    const storageCost = getFormulaValue(formulas, "storage_cost", 3000);
    breakdown.storagePrice = storageCost;
    totalPrice += breakdown.storagePrice;
  }

  // Fabric charges
  const fabricMeters = calculateFabricMeters(category, configuration, settings);
  const fabricCode = configuration.fabric?.structureCode || configuration.fabric?.claddingPlan;
  
  if (fabricCode) {
    const fabricPricePerMeter = await getFabricPrice(fabricCode);
    breakdown.fabricCharges = fabricMeters * fabricPricePerMeter;
    totalPrice += breakdown.fabricCharges;
  }

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
      breakdown.accessoriesPrice = leg.price_rs;
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
 * Calculate sofabed pricing
 */
async function calculateSofabedPricing(
  configuration: any,
  productData: ProductData,
  formulas: PricingFormula[],
  settings: AdminSetting[],
  basePrice: number
): Promise<{ breakdown: PricingBreakdown; total: number }> {
  const breakdown: PricingBreakdown = {
    basePrice: basePrice,
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
    mechanismUpgrade: 0,
    storagePrice: 0,
    discountAmount: 0,
    subtotal: 0,
    total: 0,
  };

  const seatCount = configuration.seatType || configuration.seatCount || 1;
  const seatNumber = parseSeatCount(seatCount);
  
  breakdown.baseSeatPrice = basePrice;
  let totalPrice = basePrice;

  // Additional seats
  if (seatNumber > 1) {
    const additionalSeatPercent = getFormulaValue(formulas, "additional_seat_percent", 70);
    const additionalSeatPrice = (basePrice * additionalSeatPercent) / 100;
    breakdown.additionalSeatsPrice = additionalSeatPrice * (seatNumber - 1);
    totalPrice += breakdown.additionalSeatsPrice;
  }

  // Mechanism pricing
  const mechanism = configuration.mechanismType || configuration.mechanism || "Manual";
  if (mechanism === "electric" || mechanism === "Electric" || mechanism === "Electric-RRR") {
    const electricCost = getFormulaValue(formulas, "electric_mechanism_cost", 5000);
    breakdown.mechanismUpgrade = electricCost;
    totalPrice += breakdown.mechanismUpgrade;
  }

  // Console pricing
  if (configuration.console?.required === "Yes" || configuration.console?.required === true) {
    const consoleSize = configuration.console?.size || "";
    const quantity = configuration.console?.quantity || 1;

    let consolePrice = 0;
    if (consoleSize.includes("6") || consoleSize === "6 in") {
      consolePrice = getFormulaValue(formulas, "console_6_inch", 8000);
    } else if (consoleSize.includes("10") || consoleSize === "10 in") {
      consolePrice = getFormulaValue(formulas, "console_10_inch", 12000);
    }

    breakdown.consolePrice = consolePrice * quantity;
    totalPrice += breakdown.consolePrice;
  }

  // Fabric charges
  const fabricMeters = calculateFabricMeters("sofabed", configuration, settings);
  const fabricCode = configuration.fabric?.structureCode || configuration.fabric?.claddingPlan;
  
  if (fabricCode) {
    const fabricPricePerMeter = await getFabricPrice(fabricCode);
    breakdown.fabricCharges = fabricMeters * fabricPricePerMeter;
    totalPrice += breakdown.fabricCharges;
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
 * Calculate generic pricing for unknown categories
 */
async function calculateGenericPricing(
  category: string,
  configuration: any,
  productData: ProductData,
  formulas: PricingFormula[],
  settings: AdminSetting[],
  basePrice: number
): Promise<{ breakdown: PricingBreakdown; total: number }> {
  const breakdown: PricingBreakdown = {
    basePrice: basePrice,
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
    mechanismUpgrade: 0,
    storagePrice: 0,
    discountAmount: 0,
    subtotal: 0,
    total: 0,
  };

  breakdown.baseSeatPrice = basePrice;
  let totalPrice = basePrice;

  // Calculate fabric cost
  const fabricMeters = calculateFabricMeters(category, configuration, settings);
  const fabricCode = configuration.fabric?.structureCode || configuration.fabric?.claddingPlan;
  
  if (fabricCode) {
    const fabricPricePerMeter = await getFabricPrice(fabricCode);
    breakdown.fabricCharges = fabricMeters * fabricPricePerMeter;
    totalPrice += breakdown.fabricCharges;
  }

  // Apply category-specific adjustments
  totalPrice = applyCategoryAdjustments(category, configuration, totalPrice, formulas);

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
