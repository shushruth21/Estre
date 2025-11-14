import { useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import FabricSelector from "./FabricSelector";

interface CinemaChairConfiguratorProps {
  product: any;
  configuration: any;
  onConfigurationChange: (config: any) => void;
}

const WIDTH_TABLE: Record<string, Record<string, number>> = {
  "1-Seater": { "22 In": 22, "24 In": 24, "28 In": 28, "30 In": 30 },
  "2-Seater": { "22 In": 44, "24 In": 48, "28 In": 56, "30 In": 60 },
  "3-Seater": { "22 In": 66, "24 In": 72, "28 In": 84, "30 In": 90 },
  "4-Seater": { "22 In": 88, "24 In": 96, "28 In": 112, "30 In": 120 },
};

const PRICING_MULTIPLIERS = {
  firstSeat: 1.0,
  additionalSeat: 0.55,
} as const;

const SEAT_WIDTH_CHARGES: Record<string, number> = {
  "22 In": 0,
  "24 In": 0,
  "28 In": 0.13,
  "30 In": 0.195,
};

const MECHANISM_PRICES: Record<string, number> = {
  "Single Motor": 0,
  "Dual Motor": 28000,
};

const CONSOLE_DETAILS: Record<string, { price: number; width: number; fabric: number }> = {
  "Console-6 in": { price: 8000, width: 6, fabric: 1.5 },
  "Console-10 In": { price: 12000, width: 10, fabric: 2.5 },
};

const DUAL_COLOUR_SPLIT = {
  seatBackrest: 0.645,
  structureArmrestConsole: 0.355,
};

const formatCurrency = (value: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const parseSeatCount = (seaterType?: string | number | null): number => {
  if (typeof seaterType === "number") return Math.max(1, seaterType);
  if (!seaterType) return 1;
  const match = seaterType.toString().match(/(\d+)/);
  return match ? Math.max(1, parseInt(match[1], 10)) : 1;
};

const getSeatWidthKey = (seatWidth: any, options: any[]): string => {
  if (typeof seatWidth === "string") {
    const normalized = seatWidth.trim();
    if (SEAT_WIDTH_CHARGES[normalized] !== undefined) return normalized;
    const match = normalized.match(/(\d+)/);
    if (match) {
      const candidate = `${match[1]} In`;
      if (SEAT_WIDTH_CHARGES[candidate] !== undefined) return candidate;
    }
  }
  if (typeof seatWidth === "number") {
    const candidate = `${seatWidth} In`;
    if (SEAT_WIDTH_CHARGES[candidate] !== undefined) return candidate;
  }
  const fallback = options?.[0]?.option_value || "24 In";
  return fallback;
};

const getWidthChargeMultiplier = (seatWidthKey: string) =>
  1 + (SEAT_WIDTH_CHARGES[seatWidthKey] || 0);

const calculateWidth = (seaterType: string, seatWidthKey: string, seatCount: number) => {
  return (
    WIDTH_TABLE[seaterType]?.[seatWidthKey] ||
    seatCount * Number.parseInt(seatWidthKey, 10) ||
    seatCount * 24
  );
};

const getOrdinalLabel = (index: number) => {
  if (index === 1) return "1st";
  if (index === 2) return "2nd";
  if (index === 3) return "3rd";
  return `${index}th`;
};

const getConsolePlacementOptions = (
  seatCount: number,
  consoleNumber: number
): Array<{ value: string; label: string }> => {
  const options: Array<{ value: string; label: string }> = [];

  const push = (seatIndex: number) => {
    if (seatIndex <= seatCount) {
      options.push({
        value: `after_${seatIndex}`,
        label: `After ${getOrdinalLabel(seatIndex)} Seat from Left`,
      });
    }
  };

  if (consoleNumber === 1) {
    push(1);
    push(2);
    push(3);
  } else if (consoleNumber === 2) {
    push(2);
    push(3);
  } else if (consoleNumber === 3) {
    push(3);
  }

  options.push({ value: "none", label: "None (Unassigned)" });
  return options;
};

const coerceNumber = (...values: any[]): number => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const num = Number(value);
    if (!Number.isNaN(num) && Number.isFinite(num)) return num;
  }
  return 0;
};

