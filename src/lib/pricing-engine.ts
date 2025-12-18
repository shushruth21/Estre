import { supabase } from "@/integrations/supabase/client";

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

export interface SeatConfig {
  position: string;
  type: string;
  qty: number;
  width: number;
  fabricMeters?: number;
}

export interface SofaConfiguration {
  productId: string;
  sofaType: string;
  seats: SeatConfig[];
  lounger?: {
    required: boolean;
    quantity?: number;
    size?: string;
    positioning?: string;
    storage?: string;
  };
  console?: {
    required: boolean;
    quantity?: number;
    size?: string;
  };
  additionalPillows?: {
    required: boolean;
    quantity?: number;
    type?: string;
    size?: string;
  };
  fabric: {
    claddingPlan: string;
    structureCode: string;
    backrestCode?: string;
    seatCode?: string;
    headrestCode?: string;
  };
  foam: {
    type: string;
  };
  dimensions: {
    seatDepth: number;
    seatWidth: number;
    seatHeight: number;
  };
  legsCode?: string;
  armrestType?: string;
  discount?: {
    code?: string;
    approvedBy?: string;
  };
}

export async function calculateSofaPrice(
  configuration: SofaConfiguration
): Promise<{ breakdown: PricingBreakdown; total: number }> {
  // Validate configuration
  // Note: We use a partial schema check or full check depending on what is available. 
  // Since `SofaConfiguration` interface closely matches `ConfigurationSchema`, we can attempt parsing.
  // However, `SofaConfiguration` is slightly different structure than the storage `Configuration` schema.
  // Let's at least validate critical pricing components if possible, or basic structure.
  // For now, we will trust TypeScript interface but add runtime checks for numeric values where critical.

  if (!configuration.productId) throw new Error("Product ID is required");
  if (!configuration.fabric) throw new Error("Fabric configuration is required");

  // Basic numeric guards
  if (configuration.dimensions.seatDepth < 0 || configuration.dimensions.seatWidth < 0) {
    throw new Error("Invalid dimensions detected");
  }

  // Fetch pricing formulas from database
  const { data: formulas, error: formulasError } = await supabase
    .from("pricing_formulas")
    .select("*")
    .eq("category", "sofa")
    .eq("is_active", true);

  if (formulasError || !formulas) {
    throw new Error("Failed to fetch pricing formulas");
  }

  // Convert to lookup object
  const pricing = formulas.reduce((acc, f) => {
    acc[f.formula_name] = f.value;
    return acc;
  }, {} as Record<string, number>);

  // Get product base price
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("net_price_rs, fabric_requirements")
    .eq("id", configuration.productId)
    .single();

  if (productError || !product) {
    throw new Error("Product not found");
  }

  const basePrice = product.net_price_rs || 0;
  let totalPrice = 0;

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
    mechanismUpgrade: 0,
    storagePrice: 0,
    armrestUpgrade: 0,
    stitchTypePrice: 0,
    foamUpgrade: 0,
    dimensionUpgrade: 0,
    accessoriesPrice: 0,
    discountAmount: 0,
    subtotal: 0,
    total: 0,
  };

  // Calculate seat pricing
  const firstSeatPrice = basePrice * ((pricing.first_seat || 100) / 100);
  breakdown.baseSeatPrice = firstSeatPrice;
  totalPrice += firstSeatPrice;

  // Additional seats
  const additionalSeats = configuration.seats
    .filter((s) => !["Corner", "Backrest"].includes(s.type))
    .slice(1);
  if (additionalSeats.length > 0) {
    const additionalSeatPrice =
      firstSeatPrice * ((pricing.additional_seat || 70) / 100);
    breakdown.additionalSeatsPrice =
      additionalSeatPrice * additionalSeats.length;
    totalPrice += breakdown.additionalSeatsPrice;
  }

  // Corner seats
  const cornerSeats = configuration.seats.filter((s) => s.type === "Corner");
  if (cornerSeats.length > 0) {
    const cornerPrice = firstSeatPrice * ((pricing.corner_seat || 100) / 100);
    breakdown.cornerSeatsPrice = cornerPrice * cornerSeats.length;
    totalPrice += breakdown.cornerSeatsPrice;
  }

  // Backrest seats
  const backrestSeats = configuration.seats.filter(
    (s) => s.type === "Backrest"
  );
  if (backrestSeats.length > 0) {
    const backrestPrice =
      firstSeatPrice * ((pricing.backrest_seat || 20) / 100);
    breakdown.backrestSeatsPrice = backrestPrice * backrestSeats.length;
    totalPrice += breakdown.backrestSeatsPrice;
  }

  // Lounger pricing
  if (configuration.lounger?.required && configuration.lounger.quantity) {
    let loungerPrice = pricing.lounger_base || 15000;

    const size = configuration.lounger.size || "";
    if (size.includes("5 ft 6 in")) {
      loungerPrice += pricing.lounger_additional_6_inch || 1000;
    } else if (size.includes("6 ft 6 in")) {
      loungerPrice += (pricing.lounger_additional_6_inch || 1000) * 3;
    } else if (size.includes("6 ft")) {
      loungerPrice += (pricing.lounger_additional_6_inch || 1000) * 2;
    } else if (size.includes("7 ft")) {
      loungerPrice += (pricing.lounger_additional_6_inch || 1000) * 4;
    }

    if (configuration.lounger.storage === "Yes") {
      loungerPrice += pricing.lounger_storage || 3000;
    }

    breakdown.loungerPrice = loungerPrice * configuration.lounger.quantity;
    totalPrice += breakdown.loungerPrice;
  }

  // Console pricing
  if (configuration.console?.required && configuration.console.quantity) {
    const consolePrice =
      configuration.console.size === "Console-6 in"
        ? pricing.console_6_inch || 8000
        : pricing.console_10_inch || 12000;
    breakdown.consolePrice = consolePrice * configuration.console.quantity;
    totalPrice += breakdown.consolePrice;
  }

  // Pillow pricing
  if (
    configuration.additionalPillows?.required &&
    configuration.additionalPillows.quantity
  ) {
    const type = configuration.additionalPillows.type || "Simple";
    let pillowPrice = 1200;
    if (type === "Diamond Quilted") pillowPrice = 3500;
    else if (type === "Belt Quilted") pillowPrice = 4000;
    else if (type === "Tassels") pillowPrice = 2500;

    breakdown.pillowsPrice =
      pillowPrice * configuration.additionalPillows.quantity;
    totalPrice += breakdown.pillowsPrice;
  }

  // Fabric charges
  breakdown.fabricCharges = await calculateFabricCharges(
    configuration,
    product.fabric_requirements
  );
  totalPrice += breakdown.fabricCharges;

  // Foam upgrade
  const foamType = configuration.foam.type.toLowerCase().replace(/\s+/g, "_");
  breakdown.foamUpgrade = pricing[`foam_${foamType}`] || 0;
  totalPrice += breakdown.foamUpgrade;

  // Dimension upgrades (percentage-based)
  const depthKey = `seat_depth_${configuration.dimensions.seatDepth}`;
  const widthKey = `seat_width_${configuration.dimensions.seatWidth}`;
  const depthUpgradePercent = pricing[depthKey] || 0;
  const widthUpgradePercent = pricing[widthKey] || 0;
  breakdown.dimensionUpgrade =
    totalPrice * ((depthUpgradePercent + widthUpgradePercent) / 100);
  totalPrice += breakdown.dimensionUpgrade;

  // Accessories
  if (configuration.legsCode) {
    breakdown.accessoriesPrice = await calculateAccessoriesPrice([
      configuration.legsCode,
    ]);
    totalPrice += breakdown.accessoriesPrice;
  }

  breakdown.subtotal = totalPrice;

  // Discount
  if (configuration.discount?.code) {
    const discountKey = `discount_${configuration.discount.code.toLowerCase()}`;
    const discountPercent = pricing[discountKey] || 0;
    breakdown.discountAmount = totalPrice * (discountPercent / 100);
    totalPrice -= breakdown.discountAmount;
  }

  breakdown.total = totalPrice;

  return {
    breakdown,
    total: totalPrice,
  };
}

