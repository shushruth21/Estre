import { useState, useEffect, useMemo, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import FabricSelector from "./FabricSelector";
import { FabricLibrary } from "@/components/ui/FabricLibrary";
import { SelectionCard } from "@/components/ui/SelectionCard";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Download, Info, Loader2, Square, LayoutGrid } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateAllConsolePlacements as generateConsolePlacementsUtil, calculateMaxConsoles } from "@/lib/console-validation";
import { SummaryTile } from "@/components/ui/SummaryTile";

const SECTION_ACTIVATION: Record<"STANDARD" | "L SHAPE" | "U SHAPE" | "COMBO", Record<string, boolean>> = {
  STANDARD: { F: true, L1: false, L2: false, R1: false, R2: false, C1: false, C2: false },
  "L SHAPE": { F: true, L1: true, L2: true, R1: false, R2: false, C1: false, C2: false },
  "U SHAPE": { F: true, L1: true, L2: true, R1: true, R2: true, C1: false, C2: false },
  COMBO: { F: true, L1: true, L2: true, R1: true, R2: true, C1: true, C2: true },
};

const SECTION_OPTION_MAP: Record<string, string[]> = {
  F: ["2-Seater", "3-Seater", "4-Seater", "2-Seater No Mech", "3-Seater No Mech", "4-Seater No Mech"],
  L1: ["Corner", "Backrest", "none"],
  L2: ["2-Seater", "3-Seater", "4-Seater", "2-Seater No Mech", "3-Seater No Mech", "4-Seater No Mech", "none"],
  R1: ["Corner", "Backrest", "none"],
  R2: ["2-Seater", "3-Seater", "4-Seater", "2-Seater No Mech", "3-Seater No Mech", "4-Seater No Mech", "none"],
  C1: ["Backrest", "none"],
  C2: ["2-Seater", "3-Seater", "4-Seater", "2-Seater No Mech", "3-Seater No Mech", "4-Seater No Mech", "none"],
};

const SECTION_DEFAULTS: Record<string, { seater: string; qty: number }> = {
  F: { seater: "2-Seater", qty: 1 },
  L1: { seater: "Corner", qty: 1 },
  L2: { seater: "2-Seater", qty: 1 },
  R1: { seater: "Corner", qty: 1 },
  R2: { seater: "2-Seater", qty: 1 },
  C1: { seater: "Backrest", qty: 1 },
  C2: { seater: "2-Seater", qty: 1 },
};

const CORNER_WIDTH_BY_SEAT: Record<number, number> = {
  22: 36,
  24: 38,
  26: 40,
  30: 42,
};

const BACKREST_WIDTH = 14;

const PRICING_PERCENTAGES = {
  base: 100,
  additionalSeat: 35,
  corner: 65,
  backrest: 14,
};

const parseSeatWidthValue = (value?: string | number): number => {
  if (!value && value !== 0) return 24;
  if (typeof value === "number") return value;
  const numericMatch = value.match(/([\d.]+)/);
  if (numericMatch && numericMatch[1]) {
    return Number(numericMatch[1]);
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 24;
};

const calculateSectionWidth = (seaterType: string, seatWidth: number): number => {
  if (!seaterType || seaterType === "none") return 0;
  const lowerType = seaterType.toLowerCase();
  if (lowerType.includes("backrest")) {
    return BACKREST_WIDTH;
  }
  if (lowerType.includes("corner")) {
    return CORNER_WIDTH_BY_SEAT[seatWidth] ?? CORNER_WIDTH_BY_SEAT[30];
  }
  const seatMatch = seaterType.match(/(\d+)-Seater/);
  if (!seatMatch) return 0;
  const seatCount = parseInt(seatMatch[1], 10);
  return seatCount * seatWidth;
};

const calculateFabricMetersForSection = (seaterType: string, width: number): number => {
  if (!seaterType || seaterType === "none") return 0;
  const lowerType = seaterType.toLowerCase();
  if (lowerType.includes("backrest")) {
    return 2.0;
  }
  if (lowerType.includes("corner")) {
    return 7.0;
  }
  if (width <= 0) return 0;
  const meters = (width / 120) * 21;
  return Number(meters.toFixed(2));
};

const isSectionActive = (shape: "STANDARD" | "L SHAPE" | "U SHAPE" | "COMBO", sectionId: string) => {
  return SECTION_ACTIVATION[shape]?.[sectionId] ?? false;
};

const getAllowedOptionsForSection = (shape: "STANDARD" | "L SHAPE" | "U SHAPE" | "COMBO", sectionId: string) => {
  if (!isSectionActive(shape, sectionId)) {
    return ["none"];
  }
  const options = SECTION_OPTION_MAP[sectionId] || ["none"];
  if (sectionId === "C1" && shape !== "COMBO") {
    // When C1 is not active (STANDARD/L/U) the map won't be used,
    // but ensure we return none-only guard if invoked.
    return ["none"];
  }
  return options;
};

const normalizeSectionValue = (
  shape: "STANDARD" | "L SHAPE" | "U SHAPE" | "COMBO",
  sectionId: string,
  value?: { seater?: string; qty?: number }
) => {
  if (!isSectionActive(shape, sectionId)) {
    return undefined;
  }
  const allowedOptions = getAllowedOptionsForSection(shape, sectionId);
  const defaultValue = SECTION_DEFAULTS[sectionId] || { seater: "none", qty: 1 };
  const currentSeater = value?.seater || defaultValue.seater;
  const normalizedSeater = allowedOptions.includes(currentSeater) ? currentSeater : allowedOptions[0] || "none";
  const qty = value?.qty ?? defaultValue.qty ?? 1;
  return { seater: normalizedSeater, qty: Math.max(1, qty) };
};

const normalizeSectionsForShape = (
  shape: "STANDARD" | "L SHAPE" | "U SHAPE" | "COMBO",
  currentSections: Record<string, { seater?: string; qty?: number }> = {}
) => {
  const normalizedSections: Record<string, { seater: string; qty: number }> = {};
  Object.keys(SECTION_ACTIVATION[shape]).forEach((sectionId) => {
    const normalized = normalizeSectionValue(shape, sectionId, currentSections[sectionId]);
    if (normalized) {
      normalizedSections[sectionId] = normalized;
    }
  });
  return normalizedSections;
};

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(value));
};

type NormalizedShape = "STANDARD" | "L SHAPE" | "U SHAPE" | "COMBO";
type LoungerCountOption = "1 No." | "2 Nos.";
type LoungerPlacementValue = "LHS" | "RHS" | "Both";

function normalizeShape(shape: string): NormalizedShape {
  const upper = (shape || "STANDARD").toUpperCase().replace(/\s+/g, " ") as NormalizedShape;
  if (upper === "L SHAPE" || upper === "U SHAPE" || upper === "COMBO") {
    return upper;
  }
  return "STANDARD";
}

interface LoungerConfig {
  required: "Yes" | "No";
  numberOfLoungers: LoungerCountOption;
  size: string;
  placement: LoungerPlacementValue;
  storage: "Yes" | "No";
  quantity: number;
}

const LOUNGER_DEFAULT: LoungerConfig = {
  required: "No",
  numberOfLoungers: "1 No.",
  size: "Lounger-5 ft 6 in",
  placement: "LHS",
  storage: "No",
  quantity: 1,
};

const LOUNGER_PLACEMENT_OPTIONS: Record<NormalizedShape, Array<{ value: LoungerPlacementValue; label: string }>> = {
  STANDARD: [
    { value: "LHS", label: "Left Hand Side (LHS)" },
    { value: "RHS", label: "Right Hand Side (RHS)" },
    { value: "Both", label: "Both LHS & RHS" },
  ],
  "L SHAPE": [{ value: "LHS", label: "Left Hand Side (LHS)" }],
  "U SHAPE": [
    { value: "LHS", label: "Left Hand Side (LHS)" },
    { value: "RHS", label: "Right Hand Side (RHS)" },
    { value: "Both", label: "Both LHS & RHS" },
  ],
  COMBO: [
    { value: "LHS", label: "Left Hand Side (LHS)" },
    { value: "RHS", label: "Right Hand Side (RHS)" },
    { value: "Both", label: "Both LHS & RHS" },
  ],
};

const getLoungerPlacementOptions = (shape: NormalizedShape, numberOfLoungers: LoungerCountOption) => {
  const options = LOUNGER_PLACEMENT_OPTIONS[shape] || LOUNGER_PLACEMENT_OPTIONS.STANDARD;
  if (numberOfLoungers === "2 Nos.") {
    return options.filter((option) => option.value === "Both");
  }
  return options.filter((option) => {
    if (option.value === "Both") return false;
    if (shape === "L SHAPE" && option.value === "RHS") return false;
    return true;
  });
};

const normalizeLoungerConfig = (
  loungerConfig: Partial<LoungerConfig> | undefined,
  shape: NormalizedShape
): LoungerConfig => {
  // Normalize required field: handle both boolean and string values
  let normalizedRequired: "Yes" | "No" = "No";
  const requiredValue: any = loungerConfig?.required;
  if (requiredValue === true || requiredValue === "Yes" || requiredValue === "yes") {
    normalizedRequired = "Yes";
  } else if (requiredValue === false || requiredValue === "No" || requiredValue === "no") {
    normalizedRequired = "No";
  }

  // If required is "No", return default with normalized required
  if (normalizedRequired !== "Yes") {
    return { ...LOUNGER_DEFAULT, required: normalizedRequired };
  }

  // If required is "Yes", merge with defaults but preserve existing values
  const merged: LoungerConfig = {
    ...LOUNGER_DEFAULT,
    ...loungerConfig,
    required: normalizedRequired,
  };

  const supportsDualLounger = shape !== "L SHAPE";
  if (merged.numberOfLoungers === "2 Nos." && !supportsDualLounger) {
    merged.numberOfLoungers = "1 No.";
  }

  if (merged.numberOfLoungers === "2 Nos.") {
    merged.placement = "Both";
  } else {
    const allowedPlacements = getLoungerPlacementOptions(shape, "1 No.").map((option) => option.value);
    if (!allowedPlacements.includes(merged.placement)) {
      merged.placement = allowedPlacements[0] || "LHS";
    }
  }

  merged.quantity = merged.numberOfLoungers === "2 Nos." ? 2 : 1;
  return merged;
};

type ReclinerSectionKey = "F" | "L" | "R" | "C";

interface ReclinerSectionConfig {
  required: "Yes" | "No";
  numberOfRecliners: number;
  positioning: LoungerPlacementValue;
}

type ReclinerConfigMap = Record<ReclinerSectionKey, ReclinerSectionConfig>;

const RECLINER_DEFAULT_SECTION: ReclinerSectionConfig = {
  required: "No",
  numberOfRecliners: 0,
  positioning: "LHS",
};

const RECLINER_ACTIVE_SECTIONS: Record<NormalizedShape, ReclinerSectionKey[]> = {
  STANDARD: ["F"],
  "L SHAPE": ["F", "L"],
  "U SHAPE": ["F", "L", "R"],
  COMBO: ["F", "L", "R", "C"],
};

const RECLINER_POSITION_OPTIONS: Array<{ value: LoungerPlacementValue; label: string }> = [
  { value: "LHS", label: "Left Hand Side (LHS)" },
  { value: "RHS", label: "Right Hand Side (RHS)" },
  { value: "Both", label: "Both LHS & RHS" },
];

