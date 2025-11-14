import { useEffect, useMemo, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, 
  Info, 
  Square, 
  LayoutGrid
} from "lucide-react";
import FabricSelector from "./FabricSelector";
import { SelectionCard } from "@/components/ui/SelectionCard";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateAllConsolePlacements as generateConsolePlacementsUtil, calculateMaxConsoles } from "@/lib/console-validation";

interface ReclinerConfiguratorProps {
  product: any;
  configuration: any;
  onConfigurationChange: (config: any) => void;
}

type NormalizedShape = "STANDARD" | "L SHAPE";

const SECTION_ACTIVATION: Record<NormalizedShape, Record<string, boolean>> = {
  STANDARD: {
    F: true,
    L1: false,
    L2: false,
  },
  "L SHAPE": {
    F: true,
    L1: true,
    L2: true,
  },
};

const SECTION_OPTION_MAP: Record<string, string[]> = {
  F: ["1-Seater", "2-Seater", "3-Seater", "4-Seater"],
  L1: ["Corner", "Backrest", "none"],
  L2: ["1-Seater", "2-Seater", "3-Seater", "4-Seater", "none"],
};

const SECTION_DEFAULTS: Record<string, { type: string; qty: number }> = {
  F: { type: "1-Seater", qty: 1 },
  L1: { type: "Corner", qty: 1 },
  L2: { type: "1-Seater", qty: 1 },
};

const CORNER_WIDTH_BY_SEAT: Record<number, number> = {
  22: 36,
  24: 38,
  26: 40,
  28: 42,
};

const BACKREST_WIDTH = 14;

const RECLINER_PRICING_PERCENTAGES = {
  firstSeat: 100,
  additionalSeat: 70,
  corner: 50,
  backrest: 20,
  dummySeat: 55,
};

const RECLINER_POSITION_OPTIONS: Array<{ value: "LHS" | "RHS" | "Both"; label: string }> = [
  { value: "LHS", label: "Left Hand Side (LHS)" },
  { value: "RHS", label: "Right Hand Side (RHS)" },
  { value: "Both", label: "Both LHS & RHS" },
];

const RECLINER_SECTION_LABELS: Record<"F" | "L", string> = {
  F: "Front",
  L: "Left",
};

const RECLINER_PRICE_PER_UNIT_DEFAULT = 14000;
const RECLINER_WIDTH_PER_UNIT = 30;

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
};

const normalizeShape = (shape: string): NormalizedShape => {
  if (!shape) return "STANDARD";
  const upper = shape.toUpperCase();
  if (upper.includes("L SHAPE") || upper.includes("L-SHAPE")) return "L SHAPE";
  return "STANDARD";
};

const getAllowedSectionOptions = (shape: NormalizedShape, sectionId: string) => {
  if (!SECTION_ACTIVATION[shape]?.[sectionId]) return ["none"];
  return SECTION_OPTION_MAP[sectionId] || ["none"];
};

const normalizeSectionValue = (
  shape: NormalizedShape,
  sectionId: string,
  value?: { type?: string; qty?: number } | null
) => {
  if (!SECTION_ACTIVATION[shape]?.[sectionId]) return undefined;
  const defaults = SECTION_DEFAULTS[sectionId] || { type: "none", qty: 1 };
  const allowedOptions = getAllowedSectionOptions(shape, sectionId);
  const selectedType = value?.type || defaults.type;
  const normalizedType = allowedOptions.includes(selectedType) ? selectedType : allowedOptions[0] || "none";
  const qty = Math.max(1, value?.qty ?? defaults.qty ?? 1);
  return { type: normalizedType, qty };
};

const normalizeSectionsForShape = (
  shape: NormalizedShape,
  sections: Record<string, { type?: string; qty?: number } | null | undefined> = {}
) => {
  const normalized: Record<string, { type: string; qty: number }> = {};
  Object.keys(SECTION_ACTIVATION[shape]).forEach((sectionId) => {
    const normalizedValue = normalizeSectionValue(shape, sectionId, sections[sectionId] || undefined);
    if (normalizedValue) normalized[sectionId] = normalizedValue;
  });
  return normalized;
};

const getSeatCount = (type: string): number => {
  if (!type || type === "Corner" || type === "Backrest" || type === "none") return 0;
  const match = type.match(/(\d+)-Seater/);
  return match ? parseInt(match[1], 10) : 0;
};

const parseSeatWidthValue = (value?: number) => {
  if (!value || Number.isNaN(value)) return 22;
  return value;
};

const calculateSectionWidth = (seaterType: string, seatWidth: number): number => {
  if (!seaterType || seaterType === "none") return 0;
  const lower = seaterType.toLowerCase();
  if (lower.includes("backrest")) return BACKREST_WIDTH;
  if (lower.includes("corner")) return CORNER_WIDTH_BY_SEAT[seatWidth] ?? CORNER_WIDTH_BY_SEAT[28] ?? seatWidth;
  return getSeatCount(seaterType) * seatWidth;
};

const getMechanismPriceFromOption = (option: any): number => {
  if (!option) return 0;
  const metadata = option.metadata || {};
  const price = Number(metadata?.price ?? metadata?.price_rs ?? metadata?.priceRs ?? 0);
  return Number.isFinite(price) ? price : 0;
};

const calculateReclinerSectionPrice = (seaterType: string, basePerSeat: number): number => {
  if (!seaterType || seaterType === "none") return 0;
  const lower = seaterType.toLowerCase();
  if (lower.includes("corner")) return (basePerSeat * RECLINER_PRICING_PERCENTAGES.corner) / 100;
  if (lower.includes("backrest")) return (basePerSeat * RECLINER_PRICING_PERCENTAGES.backrest) / 100;

  const seatCount = getSeatCount(seaterType);
  if (seatCount <= 0) return 0;

  if (seatCount === 1) {
    return (basePerSeat * RECLINER_PRICING_PERCENTAGES.firstSeat) / 100;
  }

  let price = (basePerSeat * RECLINER_PRICING_PERCENTAGES.firstSeat) / 100;
  price += (seatCount - 1) * ((basePerSeat * RECLINER_PRICING_PERCENTAGES.additionalSeat) / 100);
  return price;
};

