import { fetchProductData, PricingBreakdown } from "@/lib/dynamic-pricing";

interface JobCardCustomerInfo {
  name: string;
  email?: string;
  phone?: string;
  address?: any;
}

interface JobCardSectionSummary {
  section: string;
  seater: string;
  quantity: number;
  fabricMeters: number;
}

interface JobCardConsoleSummary {
  required: boolean;
  count: number;
  size: string;
  fabricMeters: number;
  placements: Array<{ section: string; position: string; accessoryId?: string | null }>;
}

interface JobCardDummySeatSummary {
  total: number;
  fabricMeters: number;
  breakdown: Array<{ section: string; quantity: number }>;
}

interface JobCardFabricPlanSummary {
  planType: "Single Colour" | "Dual Colour";
  baseMeters: number;
  structureMeters: number;
  armrestMeters: number;
  totalMeters: number;
  upgradeCharge: number;
  fabricCodes: {
    structure?: string;
    backrest?: string;
    seat?: string;
    headrest?: string;
    armrest?: string;
  };
}

export interface JobCardGeneratedData {
  jobCardNumber: string;
  soNumber: string;
  lineItemId: string;
  orderId?: string;
  orderNumber?: string;
  category: string;
  modelName: string;
  quantity: number;
  customer: JobCardCustomerInfo;
  configuration: any;
  sections: JobCardSectionSummary[];
  console: JobCardConsoleSummary;
  dummySeats: JobCardDummySeatSummary;
  fabricPlan: JobCardFabricPlanSummary;
  pricing: {
    total: number;
    breakdown: PricingBreakdown;
  };
  dimensions: {
    seatDepth?: number;
    seatWidth?: number;
    seatHeight?: number;
  };
  createdAt: string;
}