async function calculateFabricCharges(
  config: SofaConfiguration,
  fabricReqs: any
): Promise<number> {
  const fabricCodes = [
    config.fabric.structureCode,
    config.fabric.backrestCode,
    config.fabric.seatCode,
    config.fabric.headrestCode,
  ].filter(Boolean);

  if (fabricCodes.length === 0) return 0;

  const { data: fabrics } = await supabase
    .from("fabric_coding")
    .select("estre_code, price")
    .in("estre_code", fabricCodes);

  if (!fabrics) return 0;

  const fabricPriceMap = fabrics.reduce((acc, f) => {
    acc[f.estre_code] = f.price || 0;
    return acc;
  }, {} as Record<string, number>);

  let totalFabricCharge = 0;

  // Calculate fabric meters based on configuration
  const totalSeats = config.seats.length;
  const firstSeatMeters = fabricReqs?.first_seat || 6.0;
  const additionalSeatMeters = fabricReqs?.additional_seat || 3.0;

  const structurePrice = fabricPriceMap[config.fabric.structureCode] || 0;
  totalFabricCharge += structurePrice * firstSeatMeters;

  if (totalSeats > 1) {
    totalFabricCharge +=
      structurePrice * additionalSeatMeters * (totalSeats - 1);
  }

  return totalFabricCharge;
}

async function calculateAccessoriesPrice(codes: string[]): Promise<number> {
  if (codes.length === 0) return 0;

  const { data: accessories } = await supabase
    .from("accessories")
    .select("code, price_rs")
    .in("code", codes);

  if (!accessories) return 0;

  return accessories.reduce((sum, acc) => sum + acc.price_rs, 0);
}

export async function loadDropdownOptions(
  category: string,
  fieldName: string
) {
  const { data, error } = await supabase
    .from("dropdown_options")
    .select("*")
    .eq("category", category)
    .eq("field_name", fieldName)
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    console.error("Error loading dropdown options:", error);
    return [];
  }

  return data || [];
}

export async function loadPricingFormulas(category: string) {
  const { data, error } = await supabase
    .from("pricing_formulas")
    .select("*")
    .eq("category", category)
    .eq("is_active", true);

  if (error) {
    console.error("Error loading pricing formulas:", error);
    return [];
  }

  return data || [];
}