const getReclinerFabricValue = (product: any, key: string, fallback: number) => {
  const value = Number(product?.[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const calculateFabricForSection = (
  product: any,
  seaterType: string,
): number => {
  const firstFabric = getReclinerFabricValue(product, "fabric_first_recliner_mtrs", 8);
  const cornerFabric = getReclinerFabricValue(product, "fabric_corner_mtrs", 7);
  const backrestFabric = getReclinerFabricValue(product, "fabric_backrest_mtrs", 2);

  if (!seaterType || seaterType === "none") return 0;
  const lower = seaterType.toLowerCase();
  if (lower.includes("corner")) {
    return cornerFabric;
  }
  if (lower.includes("backrest")) {
    return backrestFabric;
  }
  if (lower.includes("1-seater") || lower.includes("2-seater") || lower.includes("3-seater") || lower.includes("4-seater")) {
    return firstFabric;
  }
  return firstFabric;
};

const areSectionsEqual = (
  a: Record<string, { type: string; qty: number }> = {},
  b: Record<string, { type: string; qty: number }> = {}
) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const first = a[key];
    const second = b[key];
    if (!first && !second) continue;
    if (!first || !second) return false;
    if (first.type !== second.type) return false;
    if (first.qty !== second.qty) return false;
  }
  return true;
};

const getAllowedMechanismsForSeater = (seaterType: string): string[] => {
  if (!seaterType) return ["Manual", "Electrical"];
  const lower = seaterType.toLowerCase();
  if (lower.includes("corner") || lower.includes("backrest")) return [];
  if (lower.includes("1-seater")) {
    return ["Manual", "Manual-RRR", "Electrical", "Electrical-RRR", "Only Sofa"];
  }
  if (lower.includes("2-seater") || lower.includes("3-seater") || lower.includes("4-seater")) {
    return ["Manual", "Electrical"];
  }
  return ["Manual", "Electrical"];
};

const ReclinerConfigurator = ({ product, configuration, onConfigurationChange }: ReclinerConfiguratorProps) => {
  // Fetch dropdown options
  const shapesResult = useDropdownOptions("recliner", "base_shape");
  const seatTypesResult = useDropdownOptions("recliner", "seat_type");
  const mechanismTypesResult = useDropdownOptions("recliner", "mechanism_type");
  const consoleSizesResult = useDropdownOptions("common", "console_size");
  const foamTypesResult = useDropdownOptions("common", "foam_type");
  const seatDepthsResult = useDropdownOptions("recliner", "seat_depth");
  const seatWidthsResult = useDropdownOptions("recliner", "seat_width");
  const seatHeightsResult = useDropdownOptions("recliner", "seat_height");

  // Safely extract data
  const shapes = Array.isArray(shapesResult.data) ? shapesResult.data : [];
  const seatTypes = Array.isArray(seatTypesResult.data) ? seatTypesResult.data : [];
  const mechanismTypes = Array.isArray(mechanismTypesResult.data) ? mechanismTypesResult.data : [];
  const consoleSizes = Array.isArray(consoleSizesResult.data) ? consoleSizesResult.data : [];
  const foamTypes = Array.isArray(foamTypesResult.data) ? foamTypesResult.data : [];
  const seatDepths = Array.isArray(seatDepthsResult.data) ? seatDepthsResult.data : [];
  const seatWidths = Array.isArray(seatWidthsResult.data) ? seatWidthsResult.data : [];
  const seatHeights = Array.isArray(seatHeightsResult.data) ? seatHeightsResult.data : [];

  // Check loading state
  const isLoadingDropdowns = shapesResult.isLoading || seatTypesResult.isLoading;

  const updateConfiguration = useCallback(
    (updates: any) => {
      onConfigurationChange({ ...configuration, ...updates });
    },
    [configuration, onConfigurationChange]
  );

  const normalizedShape = normalizeShape(configuration.baseShape || "STANDARD");
  const normalizedSections = useMemo(
    () => normalizeSectionsForShape(normalizedShape, configuration.sections || {}),
    [normalizedShape, configuration.sections]
  );

  const isLShape = normalizedShape === "L SHAPE";

  useEffect(() => {
    if (!areSectionsEqual(normalizedSections, configuration.sections || {})) {
      updateConfiguration({
        sections: normalizedSections,
      });
    }
  }, [normalizedSections, configuration.sections, updateConfiguration]);

  const seatWidth = parseSeatWidthValue(configuration.dimensions?.seatWidth);

  const mechanismPriceLookup = useMemo(() => {
    const map = new Map<string, number>();
    mechanismTypes?.forEach((option: any) => {
      if (!option?.option_value) return;
      map.set(option.option_value, getMechanismPriceFromOption(option));
    });
    return map;
  }, [mechanismTypes]);

  const getMechanismPrice = useCallback(
    (mechanismType: string) => mechanismPriceLookup.get(mechanismType) ?? 0,
    [mechanismPriceLookup]
  );

  const seatTypeMetadataLookup = useMemo(() => {
    const map = new Map<string, any>();
    seatTypes?.forEach((option: any) => {
      if (!option?.option_value) return;
      map.set(option.option_value, option.metadata || {});
    });
    map.set("Corner", seatTypes?.find((o: any) => o.option_value === "Corner")?.metadata || {});
    map.set("Backrest", seatTypes?.find((o: any) => o.option_value === "Backrest")?.metadata || {});
    return map;
  }, [seatTypes]);

  const basePerSeatPrice = useMemo(() => {
    const metadata = product?.metadata || {};
    const explicitPrice =
      Number(metadata?.recliner_base_per_seat) ||
      Number(metadata?.base_price_per_seat) ||
      Number(metadata?.per_seat_price);
    if (explicitPrice) return explicitPrice;
    const netPrice = Number(product?.net_price_rs ?? product?.strike_price_2seater_rs ?? product?.base_price ?? 0);
    const defaultSeatCount = Number(metadata?.default_seat_count ?? metadata?.base_seat_count ?? 1);
    if (netPrice && defaultSeatCount > 0) return Math.round(netPrice / defaultSeatCount);
    return RECLINER_PRICE_PER_UNIT_DEFAULT;
  }, [product?.metadata, product?.net_price_rs, product?.strike_price_2seater_rs, product?.base_price]);

  const sectionSummaries = useMemo(() => {
    return Object.entries(normalizedSections)
      .filter(([_, value]) => value?.type && value.type !== "none")
      .map(([sectionId, value]) => {
        const metadata = seatTypeMetadataLookup.get(value.type) || {};
        const width = calculateSectionWidth(value.type, seatWidth);
        const fabricMeters = calculateFabricForSection(product, value.type);
        const price = calculateReclinerSectionPrice(value.type, basePerSeatPrice);
        return {
          sectionId,
          type: value.type,
          qty: value.qty ?? 1,
          width,
          fabricMeters,
          price,
        };
      });
  }, [normalizedSections, seatWidth, seatTypeMetadataLookup, basePerSeatPrice, product]);

  const totalSeats = useMemo(() => {
    return sectionSummaries.reduce((sum, summary) => {
      const seatCount = getSeatCount(summary.type) * (summary.qty ?? 1);
      return sum + seatCount;
    }, 0);
  }, [sectionSummaries]);

  const totalDummySeats = useMemo(() => {
    const frontDummy = Number(
      configuration.dummySeats?.quantity_per_section?.front ??
        configuration.dummySeats?.F ??
        0
    );
    const leftDummy = Number(
      configuration.dummySeats?.quantity_per_section?.left ??
        configuration.dummySeats?.L ??
        0
    );
    return frontDummy + (isLShape ? leftDummy : 0);
  }, [configuration.dummySeats, isLShape]);

  const sectionsFabricMeters = useMemo(
    () => sectionSummaries.reduce((sum, summary) => sum + summary.fabricMeters, 0),
    [sectionSummaries]
  );

  const dummySeatFabricMeters = useMemo(() => {
    if (!totalDummySeats) return 0;
    const additionalFabric = getReclinerFabricValue(
      product,
      "fabric_additional_seat_mtrs",
      5
    );
    return additionalFabric * totalDummySeats;
  }, [product, totalDummySeats]);

  const activeConsolePlacements = useMemo(() => {
    if (configuration.console?.required !== "Yes" && configuration.console?.required !== true) {
      return [] as any[];
    }
    return (configuration.console?.placements || []).filter(
      (placement: any) => placement && placement.position && placement.position !== "none" && placement.section
    );
  }, [configuration.console?.placements, configuration.console?.required]);

  const consoleFabricMeters = useMemo(() => {
    if (!activeConsolePlacements.length) return 0;
    const consoleSize = configuration.console?.size || "";
    const perConsole = consoleSize.toLowerCase().includes("10")
      ? getReclinerFabricValue(product, "fabric_console_10_mtrs", 2.5)
      : getReclinerFabricValue(product, "fabric_console_6_mtrs", 2.0);
    return perConsole * activeConsolePlacements.length;
  }, [activeConsolePlacements.length, configuration.console?.size, product]);

  const baseFabricMeters = useMemo(
    () => sectionsFabricMeters + dummySeatFabricMeters + consoleFabricMeters,
    [sectionsFabricMeters, dummySeatFabricMeters, consoleFabricMeters]
  );

  const fabricPlanType = useMemo(() => {
    const plan = configuration.fabric?.claddingPlan || "Single Colour";
    if (plan === "Dual Colour" || plan === "Multi Colour") {
      return "Dual Colour" as const;
    }
    return "Single Colour" as const;
  }, [configuration.fabric?.claddingPlan]);

  const fabricPlanSummary = useMemo(() => {
    if (fabricPlanType === "Dual Colour") {
      const structureMeters = baseFabricMeters * 0.75;
      const armrestMeters = baseFabricMeters * 0.3;
      const totalMeters = baseFabricMeters * 1.05;
      return {
        plan: fabricPlanType,
        baseMeters: baseFabricMeters,
        totalMeters,
        structureMeters,
        armrestMeters,
      } as const;
    }
    return {
      plan: fabricPlanType,
      baseMeters: baseFabricMeters,
      totalMeters: baseFabricMeters,
      structureMeters: baseFabricMeters,
      armrestMeters: 0,
    } as const;
  }, [fabricPlanType, baseFabricMeters]);

  const totalFabricMeters = fabricPlanSummary.totalMeters;

  const totalWidth = useMemo(
    () => sectionSummaries.reduce((sum, summary) => sum + summary.width, 0),
    [sectionSummaries]
  );

  const consolePriceLookup = useMemo(() => {
    const map = new Map<string, number>();
    consoleSizes?.forEach((option: any) => {
      if (!option?.option_value) return;
      const metadata = option.metadata || {};
      const price =
        Number(metadata?.sale_price) ||
        Number(metadata?.base_price) ||
        Number(metadata?.price) ||
        Number(metadata?.price_rs);
      if (Number.isFinite(price) && price > 0) {
        map.set(option.option_value, price);
      }
    });
    return map;
  }, [consoleSizes]);

  const getConsoleBasePrice = useCallback(
    (size: string) => {
      const price = consolePriceLookup.get(size);
      if (Number.isFinite(price) && price && price > 0) return price;
      if (!size) return 0;
      return size.includes("6") ? 8000 : 12000;
    },
    [consolePriceLookup]
  );

  const generateAllConsolePlacements = useCallback(() => {
    const consoleRequired = configuration.console?.required === "Yes" || configuration.console?.required === true;
    if (!consoleRequired) return [];

    const frontSeaterType = normalizedSections.F?.type || "1-Seater";
    const leftSeaterType = normalizedShape === "L SHAPE" ? normalizedSections.L2?.type : undefined;

    return generateConsolePlacementsUtil(
      consoleRequired,
      {
        front: frontSeaterType,
        left: leftSeaterType,
      },
      normalizedShape
    );
  }, [configuration.console?.required, normalizedSections, normalizedShape]);

  const fSeatCount = normalizedSections.F ? getSeatCount(normalizedSections.F.type) : 0;
  const l2SeatCount = isLShape && normalizedSections.L2 ? getSeatCount(normalizedSections.L2.type) : 0;

  const mechanismSummaryText = useMemo(() => {
    if (!mechanismTypes || mechanismTypes.length === 0) return "";
    return mechanismTypes
      .map((option: any) => {
        const price = getMechanismPrice(option.option_value);
        const priceLabel = price > 0 ? `(${formatCurrency(price)})` : "(Included)";
        return `${option.display_label || option.option_value} ${priceLabel}`;
      })
      .join(" • ");
  }, [getMechanismPrice, mechanismTypes]);

  const maxConsoleSlots = useMemo(() => calculateMaxConsoles(totalSeats), [totalSeats]);

  useEffect(() => {
    const consoleConfig = configuration.console || {};
    const consoleRequired = consoleConfig.required === "Yes" || consoleConfig.required === true;
    if (!consoleRequired) {
      if ((consoleConfig.quantity ?? 0) !== 0 || (consoleConfig.placements?.length ?? 0) !== 0) {
        updateConfiguration({
          console: {
            ...consoleConfig,
            quantity: 0,
            placements: [],
          },
        });
      }
      return;
    }

    const nextQuantity = Math.min(consoleConfig.quantity ?? maxConsoleSlots, maxConsoleSlots);
    const availablePlacements = generateAllConsolePlacements();
    const sanitizedPlacements = (consoleConfig.placements || [])
      .slice(0, nextQuantity)
      .map((placement: any) => {
        if (!placement || !placement.section || placement.position === "none") {
          return {
            section: null,
            position: "none",
            afterSeat: null,
            accessoryId: null,
          };
        }
        const valueKey = `${placement.section}_${placement.afterSeat ?? placement.position?.split("_")[1] ?? 1}`;
        const isStillValid = availablePlacements.some((p) => p.value === valueKey);
        if (!isStillValid) {
          return {
            section: null,
            position: "none",
            afterSeat: null,
            accessoryId: null,
          };
        }
        return placement;
      });

    while (sanitizedPlacements.length < nextQuantity) {
      sanitizedPlacements.push({
        section: null,
        position: "none",
        afterSeat: null,
        accessoryId: null,
      });
    }

    if (
      (consoleConfig.quantity ?? 0) !== nextQuantity ||
      JSON.stringify(consoleConfig.placements || []) !== JSON.stringify(sanitizedPlacements)
    ) {
      updateConfiguration({
        console: {
          ...consoleConfig,
          quantity: nextQuantity,
          placements: sanitizedPlacements,
        },
      });
    }
  }, [
    configuration.console,
    generateAllConsolePlacements,
    maxConsoleSlots,
    updateConfiguration,
  ]);

  useEffect(() => {
    const dummyConfig = configuration.dummySeats || {};
    const isRequired = dummyConfig.required === true || dummyConfig.required === "Yes";
    if (!isRequired) {
      if (
        (dummyConfig.quantity_per_section?.front ?? dummyConfig.F ?? 0) !== 0 ||
        (dummyConfig.quantity_per_section?.left ?? dummyConfig.L ?? 0) !== 0 ||
        (dummyConfig.placements?.length ?? 0) > 0
      ) {
        updateConfiguration({
          dummySeats: {
            required: false,
            quantity_per_section: {
              front: 0,
              left: 0,
            },
            placements: [],
          },
        });
      }
      return;
    }

    const maxFront = fSeatCount;
    const maxLeft = l2SeatCount;
    const currentFrontRaw = configuration.dummySeats?.quantity_per_section?.front ?? configuration.dummySeats?.F ?? 0;
    const currentLeftRaw = configuration.dummySeats?.quantity_per_section?.left ?? configuration.dummySeats?.L ?? 0;

    let currentFront = Math.min(Number(currentFrontRaw) || 0, maxFront);
    let currentLeft = Math.min(Number(currentLeftRaw) || 0, maxLeft);

    const frontRequiresMandatory = normalizedSections.F?.type === "3-Seater";
    const leftRequiresMandatory = isLShape && normalizedSections.L2?.type === "3-Seater";

    if (frontRequiresMandatory && currentFront < 1) {
      currentFront = 1;
    }
    if (leftRequiresMandatory && currentLeft < 1) {
      currentLeft = 1;
    }

    const sanitizedPlacements = (dummyConfig.placements || []).filter((placement: any) => {
      if (!placement?.section) return false;
      if (placement.section === "L" && !isLShape) return false;
      if (placement.position === "none") return true;
      const seatCountForSection = placement.section === "F" ? maxFront : maxLeft;
      const value = placement.position?.split("_")[1];
      const afterSeat = Number(value);
      return Number.isFinite(afterSeat) && afterSeat > 0 && afterSeat <= seatCountForSection;
    });

    const ensureMandatoryPlacement = (
      sectionKey: "F" | "L",
      required: boolean,
      targetSlot: number,
      list: any[],
    ) => {
      if (!required) return list;
      const hasMandatory = list.some(
        (placement: any) =>
          placement.section === sectionKey &&
          placement.position &&
          placement.position.toLowerCase() === `after_${targetSlot}`
      );
      if (hasMandatory) return list;
      return [
        ...list,
        {
          section: sectionKey,
          slot: targetSlot,
          position: `after_${targetSlot}`,
        },
      ];
    };

    let normalizedPlacements = sanitizedPlacements.map((placement: any, index: number) => ({
      ...placement,
      slot: placement.slot || index + 1,
    }));

    normalizedPlacements = ensureMandatoryPlacement("F", frontRequiresMandatory, 2, normalizedPlacements);
    normalizedPlacements = ensureMandatoryPlacement("L", leftRequiresMandatory, 2, normalizedPlacements);

    const needsUpdate =
      (dummyConfig.quantity_per_section?.front ?? dummyConfig.F ?? 0) !== currentFront ||
      (dummyConfig.quantity_per_section?.left ?? dummyConfig.L ?? 0) !== currentLeft ||
      normalizedPlacements.length !== (dummyConfig.placements || []).length;

    if (needsUpdate) {
      updateConfiguration({
        dummySeats: {
          required: true,
          quantity_per_section: {
            front: currentFront,
            left: currentLeft,
          },
          placements: normalizedPlacements,
        },
      });
    }
  }, [configuration.dummySeats, fSeatCount, isLShape, l2SeatCount, updateConfiguration, normalizedSections]);

  // Load console accessories
  const { data: consoleAccessories, isLoading: loadingAccessories } = useQuery({
    queryKey: ["recliner-console-accessories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accessories_prices")
        .select("id, description, sale_price")
        .eq("is_active", true)
        .order("description");
      if (error) throw error;
      
      // Remove duplicates
      const uniqueAccessories = (data || []).reduce((acc: any[], current: any) => {
        const existing = acc.find((item: any) => item.description === current.description);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      return uniqueAccessories;
    },
  });

  // Generate dummy seat placement options
  const generateDummyPlacementOptions = (section: "F" | "L", seatCount: number) => {
    const options = [];
    for (let i = 1; i <= seatCount; i++) {
      const ordinal = i === 1 ? "st" : i === 2 ? "nd" : i === 3 ? "rd" : "th";
      options.push({
        value: `after_${i}`,
        label: `After ${i}${ordinal} Seat from Left`,
      });
    }
    options.push({ value: "none", label: "None (Unassigned)" });
    return options;
  };

  // Initialize configuration
  useEffect(() => {
    if (!configuration.productId && product?.id) {
      const defaultConfig = {
        productId: product.id,
        category: "recliner",
        baseShape: "STANDARD",
        sections: {
          F: { type: "1-Seater", qty: 1 },
          L1: null,
          L2: null,
        },
        mechanism: {
          sections: {
            front: "Manual",
            left: "Manual",
          },
        },
        dummySeats: {
          required: false,
          quantity_per_section: {
            front: 0,
            left: 0,
          },
          placements: [],
        },
        console: {
          required: "No",
          quantity: 0,
          size: "Console-6 in",
          placements: [],
        },
        fabric: {
          claddingPlan: "Single Colour",
          structureCode: "",
        },
        foam: {
          type: "Firm",
        },
        dimensions: {
          seatDepth: 24,
          seatWidth: 22,
          seatHeight: 18,
        },
      };
      onConfigurationChange(defaultConfig);
    }
  }, [product?.id, configuration.productId, onConfigurationChange]);

  const updateSection = useCallback(
    (sectionId: "F" | "L1" | "L2", field: "type" | "qty", value: any) => {
      const draft = { ...normalizedSections };
      const current = draft[sectionId] ? { ...draft[sectionId] } : { type: "none", qty: 1 };
      if (field === "type") {
        current.type = value;
      } else {
        current.qty = Math.max(1, Number(value) || 1);
      }
      const sanitized = normalizeSectionValue(normalizedShape, sectionId, current);
      if (!sanitized) {
        delete draft[sectionId];
      } else {
        draft[sectionId] = sanitized;
      }
      updateConfiguration({ sections: draft });
    },
    [normalizedSections, normalizedShape, updateConfiguration]
  );

  const getSectionOptions = useCallback(
    (sectionId: "F" | "L1" | "L2") => {
      const allowed = new Set(getAllowedSectionOptions(normalizedShape, sectionId));
      if (sectionId === "L1") {
        return ["Corner", "Backrest"].map((value) => ({
          option_value: value,
          display_label: value,
        }));
      }
      const options = seatTypes?.filter((option: any) => allowed.has(option.option_value));
      if (!options || options.length === 0) {
        return Array.from(allowed).map((value) => ({
          option_value: value,
          display_label: value,
        }));
      }
      return options;
    },
    [normalizedShape, seatTypes]
  );

  const frontSeaterType = normalizedSections.F?.type || SECTION_DEFAULTS.F.type;
  const leftSeaterType = isLShape ? normalizedSections.L2?.type || SECTION_DEFAULTS.L2.type : "";

  const frontMechanismOptions = useMemo(
    () => getAllowedMechanismsForSeater(frontSeaterType),
    [frontSeaterType]
  );

  const leftMechanismOptions = useMemo(
    () => getAllowedMechanismsForSeater(leftSeaterType),
    [leftSeaterType]
  );

  useEffect(() => {
    const allowedFront = frontMechanismOptions;
    if (allowedFront.length > 0 && !allowedFront.includes(configuration.mechanism?.sections?.front || configuration.mechanism?.front)) {
      updateConfiguration({
        mechanism: {
          sections: {
            ...(configuration.mechanism?.sections || configuration.mechanism || {}),
            front: allowedFront[0],
          },
        },
      });
    }

    if (isLShape) {
      const allowedLeft = leftMechanismOptions;
      if (
        allowedLeft.length > 0 &&
        !allowedLeft.includes(configuration.mechanism?.sections?.left || configuration.mechanism?.left)
      ) {
        updateConfiguration({
          mechanism: {
            sections: {
              ...(configuration.mechanism?.sections || configuration.mechanism || {}),
              left: allowedLeft[0],
            },
          },
        });
      }
    }
  }, [configuration.mechanism, frontMechanismOptions, leftMechanismOptions, isLShape, updateConfiguration]);

  const defaultMechanism = mechanismTypes?.[0]?.option_value || "Manual";
  const frontMechanism =
    configuration.mechanism?.sections?.front || configuration.mechanism?.front || defaultMechanism;
  const leftMechanism =
    configuration.mechanism?.sections?.left || configuration.mechanism?.left || defaultMechanism;
  const frontMechanismPrice = getMechanismPrice(frontMechanism);
  const leftMechanismPrice = isLShape ? getMechanismPrice(leftMechanism) : 0;
  const totalMechanismPrice = frontMechanismPrice + leftMechanismPrice;

  // Show loading state
  if (isLoadingDropdowns && (!shapes || shapes.length === 0)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading configuration options...</p>
        </div>
      </div>
    );
  }

  const sections = normalizedSections;

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl font-serif">Configuration</CardTitle>
          <CardDescription>Customize your perfect recliner</CardDescription>
          {isLoadingDropdowns && (
            <Alert className="mt-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Loading dropdown options from database...</AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Shape Selection - Card Based */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Base Shape</Label>
            {shapesResult.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : shapes && shapes.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {shapes
                  .filter((shape: any) => shape && shape.option_value)
                  .map((shape: any) => {
                    const shapeValue = shape.option_value;
                    const normalizedShapeValue = normalizeShape(shapeValue);
                    const currentNormalizedShape = normalizeShape(configuration.baseShape || '');
                    const isSelected = currentNormalizedShape === normalizedShapeValue;
                    
                    const getShapeIcon = () => {
                      const shapeLower = shapeValue.toLowerCase();
                      if (shapeLower.includes("l-shape") || shapeLower.includes("l shape")) {
                        return (
                          <div className="relative w-12 h-12">
                            <Square className="w-8 h-8 absolute top-0 left-0" />
                            <Square className="w-6 h-6 absolute bottom-0 right-0" />
                          </div>
                        );
                      } else {
                        return <Square className="w-12 h-12" />;
                      }
                    };
                    
                    return (
                      <SelectionCard
                        key={shape.id}
                        label={shape.display_label || shape.option_value}
                        icon={getShapeIcon()}
                        isSelected={isSelected}
                        onClick={() => {
                          const normalized = normalizeShape(shapeValue);
                          const updates: any = { baseShape: normalized };
                          if (normalized === "STANDARD") {
                            updates.sections = {
                              F: configuration.sections?.F || { type: "1-Seater", qty: 1 },
                              L1: null,
                              L2: null,
                            };
                          } else if (normalized === "L SHAPE") {
                            updates.sections = {
                              F: configuration.sections?.F || { type: "1-Seater", qty: 1 },
                              L1: { type: "Corner", qty: 1 },
                              L2: { type: "1-Seater", qty: 1 },
                            };
                          }
                          updateConfiguration(updates);
                        }}
                      />
                    );
                  })}
              </div>
            ) : (
              <Alert>
                <AlertDescription>No shape options available</AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* Section Configuration - Only show after shape is selected */}
          {configuration.baseShape && (
            <>
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Section Configuration</Label>
                
                {/* F Section */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <Label>Front Section (F)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Seat Type</Label>
                        <Select
                          value={sections.F?.type || SECTION_DEFAULTS.F.type}
                          onValueChange={(value) => updateSection("F", "type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getSectionOptions("F").map((type: any) => (
                              <SelectItem key={type.option_value} value={type.option_value}>
                                {type.display_label || type.option_value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          max="4"
                          value={sections.F?.qty || 1}
                          onChange={(e) => updateSection("F", "qty", parseInt(e.target.value, 10) || 1)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* L1 & L2 Sections - Only for L SHAPE */}
                {isLShape && (
                  <>
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <Label>Left Corner (L1)</Label>
                        <Select
                          value={sections.L1?.type || SECTION_DEFAULTS.L1.type}
                          onValueChange={(value) => updateSection("L1", "type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getSectionOptions("L1").map((option: any) => (
                              <SelectItem key={option.option_value} value={option.option_value}>
                                {option.display_label || option.option_value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Corner: 50% of base price | Backrest: 20% of base price
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <Label>Left Section (L2)</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm">Seat Type</Label>
                            <Select
                          value={sections.L2?.type || SECTION_DEFAULTS.L2.type}
                              onValueChange={(value) => updateSection("L2", "type", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                            {getSectionOptions("L2")
                              .filter((type: any) => type.option_value !== "Corner" && type.option_value !== "Backrest")
                              .map((type: any) => (
                                <SelectItem key={type.option_value} value={type.option_value}>
                                  {type.display_label || type.option_value}
                                </SelectItem>
                              ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              max="4"
                              value={sections.L2?.qty || 1}
                              onChange={(e) => updateSection("L2", "qty", parseInt(e.target.value, 10) || 1)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Total Seats Display */}
                <Card className="bg-muted">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium">Total Seats</p>
                    <p className="text-2xl font-bold">{totalSeats}</p>
                  </CardContent>
                </Card>

                {sectionSummaries.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold">Active Sections Summary</CardTitle>
                      <CardDescription>
                        Width and fabric requirements calculated with seat width {seatWidth}" and admin multipliers.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3">
                        {sectionSummaries.map((summary) => (
                          <div
                            key={summary.sectionId}
                            className="flex flex-col gap-1 rounded-lg border border-border/60 p-3 bg-muted/40"
                          >
                            <div className="flex items-center gap-2 text-sm font-semibold">
                              <Badge variant="outline">{summary.sectionId}</Badge>
                              <span>{summary.type}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
                              <div className="space-y-1">
                                <p className="font-medium text-foreground">Width</p>
                                <p>{summary.width.toFixed(0)} in</p>
                              </div>
                              <div className="space-y-1">
                                <p className="font-medium text-foreground">Fabric</p>
                                <p>{summary.fabricMeters.toFixed(2)} m</p>
                              </div>
                              <div className="space-y-1">
                                <p className="font-medium text-foreground">Seats</p>
                                <p>{getSeatCount(summary.type)}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="font-medium text-foreground">Price</p>
                                <p>{formatCurrency(summary.price)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Section Fabric</span>
                          <span>{sectionsFabricMeters.toFixed(2)} m</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Dummy Seats Fabric</span>
                          <span>{dummySeatFabricMeters.toFixed(2)} m</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Console Fabric</span>
                          <span>{consoleFabricMeters.toFixed(2)} m</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Base Fabric (Single Plan)</span>
                          <span>{fabricPlanSummary.baseMeters.toFixed(2)} m</span>
                        </div>
                        {fabricPlanSummary.plan === "Dual Colour" && (
                          <>
                            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                              <span className="font-semibold">Structure / Backrest / Seat (75%)</span>
                              <span>{fabricPlanSummary.structureMeters.toFixed(2)} m</span>
                            </div>
                            <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                              <span className="font-semibold">Armrest (30%)</span>
                              <span>{fabricPlanSummary.armrestMeters.toFixed(2)} m</span>
                            </div>
                          </>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Fabric Plan</span>
                          <span>{fabricPlanSummary.plan}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Total Fabric Required</span>
                          <span>{fabricPlanSummary.totalMeters.toFixed(2)} m</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Total Width</span>
                          <span>{totalWidth.toFixed(0)} in</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Separator />
            </>
          )}

          {/* Mechanisms - Required per section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Recliner Mechanisms</Label>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {mechanismSummaryText || "Mechanism pricing is loaded from admin settings."}
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Front Recliner Mechanism
                  {frontMechanismPrice > 0 && (
                    <Badge variant="outline" className="ml-auto">
                      ₹{frontMechanismPrice.toLocaleString()}
                    </Badge>
                  )}
                </Label>
                <Select
                  value={frontMechanism}
                  onValueChange={(value) => {
                    const mechanismSections = configuration.mechanism?.sections || configuration.mechanism || {};
                    updateConfiguration({
                      mechanism: {
                        sections: {
                          ...mechanismSections,
                          front: value
                        }
                      }
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frontMechanismOptions.length === 0 ? (
                      <SelectItem value="Manual" disabled>
                        Not available for this section
                      </SelectItem>
                    ) : (
                      frontMechanismOptions.map((type) => {
                        const option = mechanismTypes?.find((opt: any) => opt.option_value === type);
                        const label = option?.display_label || option?.option_value || type;
                        const price = getMechanismPrice(type);
                        return (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center justify-between w-full">
                              <span>{label}</span>
                              {price > 0 && (
                                <Badge variant="outline" className="ml-2">
                                  ₹{price.toLocaleString()}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>

              {isLShape && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Left Recliner Mechanism
                    {leftMechanismPrice > 0 && (
                      <Badge variant="outline" className="ml-auto">
                        ₹{leftMechanismPrice.toLocaleString()}
                      </Badge>
                    )}
                  </Label>
                  <Select
                    value={leftMechanism}
                    onValueChange={(value) => {
                      const mechanismSections = configuration.mechanism?.sections || configuration.mechanism || {};
                      updateConfiguration({
                        mechanism: {
                          sections: {
                            ...mechanismSections,
                            left: value
                          }
                        }
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {leftMechanismOptions.length === 0 ? (
                        <SelectItem value="Manual" disabled>
                          Not available for this section
                        </SelectItem>
                      ) : (
                        leftMechanismOptions.map((type) => {
                          const option = mechanismTypes?.find((opt: any) => opt.option_value === type);
                          const label = option?.display_label || option?.option_value || type;
                          const price = getMechanismPrice(type);
                          return (
                            <SelectItem key={type} value={type}>
                              <div className="flex items-center justify-between w-full">
                                <span>{label}</span>
                                {price > 0 && (
                                  <Badge variant="outline" className="ml-2">
                                    ₹{price.toLocaleString()}
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Total Mechanism Cost */}
              <Card className="bg-muted">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Total Mechanism Cost</p>
                    <p className="text-2xl font-bold">₹{totalMechanismPrice.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Console Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Console</Label>
              <Select
                value={configuration.console?.required === "Yes" ? "Yes" : "No"}
                onValueChange={(value) => {
                  const isRequired = value === "Yes";
                  updateConfiguration({
                    console: {
                      ...configuration.console,
                      required: isRequired ? "Yes" : "No",
                      quantity: isRequired ? (configuration.console?.quantity || 1) : 0,
                      placements: isRequired ? (configuration.console?.placements || []) : [],
                    }
                  });
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {configuration.console?.required === "Yes" && (
              <div className="space-y-4 pt-2 pl-4 border-l-2 border-muted">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Maximum console slots based on active seats: {maxConsoleSlots}. Additional placements are disabled automatically.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Console Size</Label>
                  <Select
                    value={configuration.console?.size || "Console-6 in"}
                    onValueChange={(value) => updateConfiguration({
                      console: { ...configuration.console, size: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {consoleSizesResult.isLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : consoleSizes && consoleSizes.length > 0 ? (
                        consoleSizes
                          .filter((size: any) => size && size.option_value)
                          .map((size: any) => (
                            <SelectItem key={size.id} value={size.option_value}>
                              {size.display_label || size.option_value}
                            </SelectItem>
                          ))
                      ) : (
                        <>
                          <SelectItem value="Console-6 in">6 inches (₹8,000)</SelectItem>
                          <SelectItem value="Console-10 In">10 inches (₹12,000)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Console Quantity</Label>
                  <Input
                    type="number"
                    min="0"
                    max={maxConsoleSlots}
                    value={configuration.console?.quantity || 0}
                    onChange={(e) => {
                      const quantity = parseInt(e.target.value, 10) || 0;
                      const currentPlacements = configuration.console?.placements || [];
                      let placements = [...currentPlacements];
                      
                      // Ensure placements array matches quantity
                      if (placements.length < quantity) {
                      while (placements.length < quantity) {
                        placements.push({
                          section: null,
                          position: "none",
                          afterSeat: null,
                          accessoryId: null
                        });
                      }
                      } else if (placements.length > quantity) {
                        placements = placements.slice(0, quantity);
                      }
                      
                      updateConfiguration({
                        console: {
                          ...configuration.console,
                          quantity: quantity,
                          placements: placements,
                        }
                      });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Console quantity cannot exceed {maxConsoleSlots} (total seats - 1)
                  </p>
                </div>

                {/* Console Placements & Accessories */}
                {configuration.console?.quantity > 0 && (() => {
                  const allPlacements = generateAllConsolePlacements();
                  const maxConsoles = configuration.console?.quantity || 0;
                  let currentPlacements = configuration.console?.placements || [];
                  
                  // Ensure we have exactly maxConsoles slots
                  if (currentPlacements.length < maxConsoles) {
                    currentPlacements = [...currentPlacements];
                    while (currentPlacements.length < maxConsoles) {
                      currentPlacements.push({
                        section: null,
                        position: "none",
                        accessoryId: null
                      });
                    }
                  } else if (currentPlacements.length > maxConsoles) {
                    currentPlacements = currentPlacements.slice(0, maxConsoles);
                  }
                  
                  // Display all slots
                  return Array(maxConsoles).fill(null).map((_, index: number) => {
                    const currentPlacement = currentPlacements[index] || {
                      section: null,
                      position: "none",
                      afterSeat: null,
                      accessoryId: null
                    };
                    
                    // Check if this slot is active (not "none")
                    const isActive = currentPlacement.position && 
                                     currentPlacement.position !== "none" && 
                                     currentPlacement.section;
                    
                    // Get current placement value for the select dropdown
                    const currentPlacementValue = isActive
                      ? `${currentPlacement.section}_${currentPlacement.afterSeat || currentPlacement.position?.split('_')[1] || 1}`
                      : "none";
                    
                    // Filter out placements that are already selected by OTHER console slots
                    const otherActivePlacements = currentPlacements
                      .map((p: any, i: number) => {
                        if (i === index) return null;
                        if (p.position && p.position !== "none" && p.section) {
                          return `${p.section}_${p.afterSeat || p.position?.split('_')[1] || 1}`;
                        }
                        return null;
                      })
                      .filter(Boolean);
                    
                    // Get available placement options
                    const availablePlacements = allPlacements.length > 0 
                      ? allPlacements.filter((placement) => {
                          if (placement.value === currentPlacementValue) return true;
                          return !otherActivePlacements.includes(placement.value);
                        })
                      : [];
                    
                    return (
                      <div key={`console-slot-${index}`} className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">Console Slot {index + 1}</Label>
                          {isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Placement</Label>
                          <Select
                            key={`console-select-${index}`}
                            value={currentPlacementValue}
                            onValueChange={(value) => {
                              const freshPlacements = [...(configuration.console?.placements || [])];
                              
                              while (freshPlacements.length < maxConsoles) {
                                freshPlacements.push({
                                  section: null,
                                  position: "none",
                                  afterSeat: null,
                                  accessoryId: null
                                });
                              }
                              
                              if (value === "none") {
                                freshPlacements[index] = {
                                  section: null,
                                  position: "none",
                                  afterSeat: null,
                                  accessoryId: null
                                };
                              } else {
                                const placement = availablePlacements.find(p => p.value === value);
                                if (placement) {
                                  const afterSeat = parseInt(placement.position.split('_')[1] || "1", 10);
                                  freshPlacements[index] = {
                                    section: placement.section,
                                    position: placement.position,
                                    afterSeat: afterSeat,
                                    accessoryId: freshPlacements[index]?.accessoryId || null
                                  };
                                }
                              }
                              
                              updateConfiguration({
                                console: { 
                                  ...configuration.console, 
                                  placements: freshPlacements,
                                  quantity: maxConsoles
                                },
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select console placement" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {availablePlacements.map((placement) => (
                                <SelectItem key={placement.value} value={placement.value}>
                                  {placement.label}
                                </SelectItem>
                              ))}
                              {availablePlacements.length === 0 && (
                                <SelectItem value="no-options" disabled>
                                  No console positions available (need at least 2 seats)
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Only show accessory selector if placement is not "none" */}
                        {isActive && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Accessory</Label>
                            <Select
                              value={currentPlacement.accessoryId || "none"}
                              onValueChange={(value) => {
                                const freshPlacements = [...(configuration.console?.placements || [])];
                                if (freshPlacements[index]) {
                                  freshPlacements[index] = {
                                    ...freshPlacements[index],
                                    accessoryId: value === "none" ? null : value
                                  };
                                  updateConfiguration({
                                    console: { ...configuration.console, placements: freshPlacements },
                                  });
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select accessory (optional)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {loadingAccessories ? (
                                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                                ) : consoleAccessories && consoleAccessories.length > 0 ? (
                                  consoleAccessories.map((acc: any) => (
                                    <SelectItem key={acc.id} value={acc.id}>
                                      {acc.description} - ₹{Number(acc.sale_price || 0).toLocaleString()}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-data" disabled>No accessories available</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}

                {/* Active Consoles Summary */}
                {(() => {
                  if (activeConsolePlacements.length === 0) return null;
 
                   const consoleSize = configuration.console?.size || "";
                   const baseConsolePrice = getConsoleBasePrice(consoleSize);
 
                   return (
                     <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-300 dark:from-green-950/20 dark:to-blue-950/20 dark:border-green-800">
                       <CardHeader className="p-0 pb-3">
                         <CardTitle className="text-base font-semibold flex items-center gap-2">
                           <span>✓</span> Active Consoles Summary
                         </CardTitle>
                       </CardHeader>
                       <CardContent className="p-0 space-y-2">
                         {activeConsolePlacements.map((placement: any, index: number) => {
                           const placementLabel = generateAllConsolePlacements().find(
                             p => p.value === `${placement.section}_${placement.afterSeat || placement.position?.split('_')[1] || 1}`
                           )?.label || `${placement.section}: After ${placement.afterSeat || placement.position?.split('_')[1] || 1} seat`;
                           
                           const accessory = consoleAccessories?.find((acc: any) => acc.id === placement.accessoryId);
                           const accessoryPrice = accessory ? (Number(accessory.sale_price) || 0) : 0;
                           const consolePrice = baseConsolePrice + accessoryPrice;

                           return (
                             <div
                               key={`summary-${placement.section}-${placement.position}-${index}`}
                               className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                             >
                               <div className="flex items-start justify-between">
                                 <div className="flex-1">
                                   <div className="font-semibold text-sm mb-1">
                                     Console {index + 1}
                                   </div>
                                   <div className="text-sm text-muted-foreground">
                                     📍 {placementLabel}
                                   </div>
                                   {accessory && (
                                     <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                       + {accessory.description} (₹{accessoryPrice.toLocaleString()})
                                     </div>
                                   )}
                                 </div>
                                 <div className="text-right">
                                   <div className="font-bold text-green-600 dark:text-green-400">
                                     ₹{consolePrice.toLocaleString()}
                                   </div>
                                   <div className="text-xs text-muted-foreground">
                                     {consoleSize || "10 in"}
                                   </div>
                                 </div>
                               </div>
                             </div>
                           );
                         })}
                         
                         <div className="pt-3 border-t border-gray-300 dark:border-gray-700">
                           <div className="flex items-center justify-between">
                             <span className="font-semibold text-sm">Total Console Cost:</span>
                             <span className="text-sm text-muted-foreground">
                               (Calculated in price summary)
                             </span>
                           </div>
                           <p className="text-xs text-muted-foreground mt-1">
                             {activeConsolePlacements.length} active console{activeConsolePlacements.length !== 1 ? 's' : ''} configured
                           </p>
                         </div>
                       </CardContent>
                     </Card>
                   );
                 })()}
              </div>
            )}
          </div>

          <Separator />

          {/* Dummy Seats */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Dummy Seats</Label>
              <Select
                value={(configuration.dummySeats?.required === true || configuration.dummySeats?.required === "Yes") ? "Yes" : "No"}
                onValueChange={(value) => {
                  const isRequired = value === "Yes";
                  updateConfiguration({
                    dummySeats: {
                      required: isRequired,
                      quantity_per_section: {
                        front: isRequired ? (configuration.dummySeats?.quantity_per_section?.front || configuration.dummySeats?.F || 0) : 0,
                        left: isRequired ? (configuration.dummySeats?.quantity_per_section?.left || configuration.dummySeats?.L || 0) : 0,
                      },
                      placements: isRequired ? (configuration.dummySeats?.placements || []) : [],
                    }
                  });
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(configuration.dummySeats?.required === true || configuration.dummySeats?.required === "Yes") && (
              <div className="space-y-4 pt-2 pl-4 border-l-2 border-muted">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Dummy seats are non-reclining seats that cost 55% of the regular seat price. They can be placed between reclining seats.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  {/* Front Section Dummy Seats */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Front Section Dummy Seats</Label>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Number of Dummy Seats</Label>
                      <Input
                        type="number"
                        min="0"
                        max={fSeatCount}
                        value={configuration.dummySeats?.quantity_per_section?.front || configuration.dummySeats?.F || 0}
                        onChange={(e) => {
                          const count = parseInt(e.target.value, 10) || 0;
                          const currentPlacements = Array.isArray(configuration.dummySeats?.placements) 
                            ? configuration.dummySeats.placements 
                            : [];
                          
                          const updatedPlacements = currentPlacements
                            .filter((p: any) => !(p.section === "F" && p.slot > count))
                            .map((p: any) => {
                              if (p.section === "F") {
                                const slotIndex = currentPlacements.filter((pl: any) => pl.section === "F" && pl.slot <= p.slot).length;
                                return { ...p, slot: slotIndex };
                              }
                              return p;
                            });
                          
                          const currentFrontCount = currentPlacements.filter((p: any) => p.section === "F").length;
                          for (let i = currentFrontCount; i < count; i++) {
                            updatedPlacements.push({
                              section: "F",
                              slot: i + 1,
                              position: "none"
                            });
                          }
                          
                          updateConfiguration({
                            dummySeats: {
                              ...configuration.dummySeats,
                              quantity_per_section: {
                                front: count,
                                left: configuration.dummySeats?.quantity_per_section?.left || configuration.dummySeats?.L || 0,
                              },
                              placements: updatedPlacements,
                            }
                          });
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum: {fSeatCount} dummy seat(s) for Front section
                      </p>
                    </div>
                    
                    {/* Dummy Seat Placements for Front */}
                    {Array.from({ length: (configuration.dummySeats?.quantity_per_section?.front || configuration.dummySeats?.F || 0) }, (_, i) => {
                      const slot = i + 1;
                      const currentPlacements = Array.isArray(configuration.dummySeats?.placements) 
                        ? configuration.dummySeats.placements 
                        : [];
                      const placement = currentPlacements.find((p: any) => p.section === "F" && p.slot === slot) || {
                        section: "F",
                        slot: slot,
                        position: "none"
                      };
                      const placementOptions = generateDummyPlacementOptions("F", fSeatCount);
                      
                      return (
                        <div key={i} className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                          <Label className="text-xs font-semibold">Front Dummy Seat {slot} Placement</Label>
                          <Select
                            value={placement.position || "none"}
                            onValueChange={(value) => {
                              const updatedPlacements = [...(Array.isArray(configuration.dummySeats?.placements) ? configuration.dummySeats.placements : [])];
                              const existingIndex = updatedPlacements.findIndex((p: any) => p.section === "F" && p.slot === slot);
                              
                              if (existingIndex >= 0) {
                                updatedPlacements[existingIndex] = {
                                  ...updatedPlacements[existingIndex],
                                  position: value
                                };
                              } else {
                                updatedPlacements.push({
                                  section: "F",
                                  slot: slot,
                                  position: value
                                });
                              }
                              
                              updateConfiguration({
                                dummySeats: {
                                  ...configuration.dummySeats,
                                  placements: updatedPlacements,
                                }
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {placementOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>

                  {/* Left Section Dummy Seats - Only for L SHAPE */}
                  {isLShape && (
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Left Section Dummy Seats</Label>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Number of Dummy Seats</Label>
                        <Input
                          type="number"
                          min="0"
                          max={l2SeatCount}
                          value={configuration.dummySeats?.quantity_per_section?.left || configuration.dummySeats?.L || 0}
                          onChange={(e) => {
                            const count = parseInt(e.target.value, 10) || 0;
                            const currentPlacements = Array.isArray(configuration.dummySeats?.placements) 
                              ? configuration.dummySeats.placements 
                              : [];
                            
                            const updatedPlacements = currentPlacements
                              .filter((p: any) => !(p.section === "L" && p.slot > count))
                              .map((p: any) => {
                                if (p.section === "L") {
                                  const slotIndex = currentPlacements.filter((pl: any) => pl.section === "L" && pl.slot <= p.slot).length;
                                  return { ...p, slot: slotIndex };
                                }
                                return p;
                              });
                            
                            const currentLeftCount = currentPlacements.filter((p: any) => p.section === "L").length;
                            for (let i = currentLeftCount; i < count; i++) {
                              updatedPlacements.push({
                                section: "L",
                                slot: i + 1,
                                position: "none"
                              });
                            }
                            
                            updateConfiguration({
                              dummySeats: {
                                ...configuration.dummySeats,
                                quantity_per_section: {
                                  front: configuration.dummySeats?.quantity_per_section?.front || configuration.dummySeats?.F || 0,
                                  left: count,
                                },
                                placements: updatedPlacements,
                              }
                            });
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum: {l2SeatCount} dummy seat(s) for Left section
                        </p>
                      </div>
                      
                      {/* Dummy Seat Placements for Left */}
                      {Array.from({ length: (configuration.dummySeats?.quantity_per_section?.left || configuration.dummySeats?.L || 0) }, (_, i) => {
                        const slot = i + 1;
                        const currentPlacements = Array.isArray(configuration.dummySeats?.placements) 
                          ? configuration.dummySeats.placements 
                          : [];
                        const placement = currentPlacements.find((p: any) => p.section === "L" && p.slot === slot) || {
                          section: "L",
                          slot: slot,
                          position: "none"
                        };
                        const placementOptions = generateDummyPlacementOptions("L", l2SeatCount);
                        
                        return (
                          <div key={i} className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                            <Label className="text-xs font-semibold">Left Dummy Seat {slot} Placement</Label>
                            <Select
                              value={placement.position || "none"}
                              onValueChange={(value) => {
                                const updatedPlacements = [...(Array.isArray(configuration.dummySeats?.placements) ? configuration.dummySeats.placements : [])];
                                const existingIndex = updatedPlacements.findIndex((p: any) => p.section === "L" && p.slot === slot);
                                
                                if (existingIndex >= 0) {
                                  updatedPlacements[existingIndex] = {
                                    ...updatedPlacements[existingIndex],
                                    position: value
                                  };
                                } else {
                                  updatedPlacements.push({
                                    section: "L",
                                    slot: slot,
                                    position: value
                                  });
                                }
                                
                                updateConfiguration({
                                  dummySeats: {
                                    ...configuration.dummySeats,
                                    placements: updatedPlacements,
                                  }
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {placementOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Fabric Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Fabric Selection</Label>
            <FabricSelector
              configuration={configuration}
              onConfigurationChange={onConfigurationChange}
            />
          </div>

          <Separator />

          {/* Specifications */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Specifications</Label>
            
            <div className="space-y-4">
              {/* Foam Type */}
              <div className="space-y-2">
                <Label>Foam Type</Label>
                <Select
                  value={configuration.foam?.type || "Firm"}
                  onValueChange={(value) => updateConfiguration({
                    foam: { type: value }
                  })}
                  disabled={foamTypesResult.isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {foamTypesResult.isLoading ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : foamTypes && foamTypes.length > 0 ? (
                      foamTypes.map((foam: any) => (
                        <SelectItem key={foam.id} value={foam.option_value}>
                          {foam.display_label || foam.option_value}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-data" disabled>No options available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Dimensions */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Seat Depth (inches)</Label>
                  {seatDepthsResult.isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Select disabled>
                        <SelectTrigger>
                          <SelectValue placeholder="Loading..." />
                        </SelectTrigger>
                      </Select>
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <Select
                      value={
                        seatDepths && seatDepths.length > 0
                          ? (seatDepths.find((d: any) => {
                              const storedValue = configuration.dimensions?.seatDepth || 24;
                              const optionValue = Number(d.option_value);
                              return optionValue === storedValue;
                            })?.option_value || String(configuration.dimensions?.seatDepth || 24))
                          : String(configuration.dimensions?.seatDepth || 24)
                      }
                      onValueChange={(value) => updateConfiguration({
                        dimensions: { ...configuration.dimensions, seatDepth: Number(value) }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select seat depth" />
                      </SelectTrigger>
                      <SelectContent>
                        {seatDepths && seatDepths.length > 0 ? (
                          seatDepths.map((depth: any) => {
                            const depthValue = Number(depth.option_value);
                            const upgradePercent = depthValue === 22 || depthValue === 24 ? 0 : depthValue === 26 ? 3 : depthValue === 28 ? 6 : 0;
                            const label = depth.display_label || depth.option_value;
                            return (
                              <SelectItem key={depth.id} value={depth.option_value}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{label}</span>
                                  {upgradePercent > 0 && (
                                    <Badge variant="outline" className="ml-2">
                                      +{upgradePercent}%
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem value="no-data" disabled>No options available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground">
                    22" or 24": Standard | 26": +3% | 28": +6%
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Seat Width (inches)</Label>
                  {seatWidthsResult.isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Select disabled>
                        <SelectTrigger>
                          <SelectValue placeholder="Loading..." />
                        </SelectTrigger>
                      </Select>
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <Select
                      value={
                        seatWidths && seatWidths.length > 0
                          ? (seatWidths.find((w: any) => {
                              const storedValue = configuration.dimensions?.seatWidth || 22;
                              const optionValue = Number(w.option_value);
                              return optionValue === storedValue;
                            })?.option_value || String(configuration.dimensions?.seatWidth || 22))
                          : String(configuration.dimensions?.seatWidth || 22)
                      }
                      onValueChange={(value) => updateConfiguration({
                        dimensions: { ...configuration.dimensions, seatWidth: Number(value) }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select seat width" />
                      </SelectTrigger>
                      <SelectContent>
                        {seatWidths && seatWidths.length > 0 ? (
                          seatWidths.map((width: any) => {
                            const widthValue = Number(width.option_value);
                            const upgradePercent = widthValue === 22 || widthValue === 24 ? 0 : widthValue === 26 ? 6.5 : widthValue === 28 ? 13 : 0;
                            const label = width.display_label || width.option_value;
                            return (
                              <SelectItem key={width.id} value={width.option_value}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{label}</span>
                                  {upgradePercent > 0 && (
                                    <Badge variant="outline" className="ml-2">
                                      +{upgradePercent}%
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem value="no-data" disabled>No options available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground">
                    22" or 24": Standard | 26": +6.5% | 28": +13%
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Seat Height (inches)</Label>
                  {seatHeightsResult.isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Select disabled>
                        <SelectTrigger>
                          <SelectValue placeholder="Loading..." />
                        </SelectTrigger>
                      </Select>
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <Select
                      value={
                        seatHeights && seatHeights.length > 0
                          ? (seatHeights.find((h: any) => {
                              const storedValue = configuration.dimensions?.seatHeight || 18;
                              const optionValue = Number(h.option_value);
                              return optionValue === storedValue;
                            })?.option_value || String(configuration.dimensions?.seatHeight || 18))
                          : String(configuration.dimensions?.seatHeight || 18)
                      }
                      onValueChange={(value) => updateConfiguration({
                        dimensions: { ...configuration.dimensions, seatHeight: Number(value) }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select seat height" />
                      </SelectTrigger>
                      <SelectContent>
                        {seatHeights && seatHeights.length > 0 ? (
                          seatHeights.map((height: any) => (
                            <SelectItem key={height.id} value={height.option_value}>
                              {height.display_label || height.option_value}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-data" disabled>No options available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground">No pricing impact</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReclinerConfigurator;
