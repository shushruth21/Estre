import { supabase } from "@/integrations/supabase/client";
import { PricingBreakdown } from "./schemas/pricing";
import { Configuration } from "./schemas/configuration";

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

const toNum = (val: any) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  return 0;
};


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
  fabric_first_seat_mtrs?: number;
  fabric_additional_seat_mtrs?: number;
  fabric_corner_seat_mtrs?: number;
  fabric_backrest_mtrs?: number;
  fabric_lounger_6ft_mtrs?: number;
  fabric_lounger_additional_6_mtrs?: number;
  fabric_console_6_mtrs?: number;
  fabric_console_10_mtrs?: number;
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

const SOFABED_RECLINER_ACTIVE_SECTIONS: Record<string, Array<"F" | "L" | "R" | "C">> = {
  STANDARD: ["F"],
  "L SHAPE": ["F", "L"],
  "U SHAPE": ["F", "L", "R"],
  COMBO: ["F", "L", "R", "C"],
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
 * Fetch lounger size metadata from dropdown_options
 * Returns pricing metadata for the given lounger size
 */
async function getLoungerSizeMetadata(
  category: string,
  loungerSize: string
): Promise<{ basePercentage?: number; priceMultiplier?: number; fabricMeters?: number }> {
  if (!loungerSize) return {};

  try {
    const { data, error } = await supabase
      .from("dropdown_options")
      .select("metadata")
      .eq("category", category)
      .eq("field_name", "lounger_size")
      .eq("option_value", loungerSize)
      .eq("is_active", true)
      .single();

    if (error || !data) return {};

    const metadata = (data.metadata || {}) as Record<string, any>;
    return {
      basePercentage: typeof metadata.base_percentage === 'number' ? metadata.base_percentage : undefined,
      priceMultiplier: typeof metadata.price_multiplier === 'number' ? metadata.price_multiplier : undefined,
      fabricMeters: typeof metadata.fabric_meters === 'number' ? metadata.fabric_meters : undefined,
    };
  } catch (error) {
    console.warn(`Error fetching lounger size metadata for ${category}:`, error);
    return {};
  }
}

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
export const calculateFabricMeters = async (
  category: string,
  configuration: Configuration,
  settings: AdminSetting[],
  productData?: ProductData
): Promise<number> => {
  let totalMeters = 0;

  switch (category) {
    case "sofa": {
      const parseSeatCountLocal = (value: any): number => {
        if (typeof value === "number") return value;
        if (!value) return 0;
        const match = value.toString().match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };

      const {
        fabric_first_seat_mtrs = 6,
        fabric_additional_seat_mtrs = 3,
        fabric_corner_seat_mtrs = 5,
        fabric_backrest_mtrs = 1,
        fabric_lounger_6ft_mtrs = 6.5,
        fabric_lounger_additional_6_mtrs = 0.5,
        fabric_console_6_mtrs = 1.5,
        fabric_console_10_mtrs = 2,
      } = (productData || {}) as ProductData;

      const shapeValue = configuration.shape || "standard";
      const normalizedShape = shapeValue.toString().toLowerCase();

      const frontSeats = parseSeatCountLocal(configuration.frontSeatCount || configuration.frontSeats || 1);
      const l2Seats =
        normalizedShape === "l-shape" || normalizedShape === "u-shape" || normalizedShape === "combo"
          ? parseSeatCountLocal(configuration.l2SeatCount || configuration.l2 || 0)
          : 0;
      const r2Seats =
        normalizedShape === "u-shape" || normalizedShape === "combo"
          ? parseSeatCountLocal(configuration.r2SeatCount || configuration.r2 || 0)
          : 0;
      const comboSeats =
        normalizedShape === "combo"
          ? parseSeatCountLocal(configuration.c2SeatCount || configuration.c2 || 0)
          : 0;

      let sofaMeters = Number(fabric_first_seat_mtrs) || 0;

      const additionalSeatCount = Math.max(frontSeats - 1, 0) + l2Seats + r2Seats + comboSeats;
      if (additionalSeatCount > 0) {
        sofaMeters += additionalSeatCount * (Number(fabric_additional_seat_mtrs) || 0);
      }

      const addStructuralFabric = (sectionValue: any) => {
        if (!sectionValue) return;
        const normalized = sectionValue.toString().toLowerCase();
        if (normalized.includes("corner")) {
          sofaMeters += Number(fabric_corner_seat_mtrs) || 0;
        } else if (normalized.includes("backrest")) {
          sofaMeters += Number(fabric_backrest_mtrs) || 0;
        }
      };

      if (normalizedShape === "l-shape" || normalizedShape === "u-shape" || normalizedShape === "combo") {
        addStructuralFabric(configuration.l1Option || configuration.l1);
      }
      if (normalizedShape === "u-shape" || normalizedShape === "combo") {
        addStructuralFabric(configuration.r1Option || configuration.r1);
      }
      if (normalizedShape === "combo") {
        addStructuralFabric(configuration.c1Option || configuration.c1);
      }

      if (configuration.lounger?.required && configuration.lounger?.size) {
        const loungerSize = configuration.lounger.size;
        const loungerQuantity = toNum(configuration.lounger.quantity) || 1;

        const loungerMetadata = await getLoungerSizeMetadata("sofa", loungerSize);

        let loungerMeters =
          loungerMetadata.fabricMeters !== undefined
            ? Number(loungerMetadata.fabricMeters)
            : Number(fabric_lounger_6ft_mtrs) || 0;

        if (loungerMetadata.fabricMeters === undefined) {
          const baseMeters = Number(fabric_lounger_6ft_mtrs) || 0;
          const incrementMeters = Number(fabric_lounger_additional_6_mtrs) || 0;
          const sizeKey = loungerSize.toString().toLowerCase();

          let incrementSteps = 0;
          if (sizeKey.includes("7 ft") || sizeKey.includes("7'")) {
            incrementSteps = 3;
          } else if (sizeKey.includes("6 ft 6") || sizeKey.includes("6'6")) {
            incrementSteps = 2;
          } else if (sizeKey.includes("6 ft") || sizeKey.includes("6'")) {
            incrementSteps = 1;
          } else if (sizeKey.includes("5 ft") && !sizeKey.includes("6")) {
            incrementSteps = -1;
          }

          loungerMeters = Math.max(0, baseMeters + incrementSteps * incrementMeters);
        }

        sofaMeters += loungerMeters * loungerQuantity;
      }

      if (configuration.console?.required && configuration.console?.size) {
        const consoleSize = configuration.console.size?.toString().toLowerCase() || "";
        const consoleQuantity = toNum(configuration.console?.quantity) || 1;

        if (consoleSize.includes("10")) {
          sofaMeters += (Number(fabric_console_10_mtrs) || 0) * (consoleQuantity as number);
        } else if (consoleSize.includes("6")) {
          sofaMeters += (Number(fabric_console_6_mtrs) || 0) * consoleQuantity;
        }
      }

      totalMeters += sofaMeters;
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
      const parseSeatCount = (seaterType: string | number | undefined) => {
        if (typeof seaterType === "number") return seaterType;
        if (!seaterType) return 1;
        const match = seaterType.toString().match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 1;
      };

      const seatCount =
        parseSeatCount(configuration.seaterType) ||
        configuration.numberOfSeats ||
        configuration.seats?.length ||
        1;

      const baseFabricMeters = getSettingValue(settings, "cinema_base_fabric_mtrs", 17.0);
      const additionalSeatMeters = getSettingValue(settings, "cinema_additional_fabric_mtrs", 2.0);

      totalMeters += baseFabricMeters;
      if (seatCount > 1) {
        totalMeters += (seatCount - 1) * additionalSeatMeters;
      }

      const consoleSize = configuration.console?.size || configuration.consoleSize || null;
      const placements = configuration.console?.placements || [];
      const activeConsoles = placements.filter((p: any) => p && p !== "none").length;

      if (consoleSize && activeConsoles > 0) {
        if (consoleSize.includes("6") || consoleSize === "6 in" || consoleSize === "Console-6 in") {
          const consoleMeters = getSettingValue(settings, "fabric_console_6_mtrs", 1.5);
          totalMeters += activeConsoles * consoleMeters;
        } else if (consoleSize.includes("10") || consoleSize === "10 in" || consoleSize === "Console-10 In") {
          const consoleMeters = getSettingValue(settings, "fabric_console_10_mtrs", 2.5);
          totalMeters += activeConsoles * consoleMeters;
        }
      }

      const extraFabric = Number(configuration.fabric?.extraFabricCharges || 0);
      if (!Number.isNaN(extraFabric) && extraFabric > 0) {
        totalMeters += extraFabric;
      }

      break;
    }

    case "bed":
    case "kids_bed": {
      const bedSize = configuration.bedSize || "Double";
      const width = configuration.dimensions?.width || 54;
      const length = configuration.dimensions?.length || 78;

      // Fetch default dimensions from DB
      let defaultDimensions = { width: 54, length: 75 };
      try {
        const { data: bedSizeOption } = await supabase
          .from("dropdown_options")
          .select("metadata")
          .eq("category", "bed")
          .eq("field_name", "bed_size")
          .eq("option_value", bedSize)
          .eq("is_active", true)
          .single();

        if (bedSizeOption?.metadata) {
          const metadata = parseOptionMetadata(bedSizeOption.metadata);
          defaultDimensions = {
            width: metadata.width_inches || defaultDimensions.width,
            length: metadata.length_inches || defaultDimensions.length,
          };
        } else {
          // Fallback
          const fallback: Record<string, { width: number; length: number }> = {
            Single: { width: 36, length: 72 },
            Double: { width: 54, length: 75 },
            Queen: { width: 60, length: 78 },
            King: { width: 72, length: 80 },
          };
          defaultDimensions = fallback[bedSize] || fallback.Double;
        }
      } catch (error) {
        console.warn("Error fetching bed size metadata:", error);
        const fallback: Record<string, { width: number; length: number }> = {
          Single: { width: 36, length: 72 },
          Double: { width: 54, length: 75 },
          Queen: { width: 60, length: 78 },
          King: { width: 72, length: 80 },
        };
        defaultDimensions = fallback[bedSize] || fallback.Double;
      }

      // Calculate area ratio
      const areaRatio = (toNum(width) * toNum(length)) / (defaultDimensions.width * defaultDimensions.length);

      // Get base fabric meterage from product or settings
      const isQueenOrAbove = bedSize === "Queen" || bedSize === "King";
      let baseFabric = 0;

      if (productData) {
        baseFabric = isQueenOrAbove
          ? (productData.fabric_bed_queen_above_mtrs || getSettingValue(settings, "fabric_bed_queen_above_mtrs", 10.0))
          : (productData.fabric_bed_up_to_double_xl_mtrs || getSettingValue(settings, "fabric_bed_up_to_double_xl_mtrs", 8.0));
      } else {
        baseFabric = isQueenOrAbove
          ? getSettingValue(settings, "fabric_bed_queen_above_mtrs", 10.0)
          : getSettingValue(settings, "fabric_bed_up_to_double_xl_mtrs", 8.0);
      }

      // Apply area ratio to base fabric
      totalMeters = baseFabric * areaRatio;

      // Add extra fabric if specified
      const extraFabric = Number(configuration.fabric?.extraFabricCharges || 0);
      if (!Number.isNaN(extraFabric) && extraFabric > 0) {
        totalMeters += extraFabric;
      }

      break;
    }

    case "arm_chairs": {
      const baseFabricMeters =
        Number(configuration.fabricPlan?.baseFabricMeters) ||
        Number(configuration.baseModel?.fabric) ||
        getSettingValue(settings, "arm_chair_base_fabric_mtrs", 6.0);

      const extraFabricMeters = Number(configuration.fabricPlan?.extraFabricMeters || 0);

      let totalChairFabric = baseFabricMeters + extraFabricMeters;

      if (configuration.fabricPlan?.claddingPlan === "Dual Colour") {
        totalChairFabric = totalChairFabric * 1.2; // structure (0.8) + seat (0.4)
      }

      totalMeters += totalChairFabric;

      if (configuration.pillows?.required) {
        const pillowType = configuration.pillows?.type || "Simple pillow";
        const pillowSize = configuration.pillows?.size || "18 in X 18 in";
        const pillowQty = configuration.pillows?.quantity || 1;

        let pillowFabricMeters = getSettingValue(settings, "fabric_pillow_mtrs", 0.6);

        try {
          const { data: pillowSizeOption } = await supabase
            .from("dropdown_options")
            .select("metadata, option_value")
            .eq("category", "arm_chairs")
            .eq("field_name", "pillow_size")
            .eq("option_value", pillowSize)
            .eq("is_active", true)
            .single();

          if (pillowSizeOption && pillowSizeOption.metadata) {
            const metadata = parseOptionMetadata(pillowSizeOption.metadata);
            const fabricMatrix = metadata.fabric_matrix || {};
            const matchingFabric =
              fabricMatrix[pillowType] ||
              fabricMatrix[pillowType.toLowerCase()] ||
              Object.entries(fabricMatrix).find(([key]) => key.toLowerCase() === pillowType.toLowerCase())?.[1];

            pillowFabricMeters = Number(matchingFabric) || pillowFabricMeters;
          }
        } catch (error) {
          console.warn("Error fetching pillow fabric metadata; using fallback", error);
        }

        totalMeters += pillowQty * pillowFabricMeters;
      }

      break;
    }

    case "dining_chairs": {
      const baseFabricMeters =
        Number(configuration.baseModel?.fabric) ||
        Number(configuration.fabricPlan?.baseFabricMeters) ||
        getSettingValue(settings, "dining_base_fabric_mtrs", 3.0);

      const extraFabricMeters = Number(configuration.fabricPlan?.extraFabricMeters || 0);
      totalMeters += baseFabricMeters + extraFabricMeters;

      break;
    }

    case "database_pouffes": {
      // Pouffe fabric from base model or configuration
      const baseFabricMeters = Number(
        configuration.baseModel?.fabric ||
        configuration.fabricPlan?.baseFabricMeters ||
        getSettingValue(settings, "fabric_single_bench_mtrs", 3.0)
      );
      totalMeters += baseFabricMeters;
      break;
    }

    case "benches": {
      const seatingCapacity = toNum(configuration.seatingCapacity) || toNum(configuration.qty) || 1;

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

      // Lounger fabric (by size) - Database-driven from metadata
      if (configuration.lounger?.required === "Yes" && configuration.lounger?.size) {
        const loungerSize = configuration.lounger.size;
        const quantity = configuration.lounger?.numberOfLoungers === "2 Nos." ? 2 : 1;

        // Fetch lounger size metadata from database
        const loungerMetadata = await getLoungerSizeMetadata("sofabed", loungerSize);

        let loungerMeters = 0;

        if (loungerMetadata.fabricMeters !== undefined) {
          // Use fabric meters from metadata
          loungerMeters = loungerMetadata.fabricMeters;
        } else {
          // Fallback: Pattern matching
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

      // Pillow fabric - Get from pillow_size metadata (fabric_matrix)
      if (configuration.additionalPillows?.required === "Yes" || configuration.additionalPillows?.required === true) {
        const pillowType = configuration.additionalPillows?.type || "Simple pillow";
        const pillowSize = configuration.additionalPillows?.size || "18 in X 18 in";
        const pillowQuantity = configuration.additionalPillows?.quantity || 1;

        let pillowFabricMeters = 0.6; // Default fallback

        try {
          const { data: pillowSizeOption } = await supabase
            .from("dropdown_options")
            .select("metadata")
            .eq("category", "sofabed")
            .eq("field_name", "pillow_size")
            .eq("option_value", pillowSize)
            .eq("is_active", true)
            .single();

          if (pillowSizeOption?.metadata) {
            const metadata = parseOptionMetadata(pillowSizeOption.metadata);
            const fabricMatrix = metadata.fabric_matrix || {};
            const matchingFabric =
              fabricMatrix[pillowType] ||
              fabricMatrix[pillowType.toLowerCase()] ||
              Object.entries(fabricMatrix).find(([key]) => key.toLowerCase() === pillowType.toLowerCase())?.[1];
            pillowFabricMeters = Number(matchingFabric) || pillowFabricMeters;
          }
        } catch (error) {
          console.warn("Error fetching pillow fabric metadata; using fallback", error);
        }

        totalMeters += pillowQuantity * pillowFabricMeters;
      }

      // Pillow fabric - Get from pillow_size metadata (fabric_matrix)
      if (configuration.additionalPillows?.required === "Yes" || configuration.additionalPillows?.required === true) {
        const pillowType = configuration.additionalPillows?.type || "Simple pillow";
        const pillowSize = configuration.additionalPillows?.size || "18 in X 18 in";
        const pillowQuantity = configuration.additionalPillows?.quantity || 1;

        let pillowFabricMeters = 0.6; // Default fallback

        try {
          const { data: pillowSizeOption } = await supabase
            .from("dropdown_options")
            .select("metadata")
            .eq("category", "recliner")
            .eq("field_name", "pillow_size")
            .eq("option_value", pillowSize)
            .eq("is_active", true)
            .single();

          if (pillowSizeOption?.metadata) {
            const metadata = parseOptionMetadata(pillowSizeOption.metadata);
            const fabricMatrix = metadata.fabric_matrix || {};
            const matchingFabric =
              fabricMatrix[pillowType] ||
              fabricMatrix[pillowType.toLowerCase()] ||
              Object.entries(fabricMatrix).find(([key]) => key.toLowerCase() === pillowType.toLowerCase())?.[1];
            pillowFabricMeters = Number(matchingFabric) || pillowFabricMeters;
          }
        } catch (error) {
          console.warn("Error fetching pillow fabric metadata; using fallback", error);
        }

        totalMeters += pillowQuantity * pillowFabricMeters;
      }

      break;
    }
  }

  return totalMeters;
};



/**
 * Calculate dynamic price based on configuration
 * Returns detailed breakdown for pricing summary display
 */
export const calculateDynamicPrice = async (
  category: string,
  productId: string,
  configuration: Configuration
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
      fabricMeters: 0,
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
    } else if (category === "bed" || category === "kids_bed") {
      // Bed category: prioritize net_price_rs (base product cost ~46k)
      // Do NOT use bom_rs as it's for BOM calculations, not base price
      basePrice = productData.net_price_rs ||
        productData.net_price ||
        productData.strike_price_rs ||
        productData.adjusted_bom_rs ||
        productData.bom_rs || 0;
    } else if (category === "database_pouffes") {
      // Pouffes uses net_price (not net_price_rs) as primary column
      basePrice = productData.net_price ||
        productData.net_price_rs ||
        productData.strike_price_rs ||
        productData.adjusted_bom_rs ||
        productData.bom_rs || 0;
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
        return await calculateDiningChairPricing(configuration, productData, formulas, settings, basePrice);
      case "arm_chairs":
        return await calculateArmChairPricing(configuration, productData, formulas, settings, basePrice);
      case "database_pouffes":
        return await calculatePouffePricing(configuration, productData, formulas, settings, basePrice);
      case "benches":
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
    fabricMeters: 0,
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

  // Lounger pricing - Database-driven from dropdown_options metadata
  if (configuration.lounger?.required) {
    const loungerSize = configuration.lounger?.size || "";
    const quantity = configuration.lounger?.quantity || 1;

    // Fetch lounger size metadata from database
    const loungerMetadata = await getLoungerSizeMetadata("sofa", loungerSize);

    // Use price multiplier from metadata, or fallback to formula-based calculation
    let loungerPercent = 100; // Default fallback

    if (loungerMetadata.priceMultiplier !== undefined) {
      // Use price multiplier directly (e.g., 1.0 = 100%, 1.1 = 110%, etc.)
      loungerPercent = loungerMetadata.priceMultiplier * 100;
    } else {
      // Fallback: Try to get from formulas or use pattern matching
      const loungerFormulaKey = loungerSize.toLowerCase().replace(/[^a-z0-9]/g, "_");
      loungerPercent = getFormulaValue(formulas, `lounger_${loungerFormulaKey}_percent`, 100);

      // If still no match, try pattern matching as last resort
      if (loungerPercent === 100) {
        if (loungerSize.includes("7 ft") || loungerSize.includes("7'")) {
          loungerPercent = getFormulaValue(formulas, "lounger_7ft_percent", 130);
        } else if (loungerSize.includes("6'6") || loungerSize.includes("6 ft 6 in")) {
          loungerPercent = getFormulaValue(formulas, "lounger_6ft6in_percent", 120);
        } else if (loungerSize.includes("6 ft") || loungerSize.includes("6'")) {
          loungerPercent = getFormulaValue(formulas, "lounger_6ft_percent", 110);
        } else if (loungerSize.includes("5'6") || loungerSize.includes("5 ft 6 in")) {
          loungerPercent = getFormulaValue(formulas, "lounger_5ft6in_percent", 100);
        } else if (loungerSize.includes("5 ft") || loungerSize.includes("5'")) {
          loungerPercent = getFormulaValue(formulas, "lounger_5ft_percent", 100);
        }
      }
    }

    // Calculate lounger price as percentage of base price
    let loungerPrice = (basePrice * loungerPercent) / 100;

    // Storage option - fetch from formulas
    if (configuration.lounger?.storage === "Yes") {
      loungerPrice += getFormulaValue(formulas, "lounger_storage", 3000);
    }

    breakdown.loungerPrice = loungerPrice * quantity;
    totalPrice += breakdown.loungerPrice;
  }

  // Console pricing - Fixed price per console based on size + accessory prices
  // Only charge for ACTIVE consoles (where position !== "none")
  if (configuration.console?.required) {
    const consoleSize = configuration.console?.size || "";

    // Base console price (per console)
    let baseConsolePrice = 0;
    if (consoleSize.includes("6") || consoleSize === "6 in" || consoleSize === "Console-6 in") {
      baseConsolePrice = getFormulaValue(formulas, "console_6_inch", 8000);
    } else if (consoleSize.includes("10") || consoleSize === "10 in" || consoleSize === "Console-10 in") {
      baseConsolePrice = getFormulaValue(formulas, "console_10_inch", 12000);
    }

    // Count only ACTIVE console placements (not "none")
    // Match the same logic used in Active Consoles Summary
    const activePlacements = (configuration.console?.placements || []).filter(
      (p: any) => p && p.position && p.position !== null && p.section !== null && p.position !== "none"
    );
    const activeConsoleCount = activePlacements.length;

    // Calculate console accessories prices from ACTIVE placements only
    let consoleAccessoriesTotal = 0;
    if (activePlacements.length > 0) {
      const accessoryIds = Array.from(
        new Set(
          activePlacements
            .map((placement: any) => placement.accessoryId)
            .filter((id: any) => id && id !== "none")
            .map((id: any) => id.toString())
        )
      );

      if (accessoryIds.length > 0) {
        const { data: accessories } = await supabase
          .from("accessories_prices")
          .select("id, sale_price")
          .in("id", accessoryIds as string[])
          .eq("is_active", true);

        if (accessories && accessories.length > 0) {
          // Sum all accessory prices from active console placements only
          consoleAccessoriesTotal = accessories.reduce((sum: number, acc: any) => {
            return sum + (Number(acc.sale_price) || 0);
          }, 0);
        }
      }
    }

    // Total console price = (base console price × ACTIVE console count) + (sum of all accessories from active consoles)
    breakdown.consolePrice = (baseConsolePrice * activeConsoleCount) + consoleAccessoriesTotal;
    totalPrice += breakdown.consolePrice;

    if (import.meta.env.DEV) {
      console.log(`🛋️ Sofa Console Pricing: Active Consoles=${activeConsoleCount}, Base=₹${baseConsolePrice} × ${activeConsoleCount} = ₹${baseConsolePrice * activeConsoleCount}, Accessories=₹${consoleAccessoriesTotal}, Total=₹${breakdown.consolePrice}`);
    }
  }

  // Pillows pricing - Size and type-based pricing with quantity multiplier
  // Pricing is database-driven: fetch price from pillow_size metadata (price_matrix)
  if (configuration.additionalPillows?.required) {
    const pillowType = configuration.additionalPillows?.type || "Simple pillow";
    const pillowSize = configuration.additionalPillows?.size || "18 in X 18 in";
    const quantity = configuration.additionalPillows?.quantity || 1;

    // Get pillow price from pillow_size metadata (price_matrix)
    let pillowPrice = 1200; // Default fallback

    try {
      const { data: pillowSizeOption } = await supabase
        .from("dropdown_options")
        .select("metadata")
        .eq("category", "sofa")
        .eq("field_name", "pillow_size")
        .eq("option_value", pillowSize)
        .eq("is_active", true)
        .single();

      if (pillowSizeOption?.metadata) {
        const metadata = parseOptionMetadata(pillowSizeOption.metadata);
        const priceMatrix = metadata.price_matrix || {};

        pillowPrice =
          priceMatrix[pillowType] ||
          priceMatrix[pillowType.toLowerCase()] ||
          Object.entries(priceMatrix).find(([key]) => key.toLowerCase() === pillowType.toLowerCase())?.[1] ||
          1200;
      }
    } catch (error) {
      // Fallback to formula-based pricing
      console.warn("Error fetching pillow size from database, using formula fallback:", error);
      pillowPrice = getFormulaValue(formulas, "pillow_simple_price", 1200);
    }

    // Price per pillow, multiplied by quantity
    breakdown.pillowsPrice = pillowPrice * quantity;
    totalPrice += breakdown.pillowsPrice;
  }

  // Fabric charges (single or multi colour)
  const fabricMeters = await calculateFabricMeters("sofa", configuration, settings, productData);
  const fabricConfig = configuration.fabric || {};
  const claddingPlan = fabricConfig.claddingPlan || "Single Colour";
  const baseFabricPrice = Number(getSettingValue(settings, "sofa_base_fabric_price_rs", 800)) || 800;
  const fabricCodes = [
    fabricConfig.structureCode,
    fabricConfig.backrestCode,
    fabricConfig.seatCode,
    fabricConfig.headrestCode,
  ].filter((code): code is string => typeof code === "string" && code.length > 0);

  const fetchFabricPrice = async (code?: string) => {
    if (!code) return baseFabricPrice;
    const price = await getFabricPrice(code);
    return Number.isFinite(price) && price ? price : baseFabricPrice;
  };

  const normalizePercent = (value: any, fallback: number) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return num > 1 ? num / 100 : num;
  };

  let fabricUpgradeCharge = 0;
  let totalFabricMetersForSummary = fabricMeters;

  if (claddingPlan === "Multi Colour") {
    const structurePercent = normalizePercent(
      getSettingValue(settings, "sofa_multi_structure_percent", 0.70),
      0.70
    );
    const backrestPercent = normalizePercent(
      getSettingValue(settings, "sofa_multi_backrest_percent", 0.12),
      0.12
    );
    const seatPercent = normalizePercent(
      getSettingValue(settings, "sofa_multi_seat_percent", 0.21),
      0.21
    );
    const headrestPercent = normalizePercent(
      getSettingValue(settings, "sofa_multi_headrest_percent", 0.12),
      0.12
    );
    const extraPercent = normalizePercent(
      getSettingValue(settings, "sofa_multi_extra_percent", 0.15),
      0.15
    );

    const structureMeters = fabricMeters * structurePercent;
    const backrestMeters = fabricMeters * backrestPercent;
    const seatMeters = fabricMeters * seatPercent;
    const headrestMeters = fabricMeters * headrestPercent;
    const extraMeters = fabricMeters * extraPercent;

    const [structurePrice, backrestPrice, seatPrice, headrestPrice] = await Promise.all([
      fetchFabricPrice(fabricConfig.structureCode),
      fetchFabricPrice(fabricConfig.backrestCode),
      fetchFabricPrice(fabricConfig.seatCode),
      fetchFabricPrice(fabricConfig.headrestCode),
    ]);

    const diff = (price: number) => Math.max(0, price - baseFabricPrice);

    const structureUpgrade = diff(structurePrice) * structureMeters;
    const backrestUpgrade = diff(backrestPrice) * backrestMeters;
    const seatUpgrade = diff(seatPrice) * seatMeters;
    const headrestUpgrade = diff(headrestPrice) * headrestMeters;
    const extraCharge = extraMeters * baseFabricPrice;

    fabricUpgradeCharge =
      structureUpgrade +
      backrestUpgrade +
      seatUpgrade +
      headrestUpgrade +
      extraCharge;

    totalFabricMetersForSummary =
      structureMeters +
      backrestMeters +
      seatMeters +
      headrestMeters +
      extraMeters;
  } else {
    const singleFabricCode =
      fabricConfig.structureCode ||
      fabricConfig.singleColour?.fabricCode ||
      fabricCodes?.[0];

    if (fabricMeters > 0) {
      const price = await fetchFabricPrice(singleFabricCode);
      fabricUpgradeCharge = Math.max(0, price - baseFabricPrice) * fabricMeters;
    }
  }

  breakdown.fabricCharges = fabricUpgradeCharge;
  totalPrice += breakdown.fabricCharges;
  breakdown.fabricMeters = totalFabricMetersForSummary;

  breakdown.fabricMeters = fabricMeters;

  breakdown.fabricMeters = fabricMeters;

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
        const metadata = parseOptionMetadata(armrestOption.metadata) as Record<string, any>;
        const armrestPrice = Number(metadata.price_rs || metadata.price || metadata.priceRs || 0);
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
        const metadata = parseOptionMetadata(stitchOption.metadata) as Record<string, any>;
        const stitchPrice = Number(metadata.price_rs || metadata.price || metadata.priceRs || 0);
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
    basePrice: 0,
    baseSeatPrice: 0,
    additionalSeatsPrice: 0,
    cornerSeatsPrice: 0,
    backrestSeatsPrice: 0,
    loungerPrice: 0,
    consolePrice: 0,
    pillowsPrice: 0,
    fabricCharges: 0,
    fabricMeters: 0,
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

  // 1. Get bed size and dimensions
  const bedSize = configuration.bedSize || "Double";
  const width = configuration.dimensions?.width || 54;
  const length = configuration.dimensions?.length || 78;

  // 2. Fetch default dimensions from DB metadata
  let defaultDimensions = { width: 54, length: 75 }; // Fallback
  try {
    const { data: bedSizeOption } = await supabase
      .from("dropdown_options")
      .select("metadata")
      .eq("category", "bed")
      .eq("field_name", "bed_size")
      .eq("option_value", bedSize)
      .eq("is_active", true)
      .single();

    if (bedSizeOption?.metadata) {
      const metadata = parseOptionMetadata(bedSizeOption.metadata);
      defaultDimensions = {
        width: metadata.width_inches || defaultDimensions.width,
        length: metadata.length_inches || defaultDimensions.length,
      };
    } else {
      // Fallback to hardcoded defaults
      const fallbackDimensions: Record<string, { width: number; length: number }> = {
        Single: { width: 36, length: 72 },
        Double: { width: 54, length: 75 },
        Queen: { width: 60, length: 78 },
        King: { width: 72, length: 80 }, // Fixed: 80 not 78
      };
      defaultDimensions = fallbackDimensions[bedSize] || fallbackDimensions.Double;
    }
  } catch (error) {
    console.warn("Error fetching bed size metadata, using fallback:", error);
    const fallbackDimensions: Record<string, { width: number; length: number }> = {
      Single: { width: 36, length: 72 },
      Double: { width: 54, length: 75 },
      Queen: { width: 60, length: 78 },
      King: { width: 72, length: 80 },
    };
    defaultDimensions = fallbackDimensions[bedSize] || fallbackDimensions.Double;
  }

  // 3. Calculate area ratio
  const areaRatio = (width * length) / (defaultDimensions.width * defaultDimensions.length);

  // 4. Get base price (use net_price_single_no_storage_rs as reference)
  const baseSinglePrice = productData.net_price_single_no_storage_rs || basePrice;

  // 5. Adjust base price by area ratio (not by size multipliers)
  breakdown.basePrice = baseSinglePrice * areaRatio;
  let totalPrice = breakdown.basePrice;

  // 6. Storage pricing and fabric
  if (configuration.storage === "Yes" || configuration.storage === true) {
    const storageType = configuration.storageType || "Hydraulic";

    try {
      const { data: storageOption } = await supabase
        .from("dropdown_options")
        .select("metadata")
        .eq("category", "bed")
        .eq("field_name", "storage_type")
        .eq("option_value", storageType)
        .eq("is_active", true)
        .single();

      if (storageOption?.metadata) {
        const metadata = parseOptionMetadata(storageOption.metadata);
        const storagePrice = Number(metadata.price_adjustment || metadata.price_rs || 0);
        breakdown.storagePrice = storagePrice;
        totalPrice += breakdown.storagePrice;

        // Add storage fabric if available
        const storageFabric = Number(metadata.fabric_mtrs || metadata.fabric || 0);
        if (storageFabric > 0) {
          breakdown.fabricMeters = (breakdown.fabricMeters || 0) + storageFabric;
        }
      } else {
        // Fallback pricing
        const fallbackPrices: Record<string, number> = {
          Hydraulic: 2000,
          Box: 1500,
          Drawer: 2500,
        };
        breakdown.storagePrice = fallbackPrices[storageType] || 2000;
        totalPrice += breakdown.storagePrice;
      }
    } catch (error) {
      console.warn("Error fetching storage metadata:", error);
      breakdown.storagePrice = 2000; // Fallback
      totalPrice += breakdown.storagePrice;
    }
  }

  // 7. Fabric calculation with area ratio
  const fabricMeters = await calculateFabricMeters("bed", configuration, settings, productData);
  breakdown.fabricMeters = (breakdown.fabricMeters || 0) + fabricMeters;

  // Get base fabric price for upgrade calculation
  const baseFabricPrice = getSettingValue(settings, "base_fabric_price_per_meter", 1000);

  // 8. Fabric cost calculation
  // For beds: Full fabric cost = meterage × price per meter (not upgrade charges)
  if (configuration.fabric?.claddingPlan === "Multi Colour") {
    // Multi-colour plan breakdown (60% Structure, 40% Headrest)
    const structureMeters = fabricMeters * 0.60;
    const headrestMeters = fabricMeters * 0.40;

    const structureCode = configuration.fabric?.structureCode;
    const headrestCode = configuration.fabric?.headrestCode || configuration.fabric?.headboardCode; // Support both field names

    if (structureCode && headrestCode) {
      const structurePrice = await getFabricPrice(structureCode);
      const headrestPrice = await getFabricPrice(headrestCode);

      // Full fabric cost = meterage × price per meter
      const structureCost = structureMeters * structurePrice;
      const headrestCost = headrestMeters * headrestPrice;

      breakdown.fabricCharges = structureCost + headrestCost;
      totalPrice += breakdown.fabricCharges;
    }
  } else if (configuration.fabric?.claddingPlan === "Dual Colour") {
    // Dual colour: structure and headrest (60% structure, 40% headrest)
    const structureMeters = fabricMeters * 0.60;
    const headrestMeters = fabricMeters * 0.40;

    const structureCode = configuration.fabric?.structureCode;
    const headrestCode = configuration.fabric?.headrestCode || configuration.fabric?.headboardCode;

    if (structureCode && headrestCode) {
      const structurePrice = await getFabricPrice(structureCode);
      const headrestPrice = await getFabricPrice(headrestCode);

      // Full fabric cost = meterage × price per meter
      const structureCost = structureMeters * structurePrice;
      const headrestCost = headrestMeters * headrestPrice;

      breakdown.fabricCharges = structureCost + headrestCost;
      totalPrice += breakdown.fabricCharges;
    }
  } else {
    // Single color: use structure fabric
    const fabricCode = configuration.fabric?.structureCode;
    if (fabricCode) {
      const fabricPricePerMeter = await getFabricPrice(fabricCode);
      // Full fabric cost = meterage × price per meter
      breakdown.fabricCharges = fabricMeters * fabricPricePerMeter;
      totalPrice += breakdown.fabricCharges;
    }
  }

  // 9. Legs pricing
  if (configuration.legsCode || configuration.legType) {
    const legCode = configuration.legsCode || configuration.legType;
    const { data: leg } = await supabase
      .from("legs_prices")
      .select("price_per_unit")
      .eq("description", legCode)
      .eq("is_active", true)
      .single();

    if (leg?.price_per_unit) {
      breakdown.accessoriesPrice = leg.price_per_unit;
      totalPrice += breakdown.accessoriesPrice;
    }
  }

  // 10. Apply wastage/delivery/GST (if available in productData)
  const wastagePercent = productData.wastage_delivery_gst_percent || 0;
  if (wastagePercent > 0) {
    const wastageAmount = totalPrice * (wastagePercent / 100);
    totalPrice += wastageAmount;
  }

  // 11. Apply markup (if available in productData)
  const markupPercent = productData.markup_percent || 0;
  if (markupPercent > 0) {
    const markupAmount = totalPrice * (markupPercent / 100);
    totalPrice += markupAmount;
  }

  breakdown.subtotal = totalPrice;

  // 12. Apply discount
  if (configuration.discount?.code) {
    const discountPercent = productData.discount_percent || getFormulaValue(formulas, `discount_${configuration.discount.code.toLowerCase()}`, 0);
    breakdown.discountAmount = totalPrice * (discountPercent / 100);
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
    fabricMeters: 0,
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

  const getSeatCount = (type: string): number => {
    if (!type) return 0;
    if (type.toLowerCase().includes("corner")) return 0;
    if (type.toLowerCase().includes("backrest")) return 0;
    const match = type.match(/(\d+)-Seater/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const shapeRaw = configuration.baseShape || configuration.basic_recliner?.shape || "";
  const normalizedShape = typeof shapeRaw === "string" && shapeRaw.toUpperCase().includes("L")
    ? "L SHAPE"
    : "STANDARD";

  const sanitizeSection = (value: any): { type: string; qty: number } | null => {
    if (!value) return null;
    if (typeof value === "string") {
      if (!value || value === "none") return null;
      return { type: value, qty: 1 };
    }
    const type = value.type || value.option_value || value.section_type || value.section || value.name;
    if (!type || type === "none") return null;
    const qty = Number(value.qty ?? value.quantity ?? value.count ?? 1) || 1;
    return { type, qty };
  };

  const sectionsSource =
    configuration.sections ||
    configuration.basic_recliner?.sections ||
    configuration.base_sofa?.sections ||
    {};

  const sections = {
    F: sanitizeSection(
      sectionsSource.F ??
      sectionsSource.front ??
      configuration.sections?.front ??
      configuration.basic_recliner?.sections?.front
    ),
    L1:
      normalizedShape === "L SHAPE"
        ? sanitizeSection(
          sectionsSource.L1 ??
          sectionsSource.left_l1 ??
          configuration.sections?.L1 ??
          configuration.sections?.left_l1 ??
          configuration.basic_recliner?.sections?.left_l1
        )
        : null,
    L2:
      normalizedShape === "L SHAPE"
        ? sanitizeSection(
          sectionsSource.L2 ??
          sectionsSource.left_l2 ??
          configuration.sections?.L2 ??
          configuration.sections?.left_l2 ??
          configuration.basic_recliner?.sections?.left_l2
        )
        : null,
  };

  const productMetadata = (productData && productData.metadata) || {};
  let baseSeatPrice = getFormulaValue(formulas, "recliner_base_seat_price", basePrice);
  if (!baseSeatPrice || baseSeatPrice <= 0) {
    baseSeatPrice =
      basePrice ||
      productData.net_price_rs ||
      productData.net_price ||
      Number(productMetadata.recliner_base_per_seat) ||
      Number(productMetadata.base_price_per_seat) ||
      14000;
  }

  const percentage = {
    firstSeat: (getFormulaValue(formulas, "recliner_first_seat_percentage", 100) || 100) / 100,
    additionalSeat:
      (getFormulaValue(formulas, "recliner_additional_seat_percentage", 70) || 70) / 100,
    corner: (getFormulaValue(formulas, "recliner_corner_seat_percentage", 50) || 50) / 100,
    backrest: (getFormulaValue(formulas, "recliner_backrest_percentage", 20) || 20) / 100,
    dummy: (getFormulaValue(formulas, "recliner_dummy_seat_percentage", 55) || 55) / 100,
  };

  let totalPrice = 0;
  let firstSeatConsumed = false;

  const applyCornerOrBackrestPricing = (section: { type: string; qty: number } | null) => {
    if (!section) return;
    const qty = section.qty ?? 1;
    const lower = section.type.toLowerCase();
    if (lower.includes("corner")) {
      const amount = baseSeatPrice * percentage.corner * qty;
      breakdown.cornerSeatsPrice += amount;
      totalPrice += amount;
      return;
    }
    if (lower.includes("backrest")) {
      const amount = baseSeatPrice * percentage.backrest * qty;
      breakdown.backrestSeatsPrice += amount;
      totalPrice += amount;
    }
  };

  const applyRegularSectionPricing = (
    section: { type: string; qty: number } | null,
    resetFirstSeat: boolean
  ) => {
    if (!section) return;
    const lower = section.type.toLowerCase();
    if (lower.includes("corner") || lower.includes("backrest")) {
      applyCornerOrBackrestPricing(section);
      return;
    }

    if (resetFirstSeat) {
      firstSeatConsumed = false;
    }

    const qty = section.qty ?? 1;
    for (let moduleIndex = 0; moduleIndex < qty; moduleIndex += 1) {
      let seatCount = getSeatCount(section.type);
      if (seatCount <= 0) continue;

      if (!firstSeatConsumed && percentage.firstSeat > 0) {
        const firstSeatAmount = baseSeatPrice * percentage.firstSeat;
        breakdown.baseSeatPrice += firstSeatAmount;
        totalPrice += firstSeatAmount;
        firstSeatConsumed = true;
        seatCount -= 1;
      }

      if (seatCount > 0 && percentage.additionalSeat > 0) {
        const additionalAmount = baseSeatPrice * percentage.additionalSeat * seatCount;
        breakdown.additionalSeatsPrice += additionalAmount;
        totalPrice += additionalAmount;
      }
    }
  };

  applyRegularSectionPricing(sections.F, false);
  applyCornerOrBackrestPricing(sections.L1);
  applyRegularSectionPricing(sections.L2, true);

  const frontSeatCapacity =
    sections.F ? getSeatCount(sections.F.type) * (sections.F.qty ?? 1) : 0;
  const leftSeatCapacity =
    sections.L2 && normalizedShape === "L SHAPE"
      ? getSeatCount(sections.L2.type) * (sections.L2.qty ?? 1)
      : 0;

  const dummySeatsConfig = configuration.dummySeats || configuration.dummy_seats || {};
  const dummySeatsRequired = dummySeatsConfig.required === true || dummySeatsConfig.required === "Yes";

  if (dummySeatsRequired) {
    const quantityPerSection = dummySeatsConfig.quantity_per_section || {};
    const plannedFront = Math.min(quantityPerSection.front || 0, frontSeatCapacity);
    const plannedLeft = Math.min(quantityPerSection.left || 0, leftSeatCapacity);

    const placements = Array.isArray(dummySeatsConfig.placements) ? dummySeatsConfig.placements : [];
    const activeFrontSeats = placements.filter(
      (placement: any) =>
        placement?.section === "F" && placement.position && placement.position !== "none"
    ).length;
    const activeLeftSeats = placements.filter(
      (placement: any) =>
        placement?.section === "L" && placement.position && placement.position !== "none"
    ).length;

    const totalDummySeats =
      Math.min(plannedFront, activeFrontSeats || plannedFront) +
      Math.min(plannedLeft, activeLeftSeats || plannedLeft);

    if (totalDummySeats > 0 && percentage.dummy > 0) {
      const dummySeatPrice = baseSeatPrice * percentage.dummy;
      const dummySeatsTotal = dummySeatPrice * totalDummySeats;
      breakdown.additionalSeatsPrice += dummySeatsTotal;
      totalPrice += dummySeatsTotal;

      if (import.meta.env.DEV) {
        console.log(
          `📊 Dummy Seats: ${totalDummySeats} × ₹${dummySeatPrice.toFixed(
            2
          )} = ₹${dummySeatsTotal.toFixed(2)}`
        );
      }
    }
  }

  const mechanismFormulaKeys: Record<string, string> = {
    Manual: "recliner_mechanism_manual",
    "Manual-RRR": "recliner_mechanism_manual_rrr",
    Electrical: "recliner_mechanism_electrical",
    Electric: "recliner_mechanism_electrical",
    "Electrical-RRR": "recliner_mechanism_electrical_rrr",
    "Electric-RRR": "recliner_mechanism_electrical_rrr",
    "Only Sofa": "recliner_mechanism_only_sofa",
  };

  const mechanismSections = configuration.mechanism?.sections || configuration.mechanism || {};
  const frontMechanism = mechanismSections.front || mechanismSections.F || "Manual";
  const leftMechanism = mechanismSections.left || mechanismSections.L || "Manual";

  const resolveMechanismPrice = (mechanismType: string) => {
    const key = mechanismFormulaKeys[mechanismType] || mechanismFormulaKeys[mechanismType?.trim()];
    if (!key) return 0;
    return getFormulaValue(formulas, key, 0);
  };

  const isLShape = normalizedShape === "L SHAPE";
  const frontMechanismPrice = resolveMechanismPrice(frontMechanism);
  const leftMechanismPrice = isLShape ? resolveMechanismPrice(leftMechanism) : 0;

  breakdown.mechanismUpgrade = frontMechanismPrice + leftMechanismPrice;
  totalPrice += breakdown.mechanismUpgrade;

  if (import.meta.env.DEV) {
    console.log(
      `⚙️ Mechanism Pricing: Front=${frontMechanism} (₹${frontMechanismPrice}), Left=${isLShape ? leftMechanism || "N/A" : "N/A"
      } (₹${leftMechanismPrice}), Total=₹${breakdown.mechanismUpgrade}`
    );
  }

  if (configuration.console?.required === "Yes" || configuration.console?.required === true) {
    const consoleSize = configuration.console?.size || "";
    const placements = Array.isArray(configuration.console?.placements)
      ? configuration.console.placements
      : [];

    let baseConsolePrice = 0;
    if (consoleSize.includes("6")) {
      baseConsolePrice = getFormulaValue(formulas, "console_6_inch", 8000);
    } else if (consoleSize.includes("10")) {
      baseConsolePrice = getFormulaValue(formulas, "console_10_inch", 12000);
    }

    const seenPlacements = new Set<string>();
    const activePlacements = placements.filter((placement: any) => {
      if (!placement || !placement.position || placement.position === "none") return false;
      const section = (placement.section || "").toString().toLowerCase();
      if (!["f", "front", "l", "left"].includes(section)) return false;
      const afterSeat =
        placement.afterSeat ??
        Number(placement.position?.split("_")[1] || 0) ??
        0;
      const key = `${section}_${afterSeat}`;
      if (seenPlacements.has(key)) return false;
      seenPlacements.add(key);
      return true;
    });

    const activeConsoleCount = activePlacements.length;

    const accessoryIds: string[] = Array.from(
      new Set(
        activePlacements
          .map((placement: any) => placement.accessoryId)
          .filter((id: unknown): id is string | number => id !== null && id !== undefined && id !== "none")
          .map((id) => id.toString())
      )
    );

    let consoleAccessoriesTotal = 0;
    if (accessoryIds.length > 0) {
      try {
        const { data: accessories } = await supabase
          .from("accessories_prices")
          .select("id, sale_price")
          .in("id", accessoryIds as string[])
          .eq("is_active", true);

        if (accessories && accessories.length > 0) {
          consoleAccessoriesTotal = accessories.reduce((sum: number, accessory: any) => {
            return sum + (Number(accessory.sale_price) || 0);
          }, 0);
        }
      } catch (error) {
        console.warn("Error fetching console accessory prices:", error);
      }
    }

    breakdown.consolePrice = baseConsolePrice * activeConsoleCount + consoleAccessoriesTotal;
    totalPrice += breakdown.consolePrice;

    if (import.meta.env.DEV) {
      console.log(
        `🪑 Recliner Console Pricing: Active=${activeConsoleCount}, Base=₹${baseConsolePrice * activeConsoleCount
        }, Accessories=₹${consoleAccessoriesTotal}, Total=₹${breakdown.consolePrice}`
      );
    }
  }

  // Pillows pricing - Size and type-based pricing
  if (configuration.additionalPillows?.required === "Yes" || configuration.additionalPillows?.required === true) {
    const pillowType = configuration.additionalPillows?.type || "Simple pillow";
    const pillowSize = configuration.additionalPillows?.size || "18 in X 18 in";
    const quantity = configuration.additionalPillows?.quantity || 1;

    // Get pillow price from pillow_size metadata (price_matrix)
    let pillowPrice = 1200; // Default fallback

    try {
      const { data: pillowSizeOption } = await supabase
        .from("dropdown_options")
        .select("metadata, option_value")
        .eq("category", "recliner")
        .eq("field_name", "pillow_size")
        .eq("option_value", pillowSize)
        .eq("is_active", true)
        .single();

      if (pillowSizeOption && pillowSizeOption.metadata) {
        const metadata = parseOptionMetadata(pillowSizeOption.metadata);
        const priceMatrix = metadata.price_matrix || {};
        pillowPrice =
          priceMatrix[pillowType] ||
          priceMatrix[pillowType.toLowerCase()] ||
          Object.entries(priceMatrix).find(([key]) => key.toLowerCase() === pillowType.toLowerCase())?.[1] ||
          1200;
      }
    } catch (error) {
      console.warn("Error fetching pillow size from database, using formula fallback:", error);
      pillowPrice = getFormulaValue(formulas, "pillow_simple_price", 1200);
    }

    breakdown.pillowsPrice = pillowPrice * quantity;
    totalPrice += breakdown.pillowsPrice;
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
  const depthUpgradePercentDefaults: Record<number, number> = {
    22: 0,
    24: 0,
    26: 0.03, // 3%
    28: 0.06, // 6%
  };

  const depthPercentDefault = depthUpgradePercentDefaults[seatDepth] ?? 0;
  const depthPercentRaw = getFormulaValue(
    formulas,
    `recliner_seat_depth_${seatDepth}_percent`,
    depthPercentDefault * 100
  );
  const depthUpgradePercentValue = (depthPercentRaw || 0) / 100;
  const depthUpgrade = baseTotal * depthUpgradePercentValue;

  // Seat Width Upgrade
  // 22" = 0%, 24" = 0%, 26" = 6.5%, 28" = 13%
  const seatWidth = configuration.dimensions?.seatWidth || 22;
  const widthUpgradePercentDefaults: Record<number, number> = {
    22: 0,
    24: 0,
    26: 0.065, // 6.5%
    28: 0.13,  // 13%
  };

  const widthPercentDefault = widthUpgradePercentDefaults[seatWidth] ?? 0;
  const widthPercentRaw = getFormulaValue(
    formulas,
    `recliner_seat_width_${seatWidth}_percent`,
    widthPercentDefault * 100
  );
  const widthUpgradePercentValue = (widthPercentRaw || 0) / 100;
  const widthUpgrade = baseTotal * widthUpgradePercentValue;

  // Total dimension upgrade (applied to base total, before fabric)
  breakdown.dimensionUpgrade = depthUpgrade + widthUpgrade;
  totalPrice += breakdown.dimensionUpgrade;

  // Fabric charges (applied after dimension upgrades)
  const fabricMeters = await calculateFabricMeters("recliner", configuration, settings, productData);
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
    fabricMeters: 0,
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

  const parseDimension = (value: unknown, fallback: number): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const match = value.match(/(\d+(\.\d+)?)/);
      if (match) {
        return Number(match[1]);
      }
    }
    return fallback;
  };

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
  // Only charge for ACTIVE consoles (where placement !== "none" and !== null)
  if (configuration.console?.required === "Yes" || configuration.console?.required === true) {
    const consoleSize = configuration.console?.size || "";
    const placements = configuration.console?.placements || [];

    // Base console price (per console)
    let baseConsolePrice = 0;
    if (consoleSize.includes("6") || consoleSize === "6 in" || consoleSize === "Console-6 in") {
      baseConsolePrice = getFormulaValue(formulas, "console_6_inch", 8000);
    } else if (consoleSize.includes("10") || consoleSize === "10 in" || consoleSize === "Console-10 In") {
      baseConsolePrice = getFormulaValue(formulas, "console_10_inch", 12000);
    }

    // Count only ACTIVE console placements (not "none" or null)
    // For Cinema Chairs, placements are stored as strings (e.g., "after_1") or null/"none"
    const activePlacements = placements.filter((p: any) =>
      p && p !== null && p !== "none" && p !== undefined
    );
    const activeConsoleCount = activePlacements.length;

    // Calculate console accessories prices from ACTIVE consoles only
    // Cinema Chairs stores accessories in configuration.accessories.consoleAccessories array
    // Accessories are indexed by console slot, so we need to match them with active placements by index
    let consoleAccessoriesTotal = 0;
    if (configuration.accessories?.consoleAccessories && Array.isArray(configuration.accessories.consoleAccessories)) {
      // Collect accessory IDs only for active console placements (by index)
      const activeAccessoryIds: string[] = [];
      placements.forEach((placement: any, index: number) => {
        // If this placement is active, check if there's an accessory at this index
        if (placement && placement !== null && placement !== "none" && placement !== undefined) {
          const accessoryId = configuration.accessories.consoleAccessories[index];
          if (accessoryId && accessoryId !== null && accessoryId !== "none" && accessoryId !== undefined) {
            activeAccessoryIds.push(accessoryId.toString());
          }
        }
      });

      if (activeAccessoryIds.length > 0) {
        const { data: accessories } = await supabase
          .from("accessories_prices")
          .select("id, sale_price")
          .in("id", activeAccessoryIds as string[])
          .eq("is_active", true);

        if (accessories && accessories.length > 0) {
          consoleAccessoriesTotal = accessories.reduce((sum: number, acc: any) => {
            return sum + (Number(acc.sale_price) || 0);
          }, 0);
        }
      }
    }

    // Total console price = (base console price × ACTIVE console count) + sum of all accessories from active consoles
    breakdown.consolePrice = (baseConsolePrice * activeConsoleCount) + consoleAccessoriesTotal;
    totalPrice += breakdown.consolePrice;

    if (import.meta.env.DEV) {
      console.log(`🎬 Cinema Chairs Console Pricing: Active Consoles=${activeConsoleCount}, Base=₹${baseConsolePrice} × ${activeConsoleCount} = ₹${baseConsolePrice * activeConsoleCount}, Accessories=₹${consoleAccessoriesTotal}, Total=₹${breakdown.consolePrice}`);
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
  const seatWidth = parseDimension(configuration.dimensions?.seatWidth, 24);
  const seatDepth = parseDimension(configuration.dimensions?.seatDepth, 22);

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
  const fabricMeters = await calculateFabricMeters("cinema_chairs", configuration, settings, productData);
  const fabricCode = configuration.fabric?.structureCode || configuration.fabric?.claddingPlan;

  if (fabricCode) {
    const fabricPricePerMeter = await getFabricPrice(fabricCode);
    breakdown.fabricCharges = fabricMeters * fabricPricePerMeter;
    totalPrice += breakdown.fabricCharges;
  }

  // Fabric upgrade charges captured from configurator (difference between selected and base fabrics)
  const fabricUpgradeCharges = Number(configuration.fabric?.fabricUpgradeCharges || 0);
  if (fabricUpgradeCharges > 0) {
    breakdown.fabricCharges += fabricUpgradeCharges;
    totalPrice += fabricUpgradeCharges;
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
        .in("id", consoleAccessoryIds as string[])
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

async function calculateDiningChairPricing(
  configuration: any,
  productData: ProductData,
  formulas: PricingFormula[],
  settings: AdminSetting[],
  basePrice: number
): Promise<{ breakdown: PricingBreakdown; total: number }> {
  const breakdown: PricingBreakdown = {
    basePrice,
    baseSeatPrice: basePrice,
    additionalSeatsPrice: 0,
    cornerSeatsPrice: 0,
    backrestSeatsPrice: 0,
    loungerPrice: 0,
    consolePrice: 0,
    pillowsPrice: 0,
    fabricCharges: 0,
    fabricMeters: 0,
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

  const baseFabricMeters =
    Number(configuration.baseModel?.fabric) ||
    Number(productData.fabric_mtrs) ||
    Number(productData.metadata?.fabric_mtrs) ||
    getSettingValue(settings, "dining_base_fabric_mtrs", 3);

  const baseFabricPrice = getSettingValue(settings, "dining_base_fabric_price_rs", 800);
  const extraFabricMeters = Number(configuration.fabricPlan?.extraFabricMeters || 0);
  const totalFabricMeters = baseFabricMeters + extraFabricMeters;

  let fabricUpgrade = 0;
  const fabricPlan = configuration.fabricPlan || {};

  const getFabricPriceSafe = async (code?: string) => {
    if (!code) return baseFabricPrice;
    const price = await getFabricPrice(code);
    return price || baseFabricPrice;
  };

  if (fabricPlan.claddingPlan === "Dual Colour") {
    const frontCode = fabricPlan?.dualColour?.frontFabricCode;
    const backCode = fabricPlan?.dualColour?.backFabricCode;
    const split = totalFabricMeters * 0.5;

    if (frontCode) {
      const price = await getFabricPriceSafe(frontCode);
      fabricUpgrade += (price - baseFabricPrice) * split;
    }
    if (backCode) {
      const price = await getFabricPriceSafe(backCode);
      fabricUpgrade += (price - baseFabricPrice) * split;
    }
  } else if (fabricPlan.claddingPlan === "Single Colour") {
    const code = fabricPlan?.singleColour?.fabricCode;
    if (code) {
      const price = await getFabricPriceSafe(code);
      fabricUpgrade += (price - baseFabricPrice) * totalFabricMeters;
    }
  }

  const extraFabricCost = extraFabricMeters * baseFabricPrice;

  breakdown.fabricCharges = Math.max(0, fabricUpgrade) + extraFabricCost;
  breakdown.fabricMeters = totalFabricMeters;
  let totalPrice = basePrice + breakdown.fabricCharges;

  breakdown.subtotal = totalPrice;

  if (configuration.discount?.percentage) {
    const discountPercent = Number(configuration.discount.percentage);
    breakdown.discountAmount = totalPrice * discountPercent;
    totalPrice -= breakdown.discountAmount;
  } else if (configuration.discount?.discountCode) {
    const discountKey = `discount_${configuration.discount.discountCode.toLowerCase()}`;
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

async function calculateArmChairPricing(
  configuration: any,
  productData: ProductData,
  formulas: PricingFormula[],
  settings: AdminSetting[],
  basePrice: number
): Promise<{ breakdown: PricingBreakdown; total: number }> {
  const breakdown: PricingBreakdown = {
    basePrice,
    baseSeatPrice: basePrice,
    additionalSeatsPrice: 0,
    cornerSeatsPrice: 0,
    backrestSeatsPrice: 0,
    loungerPrice: 0,
    consolePrice: 0,
    pillowsPrice: 0,
    fabricCharges: 0,
    fabricMeters: 0,
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

  const fabricPlan = configuration.fabricPlan || {};
  const pillows = configuration.pillows || {};
  const dimensions = configuration.dimensions || {};

  const baseFabricMeters =
    Number(fabricPlan?.baseFabricMeters) ||
    Number(productData?.fabricsinglechairmtrs) ||
    Number(productData?.fabric_mtrs) ||
    getSettingValue(settings, "arm_chair_base_fabric_mtrs", 6.0);

  const baseFabricPrice = getSettingValue(settings, "arm_chair_base_fabric_price_rs", 800);
  const extraFabricMeters = Number(fabricPlan?.extraFabricMeters || 0);
  const singlePlanTotal = baseFabricMeters + extraFabricMeters;

  const fabricQuantities = (() => {
    if (fabricPlan?.claddingPlan === "Dual Colour") {
      return {
        structure: singlePlanTotal * 0.8,
        seat: singlePlanTotal * 0.4,
        total: singlePlanTotal * 1.2,
      };
    }
    return {
      total: singlePlanTotal,
    };
  })();

  const getFabricPriceSafe = async (code?: string) => {
    if (!code) return baseFabricPrice;
    const price = await getFabricPrice(code);
    return price || baseFabricPrice;
  };

  let fabricUpgradeCharges = 0;

  if (fabricPlan?.claddingPlan === "Dual Colour") {
    const structureCode = fabricPlan?.structureFabricCode;
    const seatCode = fabricPlan?.seatFabricCode;

    if (structureCode && fabricQuantities.structure) {
      const price = await getFabricPriceSafe(structureCode);
      fabricUpgradeCharges += (price - baseFabricPrice) * fabricQuantities.structure;
    }
    if (seatCode && fabricQuantities.seat) {
      const price = await getFabricPriceSafe(seatCode);
      fabricUpgradeCharges += (price - baseFabricPrice) * fabricQuantities.seat;
    }
  } else if (fabricPlan?.claddingPlan === "Single Colour") {
    const singleCode = fabricPlan?.singleFabricCode;
    if (singleCode) {
      const price = await getFabricPriceSafe(singleCode);
      fabricUpgradeCharges += (price - baseFabricPrice) * fabricQuantities.total;
    }
  }

  const extraFabricCost = extraFabricMeters * baseFabricPrice;
  breakdown.fabricCharges = Math.max(0, fabricUpgradeCharges) + extraFabricCost;
  const totalFabricUsage =
    fabricQuantities.total ??
    singlePlanTotal;
  breakdown.fabricMeters = totalFabricUsage;

  let pillowPrice = 0;
  if (pillows?.required === "Yes" && pillows?.quantity) {
    const pillowType = pillows?.type || "Simple pillow";
    const pillowSize = pillows?.size || "18 in X 18 in";
    const pillowQty = pillows?.quantity || 1;

    try {
      const { data: pillowSizeOption } = await supabase
        .from("dropdown_options")
        .select("metadata")
        .eq("category", "arm_chairs")
        .eq("field_name", "pillow_size")
        .eq("option_value", pillowSize)
        .eq("is_active", true)
        .single();

      if (pillowSizeOption?.metadata) {
        const metadata = parseOptionMetadata(pillowSizeOption.metadata);
        const fabricMatrix = metadata.fabric_matrix || {};
        const matchingFabric =
          fabricMatrix[pillowType] ||
          fabricMatrix[pillowType.toLowerCase()] ||
          Object.entries(fabricMatrix).find(([key]) => key.toLowerCase() === pillowType.toLowerCase())?.[1];

        pillowPrice = Number(matchingFabric) || 0;
      }
    } catch (error) {
      console.warn("Error fetching pillow price metadata; defaulting to 0", error);
      pillowPrice = 0;
    }

    breakdown.pillowsPrice = pillowPrice * pillowQty;
  }

  const FOAM_PRICES: Record<string, number> = {
    "Firm": 0,
    "Soft": 0,
    "Super Soft": 0,
    "Latex Foam": 4000,
    "Memory Foam": 3000,
  };

  const foamType = configuration.foam?.type || "Firm";
  breakdown.foamUpgrade = FOAM_PRICES[foamType] || 0;

  const SEAT_WIDTH_CHARGES: Record<string, number> = {
    "22 in": 0,
    "24 in": 0,
    "26 in": 0.065,
    "30 in": 0.195,
  };
  const SEAT_DEPTH_CHARGES: Record<string, number> = {
    "22 in": 0,
    "24 in": 0,
    "26 in": 0.03,
    "28 in": 0.06,
  };

  const seatWidth = dimensions?.seatWidth || "24 in";
  const seatDepth = dimensions?.seatDepth || "22 in";
  const widthUpgrade = SEAT_WIDTH_CHARGES[seatWidth] || 0;
  const depthUpgrade = SEAT_DEPTH_CHARGES[seatDepth] || 0;
  breakdown.dimensionUpgrade = basePrice * (widthUpgrade + depthUpgrade);

  const totalBeforeDiscount =
    basePrice +
    breakdown.fabricCharges +
    breakdown.pillowsPrice +
    breakdown.foamUpgrade +
    breakdown.dimensionUpgrade;

  breakdown.subtotal = totalBeforeDiscount;

  if (configuration.discount?.percentage) {
    const discountPercent = Number(configuration.discount.percentage);
    breakdown.discountAmount = totalBeforeDiscount * discountPercent;
  } else if (configuration.discount?.discountCode) {
    const discountKey = `discount_${configuration.discount.discountCode.toLowerCase()}`;
    const discountPercent = getFormulaValue(formulas, discountKey, 0) / 100;
    breakdown.discountAmount = totalBeforeDiscount * discountPercent;
  } else if (configuration.discount?.amount) {
    breakdown.discountAmount = Number(configuration.discount.amount) || 0;
  }

  const totalAfterDiscount = totalBeforeDiscount - breakdown.discountAmount;
  breakdown.total = Math.round(totalAfterDiscount);

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
    fabricMeters: 0,
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

  // Pillows pricing (for arm chairs) - Size and type-based pricing
  if (category === "arm_chairs" && configuration.pillows?.required) {
    const pillowType = configuration.pillows?.type || "Simple pillow";
    const pillowSize = configuration.pillows?.size || "18 in X 18 in";
    const pillowQty = configuration.pillows?.quantity || 1;

    // Get pillow price from pillow_size metadata (price_matrix)
    let pillowPrice = 1200; // Default fallback

    try {
      const { data: pillowSizeOption } = await supabase
        .from("dropdown_options")
        .select("metadata, option_value")
        .eq("category", "arm_chairs")
        .eq("field_name", "pillow_size")
        .eq("option_value", pillowSize)
        .eq("is_active", true)
        .single();

      if (pillowSizeOption && pillowSizeOption.metadata) {
        const metadata = parseOptionMetadata(pillowSizeOption.metadata);
        const fabricMatrix = metadata.fabric_matrix || {};
        const matchingFabric =
          fabricMatrix[pillowType] ||
          fabricMatrix[pillowType.toLowerCase()] ||
          Object.entries(fabricMatrix).find(([key]) => key.toLowerCase() === pillowType.toLowerCase())?.[1];

        pillowPrice = Number(matchingFabric) || 0;
      }
    } catch (error) {
      console.warn("Error fetching pillow price metadata; defaulting to 0", error);
      pillowPrice = 0;
    }

    breakdown.pillowsPrice = pillowPrice * pillowQty * quantity;
    totalPrice += breakdown.pillowsPrice;
  }

  // Fabric charges
  const fabricMeters = await calculateFabricMeters(category, configuration, settings, productData);
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
 * Calculate pouffe pricing
 * Pricing Rules:
 * - Base Price: From database (net_price_rs)
 * - Depth Upgrade: 22/24 in = 0%, 26 in = 3%, 28 in = 6%
 * - Width Upgrade: 22/24 in = 0%, 26 in = 6.5%, 30 in = 19.5%
 * - Fabric Upgrade: Based on selected fabric vs base price (₹800/meter)
 * - Dual Colour: 50% structure + 50% seat
 * - Legs: From legs_prices table (if applicable)
 * - Discount: Based on discount code percentage
 */
async function calculatePouffePricing(
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
    fabricMeters: 0,
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

  // Dimension upgrade charges
  const dimensions = configuration.dimensions || {};
  const seatDepth = dimensions.seatDepth || "22 in";
  const seatWidth = dimensions.seatWidth || "22 in";

  const depthUpgradePercentages: Record<string, number> = {
    "22 in": 0.0,
    "24 in": 0.0,
    "26 in": 0.03,
    "28 in": 0.06,
  };

  const widthUpgradePercentages: Record<string, number> = {
    "22 in": 0.0,
    "24 in": 0.0,
    "26 in": 0.065,
    "30 in": 0.195,
  };

  const depthUpgradePercent = depthUpgradePercentages[seatDepth] || 0;
  const widthUpgradePercent = widthUpgradePercentages[seatWidth] || 0;

  const depthUpgradeCharge = basePrice * depthUpgradePercent;
  const widthUpgradeCharge = basePrice * widthUpgradePercent;

  breakdown.dimensionUpgrade = depthUpgradeCharge + widthUpgradeCharge;
  totalPrice += breakdown.dimensionUpgrade;

  // Fabric upgrade charges
  const fabricPlan = configuration.fabricPlan || {};
  const baseFabricMeters = Number(
    fabricPlan.baseFabricMeters ||
    configuration.baseModel?.fabric ||
    productData.fabric_required_mtr ||
    productData.fabric_mtrs ||
    3
  );
  const BASE_FABRIC_PRICE_PER_METER = 800;

  if (fabricPlan.claddingPlan === "Single Colour" && fabricPlan.singleColour?.fabricCode) {
    const fabricCode = fabricPlan.singleColour.fabricCode;
    const fabricPrice = await getFabricPrice(fabricCode);
    if (fabricPrice > 0) {
      const upgradeCharge = (fabricPrice - BASE_FABRIC_PRICE_PER_METER) * baseFabricMeters;
      breakdown.fabricCharges = Math.max(0, upgradeCharge);
      totalPrice += breakdown.fabricCharges;
    }
  } else if (fabricPlan.claddingPlan === "Dual Colour") {
    const structureCode = fabricPlan.dualColour?.structureFabricCode;
    const seatCode = fabricPlan.dualColour?.seatFabricCode;
    let totalUpgrade = 0;

    if (structureCode) {
      const structurePrice = await getFabricPrice(structureCode);
      if (structurePrice > 0) {
        const structureFabricMeters = baseFabricMeters * 0.5; // 50%
        totalUpgrade += (structurePrice - BASE_FABRIC_PRICE_PER_METER) * structureFabricMeters;
      }
    }

    if (seatCode) {
      const seatPrice = await getFabricPrice(seatCode);
      if (seatPrice > 0) {
        const seatFabricMeters = baseFabricMeters * 0.5; // 50%
        totalUpgrade += (seatPrice - BASE_FABRIC_PRICE_PER_METER) * seatFabricMeters;
      }
    }

    breakdown.fabricCharges = Math.max(0, totalUpgrade);
    totalPrice += breakdown.fabricCharges;
  }

  // Use fabric upgrade charges from configuration if available (calculated in component)
  if (fabricPlan.fabricUpgradeCharges) {
    breakdown.fabricCharges = Number(fabricPlan.fabricUpgradeCharges);
    // Recalculate total with the component-calculated charges
    totalPrice = basePrice + breakdown.dimensionUpgrade + breakdown.fabricCharges;
  }

  // Legs pricing (if applicable)
  if (configuration.legs?.type) {
    const legType = configuration.legs.type;
    try {
      const { data: leg } = await supabase
        .from("legs_prices")
        .select("price_per_unit")
        .eq("description", legType)
        .eq("is_active", true)
        .single();

      if (leg && leg.price_per_unit) {
        breakdown.accessoriesPrice = Number(leg.price_per_unit);
        totalPrice += breakdown.accessoriesPrice;
      }
    } catch (error) {
      console.warn("Error fetching leg price:", error);
    }
  }

  breakdown.subtotal = totalPrice;

  // Discount
  if (configuration.discount?.discountCode || configuration.discount?.code) {
    const discountCode = configuration.discount.discountCode || configuration.discount.code;

    // Try to get discount percentage from metadata first
    try {
      const { data: discountOption } = await supabase
        .from("dropdown_options")
        .select("metadata")
        .eq("category", "database_pouffes")
        .eq("field_name", "discount_code")
        .eq("option_value", discountCode)
        .eq("is_active", true)
        .single();

      if (discountOption?.metadata) {
        const metadata = parseOptionMetadata(discountOption.metadata) as Record<string, any>;
        const discountPercent = Number(metadata.percentage || 0);
        breakdown.discountAmount = totalPrice * discountPercent;
        totalPrice -= breakdown.discountAmount;
      } else {
        // Fallback to formula lookup
        const discountKey = `discount_${discountCode.toLowerCase()}`;
        const discountPercent = getFormulaValue(formulas, discountKey, 0);
        breakdown.discountAmount = (totalPrice * discountPercent) / 100;
        totalPrice -= breakdown.discountAmount;
      }
    } catch (error) {
      console.warn("Error fetching discount:", error);
    }
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
    fabricMeters: 0,
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
  const fabricMeters = await calculateFabricMeters(category, configuration, settings, productData);
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
    fabricMeters: 0,
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

  const normalizedShape = (configuration.baseShape || configuration.shape || "STANDARD")
    .toUpperCase()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");

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

  // Lounger pricing - Database-driven from dropdown_options metadata
  if (configuration.lounger?.required === "Yes" || configuration.lounger?.required === true) {
    const numLoungers = configuration.lounger?.numberOfLoungers === "2 Nos." ? 2 :
      (configuration.lounger?.quantity || 1);
    const loungerSize = configuration.lounger?.size || "";

    // Fetch lounger size metadata from database
    const loungerMetadata = await getLoungerSizeMetadata("sofabed", loungerSize);

    // Calculate base lounger price using metadata
    let baseLoungerPercentage = 0.40; // Default fallback: 40%

    if (loungerMetadata.basePercentage !== undefined) {
      // Use base percentage from metadata
      baseLoungerPercentage = loungerMetadata.basePercentage / 100;
    } else {
      // Fallback: Try to get from formulas
      baseLoungerPercentage = getFormulaValue(formulas, "sofabed_lounger_base_percentage", 40) / 100;
    }

    const baseLoungerPrice = basePriceFor2Seater * baseLoungerPercentage;

    // Calculate price multiplier for size increments
    let priceMultiplier = 1.0; // Default: base price (5'6")

    if (loungerMetadata.priceMultiplier !== undefined) {
      // Use price multiplier from metadata (e.g., 1.0 = base, 1.04 = +4%, etc.)
      priceMultiplier = loungerMetadata.priceMultiplier;
    } else {
      // Fallback: Calculate from size increments
      // Base 5'6" = 1.0, each additional 6" = +0.04 (4%)
      const loungerSizeMap: { [key: string]: number } = {
        "Lounger-5 ft": 60,      // -6" from base
        "Lounger-5 ft 6 in": 66, // base = 66 inches (multiplier = 1.0)
        "Lounger-6 ft": 72,      // +6" from base (multiplier = 1.04)
        "Lounger-6 ft 6 in": 78, // +12" from base (multiplier = 1.08)
        "Lounger-7 ft": 84       // +18" from base (multiplier = 1.12)
      };

      let loungerInches = loungerSizeMap[loungerSize] || 66;

      // Pattern matching fallback
      if (loungerInches === 66) {
        if (loungerSize.includes("7 ft") || loungerSize.includes("7'")) {
          loungerInches = 84;
        } else if (loungerSize.includes("6'6") || loungerSize.includes("6 ft 6 in")) {
          loungerInches = 78;
        } else if (loungerSize.includes("6 ft") || loungerSize.includes("6'")) {
          loungerInches = 72;
        } else if (loungerSize.includes("5'6") || loungerSize.includes("5 ft 6 in")) {
          loungerInches = 66;
        } else if (loungerSize.includes("5 ft") || loungerSize.includes("5'")) {
          loungerInches = 60;
        }
      }

      // Calculate multiplier: base (66") = 1.0, each 6" increment = +0.04
      const baseInches = 66;
      const additionalInches = Math.max(0, loungerInches - baseInches);
      const additional6InchIncrements = additionalInches / 6;
      priceMultiplier = 1.0 + (additional6InchIncrements * 0.04);
    }

    // Total lounger price per unit
    let loungerPricePerUnit = baseLoungerPrice * priceMultiplier;

    // Storage option - fetch from formulas
    if (configuration.lounger?.storage === "Yes") {
      const storageCost = getFormulaValue(formulas, "sofabed_lounger_storage", 0);
      loungerPricePerUnit += storageCost;
    }

    // Total for all loungers
    breakdown.loungerPrice = loungerPricePerUnit * numLoungers;
    totalPrice += breakdown.loungerPrice;
  }

  // Recliner mechanism pricing (₹14,000 per recliner)
  const recliner = configuration.recliner || {};
  let reclinerTotal = 0;
  const reclinerPricePerSeat = getFormulaValue(formulas, "recliner_electric_cost", 14000);

  const activeReclinerSections =
    SOFABED_RECLINER_ACTIVE_SECTIONS[normalizedShape] || SOFABED_RECLINER_ACTIVE_SECTIONS.STANDARD;

  activeReclinerSections.forEach((section) => {
    const reclinerData = recliner[section];
    if (reclinerData?.required === "Yes") {
      const numRecliners = Math.max(0, reclinerData.numberOfRecliners || 0);
      reclinerTotal += reclinerPricePerSeat * numRecliners;
    }
  });

  breakdown.mechanismUpgrade = reclinerTotal;
  totalPrice += breakdown.mechanismUpgrade;

  // Pillows pricing - Size and type-based pricing
  if (configuration.additionalPillows?.required === "Yes" || configuration.additionalPillows?.required === true) {
    const pillowType = configuration.additionalPillows?.type || "Simple pillow";
    const pillowSize = configuration.additionalPillows?.size || "18 in X 18 in";
    const quantity = configuration.additionalPillows?.quantity || 1;

    // Get pillow price from pillow_size metadata (price_matrix)
    let pillowPrice = 1200; // Default fallback

    try {
      const { data: pillowSizeOption } = await supabase
        .from("dropdown_options")
        .select("metadata, option_value")
        .eq("category", "sofabed")
        .eq("field_name", "pillow_size")
        .eq("option_value", pillowSize)
        .eq("is_active", true)
        .single();

      if (pillowSizeOption && pillowSizeOption.metadata) {
        const metadata = parseOptionMetadata(pillowSizeOption.metadata);
        const priceMatrix = metadata.price_matrix || {};
        pillowPrice =
          priceMatrix[pillowType] ||
          priceMatrix[pillowType.toLowerCase()] ||
          Object.entries(priceMatrix).find(([key]) => key.toLowerCase() === pillowType.toLowerCase())?.[1] ||
          1200;
      }
    } catch (error) {
      console.warn("Error fetching pillow size from database, using formula fallback:", error);
      pillowPrice = getFormulaValue(formulas, "pillow_simple_price", 1200);
    }

    breakdown.pillowsPrice = pillowPrice * quantity;
    totalPrice += breakdown.pillowsPrice;
  }

  // Console pricing - Fixed price per console based on size + accessory prices
  // Only charge for ACTIVE consoles (where position !== "none")
  if (configuration.console?.required === "Yes" || configuration.console?.required === true) {
    const consoleSize = configuration.console?.size || "";
    const placements = configuration.console?.placements || [];

    // Base console price (per console)
    let baseConsolePrice = 0;
    if (consoleSize.includes("6") || consoleSize === "6 in" || consoleSize === "Console-6 in") {
      baseConsolePrice = getFormulaValue(formulas, "console_6_inch", 8000);
    } else if (consoleSize.includes("10") || consoleSize === "10 in" || consoleSize === "Console-10 In") {
      baseConsolePrice = getFormulaValue(formulas, "console_10_inch", 12000);
    }

    // Count only ACTIVE console placements (not "none")
    // Match the same logic used in Active Consoles Summary
    const activePlacements = placements.filter((p: any) =>
      p && p.position && p.position !== null && p.section !== null && p.position !== "none"
    );
    const activeConsoleCount = activePlacements.length;

    // Calculate console accessories prices from ACTIVE placements only
    let consoleAccessoriesTotal = 0;
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

    // Total console price = (base console price × ACTIVE console count) + sum of all accessories from active consoles
    breakdown.consolePrice = (baseConsolePrice * activeConsoleCount) + consoleAccessoriesTotal;
    totalPrice += breakdown.consolePrice;

    if (import.meta.env.DEV) {
      console.log(`🛋️ Sofabed Console Pricing: Active Consoles=${activeConsoleCount}, Base=₹${baseConsolePrice} × ${activeConsoleCount} = ₹${baseConsolePrice * activeConsoleCount}, Accessories=₹${consoleAccessoriesTotal}, Total=₹${breakdown.consolePrice}`);
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
  const fabricMeters = await calculateFabricMeters("sofabed", configuration, settings, productData);
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
          const metadata = parseOptionMetadata(sofaArmrest.metadata);
          const armrestPrice = Number(metadata.price_rs || metadata.price || metadata.priceRs || 0);
          breakdown.armrestUpgrade = armrestPrice;
          totalPrice += armrestPrice;
        }
      } else if (armrestOption && armrestOption.metadata) {
        const metadata = parseOptionMetadata(armrestOption.metadata);
        const armrestPrice = Number(metadata.price_rs || metadata.price || metadata.priceRs || 0);
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
          let rawMetadata = sofaStitch.metadata;
          if (typeof rawMetadata === 'string') {
            try {
              rawMetadata = JSON.parse(rawMetadata);
            } catch (e) {
              console.warn("Failed to parse stitch metadata as JSON:", e);
            }
          }

          const metadata = parseOptionMetadata(stitchOption.metadata);
          const stitchPrice = Number(metadata.price_rs || metadata.price || metadata.priceRs || 0);
          breakdown.stitchTypePrice = stitchPrice;
          totalPrice += stitchPrice;
        }
      } else if (stitchOption?.metadata) {
        const metadata = parseOptionMetadata(stitchOption.metadata);
        const stitchPrice = Number(metadata.price_rs || metadata.price || metadata.priceRs || 0);
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
  const fabricMeters = await calculateFabricMeters(category, configuration, settings, productData);
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

async function calculateKidsBedPricing(
  configuration: any,
  productData: ProductData,
  formulas: PricingFormula[],
  settings: AdminSetting[],
  basePrice: number
): Promise<{ breakdown: PricingBreakdown; total: number }> {
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

  const baseProductPrice =
    Number(productData?.netpricers || productData?.net_price_rs || productData?.base_price || basePrice || 0);
  const baseProductFabric = Number(
    productData?.fabric_single_bed_mtrs || productData?.fabricmtrs || productData?.fabric_mtrs || 9
  );

  const length = configuration.bedDimensions?.length || KIDS_BED_STANDARD.standardLength;
  const width = configuration.bedDimensions?.width || KIDS_BED_STANDARD.standardWidth;
  const areaRatio = configuration.bedDimensions?.areaRatio || (length * width) / KIDS_BED_STANDARD.standardArea;

  const baseModelPrice = baseProductPrice * areaRatio;
  const baseModelFabric = baseProductFabric * areaRatio;

  breakdown.basePrice = baseModelPrice;
  breakdown.baseSeatPrice = baseModelPrice;
  let totalPrice = baseModelPrice;

  const storageRequired = configuration.storage?.required === "Yes";
  let storagePrice = Number(configuration.storage?.price || 0);
  if (!storagePrice && storageRequired) {
    if (configuration.storage?.type === "Side Drawer") {
      storagePrice = KIDS_BED_STORAGE_PRICES["Side Drawer"];
    } else {
      const storageType = configuration.storage?.boxStorageType || "Manual";
      storagePrice = KIDS_BED_STORAGE_PRICES[storageType] || KIDS_BED_STORAGE_PRICES["Manual"];
    }
  }

  breakdown.storagePrice = storagePrice;
  totalPrice += storagePrice;

  const extraFabricMeters = Number(configuration.fabricPlan?.extraFabricMeters || 0);
  const fabricUpgradeCharges = Number(configuration.fabricPlan?.fabricUpgradeCharges || 0);
  const extraFabricCost = extraFabricMeters * KIDS_BED_STANDARD.baseFabricPrice;
  breakdown.fabricCharges = fabricUpgradeCharges + extraFabricCost;
  totalPrice += breakdown.fabricCharges;

  breakdown.subtotal = totalPrice;

  let discountPercent = Number(configuration.discount?.percentage || 0);
  if (!discountPercent && configuration.discount?.discountCode) {
    const discountKey = `discount_${configuration.discount.discountCode.toLowerCase()}`;
    discountPercent = getFormulaValue(formulas, discountKey, 0) / 100;
  }

  breakdown.discountAmount = totalPrice * discountPercent;
  totalPrice -= breakdown.discountAmount;

  breakdown.total = Math.round(totalPrice);

  configuration.baseModel = {
    ...configuration.baseModel,
    price: baseModelPrice,
    fabric: baseModelFabric,
    basePrice: baseProductPrice,
    baseFabric: baseProductFabric,
  };

  return {
    breakdown,
    total: breakdown.total,
  };
}

const DEFAULT_FABRIC_PRICE_PER_METER = 800;

const parseOptionMetadata = (metadata: any): Record<string, any> => {
  if (!metadata) return {};
  if (typeof metadata === "string") {
    try {
      return JSON.parse(metadata);
    } catch (error) {
      console.warn("Failed to parse dropdown metadata", error);
      return {};
    }
  }
  return metadata as Record<string, any>;
};

const KIDS_BED_STANDARD = {
  standardLength: 75,
  standardWidth: 36,
  standardArea: 2700,
  storageFabricAddition: 1,
  baseFabricPrice: 800,
};

const KIDS_BED_STORAGE_PRICES: Record<string, number> = {
  Manual: 4200,
  "Hydraulic / Electric": 7000,
  "Side Drawer": 4704,
};
