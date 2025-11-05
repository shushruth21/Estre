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
 * Calculate dynamic price based on configuration
 */
export const calculateDynamicPrice = async (
  category: string,
  productId: string,
  configuration: any
): Promise<number> => {
  try {
    // Fetch all required data
    const [formulas, settings, productData] = await Promise.all([
      fetchPricingFormulas(category),
      fetchAdminSettings(category),
      fetchProductData(category, productId),
    ]);

    // Start with base BOM
    let basePrice = productData.adjusted_bom_rs || productData.bom_rs || 0;

    // Calculate fabric cost
    const fabricMeters = calculateFabricMeters(category, configuration, settings);
    const fabricPricePerMeter = configuration.fabric?.price || 0;
    const fabricCost = fabricMeters * fabricPricePerMeter;

    // Add fabric cost to base
    basePrice += fabricCost;

    // Apply category-specific adjustments
    basePrice = applyCategoryAdjustments(category, configuration, basePrice, formulas);

    // Apply wastage, delivery, GST
    const wastagePercent = getFormulaValue(formulas, "wastage_delivery_gst_percent", 
      productData.wastage_delivery_gst_percent || 20);
    const wastageAmount = (basePrice * wastagePercent) / 100;
    basePrice += wastageAmount;

    // Apply markup
    const markupPercent = getFormulaValue(formulas, "markup_percent", 
      productData.markup_percent || 270);
    const markupAmount = (basePrice * markupPercent) / 100;
    basePrice += markupAmount;

    // Apply discount
    const discountPercent = getFormulaValue(formulas, "discount_percent", 
      productData.discount_percent || 10);
    const discountAmount = (basePrice * discountPercent) / 100;
    const finalPrice = basePrice - discountAmount;

    return Math.round(finalPrice);
  } catch (error) {
    console.error("Error calculating dynamic price:", error);
    throw error;
  }
};

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