const normalizeReclinerConfig = (
  shape: NormalizedShape,
  config?: Partial<Record<ReclinerSectionKey, Partial<ReclinerSectionConfig>>>
): ReclinerConfigMap => {
  const activeSections = RECLINER_ACTIVE_SECTIONS[shape] || RECLINER_ACTIVE_SECTIONS.STANDARD;
  const normalized: ReclinerConfigMap = {
    F: { ...RECLINER_DEFAULT_SECTION },
    L: { ...RECLINER_DEFAULT_SECTION },
    R: { ...RECLINER_DEFAULT_SECTION },
    C: { ...RECLINER_DEFAULT_SECTION },
  };

  Object.entries(config || {}).forEach(([key, value]) => {
    const sectionKey = key as ReclinerSectionKey;
    if (normalized[sectionKey]) {
      normalized[sectionKey] = {
        ...RECLINER_DEFAULT_SECTION,
        ...value,
        positioning: (value?.positioning as LoungerPlacementValue) || "LHS",
      };
    }
  });

  (["F", "L", "R", "C"] as ReclinerSectionKey[]).forEach((sectionKey) => {
    if (!activeSections.includes(sectionKey)) {
      normalized[sectionKey] = { ...RECLINER_DEFAULT_SECTION };
    } else {
      const sectionConfig = normalized[sectionKey];
      if (sectionConfig.required !== "Yes") {
        normalized[sectionKey] = { ...RECLINER_DEFAULT_SECTION };
      } else {
        normalized[sectionKey] = {
          required: "Yes",
          numberOfRecliners: Math.max(1, sectionConfig.numberOfRecliners || 1),
          positioning: sectionConfig.positioning || "LHS",
        };
      }
    }
  });

  return normalized;
};

const RECLINER_SECTION_LABELS: Record<ReclinerSectionKey, string> = {
  F: "Front",
  L: "Left",
  R: "Right",
  C: "Center",
};

const RECLINER_PRICE_PER_UNIT = 14000;
const RECLINER_STANDARD_WIDTH = 30;

const calculateReclinerSummaries = (shape: NormalizedShape, reclinerConfig: ReclinerConfigMap) => {
  const activeSections = RECLINER_ACTIVE_SECTIONS[shape] || RECLINER_ACTIVE_SECTIONS.STANDARD;

  return activeSections.map((sectionKey) => {
    const config = reclinerConfig[sectionKey];
    if (config.required !== "Yes") {
      return {
        section: sectionKey,
        label: RECLINER_SECTION_LABELS[sectionKey],
        positioning: config.positioning,
        quantity: 0,
        price: 0,
        width: 0,
        status: "Not required",
      };
    }

    const quantity = Math.max(1, config.numberOfRecliners || 1);
    return {
      section: sectionKey,
      label: RECLINER_SECTION_LABELS[sectionKey],
      positioning: config.positioning,
      quantity,
      price: quantity * RECLINER_PRICE_PER_UNIT,
      width: RECLINER_STANDARD_WIDTH,
      status: "Active",
    };
  });
};
const calculateSofaBedSectionPrice = (seaterType: string, base2SeaterPrice: number): number => {
  if (!seaterType || seaterType === "none") return 0;
  const lowerType = seaterType.toLowerCase();

  if (lowerType.includes("backrest")) {
    return (base2SeaterPrice * PRICING_PERCENTAGES.backrest) / 100;
  }
  if (lowerType.includes("corner")) {
    return (base2SeaterPrice * PRICING_PERCENTAGES.corner) / 100;
  }

  const seatMatch = seaterType.match(/(\d+)-Seater/);
  if (!seatMatch) return 0;

  const seatCount = parseInt(seatMatch[1], 10);
  if (seatCount <= 0) return 0;

  if (seatCount === 2) {
    return (base2SeaterPrice * PRICING_PERCENTAGES.base) / 100;
  }

  const additionalSeats = seatCount - 2;
  const additionalValue = additionalSeats * (PRICING_PERCENTAGES.additionalSeat / 100);
  return base2SeaterPrice * ((PRICING_PERCENTAGES.base / 100) + additionalValue);
};

const calculateSofaBedSectionSummary = (
  shape: "STANDARD" | "L SHAPE" | "U SHAPE" | "COMBO",
  sections: Record<string, { seater?: string; qty?: number }>,
  seatWidth: number,
  base2SeaterPrice: number
) => {
  const summaries: Array<{
    section: string;
    type: string;
    qty: number;
    width: number;
    fabric: number;
    price: number;
    active: boolean;
  }> = [];

  if (!base2SeaterPrice || base2SeaterPrice <= 0) {
    return summaries;
  }

  Object.entries(SECTION_ACTIVATION[shape]).forEach(([sectionId, isActiveSection]) => {
    if (!isActiveSection) {
      summaries.push({
        section: sectionId,
        type: "none",
        qty: 0,
        width: 0,
        fabric: 0,
        price: 0,
        active: false,
      });
      return;
    }

    const normalizedSection = normalizeSectionValue(shape, sectionId, sections[sectionId]);
    const seaterType = normalizedSection?.seater || "none";
    const qty = normalizedSection?.qty || 1;
    const width = calculateSectionWidth(seaterType, seatWidth);
    const fabricPerUnit = calculateFabricMetersForSection(seaterType, width);
    const fabric = fabricPerUnit * qty;
    const sectionPrice = calculateSofaBedSectionPrice(seaterType, base2SeaterPrice) * qty;

    summaries.push({
      section: sectionId,
      type: seaterType,
      qty,
      width,
      fabric,
      price: sectionPrice,
      active: seaterType !== "none",
    });
  });

  return summaries;
};

interface SofaBedConfiguratorProps {
  product: any;
  configuration: any;
  pricing?: any;
  onConfigurationChange: (config: any) => void;
}