const normalizeTextOption = (text: string) => (text || "").toString().trim();

const normalizeInchesLabel = (text: string, suffix: "In" | "in" = "In") => {
  const match = String(text).match(/(\d+(?:\.\d+)?)/);
  if (!match) return normalizeTextOption(String(text));
  return `${match[1]} ${suffix}`;
};

const normalizeSeatCountLabel = (text: string) => {
  const match = String(text).match(/(\d+)/);
  if (!match) return normalizeTextOption(String(text));
  return `${match[1]}-Seater`;
};

type DropdownOption = {
  id?: string | number;
  option_value?: string;
  display_label?: string;
  [key: string]: unknown;
};

const dedupeOptions = (
  options: DropdownOption[] | undefined,
  normalizer: (value: string) => string = normalizeTextOption
) => {
  const unique = new Map<string, DropdownOption>();
  (options || []).forEach((option) => {
    const rawValue = normalizeTextOption(
      (option?.option_value as string) || (option?.display_label as string) || ""
    );
    const normalized = normalizer(rawValue);
    const key = normalized.toLowerCase();

    if (!unique.has(key)) {
      unique.set(key, {
        ...option,
        option_value: normalized,
        display_label: normalized,
      });
    }
  });

  return Array.from(unique.values());
};

const CinemaChairConfigurator = ({
  product,
  configuration,
  onConfigurationChange,
}: CinemaChairConfiguratorProps) => {
  const seatCountsResult = useDropdownOptions("cinema_chairs", "seat_count");
  const mechanismTypesResult = useDropdownOptions("cinema_chairs", "mechanism_type");
  const consoleSizesResult = useDropdownOptions("common", "console_size");
  const foamTypesResult = useDropdownOptions("common", "foam_type");
  const seatDepthsResult = useDropdownOptions("cinema_chairs", "seat_depth");
  const seatWidthsResult = useDropdownOptions("cinema_chairs", "seat_width");
  const seatHeightsResult = useDropdownOptions("cinema_chairs", "seat_height");
  const legTypesResult = useDropdownOptions("cinema_chairs", "leg_type");
  const woodTypesResult = useDropdownOptions("cinema_chairs", "wood_type");

  const seatCountOptions = useMemo(
    () =>
      dedupeOptions((seatCountsResult.data || []) as any[], normalizeSeatCountLabel),
    [seatCountsResult.data]
  );

  const seatWidthOptions = useMemo(
    () =>
      dedupeOptions((seatWidthsResult.data || []) as any[], (value) =>
        normalizeInchesLabel(value, "In")
      ),
    [seatWidthsResult.data]
  );

  const seatDepthOptions = useMemo(
    () =>
      dedupeOptions((seatDepthsResult.data || []) as any[], (value) =>
        normalizeInchesLabel(value, "in")
      ),
    [seatDepthsResult.data]
  );

  const seatHeightOptions = useMemo(
    () =>
      dedupeOptions((seatHeightsResult.data || []) as any[], (value) =>
        normalizeInchesLabel(value, "in")
      ),
    [seatHeightsResult.data]
  );

  const { data: accessoriesData, isLoading: loadingAccessories } = useQuery({
    queryKey: ["cinema-accessories-prices"],
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

  const accessoryPriceMap = useMemo(() => {
    const map = new Map<string, number>();
    (accessoriesData || []).forEach((item: any) => {
      map.set(item.id.toString(), Number(item.sale_price) || 0);
    });
    return map;
  }, [accessoriesData]);

  const updateConfiguration = useCallback(
    (updates: any) => {
      onConfigurationChange({ ...configuration, ...updates });
    },
    [configuration, onConfigurationChange]
  );

  useEffect(() => {
    if (!configuration.productId) {
      const defaultHeadrest =
        product?.whether_comes_with_headrest === "Yes" ||
        product?.metadata?.comes_with_headrest === "Yes";

      updateConfiguration({
        productId: product.id,
        category: "cinema_chairs",
        seaterType: configuration.seaterType || "2-Seater",
        numberOfSeats: configuration.numberOfSeats || 2,
        mechanism: configuration.mechanism || "Single Motor",
        console: configuration.console || {
          required: "No",
          quantity: 0,
          size: "Console-6 in",
          placements: [],
        },
        accessories: configuration.accessories || {
          leftArmRest: null,
          rightArmRest: null,
          consoleAccessories: [],
        },
        headrest: configuration.headrest || {
          comesWithProduct: defaultHeadrest,
          required: defaultHeadrest ? "Yes" : "No",
        },
        fabric: configuration.fabric || {
          claddingPlan: "Single Colour",
          structureCode: "",
          extraFabricCharges: 0,
          fabricUpgradeCharges: 0,
        },
        foam: configuration.foam || {
          type: "Firm",
        },
        dimensions: configuration.dimensions || {
          seatDepth: "22 in",
          seatWidth: "24 In",
          seatHeight: "18 in",
        },
        legs: configuration.legs || {
          type: "Cylinder Leg (3 in)",
        },
        wood: configuration.wood || "Pine (Default)",
      });
    }
  }, [configuration, product, updateConfiguration]);

  const seatCount = parseSeatCount(configuration.seaterType || configuration.numberOfSeats || 1);
  const seatWidthKey = getSeatWidthKey(
    configuration.dimensions?.seatWidth ||
      configuration.seatWidth ||
      seatWidthOptions[0]?.option_value ||
      "24 In",
    seatWidthOptions
  );
  const seaterType = configuration.seaterType || "2-Seater";

  useEffect(() => {
    const quantity = configuration.console?.required === "Yes" ? configuration.console?.quantity || 0 : 0;

    if (configuration.console?.placements?.length !== quantity) {
      const placements = Array.from({ length: quantity }, (_, i) => configuration.console?.placements?.[i] || "none");
      updateConfiguration({
        console: {
          ...configuration.console,
          quantity,
          placements,
        },
      });
    }

    if (configuration.accessories?.consoleAccessories?.length !== quantity) {
      const consoleAccessories = Array.from(
        { length: quantity },
        (_, i) => configuration.accessories?.consoleAccessories?.[i] || null
      );
      updateConfiguration({
        accessories: {
          ...configuration.accessories,
          consoleAccessories,
        },
      });
    }
  }, [configuration.console?.required, configuration.console?.quantity, updateConfiguration]);

  const activeConsolePlacements = useMemo(
    () => (configuration.console?.placements || []).filter((value: any) => value && value !== "none"),
    [configuration.console?.placements]
  );

  const consoleDetails = useMemo(
    () => CONSOLE_DETAILS[configuration.console?.size || "Console-6 in"] || { price: 0, width: 0, fabric: 0 },
    [configuration.console?.size]
  );

  const baseFabricMeters = useMemo(() => {
    const baseFabric = coerceNumber(
      product?.metadata?.cinema_base_fabric_mtrs,
      product?.metadata?.base_fabric_mtrs,
      product?.base_fabric_mtrs,
      product?.base_fabric
    );
    const additionalFabric = coerceNumber(
      product?.metadata?.cinema_additional_fabric_mtrs,
      product?.metadata?.additional_fabric_mtrs,
      product?.additional_fabric_mtrs,
      product?.additional_fabric
    );

    if (baseFabric === 0 && additionalFabric === 0) {
      const fallbackBase = 17;
      const fallbackAdditional = 2;
      return fallbackBase + Math.max(0, seatCount - 1) * fallbackAdditional;
    }

    return baseFabric + Math.max(0, seatCount - 1) * additionalFabric;
  }, [product, seatCount]);

  const consoleFabricMeters = consoleDetails.fabric * activeConsolePlacements.length;
  const extraFabricMeters = Number(configuration.fabric?.extraFabricCharges || 0);
  const totalFabricMeters = baseFabricMeters + consoleFabricMeters + extraFabricMeters;

  const seatMultiplier =
    PRICING_MULTIPLIERS.firstSeat + PRICING_MULTIPLIERS.additionalSeat * Math.max(0, seatCount - 1);
  const widthMultiplier = getWidthChargeMultiplier(seatWidthKey);

  const baseSeatPricePerUnit = coerceNumber(
    product?.metadata?.cinema_base_price_per_seat,
    product?.metadata?.base_price_per_seat,
    product?.base_price_per_seat,
    product?.net_price_rs
  );

  const baseModelPrice = baseSeatPricePerUnit * seatMultiplier * widthMultiplier;
  const mechanismCost = (MECHANISM_PRICES[configuration.mechanism ?? "Single Motor"] || 0) * seatCount;
  const consoleBasePrice = consoleDetails.price * activeConsolePlacements.length;

  const consoleAccessoryPrice = useMemo(() => {
    let total = 0;
    const placements = configuration.console?.placements || [];
    const accessories = configuration.accessories?.consoleAccessories || [];

    placements.forEach((placement: any, index: number) => {
      if (placement && placement !== "none") {
        const accessoryId = accessories[index];
        if (accessoryId) {
          total += accessoryPriceMap.get(accessoryId.toString()) || 0;
        }
      }
    });

    return total;
  }, [configuration.console?.placements, configuration.accessories?.consoleAccessories, accessoryPriceMap]);

  const leftArmRestPrice = accessoryPriceMap.get(configuration.accessories?.leftArmRest?.toString() || "") || 0;
  const rightArmRestPrice = accessoryPriceMap.get(configuration.accessories?.rightArmRest?.toString() || "") || 0;
  const armrestAccessoriesTotal = leftArmRestPrice + rightArmRestPrice;
  const fabricUpgradeCharges = Number(configuration.fabric?.fabricUpgradeCharges || 0);

  const discountAmount = Number(configuration.discount?.amount || 0);

  const totalInvoiceValue =
    baseModelPrice +
    mechanismCost +
    consoleBasePrice +
    consoleAccessoryPrice +
    fabricUpgradeCharges +
    armrestAccessoriesTotal;

  const approxOverallWidth =
    calculateWidth(seaterType, seatWidthKey, seatCount) +
    consoleDetails.width * activeConsolePlacements.length;

  const netInvoiceValue = totalInvoiceValue - discountAmount;

  const handleConsoleQuantityChange = (value: number) => {
    const maxConsoles = Math.max(0, seatCount - 1);
    const quantity = Math.min(Math.max(0, value), maxConsoles);

    const placements = Array.from({ length: quantity }, (_, i) => configuration.console?.placements?.[i] || "none");
    const consoleAccessories = Array.from(
      { length: quantity },
      (_, i) => configuration.accessories?.consoleAccessories?.[i] || null
    );

    updateConfiguration({
      console: {
        ...configuration.console,
        required: quantity > 0 ? "Yes" : configuration.console?.required || "No",
        quantity,
        placements,
      },
      accessories: {
        ...configuration.accessories,
        consoleAccessories,
      },
    });
  };

  const normalizedCladdingPlan = configuration.fabric?.claddingPlan || "Single Colour";
  const isMultiColour = normalizedCladdingPlan === "Multi Colour";
  const seatBackrestMeters = isMultiColour
    ? totalFabricMeters * DUAL_COLOUR_SPLIT.seatBackrest
    : totalFabricMeters;
  const structureMeters = isMultiColour
    ? totalFabricMeters * DUAL_COLOUR_SPLIT.structureArmrestConsole
    : totalFabricMeters;

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl font-serif">Base Configuration</CardTitle>
          <CardDescription>Select seat count and core dimensions.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Seater Type</Label>
            {seatCountsResult.isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={configuration.seaterType || "2-Seater"}
                onValueChange={(value) => {
                  const seats = parseSeatCount(value);
                  updateConfiguration({
                    seaterType: value,
                    numberOfSeats: seats,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select seater type" />
                </SelectTrigger>
                <SelectContent>
                  {seatCountOptions.map((option: any) => (
                    <SelectItem key={option.id || option.option_value} value={option.option_value}>
                      {option.display_label || option.option_value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">Current: {seatCount} seat(s)</p>
          </div>

          <div className="space-y-2">
            <Label>Seat Width</Label>
            {seatWidthsResult.isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={seatWidthKey}
                onValueChange={(value) =>
                  updateConfiguration({
                    dimensions: {
                      ...configuration.dimensions,
                      seatWidth: value,
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seatWidthOptions.map((width: any) => (
                    <SelectItem key={width.id || width.option_value} value={width.option_value}>
                      {width.display_label || width.option_value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground">
              Width multiplier: {(getWidthChargeMultiplier(seatWidthKey) - 1) * 100}%
            </p>
          </div>

          <div className="space-y-2">
            <Label>Seat Depth</Label>
            {seatDepthsResult.isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={configuration.dimensions?.seatDepth?.toString() || "22 in"}
                onValueChange={(value) =>
                  updateConfiguration({
                    dimensions: {
                      ...configuration.dimensions,
                      seatDepth: value,
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seatDepthOptions.map((depth: any) => (
                    <SelectItem key={depth.id || depth.option_value} value={depth.option_value}>
                      {depth.display_label || depth.option_value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Seat Height</Label>
            {seatHeightsResult.isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={configuration.dimensions?.seatHeight?.toString() || "18 in"}
                onValueChange={(value) =>
                  updateConfiguration({
                    dimensions: {
                      ...configuration.dimensions,
                      seatHeight: value,
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seatHeightOptions.map((height: any) => (
                    <SelectItem key={height.id || height.option_value} value={height.option_value}>
                      {height.display_label || height.option_value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="md:col-span-2 rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-medium">Base Width</p>
            <p className="text-xl font-semibold">
              {calculateWidth(seaterType, seatWidthKey, seatCount)}" ({Math.round(
                calculateWidth(seaterType, seatWidthKey, seatCount) * 2.54
              )} cm)
            </p>
            <p className="text-xs text-muted-foreground">
              Formula: {seatCount} seats × {seatWidthKey}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl font-serif">Mechanism & Consoles</CardTitle>
          <CardDescription>Configure motors, console size and placement.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Mechanism Type</Label>
              {mechanismTypesResult.isLoading ? (
                <Skeleton className="h-28 w-full" />
              ) : (
                <RadioGroup
                  value={configuration.mechanism || "Single Motor"}
                  onValueChange={(value) =>
                    updateConfiguration({
                      mechanism: value,
                    })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Single Motor" id="mechanism-single" />
                    <Label htmlFor="mechanism-single" className="cursor-pointer font-normal">
                      Single Motor <Badge variant="outline" className="ml-2">₹0</Badge>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Dual Motor" id="mechanism-dual" />
                    <Label htmlFor="mechanism-dual" className="cursor-pointer font-normal">
                      Dual Motor
                      <Badge variant="outline" className="ml-2">
                        ₹{(MECHANISM_PRICES["Dual Motor"] * seatCount).toLocaleString()}
                      </Badge>
                    </Label>
                  </div>
                </RadioGroup>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Console Required</Label>
              <RadioGroup
                value={configuration.console?.required || "No"}
                onValueChange={(value) => {
                  const maxConsoles = Math.max(0, seatCount - 1);
                  const quantity = value === "Yes" ? Math.min(configuration.console?.quantity || 1, maxConsoles) : 0;
                  handleConsoleQuantityChange(quantity);
                  updateConfiguration({
                    console: {
                      ...configuration.console,
                      required: value,
                      quantity,
                    },
                  });
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Yes" id="console-required-yes" />
                  <Label htmlFor="console-required-yes" className="cursor-pointer font-normal">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="No" id="console-required-no" />
                  <Label htmlFor="console-required-no" className="cursor-pointer font-normal">
                    No
                  </Label>
                </div>
              </RadioGroup>
              <Alert className="mt-2">
                <AlertDescription>
                  Maximum consoles allowed: <strong>{Math.max(0, seatCount - 1)}</strong> (seats − 1)
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {configuration.console?.required === "Yes" && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Console Size</Label>
                  {consoleSizesResult.isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={configuration.console?.size || "Console-6 in"}
                      onValueChange={(value) =>
                        updateConfiguration({
                          console: {
                            ...configuration.console,
                            size: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(consoleSizesResult.data || Object.keys(CONSOLE_DETAILS)).map((size: any) => {
                          const optionValue = size?.option_value || size;
                          return (
                            <SelectItem key={optionValue} value={optionValue}>
                              {size?.display_label || optionValue}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Width impact: +{consoleDetails.width}" per active console
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Number of Consoles</Label>
                  <Input
                    type="number"
                    min={0}
                    max={Math.max(0, seatCount - 1)}
                    value={configuration.console?.quantity || 0}
                    onChange={(event) => handleConsoleQuantityChange(Number(event.target.value))}
                  />
                </div>
              </div>

              {configuration.console?.quantity > 0 && (
                <div className="space-y-4">
                  <Label className="text-sm font-semibold">Console Placements & Accessories</Label>
                  <div className="grid gap-4 lg:grid-cols-3">
                    {Array.from({ length: configuration.console.quantity }).map((_, index) => {
                      const options = getConsolePlacementOptions(seatCount, index + 1);
                      const selected = configuration.console?.placements?.[index] || "none";
                      const occupied = new Set(
                        configuration.console?.placements?.filter(
                          (value: any, idx: number) => idx !== index && value && value !== "none"
                        )
                      );
                      const filteredOptions = options.filter((option) =>
                        option.value === "none" ? true : !occupied.has(option.value)
                      );

                      return (
                        <Card key={index} className="border">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold">Console {index + 1}</CardTitle>
                            <CardDescription>Assign placement and accessory.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Placement</Label>
                              <Select
                                value={selected}
                                onValueChange={(value) => {
                                  const placements = [...(configuration.console?.placements || [])];
                                  placements[index] = value;
                                  updateConfiguration({
                                    console: {
                                      ...configuration.console,
                                      placements,
                                    },
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select placement" />
                                </SelectTrigger>
                                <SelectContent>
                                  {filteredOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Accessory</Label>
                              {loadingAccessories ? (
                                <Skeleton className="h-9 w-full" />
                              ) : (
                                <Select
                                  value={configuration.accessories?.consoleAccessories?.[index]?.toString() || "none"}
                                  onValueChange={(value) => {
                                    const consoleAccessories = [...(configuration.accessories?.consoleAccessories || [])];
                                    consoleAccessories[index] = value === "none" ? null : value;
                                    updateConfiguration({
                                      accessories: {
                                        ...configuration.accessories,
                                        consoleAccessories,
                                      },
                                    });
                                  }}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select accessory" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {(accessoriesData || []).map((acc: any) => (
                                      <SelectItem key={acc.id} value={acc.id.toString()}>
                                        {acc.description} - ₹{Number(acc.sale_price || 0).toLocaleString()}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <Label className="text-sm font-semibold">Armrest Accessories</Label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Left Arm Rest</Label>
                {loadingAccessories ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={configuration.accessories?.leftArmRest?.toString() || "none"}
                    onValueChange={(value) =>
                      updateConfiguration({
                        accessories: {
                          ...configuration.accessories,
                          leftArmRest: value === "none" ? null : value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select accessory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {(accessoriesData || []).map((acc: any) => (
                        <SelectItem key={acc.id} value={acc.id.toString()}>
                          {acc.description} - ₹{Number(acc.sale_price || 0).toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Right Arm Rest</Label>
                {loadingAccessories ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={configuration.accessories?.rightArmRest?.toString() || "none"}
                    onValueChange={(value) =>
                      updateConfiguration({
                        accessories: {
                          ...configuration.accessories,
                          rightArmRest: value === "none" ? null : value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select accessory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {(accessoriesData || []).map((acc: any) => (
                        <SelectItem key={acc.id} value={acc.id.toString()}>
                          {acc.description} - ₹{Number(acc.sale_price || 0).toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            {armrestAccessoriesTotal > 0 && (
              <p className="text-xs text-muted-foreground">
                Armrest accessories total: <strong>{formatCurrency(armrestAccessoriesTotal)}</strong>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl font-serif">Fabric & Finishes</CardTitle>
          <CardDescription>Manage cladding plan, extra fabric and finish upgrades.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FabricSelector configuration={configuration} onConfigurationChange={onConfigurationChange} />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Extra Fabric (Meters)</Label>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={configuration.fabric?.extraFabricCharges || 0}
                onChange={(event) =>
                  updateConfiguration({
                    fabric: {
                      ...configuration.fabric,
                      extraFabricCharges: Number(event.target.value),
                    },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Fabric Upgrade Charges</Label>
              <Input
                type="number"
                min={0}
                step={100}
                value={configuration.fabric?.fabricUpgradeCharges || 0}
                onChange={(event) =>
                  updateConfiguration({
                    fabric: {
                      ...configuration.fabric,
                      fabricUpgradeCharges: Number(event.target.value),
                    },
                  })
                }
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Leg Type</Label>
              {legTypesResult.isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={configuration.legs?.type || "Cylinder Leg (3 in)"}
                  onValueChange={(value) =>
                    updateConfiguration({
                      legs: {
                        ...configuration.legs,
                        type: value,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(legTypesResult.data || []).map((option: any) => (
                      <SelectItem key={option.id} value={option.option_value}>
                        {option.display_label || option.option_value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Wood Type</Label>
              {woodTypesResult.isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={configuration.wood || "Pine (Default)"}
                  onValueChange={(value) => updateConfiguration({ wood: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(woodTypesResult.data || []).map((option: any) => (
                      <SelectItem key={option.id} value={option.option_value}>
                        {option.display_label || option.option_value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl font-serif">Specifications</CardTitle>
          <CardDescription>Foam, headrest preference and additional notes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Foam Option</Label>
            {foamTypesResult.isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={configuration.foam?.type || "Firm"}
                onValueChange={(value) => updateConfiguration({ foam: { type: value } })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(foamTypesResult.data || []).map((foam: any) => (
                    <SelectItem key={foam.id} value={foam.option_value}>
                      {foam.display_label || foam.option_value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
            <div>
              <p className="text-sm font-medium">Model Comes with Headrest</p>
              <p className="text-xs text-muted-foreground">
                {product?.whether_comes_with_headrest === "Yes" ? "Yes" : "No"}
              </p>
            </div>
            {product?.whether_comes_with_headrest === "Yes" && (
              <div className="space-y-2">
                <Label className="text-sm">Include Headrest in Order?</Label>
                <RadioGroup
                  value={configuration.headrest?.required || "Yes"}
                  onValueChange={(value) =>
                    updateConfiguration({
                      headrest: {
                        ...configuration.headrest,
                        required: value,
                      },
                    })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="headrest-yes" />
                    <Label htmlFor="headrest-yes" className="cursor-pointer font-normal">
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="headrest-no" />
                    <Label htmlFor="headrest-no" className="cursor-pointer font-normal">
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 bg-muted/40">
        <CardHeader>
          <CardTitle className="text-2xl font-serif">Summary</CardTitle>
          <CardDescription>Live pricing snapshot based on current selections.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryRow label="Base Model" value={formatCurrency(baseModelPrice)} />
            <SummaryRow label="Mechanism" value={formatCurrency(mechanismCost)} />
            <SummaryRow label="Consoles" value={formatCurrency(consoleBasePrice + consoleAccessoryPrice)} />
            <SummaryRow label="Armrest Accessories" value={formatCurrency(armrestAccessoriesTotal)} />
            <SummaryRow label="Fabric Upgrade" value={formatCurrency(fabricUpgradeCharges)} />
            <SummaryRow label="Total Fabric (m)" value={`${totalFabricMeters.toFixed(1)} m`} />
            <SummaryRow label="Seat/Backrest Fabric" value={`${seatBackrestMeters.toFixed(1)} m`} />
            <SummaryRow label="Structure/Armrest Fabric" value={`${structureMeters.toFixed(1)} m`} />
            <SummaryRow label="Approx Width" value={`${approxOverallWidth}"`} />
          </div>

          <Separator className="my-3" />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Net Invoice Value</p>
              <p className="text-2xl font-semibold">{formatCurrency(netInvoiceValue)}</p>
            </div>
            {discountAmount > 0 && (
              <Badge variant="destructive" className="text-sm">
                Discount Applied: {formatCurrency(discountAmount)}
              </Badge>
            )}
            <Badge variant="secondary" className="text-sm">
              Seats: {seatCount} • Consoles: {activeConsolePlacements.length}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md border bg-background p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-semibold">{value}</p>
  </div>
);

export default CinemaChairConfigurator;