const getNumber = (value: any, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const getReclinerFabricValue = (product: any, key: string, fallback: number) => {
  const value = Number(product?.[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const calculateReclinerSectionFabric = (product: any, seaterType: string): number => {
  const firstFabric = getReclinerFabricValue(product, "fabric_first_recliner_mtrs", 8);
  const additionalFabric = getReclinerFabricValue(product, "fabric_additional_seat_mtrs", 5);
  const cornerFabric = getReclinerFabricValue(product, "fabric_corner_mtrs", 7);
  const backrestFabric = getReclinerFabricValue(product, "fabric_backrest_mtrs", 2);

  if (!seaterType || seaterType === "none") return 0;
  const lower = seaterType.toLowerCase();
  if (lower.includes("corner")) return cornerFabric;
  if (lower.includes("backrest")) return backrestFabric;
  if (lower.includes("1-seater")) return firstFabric;
  if (lower.includes("2-seater")) return firstFabric + additionalFabric * 1;
  if (lower.includes("3-seater")) return firstFabric + additionalFabric * 2;
  if (lower.includes("4-seater")) return firstFabric + additionalFabric * 3;
  return firstFabric;
};

const deriveSectionsSummary = (configuration: any, product: any): JobCardSectionSummary[] => {
  const sections: JobCardSectionSummary[] = [];
  const sectionsConfig = configuration.sections || {};

  Object.entries(sectionsConfig).forEach(([sectionKey, sectionValue]: any) => {
    if (!sectionValue || !sectionValue.seater || sectionValue.seater === "none") return;
    const quantity = getNumber(sectionValue.qty, 1);
    const fabricMeters = calculateReclinerSectionFabric(product, sectionValue.seater) * quantity;
    sections.push({
      section: sectionKey,
      seater: sectionValue.seater,
      quantity,
      fabricMeters,
    });
  });

  return sections;
};

const deriveConsoleSummary = (configuration: any, product: any): JobCardConsoleSummary => {
  const required = configuration.console?.required === "Yes" || configuration.console?.required === true;
  const placements = Array.isArray(configuration.console?.placements)
    ? configuration.console.placements.filter(
        (placement: any) => placement && placement.position && placement.position !== "none" && placement.section
      )
    : [];
  const count = placements.length;
  const size = configuration.console?.size || "Console-6 in";
  const perConsole = size.toLowerCase().includes("10")
    ? getReclinerFabricValue(product, "fabric_console_10_mtrs", 2.5)
    : getReclinerFabricValue(product, "fabric_console_6_mtrs", 2.0);

  return {
    required,
    count,
    size,
    fabricMeters: required ? perConsole * count : 0,
    placements,
  };
};

const deriveDummySeatSummary = (configuration: any, product: any): JobCardDummySeatSummary => {
  const dummyConfig = configuration.dummySeats || configuration.dummy_seats || {};
  const frontCount = getNumber(dummyConfig.quantity_per_section?.front ?? dummyConfig.F, 0);
  const leftCount = getNumber(dummyConfig.quantity_per_section?.left ?? dummyConfig.L, 0);
  const total = frontCount + leftCount;
  const additionalPerSeat = getReclinerFabricValue(product, "fabric_additional_seat_mtrs", 5);
  const fabricMeters = additionalPerSeat * total;

  const breakdown: Array<{ section: string; quantity: number }> = [];
  if (frontCount > 0) breakdown.push({ section: "F", quantity: frontCount });
  if (leftCount > 0) breakdown.push({ section: "L", quantity: leftCount });

  return {
    total,
    fabricMeters,
    breakdown,
  };
};

const buildFabricPlan = async (
  configuration: any,
  baseMeters: number,
  totalMeters: number,
  fabricCharges: number
): Promise<JobCardFabricPlanSummary> => {
  const planTypeRaw = configuration.fabric?.claddingPlan || "Single Colour";
  const planType: "Single Colour" | "Dual Colour" =
    planTypeRaw === "Dual Colour" || planTypeRaw === "Multi Colour" ? "Dual Colour" : "Single Colour";

  const structureCode = configuration.fabric?.structureCode || configuration.fabric?.seatCode || "";
  const backrestCode = configuration.fabric?.backrestCode || "";
  const seatCode = configuration.fabric?.seatCode || "";
  const headrestCode = configuration.fabric?.headrestCode || "";
  const armrestCode = configuration.fabric?.armrestCode || configuration.fabric?.backrestCode || "";

  if (planType === "Dual Colour") {
    const derivedBase = totalMeters > 0 ? totalMeters / 1.05 : baseMeters;
    const structureMeters = derivedBase * 0.75;
    const armrestMeters = derivedBase * 0.3;
    return {
      planType,
      baseMeters: derivedBase,
      structureMeters,
      armrestMeters,
      totalMeters,
      upgradeCharge: fabricCharges,
      fabricCodes: {
        structure: structureCode,
        backrest: backrestCode,
        seat: seatCode,
        headrest: headrestCode,
        armrest: armrestCode,
      },
    };
  }

  return {
    planType,
    baseMeters,
    structureMeters: baseMeters,
    armrestMeters: 0,
    totalMeters,
    upgradeCharge: fabricCharges,
    fabricCodes: {
      structure: structureCode,
      backrest: backrestCode,
      seat: seatCode,
      headrest: headrestCode,
      armrest: armrestCode,
    },
  };
};

interface GenerateJobCardParams {
  soNumber: string;
  lineItemId: string;
  orderId?: string;
  orderNumber?: string;
  productId: string;
  category: string;
  modelName: string;
  quantity?: number;
  configuration: any;
  pricingBreakdown: PricingBreakdown;
  totalPrice: number;
  customer: JobCardCustomerInfo;
}

export async function generateJobCardData(params: GenerateJobCardParams): Promise<JobCardGeneratedData> {
  const {
    soNumber,
    lineItemId,
    orderId,
    orderNumber,
    productId,
    category,
    modelName,
    quantity = 1,
    configuration,
    pricingBreakdown,
    totalPrice,
    customer,
  } = params;

  const createdAt = new Date().toISOString();

  const lineItemIdString = String(lineItemId || "");
  const identifier = lineItemIdString.slice(-4).padStart(4, "0");
  const jobCardNumber = `${soNumber.replace(/[^A-Za-z0-9]/g, "")}-${identifier.toUpperCase()}`;

  let sections: JobCardSectionSummary[] = [];
  let consoleSummary: JobCardConsoleSummary = {
    required: false,
    count: 0,
    size: "",
    fabricMeters: 0,
    placements: [],
  };
  let dummySummary: JobCardDummySeatSummary = {
    total: 0,
    fabricMeters: 0,
    breakdown: [],
  };
  let baseMeters = pricingBreakdown.fabricMeters || 0;

  if (category === "recliner" && productId) {
    try {
      const productData = await fetchProductData(category, productId);
      sections = deriveSectionsSummary(configuration, productData);
      consoleSummary = deriveConsoleSummary(configuration, productData);
      dummySummary = deriveDummySeatSummary(configuration, productData);
      const sectionsMeters = sections.reduce((sum, section) => sum + section.fabricMeters, 0);
      baseMeters = sectionsMeters + consoleSummary.fabricMeters + dummySummary.fabricMeters;
    } catch (error) {
      console.warn("Failed to fetch recliner product metadata for job card generation", error);
    }
  }

  const totalFabricMeters = pricingBreakdown.fabricMeters || baseMeters;
  const fabricPlan = await buildFabricPlan(configuration, baseMeters, totalFabricMeters, pricingBreakdown.fabricCharges || 0);

  const dimensions = {
    seatDepth: configuration.dimensions?.seatDepth,
    seatWidth: configuration.dimensions?.seatWidth,
    seatHeight: configuration.dimensions?.seatHeight,
  };

  return {
    jobCardNumber,
    soNumber,
    lineItemId,
    orderId,
    orderNumber,
    category,
    modelName,
    quantity,
    customer,
    configuration,
    sections,
    console: consoleSummary,
    dummySeats: dummySummary,
    fabricPlan,
    pricing: {
      total: totalPrice,
      breakdown: pricingBreakdown,
    },
    dimensions,
    createdAt,
  };
}