const SofaBedConfigurator = ({
  product,
  configuration,
  pricing,
  onConfigurationChange,
}: SofaBedConfiguratorProps) => {
  // Fetch all dropdown options from database
  const shapesResult = useDropdownOptions("sofabed", "base_shape");
  const seatTypesResult = useDropdownOptions("sofabed", "seat_type");
  const foamTypesResult = useDropdownOptions("common", "foam_type");
  const seatDepthsResult = useDropdownOptions("sofabed", "seat_depth");
  const seatWidthsResult = useDropdownOptions("sofabed", "seat_width");
  const consoleSizesResult = useDropdownOptions("common", "console_size");
  const loungerSizesResult = useDropdownOptions("sofabed", "lounger_size");
  const pillowTypesResult = useDropdownOptions("sofa", "pillow_type");
  const pillowSizesResult = useDropdownOptions("sofa", "pillow_size");
  const pillowFabricPlanResult = useDropdownOptions("sofa", "pillow_fabric_plan");
  const legTypesResult = useDropdownOptions("sofa", "leg_type");
  const woodTypesResult = useDropdownOptions("sofa", "wood_type");
  const stitchTypesResult = useDropdownOptions("sofa", "stitch_type");
  
  // Safely extract data
  const shapes = Array.isArray(shapesResult.data) ? shapesResult.data : [];
  const seatTypes = Array.isArray(seatTypesResult.data) ? seatTypesResult.data : [];
  const foamTypes = Array.isArray(foamTypesResult.data) ? foamTypesResult.data : [];
  const seatDepths = Array.isArray(seatDepthsResult.data) ? seatDepthsResult.data : [];
  const seatWidths = Array.isArray(seatWidthsResult.data) ? seatWidthsResult.data : [];
  const consoleSizes = Array.isArray(consoleSizesResult.data) ? consoleSizesResult.data : [];
  const loungerSizes = Array.isArray(loungerSizesResult.data) ? loungerSizesResult.data : [];
  const pillowTypes = Array.isArray(pillowTypesResult.data) ? pillowTypesResult.data : [];
  const pillowSizes = Array.isArray(pillowSizesResult.data) ? pillowSizesResult.data : [];
  const pillowFabricPlans = Array.isArray(pillowFabricPlanResult.data) ? pillowFabricPlanResult.data : [];
  const legTypes = Array.isArray(legTypesResult.data) ? legTypesResult.data : [];
  const woodTypes = Array.isArray(woodTypesResult.data) ? woodTypesResult.data : [];
  const stitchTypes = Array.isArray(stitchTypesResult.data) ? stitchTypesResult.data : [];

  // Check loading state
  const isLoadingDropdowns = shapesResult.isLoading || seatTypesResult.isLoading || foamTypesResult.isLoading;

  // Load accessories for consoles
  const { data: consoleAccessories, isLoading: loadingAccessories } = useQuery({
    queryKey: ["sofabed-console-accessories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accessories_prices")
        .select("id, description, sale_price")
        .eq("is_active", true)
        .order("description");
      if (error) throw error;
      return data || [];
    },
  });

  // Load legs prices
  const { data: legsPrices } = useQuery({
    queryKey: ["sofabed-legs-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legs_prices")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
  });

  // State for fabric library modals
  const [openPillowFabricLibrary, setOpenPillowFabricLibrary] = useState<"colour1" | "colour2" | "single" | null>(null);

  // Fetch selected pillow fabric details
  const { data: selectedPillowFabrics } = useQuery({
    queryKey: ["selected-pillow-fabrics", configuration.additionalPillows],
    queryFn: async () => {
      const codes = [
        configuration.additionalPillows?.fabricColour1,
        configuration.additionalPillows?.fabricColour2,
        configuration.additionalPillows?.fabricColour,
      ].filter(Boolean);
      if (codes.length === 0) return {};
      const { data, error } = await supabase
        .from("fabric_coding")
        .select("*")
        .in("estre_code", codes);
      if (error) throw error;
      const fabricMap: Record<string, any> = {};
      data?.forEach((f) => {
        fabricMap[f.estre_code] = f;
      });
      return fabricMap;
    },
    enabled: !!(
      configuration.additionalPillows?.fabricColour1 ||
      configuration.additionalPillows?.fabricColour2 ||
      configuration.additionalPillows?.fabricColour
    ),
  });

  // Helper functions
  const parseSeatCount = (seaterType: string): number => {
    if (!seaterType) return 0;
    const lower = seaterType.toLowerCase();
    if (lower.includes("4-seater")) return 4;
    if (lower.includes("3-seater")) return 3;
    if (lower.includes("2-seater")) return 2;
    if (lower.includes("1-seater")) return 1;
    return 0;
  };

  const normalizedShape = normalizeShape(configuration.baseShape || "STANDARD");

  const rawSections = configuration.sections as Record<string, { seater?: string; qty?: number }> | undefined;
  const sections = useMemo(
    () => normalizeSectionsForShape(normalizedShape, rawSections || {}),
    [normalizedShape, rawSections]
  );

  const getTotalSeats = (): number => {
    let total = 0;
    ["F", "L2", "R2", "C2"].forEach((sectionId) => {
      const section = sections[sectionId];
      if (section?.seater && section.seater !== "none") {
        const seatCount = parseSeatCount(section.seater);
        const qty = section.qty || 1;
        total += seatCount * qty;
      }
    });
    return total;
  };

  const getMaxConsoles = (currentSections = sections): number => {
    return calculateMaxConsoles(
      (() => {
        let total = 0;
        ["F", "L2", "R2", "C2"].forEach((sectionId) => {
          const section = currentSections[sectionId];
          if (section?.seater && section.seater !== "none") {
            const seatCount = parseSeatCount(section.seater);
            const qty = section.qty || 1;
            total += seatCount * qty;
          }
        });
        return total;
      })()
    );
  };

  const getSectionOptions = (sectionId: string): string[] => {
    return getAllowedOptionsForSection(normalizedShape, sectionId);
  };

  // Normalize shape for comparison (avoid shadowing top-level normalizeShape)
  const normalizeShapeValue = (shape: string): 'STANDARD' | 'L SHAPE' | 'U SHAPE' | 'COMBO' => {
    if (!shape) return 'STANDARD';
    const upper = shape.toUpperCase();
    if (upper.includes('L SHAPE') || upper.includes('L-SHAPE')) return 'L SHAPE';
    if (upper.includes('U SHAPE') || upper.includes('U-SHAPE')) return 'U SHAPE';
    if (upper.includes('COMBO')) return 'COMBO';
    return 'STANDARD';
  };

  // Generate console placements using explicit validation formulas
  // Note: For SofaBed, console placements are based on seater type, not multiplied by quantity
  // Each section module has its own console placements based on the seater type
  const generateAllConsolePlacements = useCallback(() => {
    const consoleRequired = configuration.console?.required === "Yes" || configuration.console?.required === true;

    if (!consoleRequired) {
      return [];
    }

    const frontSeaterType = sections.F?.seater || "2-Seater";
    const leftSeaterType =
      normalizedShape === "L SHAPE" || normalizedShape === "U SHAPE" || normalizedShape === "COMBO"
        ? sections.L2?.seater || "2-Seater"
        : undefined;
    const rightSeaterType =
      normalizedShape === "U SHAPE" || normalizedShape === "COMBO"
        ? sections.R2?.seater || "2-Seater"
        : undefined;
    const comboSeaterType = normalizedShape === "COMBO" ? sections.C2?.seater || "2-Seater" : undefined;

    const placements = generateConsolePlacementsUtil(
      consoleRequired,
      {
        front: frontSeaterType,
        left: leftSeaterType,
        right: rightSeaterType,
        combo: comboSeaterType,
      },
      normalizedShape
    );

    return placements.map((placement) => ({
      ...placement,
      width: 40,
    }));
  }, [configuration.console?.required, normalizedShape, sections]);

  const updateConfiguration = useCallback(
    (updates: any) => {
      onConfigurationChange({ ...configuration, ...updates });
    },
    [configuration, onConfigurationChange]
  );

  // Declare loungerConfig and reclinerConfig before handlers that use them
  const loungerConfig = useMemo(
    () => normalizeLoungerConfig(configuration.lounger, normalizedShape),
    [normalizedShape, configuration.lounger]
  );

  const reclinerConfig = useMemo(
    () => normalizeReclinerConfig(normalizedShape, configuration.recliner),
    [normalizedShape, configuration.recliner]
  );

  const handleLoungerChange = useCallback(
    (changes: Partial<LoungerConfig>) => {
      // Merge current config with changes before normalizing
      const updatedConfig = { ...loungerConfig, ...changes };
      const normalized = normalizeLoungerConfig(updatedConfig, normalizedShape);
      updateConfiguration({ lounger: normalized });
    },
    [loungerConfig, normalizedShape, updateConfiguration]
  );

  const handleReclinerChange = useCallback(
    (section: ReclinerSectionKey, changes: Partial<ReclinerSectionConfig>) => {
      const updated = {
        ...reclinerConfig,
        [section]: {
          ...reclinerConfig[section],
          ...changes,
        },
      };
      const normalized = normalizeReclinerConfig(normalizedShape, updated);
      updateConfiguration({ recliner: normalized });
    },
    [reclinerConfig, normalizedShape, updateConfiguration]
  );

  const rawSectionsKey = useMemo(() => JSON.stringify(rawSections || {}), [rawSections]);
  const normalizedSectionsKey = useMemo(() => JSON.stringify(sections), [sections]);

  useEffect(() => {
    if (rawSectionsKey !== normalizedSectionsKey) {
      updateConfiguration({ sections });
    }
  }, [rawSectionsKey, normalizedSectionsKey, sections, updateConfiguration]);

  const loungerOriginalKey = useMemo(() => JSON.stringify(configuration.lounger || {}), [configuration.lounger]);
  const loungerNormalizedKey = useMemo(() => JSON.stringify(loungerConfig), [loungerConfig]);

  useEffect(() => {
    if (loungerOriginalKey !== loungerNormalizedKey) {
      updateConfiguration({ lounger: loungerConfig });
    }
  }, [loungerOriginalKey, loungerNormalizedKey, loungerConfig, updateConfiguration]);

  const loungerPlacementOptions = useMemo(
    () => getLoungerPlacementOptions(normalizedShape, loungerConfig.numberOfLoungers),
    [normalizedShape, loungerConfig.numberOfLoungers]
  );

  const loungerEnabled = loungerConfig.required === "Yes";

  useEffect(() => {
    if (!loungerEnabled && loungerConfig.required !== "No") {
      updateConfiguration({ lounger: { ...LOUNGER_DEFAULT, required: "No" } });
    }
  }, [loungerEnabled, loungerConfig.required, updateConfiguration]);

  const loungerPricing = useMemo(() => {
    if (!loungerEnabled || !product) {
      return {
        basePrice: 0,
        totalPrice: 0,
        baseFabric: 0,
        additionalFabric: 0,
        totalFabric: 0,
        width: Number(configuration.dimensions?.seatWidth || 24),
      };
    }

    const base2Seater = Number(
      product?.net_price_rs ??
        product?.net_price ??
        product?.strike_price_rs ??
        product?.strike_price ??
        0
    );

    const baseFabricMeters = Number(
      product?.fabric_lounger_6ft_mtrs ??
        product?.fabric_lounger_mtrs ??
        0
    );
    const additionalFabricMeters = Number(
      product?.fabric_lounger_additional_6_mtrs ??
        product?.fabric_lounger_additional ??
        0
    );
    const storagePrice = Number(product?.lounger_storage_price ?? 0);

    const basePercentage =
      Number(product?.lounger_base_percentage) || 0.4; // 40%
    const additionalPercentage =
      Number(product?.lounger_additional_percentage) || 0.04; // 4% per +6"

    const parseSizeInches = (size: string): number => {
      const match = size.match(/(\d+)\s*ft(?:\s*(\d+)\s*in)?/i);
      if (!match) return 66; // default 5 ft 6 in
      const feet = Number(match[1]) || 0;
      const inches = Number(match[2] || 0);
      return feet * 12 + inches;
    };

    const sizeInches = parseSizeInches(loungerConfig.size);
    const baseInches = 66; // 5 ft 6 in baseline

    const incrementsAbove = sizeInches > baseInches ? Math.floor((sizeInches - baseInches) / 6) : 0;
    const baseLoungerPrice = base2Seater * basePercentage;
    const sizeAdjustedPrice =
      baseLoungerPrice + incrementsAbove * (base2Seater * additionalPercentage);

    const effectiveBaseFabric =
      sizeInches >= baseInches || additionalFabricMeters <= 0 || baseFabricMeters <= 0
        ? baseFabricMeters + incrementsAbove * additionalFabricMeters
        : baseFabricMeters * (sizeInches / baseInches);

    const quantity = loungerConfig.numberOfLoungers === "2 Nos." ? 2 : 1;
    const storageCost = loungerConfig.storage === "Yes" ? storagePrice : 0;

    return {
      basePrice: sizeAdjustedPrice,
      totalPrice: sizeAdjustedPrice * quantity + storageCost * quantity,
      baseFabric: baseFabricMeters,
      additionalFabric: incrementsAbove * additionalFabricMeters,
      totalFabric: effectiveBaseFabric * quantity,
      width: loungerConfig.placement === "RHS" && loungerConfig.numberOfLoungers === "1 No."
        ? 0
        : Number(configuration.dimensions?.seatWidth || 24),
    };
  }, [loungerEnabled, product, loungerConfig, configuration.dimensions?.seatWidth]);
  const reclinerOriginalKey = useMemo(() => JSON.stringify(configuration.recliner || {}), [configuration.recliner]);
  const reclinerNormalizedKey = useMemo(() => JSON.stringify(reclinerConfig), [reclinerConfig]);

  useEffect(() => {
    if (reclinerOriginalKey !== reclinerNormalizedKey) {
      updateConfiguration({ recliner: reclinerConfig });
    }
  }, [reclinerOriginalKey, reclinerNormalizedKey, reclinerConfig, updateConfiguration]);

  const activeReclinerSections = useMemo(
    () => RECLINER_ACTIVE_SECTIONS[normalizedShape] || RECLINER_ACTIVE_SECTIONS.STANDARD,
    [normalizedShape]
  );

  // Initialize configuration
  useEffect(() => {
    if (!configuration.productId) {
      onConfigurationChange({
        productId: product.id,
        category: "sofabed",
        baseShape: "STANDARD",
        sections: normalizeSectionsForShape(normalizedShape, { F: { seater: "2-Seater", qty: 1 } }),
        lounger: { ...LOUNGER_DEFAULT },
        recliner: {
          F: { ...RECLINER_DEFAULT_SECTION },
          L: { ...RECLINER_DEFAULT_SECTION },
          R: { ...RECLINER_DEFAULT_SECTION },
          C: { ...RECLINER_DEFAULT_SECTION },
        },
        console: {
          required: "No",
          quantity: 0,
          size: "Console-6 in",
          placements: [],
          accessories: [],
        },
        additionalPillows: {
          required: "No",
          quantity: 1,
          type: "",
          size: "",
          fabricPlan: "Single Colour",
        },
        fabric: {
          claddingPlan: "Single Colour",
          structureCode: "",
        },
        foam: {
          type: "Firm",
        },
        dimensions: {
          seatDepth: 22,
          seatWidth: 24,
        },
        legs: {
          type: "",
        },
        wood: {
          type: "",
        },
        stitch: {
          type: "",
        },
        customerInfo: {
          fullName: "",
          email: "",
          phoneNumber: "",
          specialRequests: "",
        },
      });
    }
  }, [product.id, configuration.productId, onConfigurationChange]);

  // Auto-update console quantity when seats change
  useEffect(() => {
    if (configuration.console?.required === "Yes") {
      const currentPlacements = configuration.console?.placements || [];
      const maxConsolesForLayout = getMaxConsoles(sections);

      let placements = [...currentPlacements];

      if (placements.length < maxConsolesForLayout) {
        while (placements.length < maxConsolesForLayout) {
          placements.push({
            section: null,
            position: "none",
            afterSeat: null,
            accessoryId: null,
          });
        }
      } else if (placements.length > maxConsolesForLayout) {
        placements = placements.slice(0, maxConsolesForLayout);
      }

      const placementsChanged = JSON.stringify(placements) !== JSON.stringify(currentPlacements);

      if (placementsChanged || configuration.console?.quantity !== maxConsolesForLayout) {
        const normalizedAccessories = [...(configuration.console?.accessories || [])];
        if (normalizedAccessories.length > maxConsolesForLayout) {
          normalizedAccessories.length = maxConsolesForLayout;
        }
        while (normalizedAccessories.length < maxConsolesForLayout) {
          normalizedAccessories.push(null);
        }

        updateConfiguration({
          console: {
            ...configuration.console,
            quantity: maxConsolesForLayout,
            placements,
            accessories: normalizedAccessories,
          },
        });
      }
    }
  }, [configuration.console, sections]);

  const totalSeatCount = getTotalSeats();
  const maxConsoles = useMemo(() => getMaxConsoles(sections), [sections]);
  const isLShape = normalizedShape === "L SHAPE";
  const isUShape = normalizedShape === "U SHAPE";
  const isCombo = normalizedShape === "COMBO";

  const seatWidthValue = parseSeatWidthValue(configuration.dimensions?.seatWidth ?? 24);
  const base2SeaterPrice = Number(
    product?.net_price_rs ??
      product?.net_price ??
      product?.strike_price_rs ??
      product?.strike_price ??
      0
  );

  const sectionSummaries = useMemo(
    () => calculateSofaBedSectionSummary(normalizedShape, sections, seatWidthValue, base2SeaterPrice),
    [normalizedShape, sections, seatWidthValue, base2SeaterPrice]
  );
  const activeSectionSummaries = sectionSummaries.filter((summary) => summary.active);
  const totalSectionPrice = activeSectionSummaries.reduce((sum, item) => sum + item.price, 0);

  const consolePlacements = useMemo(() => generateAllConsolePlacements(), [generateAllConsolePlacements]);

  const reclinerSummaries = useMemo(
    () => calculateReclinerSummaries(normalizedShape, reclinerConfig),
    [normalizedShape, reclinerConfig]
  );
  const totalReclinerPrice = reclinerSummaries.reduce((sum, item) => sum + item.price, 0);

  // Get dimension percentage from metadata
  const getDimensionPercentage = (dimension: string, value: string | number) => {
    if (!value) return 0;
    const dim = dimension === "depth" ? seatDepths : seatWidths;
    if (!Array.isArray(dim) || dim.length === 0) return 0;
    const normalizedValue = String(value).replace(/["\s]/g, '').replace('in', '').trim();
    const option = dim.find((d: any) => {
      if (!d || !d.option_value) return false;
      const normalizedOption = d.option_value.replace(/["\s]/g, '').replace('in', '').trim();
      return normalizedOption === normalizedValue || d.option_value === String(value);
    });
    return option?.metadata?.upgrade_percent || option?.metadata?.percentage || 0;
  };

  // Normalize dimension value
  const normalizeDimensionValue = (value: string | number) => {
    if (!value) return "";
    return String(value).replace(/["\s]/g, '').replace('in', '').trim();
  };

  // Calculate dimensions for preview
  const calculateDimensions = (): { width: number; depth: number; label: string } => {
    try {
      const totalSeats = totalSeatCount;
      const baseWidth = 48;
      const totalWidth = totalSeats * baseWidth;
      const depth = 95;
      const shapeLabel = normalizedShape.replace(' ', '-');
      
      return {
        width: totalWidth,
        depth: depth,
        label: `${shapeLabel} • ${totalSeats}-Seater`,
      };
    } catch (error) {
      console.error('Error calculating dimensions:', error);
      return {
        width: 96,
        depth: 95,
        label: 'STANDARD • 2-Seater',
      };
    }
  };

  const dimensions = calculateDimensions();

  const normalizeConsoleSection = useCallback((section?: string | null) => {
    if (!section) return null;
    const value = section.toString().trim().toLowerCase();
    if (value === "front" || value === "f") return "front";
    if (value === "left" || value === "l") return "left";
    if (value === "right" || value === "r") return "right";
    if (value === "combo" || value === "c") return "combo";
    return null;
  }, []);

  const extractAfterSeat = useCallback((placement: any): number => {
    if (!placement) return 0;
    if (placement.afterSeat && Number.isFinite(Number(placement.afterSeat))) {
      return Number(placement.afterSeat);
    }
    if (typeof placement.position === "string") {
      const match = placement.position.match(/after_(\d+)/i);
      if (match && match[1]) {
        return Number(match[1]);
      }
    }
    return 0;
  }, []);

  const trimConsoleLabel = useCallback((label: string) => {
    if (!label) return "";
    const parts = label.split(":");
    return parts.length > 1 ? parts.slice(1).join(":").trim() : label;
  }, []);

  const consolePlacementMeta = useMemo(() => {
    const allowedBySection = new Map<string, Map<number, string>>();
    const labelByValue = new Map<string, string>();
    const maxPerSection = new Map<string, number>();

    consolePlacements.forEach((placement) => {
      const normalizedSection = normalizeConsoleSection(placement.section);
      if (!normalizedSection) return;

      labelByValue.set(placement.value, trimConsoleLabel(placement.label));

      if (!allowedBySection.has(normalizedSection)) {
        allowedBySection.set(normalizedSection, new Map());
      }

      allowedBySection.get(normalizedSection)!.set(placement.consoleNumber, placement.value);

      const currentMax = maxPerSection.get(normalizedSection) || 0;
      maxPerSection.set(normalizedSection, Math.max(currentMax, placement.consoleNumber));
    });

    return {
      allowedBySection,
      labelByValue,
      maxPerSection,
    };
  }, [consolePlacements, normalizeConsoleSection, trimConsoleLabel]);

  useEffect(() => {
    if (configuration.console?.required !== "Yes") return;

    const placements = Array.isArray(configuration.console?.placements)
      ? configuration.console.placements
      : [];

    if (placements.length === 0 && consolePlacements.length === 0) return;

    const allowedBySection = consolePlacementMeta.allowedBySection;

    const sanitized = placements.map((placement: any) => {
      const normalizedSection = normalizeConsoleSection(placement?.section);
      const afterSeat = extractAfterSeat(placement);

      if (!normalizedSection) {
        return {
          section: null,
          position: "none",
          afterSeat: null,
          accessoryId: null,
        };
      }

      const allowedForSection = allowedBySection.get(normalizedSection);
      if (!allowedForSection || !allowedForSection.has(afterSeat)) {
        return {
          section: null,
          position: "none",
          afterSeat: null,
          accessoryId: null,
        };
      }

      return {
        section: normalizedSection,
        position: `after_${afterSeat}`,
        afterSeat,
        accessoryId: placement?.accessoryId ?? null,
      };
    });

    const seenBySection = new Map<string, Set<number>>();
    const deduped = sanitized.map((placement) => {
      if (!placement || placement.position === "none") {
        return placement;
      }

      const section = placement.section!;
      const afterSeat = placement.afterSeat!;
      const usedSlots = seenBySection.get(section) || new Set<number>();

      if (usedSlots.has(afterSeat)) {
        return {
          section: null,
          position: "none",
          afterSeat: null,
          accessoryId: null,
        };
      }

      usedSlots.add(afterSeat);
      seenBySection.set(section, usedSlots);
      return placement;
    });

    const placementsChanged =
      placements.length !== deduped.length ||
      placements.some((placement, index) => {
        const current = deduped[index];
        if (!current) return true;

        const normalizedSection = normalizeConsoleSection(placement?.section);
        const afterSeat = extractAfterSeat(placement);
        const normalizedPosition =
          typeof placement?.position === "string" ? placement.position : "none";
        const accessoryId = placement?.accessoryId ?? null;

        return (
          normalizedSection !== current.section ||
          afterSeat !== current.afterSeat ||
          normalizedPosition !== current.position ||
          accessoryId !== current.accessoryId
        );
      });

    if (!placementsChanged) return;

    updateConfiguration({
      console: {
        ...configuration.console,
        placements: deduped,
      },
    });
  }, [
    configuration.console?.required,
    configuration.console?.placements,
    consolePlacementMeta.allowedBySection,
    extractAfterSeat,
    normalizeConsoleSection,
    updateConfiguration,
  ]);

  const consoleValidationSummary = useMemo(() => {
    const placements = Array.isArray(configuration.console?.placements)
      ? configuration.console.placements
      : [];

    const allowedBySection = consolePlacementMeta.allowedBySection;
    const perSectionCounts: Record<string, number> = {
      front: 0,
      left: 0,
      right: 0,
      combo: 0,
    };

    placements.forEach((placement: any) => {
      const section = normalizeConsoleSection(placement?.section);
      if (!section) return;
      if (placement?.position === "none") return;
      const afterSeat = extractAfterSeat(placement);
      const allowedForSection = allowedBySection.get(section);
      if (!allowedForSection?.has(afterSeat)) return;
      perSectionCounts[section] = (perSectionCounts[section] || 0) + 1;
    });

    const globalCount = Object.values(perSectionCounts).reduce((sum, value) => sum + value, 0);
    const totalSeats = totalSeatCount;
    const theoreticalMax = Math.max(0, totalSeats - 1);

    const warnings: string[] = [];
    if (globalCount > theoreticalMax) {
      warnings.push(
        `Total consoles (${globalCount}) exceed theoretical maximum (${theoreticalMax}) based on total seats (${totalSeatCount}).`
      );
    }

    return { perSectionCounts, globalCount, warnings };
  }, [
    configuration.console?.placements,
    consolePlacementMeta.allowedBySection,
    extractAfterSeat,
    normalizeConsoleSection,
    totalSeatCount,
  ]);

  const fabricBreakdown = useMemo(() => {
    const base2SeaterFabric = Number(
      product?.fabric_first_seat_mtrs ??
        product?.fabric_2_seater_mtrs ??
        product?.fabric_base_seat_mtrs ??
        0
    );
    const additionalSeatFabric = Number(
      product?.fabric_additional_seat_mtrs ??
        product?.fabric_additional_mtrs ??
        0
    );
    const cornerFabricPerUnit = Number(
      product?.fabric_corner_seat_mtrs ?? product?.fabric_corner_mtrs ?? 0
    );
    const backrestFabricPerUnit = Number(
      product?.fabric_backrest_mtrs ?? product?.backrest_fabric_mtrs ?? 0
    );
    const console6Fabric = Number(product?.fabric_console_6_mtrs ?? 0);
    const console10Fabric = Number(product?.fabric_console_10_mtrs ?? 0);
    const reclinerFabricPerUnit = Number(
      product?.fabric_recliner_mtrs ?? product?.fabric_recliner ?? 0
    );

    const seaterSections: Array<keyof typeof sections> = ["F", "L2", "R2", "C2"];
    let frontFabric = 0;
    seaterSections.forEach((sectionId) => {
      const section = sections[sectionId];
      if (!section?.seater || section.seater === "none") return;
      const seatCount = parseSeatCount(section.seater);
      if (seatCount <= 0 || base2SeaterFabric <= 0) return;
      const additionalSeats = Math.max(0, seatCount - 2);
      const moduleFabric =
        base2SeaterFabric + additionalSeats * additionalSeatFabric;
      frontFabric += moduleFabric * (section.qty || 1);
    });

    const sideSections: Array<keyof typeof sections> = ["L1", "R1", "C1"];
    let cornerFabric = 0;
    let backrestFabric = 0;
    sideSections.forEach((sectionId) => {
      const section = sections[sectionId];
      if (!section?.seater || section.seater === "none") return;
      const lower = section.seater.toLowerCase();
      if (lower.includes("corner") && cornerFabricPerUnit > 0) {
        cornerFabric += cornerFabricPerUnit * (section.qty || 1);
      }
      if (lower.includes("backrest") && backrestFabricPerUnit > 0) {
        backrestFabric += backrestFabricPerUnit * (section.qty || 1);
      }
    });

    const loungerFabric = loungerEnabled ? loungerPricing.totalFabric : 0;
    const reclinerFabric =
      reclinerFabricPerUnit > 0
        ? reclinerSummaries.reduce(
            (sum, summary) => sum + summary.quantity * reclinerFabricPerUnit,
            0
          )
        : 0;

    const consoleSize = configuration.console?.size?.toLowerCase() || "";
    const consoleFabricPer =
      consoleSize.includes("10") || consoleSize.includes("ten")
        ? console10Fabric
        : console6Fabric;
    const consoleFabric =
      consoleValidationSummary.globalCount * consoleFabricPer;

    const total =
      frontFabric +
      loungerFabric +
      reclinerFabric +
      consoleFabric +
      backrestFabric +
      cornerFabric;

    return {
      front: frontFabric,
      lounger: loungerFabric,
      recliner: reclinerFabric,
      console: consoleFabric,
      backrest: backrestFabric,
      corner: cornerFabric,
      total,
    };
  }, [
    product,
    sections,
    parseSeatCount,
    loungerEnabled,
    loungerPricing.totalFabric,
    reclinerSummaries,
    configuration.console?.size,
    consoleValidationSummary.globalCount,
  ]);

  const totalSectionFabric = fabricBreakdown.front;

  const summaryData = useMemo(() => {
    const basePriceValue =
      typeof pricing?.breakdown?.basePrice === "number" && pricing.breakdown.basePrice > 0
        ? pricing.breakdown.basePrice
        : base2SeaterPrice;

    const mechanismPrice =
      typeof pricing?.breakdown?.mechanismUpgrade === "number"
        ? pricing.breakdown.mechanismUpgrade
        : totalReclinerPrice;

    const consolePrice = pricing?.breakdown?.consolePrice || 0;
    const armrestAccessories = pricing?.breakdown?.armrestUpgrade || 0;
    const fabricUpgrade = pricing?.breakdown?.fabricCharges || 0;

    const loungerPriceFromPricing = typeof pricing?.breakdown?.loungerPrice === "number"
      ? pricing.breakdown.loungerPrice
      : undefined;

    const loungerFabricFromPricing = typeof pricing?.breakdown?.loungerFabricMeters === "number"
      ? pricing.breakdown.loungerFabricMeters
      : undefined;

    const loungerPrice = loungerPriceFromPricing ?? loungerPricing.totalPrice;
    const loungerFabric = loungerFabricFromPricing ?? loungerPricing.totalFabric;

    const seatFabric =
      typeof pricing?.breakdown?.fabricMeters === "number"
        ? pricing.breakdown.fabricMeters
        : fabricBreakdown.front + fabricBreakdown.backrest;

    const totalFabricMeters =
      fabricBreakdown.total > 0
        ? fabricBreakdown.total
        : seatFabric + loungerFabric;

    const subtotal =
      pricing?.breakdown?.subtotal ||
      basePriceValue +
        mechanismPrice +
        consolePrice +
        armrestAccessories +
        fabricUpgrade +
        loungerPrice;

    const total = pricing?.total || subtotal;

    return {
      basePriceValue,
      mechanismPrice,
      consolePrice,
      armrestAccessories,
      fabricUpgrade,
      loungerPrice,
      fabricMeters: totalFabricMeters,
      loungerFabric: loungerFabric > 0 ? loungerFabric : fabricBreakdown.lounger,
      seatBackrestFabric:
        fabricBreakdown.front + fabricBreakdown.backrest,
      structureFabric: totalFabricMeters,
      approxWidth: Math.max(dimensions.width, loungerPricing.width || dimensions.width),
      netInvoice: total,
      seatCount: totalSeatCount,
      consoleCount: consoleValidationSummary.globalCount,
    };
  }, [
    pricing?.breakdown?.basePrice,
    pricing?.breakdown?.mechanismUpgrade,
    pricing?.breakdown?.consolePrice,
    pricing?.breakdown?.armrestUpgrade,
    pricing?.breakdown?.fabricCharges,
    pricing?.breakdown?.loungerPrice,
    pricing?.breakdown?.loungerFabricMeters,
    pricing?.breakdown?.fabricMeters,
    pricing?.breakdown?.subtotal,
    pricing?.total,
    base2SeaterPrice,
    totalReclinerPrice,
    fabricBreakdown.front,
    fabricBreakdown.backrest,
    fabricBreakdown.total,
    fabricBreakdown.lounger,
    dimensions.width,
    loungerPricing.totalPrice,
    loungerPricing.totalFabric,
    loungerPricing.width,
    totalSeatCount,
    consoleValidationSummary.globalCount,
  ]);

  // SummaryTile is now imported from @/components/ui/SummaryTile

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

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl font-serif">Configuration</CardTitle>
          <CardDescription>Customize your perfect sofa bed</CardDescription>
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {shapes
                  .filter((shape: any) => shape && shape.option_value)
                  .map((shape: any) => {
                    const shapeValue = shape.option_value;
                    const normalizedShapeValue = normalizeShapeValue(shapeValue);
                    const currentNormalizedShape = normalizeShapeValue(configuration.baseShape || '');
                    const isSelected = currentNormalizedShape === normalizedShapeValue;
                    
                    const getShapeIcon = () => {
                      const shapeLower = shapeValue.toLowerCase();
                      if (shapeLower.includes("l-shape") || shapeLower.includes("l shape")) {
                        return (
                          <img 
                            src="/shape-icons/l-sectionals.svg" 
                            alt="L-Sectionals" 
                            className="w-16 h-16 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        );
                      } else if (shapeLower.includes("u-shape") || shapeLower.includes("u shape")) {
                        return (
                          <img 
                            src="/shape-icons/u-sectionals.svg" 
                            alt="U-Sectionals" 
                            className="w-16 h-16 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        );
                      } else if (shapeLower.includes("combo")) {
                        return (
                          <img 
                            src="/shape-icons/u-sectionals.svg" 
                            alt="Combo Modules" 
                            className="w-16 h-16 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
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
                          const normalized = normalizeShapeValue(shapeValue);
                          const newSections = normalizeSectionsForShape(normalized, sections);
                          updateConfiguration({ baseShape: normalized, sections: newSections });
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
                        <Label className="text-sm">Seater Type</Label>
                        <Select
                          value={sections.F?.seater || "2-Seater"}
                          onValueChange={(value) => {
                            updateConfiguration({
                              sections: {
                                ...sections,
                                F: { ...sections.F, seater: value, qty: sections.F?.qty || 1 },
                              },
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getSectionOptions("F").map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
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
                          value={sections.F?.qty || 1}
                          onChange={(e) => {
                            updateConfiguration({
                              sections: {
                                ...sections,
                                F: { ...sections.F, qty: Number(e.target.value) },
                              },
                            });
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* L1 & L2 Sections */}
                {(isLShape || isUShape || isCombo) && (
                  <>
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <Label>Left Corner (L1)</Label>
                        <Select
                          value={sections.L1?.seater || "Corner"}
                          onValueChange={(value) => {
                            updateConfiguration({
                              sections: {
                                ...sections,
                                L1: { ...sections.L1, seater: value, qty: sections.L1?.qty || 1 },
                              },
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getSectionOptions("L1").map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <Label>Left Section (L2)</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm">Seater Type</Label>
                            <Select
                              value={sections.L2?.seater || "2-Seater"}
                              onValueChange={(value) => {
                                updateConfiguration({
                                  sections: {
                                    ...sections,
                                    L2: { ...sections.L2, seater: value, qty: sections.L2?.qty || 1 },
                                  },
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {getSectionOptions("L2").map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
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
                              value={sections.L2?.qty || 1}
                              onChange={(e) => {
                                updateConfiguration({
                                  sections: {
                                    ...sections,
                                    L2: { ...sections.L2, qty: Number(e.target.value) },
                                  },
                                });
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* R1 & R2 Sections */}
                {(isUShape || isCombo) && (
                  <>
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <Label>Right Corner (R1)</Label>
                        <Select
                          value={sections.R1?.seater || "Corner"}
                          onValueChange={(value) => {
                            updateConfiguration({
                              sections: {
                                ...sections,
                                R1: { ...sections.R1, seater: value, qty: sections.R1?.qty || 1 },
                              },
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getSectionOptions("R1").map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <Label>Right Section (R2)</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm">Seater Type</Label>
                            <Select
                              value={sections.R2?.seater || "2-Seater"}
                              onValueChange={(value) => {
                                updateConfiguration({
                                  sections: {
                                    ...sections,
                                    R2: { ...sections.R2, seater: value, qty: sections.R2?.qty || 1 },
                                  },
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {getSectionOptions("R2").map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
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
                              value={sections.R2?.qty || 1}
                              onChange={(e) => {
                                updateConfiguration({
                                  sections: {
                                    ...sections,
                                    R2: { ...sections.R2, qty: Number(e.target.value) },
                                  },
                                });
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* C1 & C2 Sections */}
                {isCombo && (
                  <>
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <Label>Center Backrest (C1)</Label>
                        <Select
                          value={sections.C1?.seater || "Backrest"}
                          onValueChange={(value) => {
                            updateConfiguration({
                              sections: {
                                ...sections,
                                C1: { ...sections.C1, seater: value, qty: sections.C1?.qty || 1 },
                              },
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getSectionOptions("C1").map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <Label>Center Section (C2)</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm">Seater Type</Label>
                            <Select
                              value={sections.C2?.seater || "2-Seater"}
                              onValueChange={(value) => {
                                updateConfiguration({
                                  sections: {
                                    ...sections,
                                    C2: { ...sections.C2, seater: value, qty: sections.C2?.qty || 1 },
                                  },
                                });
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {getSectionOptions("C2").map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
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
                              value={sections.C2?.qty || 1}
                              onChange={(e) => {
                                updateConfiguration({
                                  sections: {
                                    ...sections,
                                    C2: { ...sections.C2, qty: Number(e.target.value) },
                                  },
                                });
                              }}
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
                  <p className="text-2xl font-bold">{totalSeatCount}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Active Sections Summary</CardTitle>
                  <CardDescription>
                    Uses sofa bed pricing percentages: base 2-seater (100%), additional seat (35%), corner (65%), backrest (14%).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {base2SeaterPrice > 0 && activeSectionSummaries.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-muted-foreground border-b">
                            <th className="py-2 pr-4">Section</th>
                            <th className="py-2 pr-4">Type</th>
                            <th className="py-2 pr-4">Qty</th>
                            <th className="py-2 pr-4">Width (in)</th>
                            <th className="py-2 pr-4">Fabric (m)</th>
                            <th className="py-2 pr-4 text-right">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeSectionSummaries.map((summary) => (
                            <tr key={summary.section} className="border-b last:border-0">
                              <td className="py-2 pr-4 font-medium">{summary.section}</td>
                              <td className="py-2 pr-4">{summary.type}</td>
                              <td className="py-2 pr-4">{summary.qty}</td>
                              <td className="py-2 pr-4">{summary.width > 0 ? summary.width : "-"}</td>
                              <td className="py-2 pr-4">
                                {summary.fabric > 0 ? summary.fabric.toFixed(1) : "-"}
                              </td>
                              <td className="py-2 pr-4 text-right">
                                {summary.price > 0 ? formatCurrency(summary.price) : "-"}
                              </td>
                            </tr>
                          ))}
                          <tr className="font-semibold">
                            <td className="py-3 pr-4" colSpan={3}>
                              Totals
                            </td>
                            <td className="py-3 pr-4">—</td>
                            <td className="py-3 pr-4">{totalSectionFabric.toFixed(1)}</td>
                            <td className="py-3 pr-4 text-right">{formatCurrency(totalSectionPrice)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        Section summary unavailable. Please ensure base 2-seater price is defined and sections are active.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Separator />
            </>
          )}

          {/* Console Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Console</Label>
              <Select
                value={configuration.console?.required === "Yes" ? "Yes" : "No"}
                onValueChange={(value) => {
                  const isRequired = value === "Yes";
                  const maxConsolesForShape = getMaxConsoles(sections);
                  const autoQuantity = isRequired ? maxConsolesForShape : 0;
                  
                  // Initialize placements array - always maintain maxConsoles slots
                  // Use "none" placeholder to maintain slot positions
                  const placements = isRequired 
                    ? Array(autoQuantity).fill(null).map((_, i) => {
                        const existing = configuration.console?.placements?.[i];
                        // If existing placement is valid, keep it; otherwise set to "none"
                        if (existing && existing.position && existing.position !== "none" && existing.section) {
                          return existing;
                        }
                        // Return "none" placeholder to maintain slot position
                        return {
                          section: null,
                          position: "none",
                          afterSeat: null,
                          accessoryId: null
                        };
                      })
                    : [];
                  
                  updateConfiguration({
                    console: {
                      ...configuration.console,
                      required: isRequired ? "Yes" : "No",
                      quantity: autoQuantity,
                      placements: placements,
                      accessories: isRequired ? (configuration.console?.accessories || Array(autoQuantity).fill(null)) : [],
                    },
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
                <div className="space-y-2">
                  <Label>Console Size</Label>
                  <Select
                    value={configuration.console?.size || ""}
                    onValueChange={(value) =>
                      updateConfiguration({
                        console: { ...configuration.console, size: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
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
                  <Label>Number of Consoles</Label>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium">
                      {configuration.console?.quantity || 0} Console{configuration.console?.quantity !== 1 ? 's' : ''} 
                      <span className="text-muted-foreground ml-2">
                    (Auto-calculated: Total Seats - 1 = {totalSeatCount} - 1 = {maxConsoles})
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Console quantity is automatically set to (Total Seats - 1)
                    </p>
                  </div>
                </div>

                {/* Console Placements & Accessories */}
                {configuration.console?.quantity > 0 && (() => {
                  const allPlacements = consolePlacements;

                  // Always maintain maxConsoles slots in the array
                  // This ensures slots maintain their positions even when set to "none"
                  let currentPlacements = configuration.console?.placements || [];
                  
                  // Ensure we have exactly maxConsoles slots
                  if (currentPlacements.length < maxConsoles) {
                    currentPlacements = [...currentPlacements];
                    // Fill missing slots with "none" placeholder
                    while (currentPlacements.length < maxConsoles) {
                      currentPlacements.push({
                        section: null,
                        position: "none",
                        afterSeat: null,
                        accessoryId: null
                      });
                    }
                  } else if (currentPlacements.length > maxConsoles) {
                    // Trim excess slots
                    currentPlacements = currentPlacements.slice(0, maxConsoles);
                  }
                  
                  // Display all slots (including "none" ones) to maintain correct slot numbers
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
                      ? `${currentPlacement.section}_${currentPlacement.afterSeat || 1}`
                      : "none";
                    
                    // Filter out placements that are already selected by OTHER console slots
                    // Only consider ACTIVE slots (not "none") when filtering
                    const otherActivePlacements = currentPlacements
                      .map((p: any, i: number) => {
                        if (i === index) return null; // Exclude current slot
                        if (p.position && p.position !== "none" && p.section) {
                          return `${p.section}_${p.afterSeat || 1}`;
                        }
                        return null;
                      })
                      .filter(Boolean);
                    
                    // Get available placement options - exclude already selected ones (except current)
                    const availablePlacements = allPlacements.length > 0 
                      ? allPlacements.filter((placement) => {
                          // Always include the current placement (so user can see what's selected)
                          if (placement.value === currentPlacementValue) return true;
                          // Exclude placements already selected by other ACTIVE console slots
                          return !otherActivePlacements.includes(placement.value);
                        })
                      : [{ section: "front", position: "after_1", label: "After 1st Seat from Left (Front)", value: "front_1" }];
                    
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
                              // Get fresh placements from configuration to ensure we have the latest state
                              const freshPlacements = [...(configuration.console?.placements || [])];
                              
                              // Ensure we have exactly maxConsoles slots
                              while (freshPlacements.length < maxConsoles) {
                                freshPlacements.push({
                                  section: null,
                                  position: "none",
                                  afterSeat: null,
                                  accessoryId: null
                                });
                              }
                              
                              if (value === "none") {
                                // Set to "none" but keep in array
                                freshPlacements[index] = {
                                  section: null,
                                  position: "none",
                                  afterSeat: null,
                                  accessoryId: null // Clear accessory when set to none
                                };
                              } else {
                                // Set to a valid placement
                                const placement = availablePlacements.find(p => p.value === value);
                                if (placement) {
                                  const afterSeat = parseInt(placement.position.split('_')[1] || "1", 10);
                                  freshPlacements[index] = {
                                    section: placement.section,
                                    position: placement.position,
                                    afterSeat: afterSeat,
                                    accessoryId: freshPlacements[index]?.accessoryId || null // Keep existing accessory or null
                                  };
                                }
                              }
                              
                              updateConfiguration({
                                console: { 
                                  ...configuration.console, 
                                  placements: freshPlacements,
                                  quantity: maxConsoles // Keep quantity at maxConsoles
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
                                  {consolePlacementMeta.labelByValue.get(placement.value) || placement.label}
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
                                // Get fresh placements from configuration to ensure we have the latest state
                                const freshPlacements = [...(configuration.console?.placements || [])];
                                // Ensure we have the slot at this index
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
                                  consoleAccessories
                                    .filter((acc: any, idx: number, self: any[]) => 
                                      idx === self.findIndex((a: any) => a.id === acc.id && a.description === acc.description)
                                    )
                                    .map((acc: any) => (
                                      <SelectItem key={`${acc.id}-${acc.description}`} value={acc.id.toString()}>
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

                <Card className="bg-muted/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Active Console Placements</CardTitle>
                    <CardDescription>Only consoles in active sections are counted for pricing.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Front Section</span>
                        <span>{consoleValidationSummary.perSectionCounts.front || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Left Section</span>
                        <span>{consoleValidationSummary.perSectionCounts.left || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Right Section</span>
                        <span>{consoleValidationSummary.perSectionCounts.right || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Combo Section</span>
                        <span>{consoleValidationSummary.perSectionCounts.combo || 0}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total Consoles: <span className="font-semibold text-foreground">{consoleValidationSummary.globalCount}</span>
                    </div>
                    {consoleValidationSummary.warnings.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs text-amber-600">
                        {consoleValidationSummary.warnings.map((warning, index) => (
                          <li key={`console-warning-${index}`}>• {warning}</li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <Separator />

          {/* Lounger Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Lounger</Label>
              <Select
                value={loungerConfig?.required || "No"}
                onValueChange={(value) => {
                  handleLoungerChange({
                    required: value as LoungerConfig["required"],
                  });
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {loungerEnabled && (
              <div className="space-y-4 pt-2 pl-4 border-l-2 border-muted">
                <div className="space-y-2">
                  <Label>Number of Loungers</Label>
                  <Select
                    value={loungerConfig.numberOfLoungers}
                    onValueChange={(value) =>
                      handleLoungerChange({ numberOfLoungers: value as LoungerCountOption })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 No.">1 No.</SelectItem>
                      <SelectItem value="2 Nos.">2 Nos.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Lounger Size</Label>
                  <Select
                    value={loungerConfig.size}
                    onValueChange={(value) => handleLoungerChange({ size: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {loungerSizesResult.isLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : loungerSizes && loungerSizes.length > 0 ? (
                        loungerSizes
                          .filter((size: any) => size && size.option_value)
                          .map((size: any) => (
                            <SelectItem key={size.id} value={size.option_value}>
                              {size.display_label || size.option_value}
                            </SelectItem>
                          ))
                      ) : (
                        <>
                          <SelectItem value="Lounger-5 ft">5 ft</SelectItem>
                          <SelectItem value="Lounger-5 ft 6 in">5 ft 6 in</SelectItem>
                          <SelectItem value="Lounger-6 ft">6 ft</SelectItem>
                          <SelectItem value="Lounger-6 ft 6 in">6 ft 6 in</SelectItem>
                          <SelectItem value="Lounger-7 ft">7 ft</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Placement</Label>
                  <Select
                    value={loungerConfig.placement}
                    onValueChange={(value) => handleLoungerChange({ placement: value as LoungerPlacementValue })}
                    disabled={loungerPlacementOptions.length <= 1}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {loungerPlacementOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Storage</Label>
                  <Select
                    value={loungerConfig.storage}
                    onValueChange={(value) => handleLoungerChange({ storage: value as LoungerConfig["storage"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                  {loungerConfig.storage === "No" && (
                    <p className="text-xs text-muted-foreground">
                      Storage-related options are disabled when Storage is set to "No"
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-muted/60 bg-muted/40 p-4 space-y-2">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Lounger Summary
                  </h4>
                  <div className="grid gap-2 text-sm md:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground">Loungers</p>
                      <p className="font-medium">
                        {loungerConfig.numberOfLoungers} • {loungerConfig.size}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Placement</p>
                      <p className="font-medium">{loungerConfig.placement}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Price</p>
                      <p className="font-medium">{formatCurrency(loungerPricing.totalPrice)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fabric</p>
                      <p className="font-medium">{loungerPricing.totalFabric.toFixed(1)} m</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Base Calculation</p>
                      <p className="text-xs text-muted-foreground leading-tight">
                        40% of base 2-seater price + 4% per additional 6″ (size adjusted). Storage adds
                        extra cost when selected.
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fabric Logic</p>
                      <p className="text-xs text-muted-foreground leading-tight">
                        Uses model fabric for 5′6″ base; adds + additional 6″ fabric per increment or scales
                        down proportionally for shorter loungers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Additional Pillows */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Additional Pillows</Label>
              <Select
                value={configuration.additionalPillows?.required === "Yes" ? "Yes" : "No"}
                onValueChange={(value) =>
                  updateConfiguration({
                    additionalPillows: {
                      ...configuration.additionalPillows,
                      required: value === "Yes" ? "Yes" : "No",
                      quantity: value === "Yes" ? (configuration.additionalPillows?.quantity || 1) : 0,
                    },
                  })
                }
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
            {configuration.additionalPillows?.required === "Yes" && (
              <div className="space-y-4 pt-2 pl-4 border-l-2 border-muted">
                <div className="space-y-2">
                  <Label>Number of Pillows</Label>
                  <Select
                    value={(configuration.additionalPillows?.quantity || 1).toString()}
                    onValueChange={(value) =>
                      updateConfiguration({
                        additionalPillows: { 
                          ...configuration.additionalPillows, 
                          quantity: parseInt(value, 10) 
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 4 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'No.' : 'Nos.'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pillow Type</Label>
                  <Select
                    value={configuration.additionalPillows?.type || ""}
                    onValueChange={(value) =>
                      updateConfiguration({
                        additionalPillows: { ...configuration.additionalPillows, type: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {pillowTypesResult.isLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : pillowTypes && pillowTypes.length > 0 ? (
                        pillowTypes
                          .filter((type: any) => type && type.option_value)
                          .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
                          .map((type: any) => (
                            <SelectItem key={type.id} value={type.option_value}>
                              {type.display_label || type.option_value}
                            </SelectItem>
                          ))
                      ) : (
                        <>
                          <SelectItem value="Simple">Simple</SelectItem>
                          <SelectItem value="Diamond Quilted pillow">Diamond Quilted pillow</SelectItem>
                          <SelectItem value="Belt Quilted">Belt Quilted</SelectItem>
                          <SelectItem value="Tassels with pillow">Tassels with pillow</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pillow Size</Label>
                  <Select
                    value={configuration.additionalPillows?.size || ""}
                    onValueChange={(value) =>
                      updateConfiguration({
                        additionalPillows: { ...configuration.additionalPillows, size: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {pillowSizesResult.isLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : pillowSizes && pillowSizes.length > 0 ? (
                        pillowSizes
                          .filter((size: any) => size && size.option_value)
                          .map((size: any) => (
                            <SelectItem key={size.id} value={size.option_value}>
                              {size.display_label || size.option_value}
                            </SelectItem>
                          ))
                      ) : (
                        <>
                          <SelectItem value='18"x18"'>18"x18"</SelectItem>
                          <SelectItem value='20"x20"'>20"x20"</SelectItem>
                          <SelectItem value='16"x24"'>16"x24"</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fabric Plan</Label>
                  <Select
                    value={configuration.additionalPillows?.fabricPlan || "Single Colour"}
                    onValueChange={(value) =>
                      updateConfiguration({
                        additionalPillows: { 
                          ...configuration.additionalPillows, 
                          fabricPlan: value,
                          fabricColour: value === "Single Colour" ? (configuration.additionalPillows?.fabricColour || undefined) : undefined,
                          fabricColour1: value === "Dual Colour" ? (configuration.additionalPillows?.fabricColour1 || undefined) : undefined,
                          fabricColour2: value === "Dual Colour" ? (configuration.additionalPillows?.fabricColour2 || undefined) : undefined,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pillowFabricPlanResult.isLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : pillowFabricPlans && pillowFabricPlans.length > 0 ? (
                        pillowFabricPlans
                          .filter((plan: any) => plan && plan.option_value)
                          .map((plan: any) => (
                            <SelectItem key={plan.id} value={plan.option_value}>
                              {plan.display_label || plan.option_value}
                            </SelectItem>
                          ))
                      ) : (
                        <>
                          <SelectItem value="Single Colour">Single Colour</SelectItem>
                          <SelectItem value="Dual Colour">Dual Colour</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Single Colour Fabric Selection */}
                {configuration.additionalPillows?.fabricPlan === "Single Colour" && (
                  <div className="space-y-4 pt-2 pl-4 border-l-2 border-muted">
                    <div className="space-y-2">
                      <Label>Fabric Colour</Label>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setOpenPillowFabricLibrary("single")}
                      >
                        {selectedPillowFabrics?.[configuration.additionalPillows?.fabricColour || ""] ? (
                          <div className="flex items-center gap-2 w-full">
                            <div
                              className="w-8 h-8 rounded-full border-2 border-gray-200 flex-shrink-0"
                              style={{
                                backgroundColor: selectedPillowFabrics[configuration.additionalPillows.fabricColour].colour_link || 
                                  `hsl(${(selectedPillowFabrics[configuration.additionalPillows.fabricColour].estre_code.charCodeAt(0) || 0) % 360}, 70%, 75%)`,
                              }}
                            />
                            <Badge variant="outline">
                              {selectedPillowFabrics[configuration.additionalPillows.fabricColour].estre_code}
                            </Badge>
                            <span className="flex-1 truncate">
                              {selectedPillowFabrics[configuration.additionalPillows.fabricColour].description || 
                               selectedPillowFabrics[configuration.additionalPillows.fabricColour].colour || 
                               selectedPillowFabrics[configuration.additionalPillows.fabricColour].estre_code}
                            </span>
                            <span className="ml-auto text-primary font-semibold">
                              ₹{selectedPillowFabrics[configuration.additionalPillows.fabricColour].bom_price?.toLocaleString() || 
                                 selectedPillowFabrics[configuration.additionalPillows.fabricColour].price?.toLocaleString() || 0}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Select fabric colour...</span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Dual Colour Fabric Selection */}
                {configuration.additionalPillows?.fabricPlan === "Dual Colour" && (
                  <div className="space-y-4 pt-2 pl-4 border-l-2 border-muted">
                    <div className="space-y-2">
                      <Label>Colour 1</Label>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setOpenPillowFabricLibrary("colour1")}
                      >
                        {selectedPillowFabrics?.[configuration.additionalPillows?.fabricColour1 || ""] ? (
                          <div className="flex items-center gap-2 w-full">
                            <div
                              className="w-8 h-8 rounded-full border-2 border-gray-200 flex-shrink-0"
                              style={{
                                backgroundColor: selectedPillowFabrics[configuration.additionalPillows.fabricColour1].colour_link || 
                                  `hsl(${(selectedPillowFabrics[configuration.additionalPillows.fabricColour1].estre_code.charCodeAt(0) || 0) % 360}, 70%, 75%)`,
                              }}
                            />
                            <Badge variant="outline">
                              {selectedPillowFabrics[configuration.additionalPillows.fabricColour1].estre_code}
                            </Badge>
                            <span className="flex-1 truncate">
                              {selectedPillowFabrics[configuration.additionalPillows.fabricColour1].description || 
                               selectedPillowFabrics[configuration.additionalPillows.fabricColour1].colour || 
                               selectedPillowFabrics[configuration.additionalPillows.fabricColour1].estre_code}
                            </span>
                            <span className="ml-auto text-primary font-semibold">
                              ₹{selectedPillowFabrics[configuration.additionalPillows.fabricColour1].bom_price?.toLocaleString() || 
                                 selectedPillowFabrics[configuration.additionalPillows.fabricColour1].price?.toLocaleString() || 0}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Select Colour 1...</span>
                        )}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Colour 2</Label>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setOpenPillowFabricLibrary("colour2")}
                      >
                        {selectedPillowFabrics?.[configuration.additionalPillows?.fabricColour2 || ""] ? (
                          <div className="flex items-center gap-2 w-full">
                            <div
                              className="w-8 h-8 rounded-full border-2 border-gray-200 flex-shrink-0"
                              style={{
                                backgroundColor: selectedPillowFabrics[configuration.additionalPillows.fabricColour2].colour_link || 
                                  `hsl(${(selectedPillowFabrics[configuration.additionalPillows.fabricColour2].estre_code.charCodeAt(0) || 0) % 360}, 70%, 75%)`,
                              }}
                            />
                            <Badge variant="outline">
                              {selectedPillowFabrics[configuration.additionalPillows.fabricColour2].estre_code}
                            </Badge>
                            <span className="flex-1 truncate">
                              {selectedPillowFabrics[configuration.additionalPillows.fabricColour2].description || 
                               selectedPillowFabrics[configuration.additionalPillows.fabricColour2].colour || 
                               selectedPillowFabrics[configuration.additionalPillows.fabricColour2].estre_code}
                            </span>
                            <span className="ml-auto text-primary font-semibold">
                              ₹{selectedPillowFabrics[configuration.additionalPillows.fabricColour2].bom_price?.toLocaleString() || 
                                 selectedPillowFabrics[configuration.additionalPillows.fabricColour2].price?.toLocaleString() || 0}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Select Colour 2...</span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Pillow Fabric Library Dialogs */}
                <FabricLibrary
                  open={openPillowFabricLibrary === "single"}
                  onOpenChange={(open) => setOpenPillowFabricLibrary(open ? "single" : null)}
                  onSelect={(code) => {
                    updateConfiguration({
                      additionalPillows: {
                        ...configuration.additionalPillows,
                        fabricColour: code,
                      },
                    });
                    setOpenPillowFabricLibrary(null);
                  }}
                  selectedCode={configuration.additionalPillows?.fabricColour}
                  title="Select Pillow Fabric Colour"
                />
                <FabricLibrary
                  open={openPillowFabricLibrary === "colour1"}
                  onOpenChange={(open) => setOpenPillowFabricLibrary(open ? "colour1" : null)}
                  onSelect={(code) => {
                    updateConfiguration({
                      additionalPillows: {
                        ...configuration.additionalPillows,
                        fabricColour1: code,
                      },
                    });
                    setOpenPillowFabricLibrary(null);
                  }}
                  selectedCode={configuration.additionalPillows?.fabricColour1}
                  title="Select Pillow Colour 1"
                />
                <FabricLibrary
                  open={openPillowFabricLibrary === "colour2"}
                  onOpenChange={(open) => setOpenPillowFabricLibrary(open ? "colour2" : null)}
                  onSelect={(code) => {
                    updateConfiguration({
                      additionalPillows: {
                        ...configuration.additionalPillows,
                        fabricColour2: code,
                      },
                    });
                    setOpenPillowFabricLibrary(null);
                  }}
                  selectedCode={configuration.additionalPillows?.fabricColour2}
                  title="Select Pillow Colour 2"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Fabric Cladding Plan */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Fabric Cladding Plan</Label>
            <FabricSelector
              configuration={configuration}
              onConfigurationChange={updateConfiguration}
            />
          </div>

          <Separator />

          {/* Advanced Options */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced">
              <AccordionTrigger className="text-base font-semibold">
                Advanced Options
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                {/* Foam Types */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-semibold">Foam Types & Pricing</Label>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Select
                    value={configuration.foam?.type || ""}
                    onValueChange={(value) =>
                      updateConfiguration({ foam: { type: value } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Foam Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {foamTypesResult.isLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : foamTypes && foamTypes.length > 0 ? (
                        foamTypes
                          .filter((foam: any) => foam && foam.option_value)
                          .map((foam: any) => (
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

                {/* Seat Depth */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Seat Depth Upgrade Charges</Label>
                  <Select
                    value={String(configuration.dimensions?.seatDepth || 22)}
                    onValueChange={(value) =>
                      updateConfiguration({
                        dimensions: {
                          ...configuration.dimensions,
                          seatDepth: Number(value),
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Seat Depth" />
                    </SelectTrigger>
                    <SelectContent>
                      {seatDepthsResult.isLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : seatDepths && seatDepths.length > 0 ? (
                        seatDepths.map((depth: any) => {
                          if (!depth || !depth.option_value) return null;
                          const percentage = (depth.metadata?.upgrade_percent || 0) * 100;
                          const normalizedValue = normalizeDimensionValue(depth.option_value);
                          return (
                            <SelectItem key={depth.id} value={normalizedValue}>
                              <div className="flex items-center justify-between w-full">
                                <span>{depth.display_label || depth.option_value}</span>
                                {percentage > 0 && (
                                  <Badge variant="secondary" className="ml-2">
                                    Upgrade: {percentage.toFixed(1)}%
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
                  {configuration.dimensions?.seatDepth && (
                    <Alert>
                      <AlertDescription>
                        <strong>Selected: {configuration.dimensions.seatDepth} in depth</strong>
                        <br />
                        {getDimensionPercentage("depth", configuration.dimensions.seatDepth) === 0
                          ? "Standard depth - No extra cost"
                          : `Upgrade charge: ${(getDimensionPercentage("depth", configuration.dimensions.seatDepth) * 100).toFixed(1)}%`}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Seat Width */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Seat Width Upgrade Charges</Label>
                  <Select
                    value={String(configuration.dimensions?.seatWidth || 24)}
                    onValueChange={(value) =>
                      updateConfiguration({
                        dimensions: {
                          ...configuration.dimensions,
                          seatWidth: Number(value),
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Seat Width" />
                    </SelectTrigger>
                    <SelectContent>
                      {seatWidthsResult.isLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : seatWidths && seatWidths.length > 0 ? (
                        seatWidths.map((width: any) => {
                          if (!width || !width.option_value) return null;
                          const percentage = (width.metadata?.upgrade_percent || 0) * 100;
                          const normalizedValue = normalizeDimensionValue(width.option_value);
                          return (
                            <SelectItem key={width.id} value={normalizedValue}>
                              <div className="flex items-center justify-between w-full">
                                <span>{width.display_label || width.option_value}</span>
                                {percentage > 0 && (
                                  <Badge variant="secondary" className="ml-2">
                                    Upgrade: {percentage.toFixed(1)}%
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
                  {configuration.dimensions?.seatWidth && (
                    <Alert>
                      <AlertDescription>
                        <strong>Selected: {configuration.dimensions.seatWidth} in width</strong>
                        <br />
                        {getDimensionPercentage("width", configuration.dimensions.seatWidth) === 0
                          ? "Standard width - No extra cost"
                          : `Upgrade charge: ${(getDimensionPercentage("width", configuration.dimensions.seatWidth) * 100).toFixed(1)}%`}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Leg Options */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Leg Options</Label>
                  <Select
                    value={configuration.legs?.type || ""}
                    onValueChange={(value) =>
                      updateConfiguration({
                        legs: { ...configuration.legs, type: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Leg Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {legTypesResult.isLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : legTypes && legTypes.length > 0 ? (
                        legTypes
                          .filter((leg: any) => leg && leg.option_value)
                          .map((leg: any) => (
                            <SelectItem key={leg.id} value={leg.option_value}>
                              {leg.display_label || leg.option_value}
                            </SelectItem>
                          ))
                      ) : (
                        <SelectItem value="no-data" disabled>No options available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {configuration.legs?.type && (
                    <p className="text-sm text-muted-foreground">
                      Premium leg finish for your sofa bed
                    </p>
                  )}
                </div>

                {/* Wood Type */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Wood Type</Label>
                  <Select
                    value={configuration.wood?.type || ""}
                    onValueChange={(value) =>
                      updateConfiguration({
                        wood: { ...configuration.wood, type: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Wood Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {woodTypesResult.isLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : woodTypes && woodTypes.length > 0 ? (
                        woodTypes
                          .filter((wood: any) => wood && wood.option_value)
                          .map((wood: any) => (
                            <SelectItem key={wood.id} value={wood.option_value}>
                              {wood.display_label || wood.option_value}
                            </SelectItem>
                          ))
                      ) : (
                        <SelectItem value="no-data" disabled>No options available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {configuration.wood?.type && (
                    <p className="text-sm text-muted-foreground">
                      High-quality wood for frame construction
                    </p>
                  )}
                </div>

                {/* Stitch Type */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Stitch Type</Label>
                  <Select
                    value={configuration.stitch?.type || ""}
                    onValueChange={(value) =>
                      updateConfiguration({
                        stitch: { ...configuration.stitch, type: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Stitch Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {stitchTypesResult.isLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : stitchTypes && stitchTypes.length > 0 ? (
                        stitchTypes
                          .filter((stitch: any) => stitch && stitch.option_value)
                          .map((stitch: any) => (
                            <SelectItem key={stitch.id} value={stitch.option_value}>
                              {stitch.display_label || stitch.option_value}
                            </SelectItem>
                          ))
                      ) : (
                        <SelectItem value="no-data" disabled>No options available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {configuration.stitch?.type && (
                    <p className="text-sm text-muted-foreground">
                      Professional stitching finish for durability
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Recliner Configuration - Separate Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl font-serif">Recliner Mechanism</CardTitle>
          <CardDescription>Configure electric recliner mechanisms per section (₹14,000 per recliner)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeReclinerSections.map((sectionKey) => {
            const reclinerData = reclinerConfig[sectionKey];
            return (
              <Card key={sectionKey} className="bg-muted/30">
                <CardContent className="p-4 space-y-3">
                  <Label className="font-semibold">
                    {RECLINER_SECTION_LABELS[sectionKey]}
                  </Label>
                  <RadioGroup
                    value={reclinerData.required}
                    onValueChange={(value) => {
                      handleReclinerChange(sectionKey, {
                        required: value as ReclinerSectionConfig["required"],
                        numberOfRecliners: value === "Yes" ? reclinerData.numberOfRecliners || 1 : 0,
                      });
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Yes" id={`recliner-${sectionKey}-yes`} />
                      <Label htmlFor={`recliner-${sectionKey}-yes`} className="font-normal cursor-pointer">
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="No" id={`recliner-${sectionKey}-no`} />
                      <Label htmlFor={`recliner-${sectionKey}-no`} className="font-normal cursor-pointer">
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  {reclinerData.required === "Yes" && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Number of Recliners</Label>
                        <Input
                          type="number"
                          min="1"
                          value={reclinerData.numberOfRecliners || 1}
                          onChange={(e) =>
                            handleReclinerChange(sectionKey, {
                              numberOfRecliners: Math.max(1, Number(e.target.value)),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Positioning</Label>
                        <Select
                          value={reclinerData.positioning}
                          onValueChange={(value) =>
                            handleReclinerChange(sectionKey, {
                              positioning: value as LoungerPlacementValue,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RECLINER_POSITION_OPTIONS.map((option) => (
                              <SelectItem key={`${sectionKey}-${option.value}`} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <Card className="bg-muted/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Recliner Summary</CardTitle>
              <CardDescription>Only active sections contribute to recliner pricing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {reclinerSummaries.length > 0 ? (
                <ul className="space-y-1">
                  {reclinerSummaries.map((summary) => (
                    <li key={`recliner-summary-${summary.section}`} className="flex items-center justify-between">
                      <span>
                        {summary.label}: {summary.quantity > 0 ? `${summary.quantity} × ${summary.positioning}` : summary.status}
                      </span>
                      <span className="text-muted-foreground">
                        {summary.quantity > 0 ? formatCurrency(summary.price) : "₹0"}
                      </span>
                    </li>
                  ))}
                  {totalReclinerPrice > 0 && (
                    <li className="flex items-center justify-between font-semibold pt-1">
                      <span>Total Recliner Cost</span>
                      <span>{formatCurrency(totalReclinerPrice)}</span>
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No recliners selected for this configuration.</p>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Live Pricing Summary */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl font-serif">Summary</CardTitle>
          <CardDescription>Live pricing snapshot based on current selections.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <SummaryTile label="Base Model" value={formatCurrency(summaryData.basePriceValue)} />
            <SummaryTile label="Mechanism" value={formatCurrency(summaryData.mechanismPrice)} />
            <SummaryTile label="Consoles" value={formatCurrency(summaryData.consolePrice)} />
            <SummaryTile label="Armrest Accessories" value={formatCurrency(summaryData.armrestAccessories)} />
            <SummaryTile label="Fabric Upgrade" value={formatCurrency(summaryData.fabricUpgrade)} />
            <SummaryTile label="Lounger" value={formatCurrency(summaryData.loungerPrice)} />
            <SummaryTile
              label="Total Fabric (m)"
              value={`${summaryData.fabricMeters > 0 ? summaryData.fabricMeters.toFixed(1) : "0.0"} m`}
            />
            <SummaryTile
              label="Seat/Backrest Fabric"
              value={`${summaryData.seatBackrestFabric > 0 ? summaryData.seatBackrestFabric.toFixed(1) : "0.0"} m`}
            />
            <SummaryTile
              label="Structure/Armrest Fabric"
              value={`${summaryData.structureFabric > 0 ? summaryData.structureFabric.toFixed(1) : "0.0"} m`}
            />
            <SummaryTile label="Approx Width" value={`${summaryData.approxWidth.toFixed(0)}"`} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Net Invoice Value</p>
              <p className="text-2xl font-serif">{formatCurrency(summaryData.netInvoice)}</p>
            </div>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              Seats: {summaryData.seatCount} • Consoles: {summaryData.consoleCount}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl font-serif">Your Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              value={configuration.customerInfo?.fullName || ""}
              onChange={(e) =>
                updateConfiguration({
                  customerInfo: {
                    ...configuration.customerInfo,
                    fullName: e.target.value,
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={configuration.customerInfo?.email || ""}
              onChange={(e) =>
                updateConfiguration({
                  customerInfo: {
                    ...configuration.customerInfo,
                    email: e.target.value,
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={configuration.customerInfo?.phoneNumber || ""}
              onChange={(e) =>
                updateConfiguration({
                  customerInfo: {
                    ...configuration.customerInfo,
                    phoneNumber: e.target.value,
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialRequests">Special Requests</Label>
            <Textarea
              id="specialRequests"
              placeholder="Any special requests or notes..."
              value={configuration.customerInfo?.specialRequests || ""}
              onChange={(e) =>
                updateConfiguration({
                  customerInfo: {
                    ...configuration.customerInfo,
                    specialRequests: e.target.value,
                  },
                })
              }
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuration Preview */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl font-serif">Configuration Preview & Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px]">
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold">
                {dimensions.width}cm × {dimensions.depth}cm
              </div>
              <div className="text-lg font-semibold text-muted-foreground">
                {dimensions.label}
              </div>
              <div className="text-sm text-muted-foreground space-y-1 pt-4">
                <p>Shape: {normalizedShape}</p>
                <p>Total Seats: {totalSeatCount}</p>
                {configuration.legs?.type && (
                  <p>Legs: {configuration.legs.type}</p>
                )}
                {loungerEnabled && (
                  <>
                    <p>
                      Lounger: {loungerConfig.numberOfLoungers} • {loungerConfig.size} • {loungerConfig.placement}
                    </p>
                    <p>
                      Lounger Price: {formatCurrency(loungerPricing.totalPrice)} • Fabric:{" "}
                      {loungerPricing.totalFabric.toFixed(1)} m
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download Image
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SofaBedConfigurator;
