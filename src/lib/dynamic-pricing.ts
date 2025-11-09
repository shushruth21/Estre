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

    case "recliner": {
      // Recliner fabric calculation based on sections
      const sections = configuration.sections || configuration.basic_recliner?.sections || {};
      const getSeatCount = (type: string): number => {
        if (!type || type === "Corner" || type === "Backrest" || type === "none") return 0;
        const match = type.match(/(\d+)-Seater/);
        return match ? parseInt(match[1], 10) : 0;
      };

      let totalSeats = 0;
      
      // Count seats from Front section
      if (sections.F?.type) {
        totalSeats += getSeatCount(sections.F.type);
      }
      
      // Count seats from L2 section (if L SHAPE)
      if (sections.L2?.type) {
        totalSeats += getSeatCount(sections.L2.type);
      }

      // First recliner: 6.0 meters (or from settings)
      const firstReclinerMeters = getSettingValue(settings, "fabric_first_recliner_mtrs", 6.0);
      totalMeters += firstReclinerMeters;

      // Additional seats: +3.5 meters per seat (or from settings)
      if (totalSeats > 1) {
        const additionalSeatMeters = getSettingValue(settings, "fabric_additional_seat_mtrs", 3.5);
        totalMeters += (totalSeats - 1) * additionalSeatMeters;
      }

      // Corner and Backrest fabric (if applicable)
      if (sections.L1?.type) {
        if (sections.L1.type === "Corner") {
          const cornerMeters = getSettingValue(settings, "fabric_corner_mtrs", 7.0);
          totalMeters += cornerMeters;
        } else if (sections.L1.type === "Backrest") {
          const backrestMeters = getSettingValue(settings, "fabric_backrest_mtrs", 2.0);
          totalMeters += backrestMeters;
        }
      }

      // Consoles
      const consoleSize = configuration.console?.size || null;
      const consoleQuantity = configuration.console?.quantity || 0;
      if (consoleSize && consoleQuantity > 0) {
        if (consoleSize.includes("6") || consoleSize === "6 in" || consoleSize === "Console-6 in") {
          const consoleMeters = getSettingValue(settings, "fabric_console_6_mtrs", 1.5);
          totalMeters += consoleQuantity * consoleMeters;
        } else if (consoleSize.includes("10") || consoleSize === "10 in" || consoleSize === "Console-10 In") {
          const consoleMeters = getSettingValue(settings, "fabric_console_10_mtrs", 2.0);
          totalMeters += consoleQuantity * consoleMeters;
        }
      }

      break;
    }
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
      // Section-based fabric calculation (similar to sofa)
      const sections = configuration.sections || {};
      
      // Helper to parse seat count
      const parseSeatCount = (seaterType: string): number => {
        if (!seaterType) return 0;
        const lower = seaterType.toLowerCase();
        if (lower.includes("4-seater")) return 4;
        if (lower.includes("3-seater")) return 3;
        if (lower.includes("2-seater")) return 2;
        if (lower.includes("1-seater")) return 1;
        return 0;
      };

      // Calculate total seats from sections
      let totalSeats = 0;
      ["F", "L2", "R2", "C2"].forEach((sectionId) => {
        const section = sections[sectionId];
        if (section?.seater && section.seater !== "none") {
          const seatCount = parseSeatCount(section.seater);
          const qty = section.qty || 1;
          totalSeats += seatCount * qty;
        }
      });

      // Base fabric: 6m for first seat (standard sofa bed)
      const firstSeatMeters = getSettingValue(settings, "fabric_first_seat_mtrs", 6.0);
      totalMeters += firstSeatMeters;

      // Additional seats: +3m per seat
      if (totalSeats > 1) {
        const additionalSeatMeters = getSettingValue(settings, "fabric_additional_seat_mtrs", 3.0);
        totalMeters += (totalSeats - 1) * additionalSeatMeters;
      }

      // Lounger fabric (by size)
      if (configuration.lounger?.required === "Yes" && configuration.lounger?.size) {
        const loungerSize = configuration.lounger.size;
        const quantity = configuration.lounger?.numberOfLoungers === "2 Nos." ? 2 : 1;
        let loungerMeters = 0;

        // Map lounger sizes to meters
        if (loungerSize.includes("5 ft") && !loungerSize.includes("6 in")) {
          loungerMeters = 5.5; // 5 ft
        } else if (loungerSize.includes("5 ft 6") || loungerSize.includes("5'6")) {
          loungerMeters = 6.5; // 5'6"
        } else if (loungerSize.includes("6 ft") && !loungerSize.includes("6 in") && !loungerSize.includes("6'6")) {
          loungerMeters = 7.2; // 6 ft
        } else if (loungerSize.includes("6 ft 6") || loungerSize.includes("6'6")) {
          loungerMeters = 7.8; // 6'6"
        } else if (loungerSize.includes("7 ft") || loungerSize.includes("7'")) {
          loungerMeters = 8.4; // 7 ft
        }

        totalMeters += loungerMeters * quantity;
      }

      // Console fabric (by size and quantity)
      if (configuration.console?.required === "Yes" && configuration.console?.size) {
        const consoleSize = configuration.console.size;
        const quantity = configuration.console?.quantity || 1;
        let consoleMeters = 0;

        // 6-inch console: 1.5 meters, 10-inch console: 2 meters
        if (consoleSize.includes("6") || consoleSize === "6 in" || consoleSize === "Console-6 in") {
          consoleMeters = 1.5;
        } else if (consoleSize.includes("10") || consoleSize === "10 in" || consoleSize === "Console-10 In") {
          consoleMeters = 2.0;
        }

        totalMeters += consoleMeters * quantity;
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
  armrestUpgrade: number;
  stitchTypePrice: number;
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
      armrestUpgrade: 0,
      stitchTypePrice: 0,
      discountAmount: 0,
      subtotal: 0,
      total: 0,
    };

    // Get base price from product
    // For sofa category, prioritize net_markup_1seater
    // For sofabed, use 2-seater base price (strike_price_2seater_rs or net_price_rs)
    let basePrice = 0;
    if (category === "sofa") {
      basePrice = productData.net_markup_1seater || 
                  productData.net_price_rs || 
                  productData.strike_price_1seater_rs || 
                  productData.bom_rs || 
                  productData.adjusted_bom_rs || 0;
    } else if (category === "sofabed") {
      // Sofa bed uses 2-seater base price
      // Note: bom_rs has been renamed to strike_price_2seater_rs in sofabed_database
      basePrice = productData.strike_price_2seater_rs ||
                  productData.net_price_rs || 
                  productData.adjusted_bom_rs || 0;
    } else if (category === "recliner") {
      // Recliner doesn't have bom_rs column - use net_price_rs as primary
      basePrice = productData.net_price_rs ||
                  productData.net_markup_1seater_manual ||
                  productData.strike_price_1seater_rs ||
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
    armrestUpgrade: 0,
    stitchTypePrice: 0,
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

  // Lounger pricing - Formula: 5ft = 100% base, 5'6" = 100%, 6ft = 110%, 6'6" = 120%, 7ft = 130%
  if (configuration.lounger?.required) {
    const loungerSize = configuration.lounger?.size || "";
    const quantity = configuration.lounger?.quantity || 1;

    // Calculate lounger price based on size
    // 5ft = 100% of base price (base)
    // 5'6" = 100% of base price (same as 5ft; no premium for the extra 6")
    // 6ft = 110% of base price (+10% from base)
    // 6'6" = 120% of base price (+20% from base)
    // 7ft = 130% of base price (+30% from base)
    // Check in order from largest to smallest to avoid partial matches
    let loungerPercent = 100; // Default: 5ft = 100%
    
    if (loungerSize.includes("7 ft") || loungerSize.includes("7'")) {
      loungerPercent = 130; // 7ft = 130%
    } else if (loungerSize.includes("6'6") || loungerSize.includes("6 ft 6 in") || loungerSize.includes("6.5")) {
      loungerPercent = 120; // 6'6" = 120%
    } else if (loungerSize.includes("6 ft") || loungerSize.includes("6'")) {
      loungerPercent = 110; // 6ft = 110%
    } else if (loungerSize.includes("5'6") || loungerSize.includes("5 ft 6 in") || loungerSize.includes("5.5")) {
      loungerPercent = 100; // 5'6" = 100%
    } else if (loungerSize.includes("5 ft") || loungerSize.includes("5'")) {
      loungerPercent = 100; // 5ft = 100% (base)
    }

    // Calculate lounger price as percentage of base price
    let loungerPrice = (basePrice * loungerPercent) / 100;

    // Storage option
    if (configuration.lounger?.storage === "Yes") {
      loungerPrice += getFormulaValue(formulas, "lounger_storage", 3000);
    }

    breakdown.loungerPrice = loungerPrice * quantity;
    totalPrice += breakdown.loungerPrice;
  }

  // Console pricing - Fixed price per console based on size + accessory prices
  if (configuration.console?.required) {
    const consoleSize = configuration.console?.size || "";
    const quantity = configuration.console?.quantity || 1;

    // Base console price (per console)
    let baseConsolePrice = 0;
    if (consoleSize.includes("6") || consoleSize === "6 in" || consoleSize === "Console-6 in") {
      baseConsolePrice = getFormulaValue(formulas, "console_6_inch", 8000);
    } else if (consoleSize.includes("10") || consoleSize === "10 in" || consoleSize === "Console-10 in") {
      baseConsolePrice = getFormulaValue(formulas, "console_10_inch", 12000);
    }

    // Calculate total console price: base price * quantity + sum of all accessory prices
    let consoleAccessoriesTotal = 0;
    if (configuration.console?.placements && Array.isArray(configuration.console.placements)) {
      const accessoryIds = configuration.console.placements
        .map((p: any) => p?.accessoryId)
        .filter((id: any) => id && id !== null && id !== "none");
      
      if (accessoryIds.length > 0) {
        const { data: accessories } = await supabase
          .from("accessories_prices")
          .select("id, sale_price")
          .in("id", accessoryIds)
          .eq("is_active", true);
        
        if (accessories && accessories.length > 0) {
          // Sum all accessory prices (each console placement can have one accessory)
          consoleAccessoriesTotal = accessories.reduce((sum: number, acc: any) => {
            return sum + (Number(acc.sale_price) || 0);
          }, 0);
        }
      }
    }

    // Total console price = (base console price * quantity) + (sum of all accessories)
    breakdown.consolePrice = (baseConsolePrice * quantity) + consoleAccessoriesTotal;
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

  // Accessories (legs only - armrest is separate)
  let accessoriesTotal = 0;
  if (configuration.legType || configuration.legsCode || configuration.legs?.type) {
    const legCode = configuration.legsCode || configuration.legType || configuration.legs?.type;
    const { data: leg } = await supabase
      .from("legs_prices")
      .select("price_per_unit")
      .eq("description", legCode)
      .eq("is_active", true)
      .single();

    if (leg && leg.price_per_unit) {
      accessoriesTotal += leg.price_per_unit || 0;
    }
  }
  breakdown.accessoriesPrice = accessoriesTotal;
  totalPrice += accessoriesTotal;

  // Armrest pricing (separate from accessories)
  if (configuration.armrest?.type) {
    const armrestType = configuration.armrest.type;
    try {
      const { data: armrestOption, error: armrestError } = await supabase
        .from("dropdown_options")
        .select("metadata, option_value, display_label")
        .eq("category", "sofa")
        .eq("field_name", "armrest_type")
        .eq("option_value", armrestType)
        .eq("is_active", true)
        .single();

      if (armrestError) {
        console.warn("Error fetching armrest option:", armrestError);
        console.warn("Armrest type searched:", armrestType);
      }

      if (armrestOption && armrestOption.metadata) {
        // Handle both JSONB object and parsed object
        let metadata = armrestOption.metadata;
        if (typeof metadata === 'string') {
          try {
            metadata = JSON.parse(metadata);
          } catch (e) {
            console.warn("Failed to parse armrest metadata as JSON:", e);
          }
        }
        
        // Try multiple possible field names for price
        const armrestPrice = Number(
          metadata?.price_rs || 
          metadata?.price || 
          metadata?.priceRs || 
          0
        );
        
        breakdown.armrestUpgrade = armrestPrice;
        totalPrice += armrestPrice;
        
        if (armrestPrice > 0) {
          console.log(`✅ Armrest "${armrestType}" price: ₹${armrestPrice}`);
        } else {
          console.log(`ℹ️ Armrest "${armrestType}" has no price (free/default)`);
        }
      } else if (armrestOption) {
        console.warn(`⚠️ Armrest option found but no metadata:`, armrestOption);
      }
    } catch (error) {
      console.error("Error processing armrest pricing:", error);
    }
  }

  // Stitch Type pricing
  if (configuration.stitch?.type) {
    const stitchType = configuration.stitch.type;
    try {
      const { data: stitchOption, error: stitchError } = await supabase
        .from("dropdown_options")
        .select("metadata")
        .eq("category", "sofa")
        .eq("field_name", "stitch_type")
        .eq("option_value", stitchType)
        .eq("is_active", true)
        .single();

      if (stitchError) {
        console.warn("Error fetching stitch type option:", stitchError);
      }

      if (stitchOption && stitchOption.metadata) {
        let metadata = stitchOption.metadata;
        if (typeof metadata === 'string') {
          try {
            metadata = JSON.parse(metadata);
          } catch (e) {
            console.warn("Failed to parse stitch metadata as JSON:", e);
          }
        }
        
        const stitchPrice = Number(
          metadata?.price_rs || 
          metadata?.price || 
          metadata?.priceRs || 
          0
        );
        
        breakdown.stitchTypePrice = stitchPrice;
        totalPrice += stitchPrice;
      }
    } catch (error) {
      console.error("Error processing stitch type pricing:", error);
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
    armrestUpgrade: 0,
    stitchTypePrice: 0,
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
      .select("price_per_unit")
      .eq("description", legCode)
      .eq("is_active", true)
      .single();

    if (leg && leg.price_per_unit) {
      breakdown.accessoriesPrice = leg.price_per_unit || 0;
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
 * Pricing Rules:
 * - First Seat: 100% of base price
 * - Additional Seat: 70% of base price
 * - Corner Seat: 50% of base price
 * - Dummy Seat: 55% of base price (replaces regular seat)
 * - Backrest: 20% of base price
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
    armrestUpgrade: 0,
    stitchTypePrice: 0,
    discountAmount: 0,
    subtotal: 0,
    total: 0,
  };

  // Helper: Get seat count from type string
  const getSeatCount = (type: string): number => {
    if (type === "Corner" || type === "Backrest") return 0;
    const match = type.match(/(\d+)-Seater/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Helper: Calculate section price
  const calculateSectionPrice = (
    section: { type: string; qty: number } | null,
    basePricePerSeat: number,
    isFirstSeatCounted: boolean
  ): { price: number; isFirstSeatCounted: boolean } => {
    if (!section) return { price: 0, isFirstSeatCounted };

    const seatCount = getSeatCount(section.type);
    const qty = section.qty || 1;
    let sectionPrice = 0;

    if (section.type === "Corner") {
      // Corner: 50% of base price
      sectionPrice = (basePricePerSeat * 0.50) * qty;
      breakdown.cornerSeatsPrice += sectionPrice;
    } else if (section.type === "Backrest") {
      // Backrest: 20% of base price
      sectionPrice = (basePricePerSeat * 0.20) * qty;
      breakdown.backrestSeatsPrice += sectionPrice;
    } else if (seatCount > 0) {
      // Regular seats
      for (let module = 0; module < qty; module++) {
        if (!isFirstSeatCounted) {
          // First seat: 100%
          sectionPrice += basePricePerSeat;
          breakdown.baseSeatPrice += basePricePerSeat;
          isFirstSeatCounted = true;
          // Additional seats: 70%
          if (seatCount > 1) {
            const additionalPrice = (basePricePerSeat * 0.70) * (seatCount - 1);
            sectionPrice += additionalPrice;
            breakdown.additionalSeatsPrice += additionalPrice;
          }
        } else {
          // All seats are additional: 70% each
          const additionalPrice = (basePricePerSeat * 0.70) * seatCount;
          sectionPrice += additionalPrice;
          breakdown.additionalSeatsPrice += additionalPrice;
        }
      }
    }

    return { price: sectionPrice, isFirstSeatCounted };
  };

  let totalPrice = 0;
  let isFirstSeatCounted = false;

  // Calculate section prices
  // F Section (Front)
  if (configuration.sections?.F) {
    const fResult = calculateSectionPrice(
      configuration.sections.F,
      basePrice,
      isFirstSeatCounted
    );
    totalPrice += fResult.price;
    isFirstSeatCounted = fResult.isFirstSeatCounted;
  }

  // L1 Section (Corner) - Only for L SHAPE
  if (configuration.sections?.L1) {
    const l1Result = calculateSectionPrice(
      configuration.sections.L1,
      basePrice,
      true // Corner doesn't count as first seat
    );
    totalPrice += l1Result.price;
  }

  // L2 Section (Left Seats) - Only for L SHAPE
  // Note: Based on user's logic, L2 restarts first seat pricing
  if (configuration.sections?.L2) {
    const l2Result = calculateSectionPrice(
      configuration.sections.L2,
      basePrice,
      false // L2 restarts first seat pricing
    );
    totalPrice += l2Result.price;
  }

  // Dummy Seats Calculation ⭐ UNIQUE TO RECLINER
  // Dummy seats are priced at 55% of per-seat base price
  // They are separate from regular seats and don't replace them
  const dummySeatsConfig = configuration.dummySeats || configuration.dummy_seats || {};
  const dummySeatsRequired = dummySeatsConfig.required === true || dummySeatsConfig.required === "Yes";
  
  if (dummySeatsRequired) {
    const quantityPerSection = dummySeatsConfig.quantity_per_section || {};
    const frontDummyQty = quantityPerSection.front || 0;
    const leftDummyQty = quantityPerSection.left || 0;
    const totalDummySeats = frontDummyQty + leftDummyQty;
    
    if (totalDummySeats > 0) {
      // Dummy seat price: 55% of per-seat base price
      const dummySeatPrice = basePrice * 0.55;
      const dummySeatsTotal = dummySeatPrice * totalDummySeats;
      
      // Add to additional seats price (since they're additional seats, just at different rate)
      breakdown.additionalSeatsPrice += dummySeatsTotal;
      totalPrice += dummySeatsTotal;
      
      if (import.meta.env.DEV) {
        console.log(`📊 Dummy Seats: ${totalDummySeats} × ₹${dummySeatPrice.toFixed(2)} = ₹${dummySeatsTotal.toFixed(2)}`);
      }
    }
  }

  // Mechanism pricing (REQUIRED per section)
  // Manual = 0, Manual-RRR = 6800, Electrical = 14500, Electrical-RRR = 16500, Only Sofa = 0
  const mechanismPrices: Record<string, number> = {
    "Manual": 0,
    "Manual-RRR": 6800,
    "Electrical": 14500,
    "Electric": 14500, // Alternative spelling
    "Electrical-RRR": 16500,
    "Electric-RRR": 16500, // Alternative spelling
    "Only Sofa": 0,
  };

  // Get mechanism from sections object (new structure) or legacy structure
  const mechanismSections = configuration.mechanism?.sections || configuration.mechanism || {};
  const frontMechanism = mechanismSections.front || mechanismSections.F || "Manual";
  const leftMechanism = mechanismSections.left || mechanismSections.L;
  const isLShape = configuration.baseShape === "L SHAPE" || configuration.basic_recliner?.shape === "L SHAPE";
  
  const frontMechanismPrice = mechanismPrices[frontMechanism] || 0;
  const leftMechanismPrice = isLShape ? (mechanismPrices[leftMechanism] || 0) : 0;
  
  breakdown.mechanismUpgrade = frontMechanismPrice + leftMechanismPrice;
  totalPrice += breakdown.mechanismUpgrade;
  
  if (import.meta.env.DEV) {
    console.log(`⚙️ Mechanism Pricing: Front=${frontMechanism} (₹${frontMechanismPrice}), Left=${leftMechanism || "N/A"} (₹${leftMechanismPrice}), Total=₹${breakdown.mechanismUpgrade}`);
  }

  // Console pricing (includes base console price + accessories)
  if (configuration.console?.required === "Yes" || configuration.console?.required === true) {
    const consoleSize = configuration.console?.size || "";
    const quantity = configuration.console?.quantity || 1;
    const placements = configuration.console?.placements || [];

    // Base console price
    let baseConsolePrice = 0;
    if (consoleSize.includes("6") || consoleSize === "6 in" || consoleSize === "Console-6 in") {
      baseConsolePrice = getFormulaValue(formulas, "console_6_inch", 8000);
    } else if (consoleSize.includes("10") || consoleSize === "10 in" || consoleSize === "Console-10 In") {
      baseConsolePrice = getFormulaValue(formulas, "console_10_inch", 12000);
    }

    // Calculate console accessories prices
    let consoleAccessoriesTotal = 0;
    const activePlacements = placements.filter((p: any) => 
      p && p.position && p.position !== "none" && p.section
    );

    for (const placement of activePlacements) {
      if (placement.accessoryId && placement.accessoryId !== "none") {
        try {
          const { data: accessory } = await supabase
            .from("accessories_prices")
            .select("sale_price")
            .eq("id", placement.accessoryId)
            .eq("is_active", true)
            .single();

          if (accessory && accessory.sale_price) {
            consoleAccessoriesTotal += Number(accessory.sale_price) || 0;
          }
        } catch (error) {
          console.warn("Error fetching console accessory price:", error);
        }
      }
    }

    // Total console price = (base console price × quantity) + sum of all accessories
    breakdown.consolePrice = (baseConsolePrice * quantity) + consoleAccessoriesTotal;
    totalPrice += breakdown.consolePrice;
    
    if (import.meta.env.DEV) {
      console.log(`🪑 Console Pricing: Base=₹${baseConsolePrice} × ${quantity} = ₹${baseConsolePrice * quantity}, Accessories=₹${consoleAccessoriesTotal}, Total=₹${breakdown.consolePrice}`);
    }
  }

  // Foam upgrade (applied to base total)
  const foamType = configuration.foam?.type || "";
  if (foamType) {
    const foamKey = `foam_${foamType.toLowerCase().replace(/\s+/g, "_")}`;
    breakdown.foamUpgrade = getFormulaValue(formulas, foamKey, 0);
    totalPrice += breakdown.foamUpgrade;
  }

  // Calculate base total (before dimension upgrades and fabric)
  const baseTotal = totalPrice;

  // Seat Depth Upgrade
  // 22" = 0%, 24" = 0%, 26" = 3%, 28" = 6%
  const seatDepth = configuration.dimensions?.seatDepth || 22;
  const depthUpgradePercent: Record<number, number> = {
    22: 0,
    24: 0,
    26: 0.03, // 3%
    28: 0.06, // 6%
  };
  
  const depthUpgradePercentValue = depthUpgradePercent[seatDepth] || 0;
  const depthUpgrade = baseTotal * depthUpgradePercentValue;

  // Seat Width Upgrade
  // 22" = 0%, 24" = 0%, 26" = 6.5%, 28" = 13%
  const seatWidth = configuration.dimensions?.seatWidth || 22;
  const widthUpgradePercent: Record<number, number> = {
    22: 0,
    24: 0,
    26: 0.065, // 6.5%
    28: 0.13,  // 13%
  };
  
  const widthUpgradePercentValue = widthUpgradePercent[seatWidth] || 0;
  const widthUpgrade = baseTotal * widthUpgradePercentValue;

  // Total dimension upgrade (applied to base total, before fabric)
  breakdown.dimensionUpgrade = depthUpgrade + widthUpgrade;
  totalPrice += breakdown.dimensionUpgrade;

  // Fabric charges (applied after dimension upgrades)
  const fabricMeters = calculateFabricMeters("recliner", configuration, settings);
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
 * Calculate cinema chair pricing
 * Pricing Rules:
 * - First Seat: 100% of base price
 * - Additional Seats: 55% of base price each
 * - Mechanism: Single Motor (0), Dual Motor (28,000 per seat)
 * - Console: 6" (₹8,000) or 10" (₹12,000) per console
 * - Foam: Per seat pricing (Super Soft: ₹2,000, Latex: ₹4,000, Memory: ₹3,000)
 * - Dimension Upgrades: Width (22/24 = 0%, 28 = 13%, 30 = 19.5%), Depth (22/24 = 0%)
 * - Accessories: From accessories_prices table
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
    armrestUpgrade: 0,
    stitchTypePrice: 0,
    discountAmount: 0,
    subtotal: 0,
    total: 0,
  };

  // Parse seat count from seater type or numberOfSeats
  const parseSeaterType = (seaterType: string | number | undefined): number => {
    if (typeof seaterType === "number") return seaterType;
    if (!seaterType) return 1;
    const match = seaterType.toString().match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  };

  const seatCount = parseSeaterType(configuration.seaterType || configuration.numberOfSeats || configuration.seatCount || 1);
  
  // Base pricing: First seat 100%, additional seats 55%
  breakdown.baseSeatPrice = basePrice; // First seat: 100%
  let totalPrice = basePrice;

  // Additional seats: 55% each
  if (seatCount > 1) {
    const additionalSeatPercent = getFormulaValue(formulas, "additional_seat_percent", 55); // Cinema chairs use 55%
    const additionalSeatPrice = (basePrice * additionalSeatPercent) / 100;
    breakdown.additionalSeatsPrice = additionalSeatPrice * (seatCount - 1);
    totalPrice += breakdown.additionalSeatsPrice;
  }

  // Mechanism pricing: Single Motor (0), Dual Motor (28,000 per seat)
  const mechanism = configuration.mechanism || "Single Motor";
  if (mechanism === "Dual Motor" || mechanism === "dual_motor") {
    const dualMotorCost = getFormulaValue(formulas, "dual_motor_cost", 28000);
    breakdown.mechanismUpgrade = dualMotorCost * seatCount;
    totalPrice += breakdown.mechanismUpgrade;
  }

  // Console pricing - Fixed price per console based on size + accessory prices
  if (configuration.console?.required === "Yes" || configuration.console?.required === true) {
    const consoleSize = configuration.console?.size || "";
    const quantity = configuration.console?.quantity || 0;
    const placements = configuration.console?.placements || [];

    // Base console price (per console)
    let baseConsolePrice = 0;
    if (consoleSize.includes("6") || consoleSize === "6 in" || consoleSize === "Console-6 in") {
      baseConsolePrice = getFormulaValue(formulas, "console_6_inch", 8000);
    } else if (consoleSize.includes("10") || consoleSize === "10 in" || consoleSize === "Console-10 In") {
      baseConsolePrice = getFormulaValue(formulas, "console_10_inch", 12000);
    }

    // Calculate console accessories prices from placements
    let consoleAccessoriesTotal = 0;
    const activePlacements = placements.filter((p: any) => 
      p && p.position && p.position !== "none" && p.section
    );

    for (const placement of activePlacements) {
      if (placement.accessoryId && placement.accessoryId !== "none" && placement.accessoryId !== null) {
        try {
          const { data: accessory } = await supabase
            .from("accessories_prices")
            .select("sale_price")
            .eq("id", placement.accessoryId)
            .eq("is_active", true)
            .single();

          if (accessory && accessory.sale_price) {
            consoleAccessoriesTotal += Number(accessory.sale_price) || 0;
          }
        } catch (error) {
          console.warn("Error fetching console accessory price:", error);
        }
      }
    }

    // Total console price = (base console price × quantity) + sum of all accessories
    breakdown.consolePrice = (baseConsolePrice * quantity) + consoleAccessoriesTotal;
    totalPrice += breakdown.consolePrice;
    
    if (import.meta.env.DEV) {
      console.log(`🎬 Cinema Chairs Console Pricing: Base=₹${baseConsolePrice} × ${quantity} = ₹${baseConsolePrice * quantity}, Accessories=₹${consoleAccessoriesTotal}, Total=₹${breakdown.consolePrice}`);
    }
  }

  // Foam upgrade (per seat)
  const foamType = configuration.foam?.type || "Firm";
  const foamPrices: Record<string, number> = {
    "Firm": 0,
    "Soft": 0,
    "Super Soft": 2000,
    "Latex": 4000,
    "Memory": 3000,
    "Memory Foam": 3000,
  };
  const foamPricePerSeat = foamPrices[foamType] || 0;
  breakdown.foamUpgrade = foamPricePerSeat * seatCount;
  totalPrice += breakdown.foamUpgrade;

  // Subtotal before dimension upgrades and fabric
  const baseTotal = totalPrice;

  // Dimension upgrades (applied to base total, before fabric)
  const seatWidth = configuration.dimensions?.seatWidth || 24;
  const seatDepth = configuration.dimensions?.seatDepth || 22;

  // Width upgrade: 22/24 = 0%, 28 = 13%, 30 = 19.5%
  const widthUpgradePercent: Record<number, number> = {
    22: 0.00,
    24: 0.00,
    28: 0.13,  // 13%
    30: 0.195, // 19.5%
  };
  const widthUpgradePercentValue = widthUpgradePercent[Number(seatWidth)] || 0;
  const widthUpgrade = baseTotal * widthUpgradePercentValue;

  // Depth upgrade: 22/24 = 0% (no upgrade for cinema chairs)
  const depthUpgrade = 0;

  breakdown.dimensionUpgrade = widthUpgrade + depthUpgrade;
  totalPrice += breakdown.dimensionUpgrade;

  // Fabric charges (applied after dimension upgrades)
  const fabricMeters = calculateFabricMeters("cinema_chairs", configuration, settings);
  const fabricCode = configuration.fabric?.structureCode || configuration.fabric?.claddingPlan;
  
  if (fabricCode) {
    const fabricPricePerMeter = await getFabricPrice(fabricCode);
    breakdown.fabricCharges = fabricMeters * fabricPricePerMeter;
    totalPrice += breakdown.fabricCharges;
  }

  // Accessories pricing
  let accessoriesTotal = 0;

  // Left armrest accessory
  if (configuration.accessories?.leftArmRest) {
    const { data: leftAcc } = await supabase
      .from("accessories_prices")
      .select("sale_price")
      .eq("id", configuration.accessories.leftArmRest)
      .eq("is_active", true)
      .single();
    if (leftAcc) {
      accessoriesTotal += leftAcc.sale_price || 0;
    }
  }

  // Right armrest accessory
  if (configuration.accessories?.rightArmRest) {
    const { data: rightAcc } = await supabase
      .from("accessories_prices")
      .select("sale_price")
      .eq("id", configuration.accessories.rightArmRest)
      .eq("is_active", true)
      .single();
    if (rightAcc) {
      accessoriesTotal += rightAcc.sale_price || 0;
    }
  }

  // Console accessories
  if (configuration.accessories?.consoleAccessories && Array.isArray(configuration.accessories.consoleAccessories)) {
    const consoleAccessoryIds = configuration.accessories.consoleAccessories.filter((id: any) => id !== null && id !== "none");
    if (consoleAccessoryIds.length > 0) {
      const { data: consoleAccessories } = await supabase
        .from("accessories_prices")
        .select("sale_price")
        .in("id", consoleAccessoryIds)
        .eq("is_active", true);
      if (consoleAccessories) {
        consoleAccessories.forEach((acc) => {
          accessoriesTotal += acc.sale_price || 0;
        });
      }
    }
  }

  breakdown.accessoriesPrice = accessoriesTotal;
  totalPrice += breakdown.accessoriesPrice;

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
    armrestUpgrade: 0,
    stitchTypePrice: 0,
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
      .select("price_per_unit")
      .eq("description", legCode)
      .eq("is_active", true)
      .single();

    if (leg && leg.price_per_unit) {
      breakdown.accessoriesPrice = leg.price_per_unit * quantity;
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
    armrestUpgrade: 0,
    stitchTypePrice: 0,
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
      .select("price_per_unit")
      .eq("description", legCode)
      .eq("is_active", true)
      .single();

    if (leg && leg.price_per_unit) {
      breakdown.accessoriesPrice = leg.price_per_unit;
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
 * Pricing Rules:
 * - First Seat: 100% of 2-Seater base price
 * - Additional Seats: 35% (KEY DIFFERENCE from sofa's 70%)
 * - Corner: 65%
 * - Backrest: 14%
 * - Lounger: 40% base (5'6") + 4% per additional 6"
 * - Recliner: ₹14,000 per electric recliner
 * - Console: ₹8,000 (6") or ₹12,000 (10") per console
 * - Foam: Per seat (Latex: ₹4,000, Memory: ₹3,000)
 * - Dimension Upgrades: Width (22/24=0%, 26=6.5%, 30=19.5%), Depth (22/24=0%, 26/27=3%, 28/29=6%)
 */
async function calculateSofabedPricing(
  configuration: any,
  productData: ProductData,
  formulas: PricingFormula[],
  settings: AdminSetting[],
  basePrice: number
): Promise<{ breakdown: PricingBreakdown; total: number }> {
  // Debug logging
  if (import.meta.env.DEV) {
    console.log("🔍 calculateSofabedPricing called with:", {
      basePrice,
      hasSections: !!configuration.sections,
      sections: configuration.sections,
      hasLounger: !!configuration.lounger,
      lounger: configuration.lounger,
      hasConsole: !!configuration.console,
      console: configuration.console,
      hasRecliner: !!configuration.recliner,
      recliner: configuration.recliner,
    });
  }

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
    armrestUpgrade: 0,
    stitchTypePrice: 0,
    discountAmount: 0,
    subtotal: 0,
    total: 0,
  };

  // Helper: Parse seat count from seater type (handles "No Mech" options)
  const parseSeatCount = (seaterType: string): number => {
    if (!seaterType) return 0;
    const lower = seaterType.toLowerCase();
    // Handle "No Mech" options - they have same seat count, just no mechanism
    if (lower.includes("4-seater")) return 4;
    if (lower.includes("3-seater")) return 3;
    if (lower.includes("2-seater")) return 2;
    if (lower.includes("1-seater")) return 1;
    return 0;
  };

  // Get base price for 2-seater (this should be the basePrice parameter)
  const basePriceFor2Seater = basePrice;
  let totalPrice = 0;

  const sections = configuration.sections || {};
  const sectionOrder = ["F", "L1", "L2", "R1", "R2", "C1", "C2"];

  // Track total seats across all sections for first 2 seats pricing
  let totalSeatsProcessed = 0;
  const FIRST_TWO_SEATS_PERCENTAGE = 1.00; // 100% for first 2 seats (base 2-seater price)
  const ADDITIONAL_SEAT_PERCENTAGE = 0.35; // 35% for each additional seat
  const CORNER_PERCENTAGE = 0.65; // 65% for corner
  const BACKREST_PERCENTAGE = 0.14; // 14% for backrest

  // Calculate section-based pricing
  for (const sectionId of sectionOrder) {
    const section = sections[sectionId];
    if (!section || !section.seater || section.seater === "none") continue;

    const seaterType = section.seater.toLowerCase();
    const qty = section.qty || 1;
    let sectionPrice = 0;

    if (seaterType.includes("corner")) {
      // Corner: 65% per unit
      sectionPrice = (basePriceFor2Seater * CORNER_PERCENTAGE) * qty;
      breakdown.cornerSeatsPrice += sectionPrice;
    } else if (seaterType.includes("backrest")) {
      // Backrest: 14% per unit
      sectionPrice = (basePriceFor2Seater * BACKREST_PERCENTAGE) * qty;
      breakdown.backrestSeatsPrice += sectionPrice;
    } else {
      // Regular seater (2/3/4-seater, with or without mech)
      // "No Mech" options are priced the same as regular seats (mechanism cost is separate)
      const seatCount = parseSeatCount(section.seater);
      
      for (let module = 0; module < qty; module++) {
        // Process each seat individually across all modules
        for (let seat = 0; seat < seatCount; seat++) {
          if (totalSeatsProcessed < 2) {
            // First 2 seats total across ALL sections = 100% of base price (split between them)
            // So each of the first 2 seats = 50% of base price
            const seatPrice = (basePriceFor2Seater * FIRST_TWO_SEATS_PERCENTAGE) / 2;
            sectionPrice += seatPrice;
            breakdown.baseSeatPrice += seatPrice;
            totalSeatsProcessed += 1;
          } else {
            // Additional seats (beyond first 2) = 35% each
            const seatPrice = basePriceFor2Seater * ADDITIONAL_SEAT_PERCENTAGE;
            sectionPrice += seatPrice;
            breakdown.additionalSeatsPrice += seatPrice;
            totalSeatsProcessed += 1;
          }
        }
      }
    }

    totalPrice += sectionPrice;
  }

  // Lounger pricing - Formula: Base 5'6" = 40% of 2-seater price, +4% per additional 6"
  if (configuration.lounger?.required === "Yes" || configuration.lounger?.required === true) {
    const numLoungers = configuration.lounger?.numberOfLoungers === "2 Nos." ? 2 : 
                       (configuration.lounger?.quantity || 1);
    const loungerSize = configuration.lounger?.size || "";
    
    // Base lounger price: 5'6" = 40% of 2-seater base price
    const baseLoungerPercentage = 0.40; // 40%
    const baseLoungerPrice = basePriceFor2Seater * baseLoungerPercentage;
    
    // Calculate additional 6" increments beyond base 5'6" (66 inches)
    const loungerSizeMap: { [key: string]: number } = {
      "Lounger-5 ft": 60,      // -6" from base (should not happen, but handle it)
      "Lounger-5 ft 6 in": 66, // base = 66 inches
      "Lounger-6 ft": 72,      // +6" from base
      "Lounger-6 ft 6 in": 78, // +12" from base
      "Lounger-7 ft": 84       // +18" from base
    };
    
    // Try to match exact size first
    let loungerInches = loungerSizeMap[loungerSize] || 66;
    
    // If no exact match, try pattern matching
    if (loungerInches === 66) {
      if (loungerSize.includes("7 ft") || loungerSize.includes("7'")) {
        loungerInches = 84;
      } else if (loungerSize.includes("6'6") || loungerSize.includes("6 ft 6 in") || loungerSize.includes("6.5")) {
        loungerInches = 78;
      } else if (loungerSize.includes("6 ft") || loungerSize.includes("6'")) {
        loungerInches = 72;
      } else if (loungerSize.includes("5'6") || loungerSize.includes("5 ft 6 in") || loungerSize.includes("5.5")) {
        loungerInches = 66;
      } else if (loungerSize.includes("5 ft") || loungerSize.includes("5'")) {
        loungerInches = 60; // Less than base, but we'll treat as base
      }
    }
    
    // Calculate additional inches beyond base 5'6" (66 inches)
    const baseInches = 66;
    const additionalInches = Math.max(0, loungerInches - baseInches);
    const additional6InchIncrements = additionalInches / 6;
    
    // Additional cost: 4% per 6" increment
    const additionalCostPer6In = 0.04; // 4%
    const additionalCost = basePriceFor2Seater * (additionalCostPer6In * additional6InchIncrements);
    
    // Total lounger price per unit
    const loungerPricePerUnit = baseLoungerPrice + additionalCost;
    
    // Total for all loungers
    breakdown.loungerPrice = loungerPricePerUnit * numLoungers;
    totalPrice += breakdown.loungerPrice;
  }

  // Recliner mechanism pricing (₹14,000 per recliner)
  const recliner = configuration.recliner || {};
  let reclinerTotal = 0;
  const reclinerPricePerSeat = getFormulaValue(formulas, "recliner_electric_cost", 14000);
  
  ["F", "L", "R", "C"].forEach((section) => {
    const reclinerData = recliner[section];
    if (reclinerData?.required === "Yes") {
      const numRecliners = reclinerData.numberOfRecliners || 0;
      reclinerTotal += reclinerPricePerSeat * numRecliners;
    }
  });
  
  breakdown.mechanismUpgrade = reclinerTotal;
  totalPrice += breakdown.mechanismUpgrade;

  // Pillows pricing
  if (configuration.additionalPillows?.required === "Yes" || configuration.additionalPillows?.required === true) {
    const pillowType = configuration.additionalPillows?.type || "Simple";
    const quantity = configuration.additionalPillows?.quantity || 1;

    // Get pillow price from formulas or use defaults
    let pillowPrice = getFormulaValue(formulas, "pillow_simple_price", 1200); // Default
    
    if (pillowType === "Diamond" || pillowType === "Diamond Quilted" || pillowType === "Diamond Quilted pillow") {
      pillowPrice = getFormulaValue(formulas, "pillow_diamond_quilted_price", 3500);
    } else if (pillowType === "Belt Quilted") {
      pillowPrice = getFormulaValue(formulas, "pillow_belt_quilted_price", 4000);
    } else if (pillowType.includes("Tassels")) {
      pillowPrice = getFormulaValue(formulas, "pillow_tassels_price", 2500);
    }

    breakdown.pillowsPrice = pillowPrice * quantity;
    totalPrice += breakdown.pillowsPrice;
  }

  // Console pricing - Fixed price per console based on size + accessory prices
  if (configuration.console?.required === "Yes" || configuration.console?.required === true) {
    const consoleSize = configuration.console?.size || "";
    const quantity = configuration.console?.quantity || 0;
    const placements = configuration.console?.placements || [];

    // Base console price (per console)
    let baseConsolePrice = 0;
    if (consoleSize.includes("6") || consoleSize === "6 in" || consoleSize === "Console-6 in") {
      baseConsolePrice = getFormulaValue(formulas, "console_6_inch", 8000);
    } else if (consoleSize.includes("10") || consoleSize === "10 in" || consoleSize === "Console-10 In") {
      baseConsolePrice = getFormulaValue(formulas, "console_10_inch", 12000);
    }

    // Calculate console accessories prices from placements
    let consoleAccessoriesTotal = 0;
    const activePlacements = placements.filter((p: any) => 
      p && p.position && p.position !== "none" && p.section
    );

    for (const placement of activePlacements) {
      if (placement.accessoryId && placement.accessoryId !== "none" && placement.accessoryId !== null) {
        try {
          const { data: accessory } = await supabase
            .from("accessories_prices")
            .select("sale_price")
            .eq("id", placement.accessoryId)
            .eq("is_active", true)
            .single();

          if (accessory && accessory.sale_price) {
            consoleAccessoriesTotal += Number(accessory.sale_price) || 0;
          }
        } catch (error) {
          console.warn("Error fetching console accessory price:", error);
        }
      }
    }

    // Total console price = (base console price × quantity) + sum of all accessories
    breakdown.consolePrice = (baseConsolePrice * quantity) + consoleAccessoriesTotal;
    totalPrice += breakdown.consolePrice;
    
    if (import.meta.env.DEV) {
      console.log(`🛋️ Sofabed Console Pricing: Base=₹${baseConsolePrice} × ${quantity} = ₹${baseConsolePrice * quantity}, Accessories=₹${consoleAccessoriesTotal}, Total=₹${breakdown.consolePrice}`);
    }
  }

  // Foam upgrade (per seat)
  // Foam is applied to all actual seats (not corners or backrests)
  const foamType = configuration.foam?.type || "Firm";
  const foamPrices: Record<string, number> = {
    "Firm": 0,
    "Soft": 0,
    "Super Soft": 0,
    "Latex": 4000,
    "Latex Foam": 4000,
    "Memory": 3000,
    "Memory Foam": 3000,
  };
  
  // Calculate total seats for foam pricing (excluding corners and backrests)
  let totalSeatsForFoam = 0;
  for (const sectionId of sectionOrder) {
    const section = sections[sectionId];
    if (!section || !section.seater || section.seater === "none") continue;
    
    const seaterType = section.seater.toLowerCase();
    // Skip corners and backrests - they don't have seats
    if (seaterType.includes("corner") || seaterType.includes("backrest")) {
      continue;
    }
    
    // Count seats in this section
    const seatCount = parseSeatCount(section.seater);
    const qty = section.qty || 1;
    totalSeatsForFoam += seatCount * qty;
  }
  
  const foamPricePerSeat = foamPrices[foamType] || 0;
  breakdown.foamUpgrade = foamPricePerSeat * totalSeatsForFoam;
  totalPrice += breakdown.foamUpgrade;

  // Subtotal before dimension upgrades
  const baseTotal = totalPrice;

  // Dimension upgrades (applied to base total, before fabric)
  const seatWidth = configuration.dimensions?.seatWidth || 24;
  const seatDepth = configuration.dimensions?.seatDepth || 22;

  // Width upgrade: 22/24 = 0%, 26/27 = 6.5%, 30/31 = 19.5%
  const widthUpgradePercent: Record<number, number> = {
    22: 0.00,
    23: 0.00,
    24: 0.00,
    25: 0.00,
    26: 0.065,  // 6.5%
    27: 0.065,
    30: 0.195, // 19.5%
    31: 0.195,
  };
  const widthUpgrade = baseTotal * (widthUpgradePercent[Number(seatWidth)] || 0);

  // Depth upgrade: 22/24 = 0%, 26/27 = 3%, 28/29 = 6%
  const depthUpgradePercent: Record<number, number> = {
    22: 0.00,
    23: 0.00,
    24: 0.00,
    25: 0.00,
    26: 0.03,  // 3%
    27: 0.03,
    28: 0.06,  // 6%
    29: 0.06,
  };
  const depthUpgrade = baseTotal * (depthUpgradePercent[Number(seatDepth)] || 0);

  breakdown.dimensionUpgrade = widthUpgrade + depthUpgrade;
  totalPrice += breakdown.dimensionUpgrade;

  // Fabric charges (applied after dimension upgrades)
  const fabricMeters = calculateFabricMeters("sofabed", configuration, settings);
  const fabricCode = configuration.fabric?.structureCode || configuration.fabric?.claddingPlan;
  
  if (fabricCode) {
    const fabricPricePerMeter = await getFabricPrice(fabricCode);
    breakdown.fabricCharges = fabricMeters * fabricPricePerMeter;
    totalPrice += breakdown.fabricCharges;
  }

  // Console accessories are already handled in the console pricing section above
  // (Removed duplicate calculation)

  // Legs/accessories pricing (legs only, not armrests)
  if (configuration.legs?.type || configuration.legType || configuration.legsCode) {
    const legCode = configuration.legs?.type || configuration.legType || configuration.legsCode;
    try {
      const { data: leg } = await supabase
        .from("legs_prices")
        .select("price_per_unit")
        .eq("description", legCode)
        .eq("is_active", true)
        .single();

      if (leg && leg.price_per_unit) {
        breakdown.accessoriesPrice += leg.price_per_unit || 0;
        totalPrice += leg.price_per_unit || 0;
      }
    } catch (error) {
      console.warn("Error fetching leg price:", error);
    }
  }

  // Armrest pricing (separate from accessories)
  if (configuration.armrest?.type || configuration.advanced?.armrest?.type) {
    const armrestType = configuration.armrest?.type || configuration.advanced?.armrest?.type;
    try {
      const { data: armrestOption, error: armrestError } = await supabase
        .from("dropdown_options")
        .select("metadata, option_value, display_label")
        .eq("category", "sofabed")
        .eq("field_name", "armrest_type")
        .eq("option_value", armrestType)
        .eq("is_active", true)
        .single();

      // Fallback to sofa category if not found in sofabed
      if (armrestError) {
        const { data: sofaArmrest } = await supabase
          .from("dropdown_options")
          .select("metadata, option_value, display_label")
          .eq("category", "sofa")
          .eq("field_name", "armrest_type")
          .eq("option_value", armrestType)
          .eq("is_active", true)
          .single();
        
        if (sofaArmrest && sofaArmrest.metadata) {
          let metadata = sofaArmrest.metadata;
          if (typeof metadata === 'string') {
            try {
              metadata = JSON.parse(metadata);
            } catch (e) {
              console.warn("Failed to parse armrest metadata as JSON:", e);
            }
          }
          
          const armrestPrice = Number(
            metadata?.price_rs || 
            metadata?.price || 
            metadata?.priceRs || 
            0
          );
          
          breakdown.armrestUpgrade = armrestPrice;
          totalPrice += armrestPrice;
        }
      } else if (armrestOption && armrestOption.metadata) {
        let metadata = armrestOption.metadata;
        if (typeof metadata === 'string') {
          try {
            metadata = JSON.parse(metadata);
          } catch (e) {
            console.warn("Failed to parse armrest metadata as JSON:", e);
          }
        }
        
        const armrestPrice = Number(
          metadata?.price_rs || 
          metadata?.price || 
          metadata?.priceRs || 
          0
        );
        
        breakdown.armrestUpgrade = armrestPrice;
        totalPrice += armrestPrice;
      }
    } catch (error) {
      console.error("Error processing armrest pricing:", error);
    }
  }

  // Stitch Type pricing
  if (configuration.stitch?.type || configuration.advanced?.stitch?.type) {
    const stitchType = configuration.stitch?.type || configuration.advanced?.stitch?.type;
    try {
      const { data: stitchOption, error: stitchError } = await supabase
        .from("dropdown_options")
        .select("metadata")
        .eq("category", "sofabed")
        .eq("field_name", "stitch_type")
        .eq("option_value", stitchType)
        .eq("is_active", true)
        .single();

      // Fallback to sofa category if not found in sofabed
      if (stitchError) {
        const { data: sofaStitch } = await supabase
          .from("dropdown_options")
          .select("metadata")
          .eq("category", "sofa")
          .eq("field_name", "stitch_type")
          .eq("option_value", stitchType)
          .eq("is_active", true)
          .single();
        
        if (sofaStitch && sofaStitch.metadata) {
          let metadata = sofaStitch.metadata;
          if (typeof metadata === 'string') {
            try {
              metadata = JSON.parse(metadata);
            } catch (e) {
              console.warn("Failed to parse stitch metadata as JSON:", e);
            }
          }
          
          const stitchPrice = Number(
            metadata?.price_rs || 
            metadata?.price || 
            metadata?.priceRs || 
            0
          );
          
          breakdown.stitchTypePrice = stitchPrice;
          totalPrice += stitchPrice;
        }
      } else if (stitchOption && stitchOption.metadata) {
        let metadata = stitchOption.metadata;
        if (typeof metadata === 'string') {
          try {
            metadata = JSON.parse(metadata);
          } catch (e) {
            console.warn("Failed to parse stitch metadata as JSON:", e);
          }
        }
        
        const stitchPrice = Number(
          metadata?.price_rs || 
          metadata?.price || 
          metadata?.priceRs || 
          0
        );
        
        breakdown.stitchTypePrice = stitchPrice;
        totalPrice += stitchPrice;
      }
    } catch (error) {
      console.error("Error processing stitch type pricing:", error);
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

  // Debug logging for sofabed pricing
  if (import.meta.env.DEV) {
    console.log("💰 Sofabed pricing calculation complete:", {
      basePrice: basePriceFor2Seater,
      breakdown: {
        baseSeatPrice: Math.round(breakdown.baseSeatPrice),
        additionalSeatsPrice: Math.round(breakdown.additionalSeatsPrice),
        cornerSeatsPrice: Math.round(breakdown.cornerSeatsPrice),
        backrestSeatsPrice: Math.round(breakdown.backrestSeatsPrice),
        loungerPrice: Math.round(breakdown.loungerPrice),
        consolePrice: Math.round(breakdown.consolePrice),
        pillowsPrice: Math.round(breakdown.pillowsPrice),
        mechanismUpgrade: Math.round(breakdown.mechanismUpgrade),
        foamUpgrade: Math.round(breakdown.foamUpgrade),
        dimensionUpgrade: Math.round(breakdown.dimensionUpgrade),
        fabricCharges: Math.round(breakdown.fabricCharges),
        accessoriesPrice: Math.round(breakdown.accessoriesPrice),
        armrestUpgrade: Math.round(breakdown.armrestUpgrade),
        stitchTypePrice: Math.round(breakdown.stitchTypePrice),
      },
      subtotal: Math.round(breakdown.subtotal),
      discountAmount: Math.round(breakdown.discountAmount),
      total: breakdown.total,
    });
  }

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
    armrestUpgrade: 0,
    stitchTypePrice: 0,
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
