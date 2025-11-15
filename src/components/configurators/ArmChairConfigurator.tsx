import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { FabricLibrary } from "@/components/ui/FabricLibrary";
import { SummaryTile } from "@/components/ui/SummaryTile";

interface ArmChairConfiguratorProps {
  product: any;
  configuration: any;
  onConfigurationChange: (config: any) => void;
}

const BASE_FABRIC_PRICE_PER_METER = 800;
const PILLOW_MAX_QUANTITY = 4;
const WIDTH_MAP: Record<string, number> = {
  "22 in": 22,
  "24 in": 24,
  "26 in": 26,
  "30 in": 30,
};

const normalizeText = (value: string) => (value || "").trim();
const normalizeInches = (value: string) => {
  const match = value.match(/(\d+(?:\.\d+)?)/);
  if (!match) return normalizeText(value);
  return `${match[1]} in`;
};

const dedupeOptions = (
  options: any[] | undefined,
  normalizer: (value: string) => string = normalizeText
) => {
  const map = new Map<string, any>();
  (options || []).forEach((option) => {
    const raw = String(option?.option_value ?? option?.display_label ?? "");
    const normalized = normalizer(raw);
    const key = normalized.toLowerCase();

    if (!map.has(key)) {
      map.set(key, {
        ...option,
        option_value: normalized,
        display_label: normalized,
      });
    }
  });
  return Array.from(map.values());
};

const getSeatWidthValue = (seatWidth: string) => WIDTH_MAP[seatWidth] ?? 24;
const calculateApproxWidth = (seatWidthValue: number) => seatWidthValue + 3;

const ArmChairConfigurator = ({
  product,
  configuration,
  onConfigurationChange,
}: ArmChairConfiguratorProps) => {
  const seatWidthResponse = useDropdownOptions("arm_chairs", "seat_width");
  const seatDepthResponse = useDropdownOptions("arm_chairs", "seat_depth");
  const seatHeightResponse = useDropdownOptions("arm_chairs", "seat_height");
  const legResponse = useDropdownOptions("arm_chairs", "leg_type");
  const fabricPlanResponse = useDropdownOptions("arm_chairs", "fabric_cladding_plan");
  const pillowTypeResponse = useDropdownOptions("arm_chairs", "pillow_type");
  const pillowSizeResponse = useDropdownOptions("arm_chairs", "pillow_size");
  const pillowFabricPlanResponse = useDropdownOptions("arm_chairs", "pillow_fabric_plan");
  const discountApproverResponse = useDropdownOptions("arm_chairs", "discount_approver");
  const discountCodeResponse = useDropdownOptions("arm_chairs", "discount_code");
  const foamTypeResponse = useDropdownOptions("common", "foam_type");

  const seatWidthOptions = useMemo(
    () => dedupeOptions(seatWidthResponse.data as any[], normalizeInches),
    [seatWidthResponse.data]
  );
  const seatDepthOptions = useMemo(
    () => dedupeOptions(seatDepthResponse.data as any[], normalizeInches),
    [seatDepthResponse.data]
  );
  const seatHeightOptions = useMemo(
    () => dedupeOptions(seatHeightResponse.data as any[], normalizeInches),
    [seatHeightResponse.data]
  );
  const legOptions = useMemo(
    () => dedupeOptions(legResponse.data as any[]),
    [legResponse.data]
  );
  const fabricPlanOptions = useMemo(
    () => dedupeOptions(fabricPlanResponse.data as any[]),
    [fabricPlanResponse.data]
  );
  const pillowTypeOptions = useMemo(
    () => dedupeOptions(pillowTypeResponse.data as any[]),
    [pillowTypeResponse.data]
  );
  const pillowSizeOptions = useMemo(
    () => dedupeOptions(pillowSizeResponse.data as any[]),
    [pillowSizeResponse.data]
  );
  const pillowFabricPlanOptions = useMemo(
    () => dedupeOptions(pillowFabricPlanResponse.data as any[]),
    [pillowFabricPlanResponse.data]
  );
  const discountApproverOptions = useMemo(
    () => dedupeOptions(discountApproverResponse.data as any[]),
    [discountApproverResponse.data]
  );
  const discountCodeOptions = useMemo(
    () => dedupeOptions(discountCodeResponse.data as any[]),
    [discountCodeResponse.data]
  );
  const foamTypeOptions = useMemo(
    () => dedupeOptions(foamTypeResponse.data as any[]),
    [foamTypeResponse.data]
  );

  const updateConfiguration = useCallback(
    (updates: any) => {
      onConfigurationChange({ ...configuration, ...updates });
    },
    [configuration, onConfigurationChange]
  );

  useEffect(() => {
    if (!configuration.productId) {
      const defaultSeatWidth = seatWidthOptions[0]?.option_value || "24 in";
      const defaultSeatDepth = seatDepthOptions[0]?.option_value || "22 in";
      const defaultSeatHeight = seatHeightOptions[1]?.option_value || "18 in";
      const defaultLeg = legOptions[0];
      const defaultFabricPlan = fabricPlanOptions[0]?.option_value || "Single Colour";
      const defaultPillowType = pillowTypeOptions[0]?.option_value || "Simple pillow";
      const defaultPillowSize = pillowSizeOptions[0]?.option_value || "18 in X 18 in";
      const defaultPillowFabricPlan = pillowFabricPlanOptions[0]?.option_value || "Single Colour";
      const defaultApprover =
        discountApproverOptions.find((opt: any) => opt.metadata?.default) || discountApproverOptions[0];
      const defaultDiscount = discountCodeOptions[0];
      const defaultFoam = foamTypeOptions[0]?.option_value || "Firm";

      updateConfiguration({
        productId: product.id,
        category: "arm_chairs",
        dimensions: {
          seatWidth: defaultSeatWidth,
          seatDepth: defaultSeatDepth,
          seatHeight: defaultSeatHeight,
        },
        fabricPlan: {
          claddingPlan: defaultFabricPlan,
          extraFabricMeters: 0,
          fabricUpgradeCharges: 0,
          structureFabricCode: "",
          seatFabricCode: "",
          singleFabricCode: "",
          baseFabricMeters: Number(product?.fabricsinglechairmtrs || product?.fabric_mtrs || 6),
        },
        pillows: {
          required: "No",
          quantity: 0,
          type: defaultPillowType,
          size: defaultPillowSize,
          fabricPlan: defaultPillowFabricPlan,
          fabrics: {
            single: "",
            colour1: "",
            colour2: "",
          },
        },
        legs: {
          type: defaultLeg?.option_value || "Kulfi Leg-Brown with Gold",
          size: defaultLeg?.metadata?.size || "16 in",
        },
        foam: {
          type: defaultFoam,
        },
        discount: {
          approvedBy: defaultApprover?.option_value || "Director",
          discountCode: defaultDiscount?.option_value || "EVIP",
        },
      });
    }
  }, [
    configuration.productId,
    product.id,
    updateConfiguration,
    seatWidthOptions,
    seatDepthOptions,
    seatHeightOptions,
    legOptions,
    fabricPlanOptions,
    pillowTypeOptions,
    pillowSizeOptions,
    pillowFabricPlanOptions,
    discountApproverOptions,
    discountCodeOptions,
    foamTypeOptions,
  ]);

  const fabricPlan = configuration.fabricPlan || {};
  const pillows = configuration.pillows || {};
  const dimensions = configuration.dimensions || {};
  const legs = configuration.legs || {};
  const discount = configuration.discount || {};
  const foam = configuration.foam || {};

  const [openFabricPicker, setOpenFabricPicker] = useState<
    | null
    | "singleChair"
    | "structureChair"
    | "seatChair"
    | "pillowSingle"
    | "pillowColour1"
    | "pillowColour2"
  >(null);

  const chairFabricCodes = useMemo(() => {
    const codes: string[] = [];
    if (fabricPlan?.claddingPlan === "Single Colour" && fabricPlan?.singleFabricCode) {
      codes.push(fabricPlan.singleFabricCode);
    }
    if (fabricPlan?.claddingPlan === "Dual Colour") {
      if (fabricPlan?.structureFabricCode) codes.push(fabricPlan.structureFabricCode);
      if (fabricPlan?.seatFabricCode) codes.push(fabricPlan.seatFabricCode);
    }
    return codes;
  }, [fabricPlan]);

  const pillowFabricCodes = useMemo(() => {
    const codes: string[] = [];
    if (pillows?.fabricPlan === "Single Colour" && pillows?.fabrics?.single) {
      codes.push(pillows.fabrics.single);
    }
    if (pillows?.fabricPlan === "Dual Colour") {
      if (pillows?.fabrics?.colour1) codes.push(pillows.fabrics.colour1);
      if (pillows?.fabrics?.colour2) codes.push(pillows.fabrics.colour2);
    }
    return codes;
  }, [pillows]);

  const chairFabricPricesQuery = useQuery({
    queryKey: ["arm-chair-fabric-prices", chairFabricCodes],
    queryFn: async () => {
      if (chairFabricCodes.length === 0) return {} as Record<string, number>;
      const { data, error } = await supabase
        .from("fabric_coding")
        .select("estre_code, price")
        .in("estre_code", chairFabricCodes);
      if (error) throw error;
      const map: Record<string, number> = {};
      (data || []).forEach((item) => {
        map[item.estre_code] = Number(item.price) || 0;
      });
      return map;
    },
    enabled: chairFabricCodes.length > 0,
  });

  const pillowSizeMetadata = useMemo(() => {
    const metadata: Record<string, { price_matrix: Record<string, number>; fabric_matrix: Record<string, number> }> = {};
    (pillowSizeOptions || []).forEach((option: any) => {
      if (option.metadata) {
        metadata[option.option_value] = option.metadata as any;
      }
    });
    return metadata;
  }, [pillowSizeOptions]);

  const pillowPriceAndFabric = useMemo(() => {
    if (pillows?.required !== "Yes" || !pillows?.quantity || pillows.quantity <= 0) {
      return { price: 0, fabric: 0 };
    }
    const sizeMetadata = pillowSizeMetadata[pillows.size || ""];
    if (!sizeMetadata) return { price: 0, fabric: 0 };
    const type = pillows.type || "Simple pillow";
    const pricePerPillow = sizeMetadata.price_matrix?.[type] || 0;
    const fabricPerPillow = sizeMetadata.fabric_matrix?.[type] || 0;
    return {
      price: pricePerPillow * pillows.quantity,
      fabric: fabricPerPillow * pillows.quantity,
    };
  }, [pillows, pillowSizeMetadata]);

  const baseFabricMeters = Number(product?.fabricsinglechairmtrs || product?.metadata?.fabric_mtrs || 6);
  const extraFabricMeters = Number(fabricPlan?.extraFabricMeters || 0);
  const totalFabricMeters = baseFabricMeters + extraFabricMeters;

  const fabricSplit = useMemo(() => {
    if (fabricPlan?.claddingPlan === "Dual Colour") {
      const structure = totalFabricMeters * 0.8;
      const seat = totalFabricMeters * 0.4;
      return {
        structure,
        seat,
        total: structure + seat,
      };
    }
    return {
      total: totalFabricMeters,
    } as { structure?: number; seat?: number; total: number };
  }, [fabricPlan?.claddingPlan, totalFabricMeters]);

  const fabricUpgradeCharges = useMemo(() => {
    if (chairFabricPricesQuery.isLoading || chairFabricPricesQuery.isError) return 0;
    const priceMap = chairFabricPricesQuery.data || {};

    if (fabricPlan?.claddingPlan === "Dual Colour") {
      const structureCode = fabricPlan?.structureFabricCode;
      const seatCode = fabricPlan?.seatFabricCode;
      let total = 0;
      if (structureCode && fabricSplit.structure) {
        const price = priceMap[structureCode] ?? BASE_FABRIC_PRICE_PER_METER;
        total += (price - BASE_FABRIC_PRICE_PER_METER) * fabricSplit.structure;
      }
      if (seatCode && fabricSplit.seat) {
        const price = priceMap[seatCode] ?? BASE_FABRIC_PRICE_PER_METER;
        total += (price - BASE_FABRIC_PRICE_PER_METER) * fabricSplit.seat;
      }
      return Math.max(0, total);
    }

    if (fabricPlan?.claddingPlan === "Single Colour" && fabricPlan?.singleFabricCode) {
      const price = priceMap[fabricPlan.singleFabricCode] ?? BASE_FABRIC_PRICE_PER_METER;
      return Math.max(0, (price - BASE_FABRIC_PRICE_PER_METER) * fabricSplit.total);
    }

    return 0;
  }, [fabricPlan, chairFabricPricesQuery.data, chairFabricPricesQuery.isError, chairFabricPricesQuery.isLoading, fabricSplit]);

  useEffect(() => {
    const current = Number(fabricPlan?.fabricUpgradeCharges || 0);
    if (Math.abs(current - fabricUpgradeCharges) > 0.5) {
      updateConfiguration({
        fabricPlan: {
          ...fabricPlan,
          fabricUpgradeCharges,
        },
      });
    }
  }, [fabricPlan, fabricUpgradeCharges, updateConfiguration]);

  const seatWidthValue = getSeatWidthValue(dimensions?.seatWidth || "24 in");
  const approxOverallWidth = calculateApproxWidth(seatWidthValue);

  const basePrice = Number(product?.netpricers || product?.net_price_rs || product?.base_price_per_seat || 0);
  const extraFabricCost = extraFabricMeters * BASE_FABRIC_PRICE_PER_METER;
  const pillowPrice = pillowPriceAndFabric.price;
  const foamUpgradePrice = (() => {
    const selectedFoam = foam?.type || "Firm";
    switch (selectedFoam) {
      case "Latex Foam":
        return 4000;
      case "Memory Foam":
        return 3000;
      default:
        return 0;
    }
  })();

  const widthMultiplier = (() => {
    const option = seatWidthOptions.find((opt: any) => opt.option_value === dimensions?.seatWidth);
    const multiplier = Number(option?.metadata?.width_multiplier || 0);
    return multiplier;
  })();

  const depthMultiplier = (() => {
    const option = seatDepthOptions.find((opt: any) => opt.option_value === dimensions?.seatDepth);
    const multiplier = Number(option?.metadata?.depth_multiplier || 0);
    return multiplier;
  })();

  const dimensionUpgrade = basePrice * (widthMultiplier + depthMultiplier);

  const totalInvoiceValue =
    basePrice +
    fabricUpgradeCharges +
    extraFabricCost +
    pillowPrice +
    foamUpgradePrice +
    dimensionUpgrade;

  const selectedDiscount = discountCodeOptions.find(
    (option: any) => option.option_value === discount?.discountCode
  );
  const discountPercent = Number(selectedDiscount?.metadata?.percentage || discount?.percentage || 0);
  const discountAmount = totalInvoiceValue * discountPercent;
  const netInvoiceValue = totalInvoiceValue - discountAmount;

  useEffect(() => {
    const currentPercent = Number(discount?.percentage || 0);
    const currentAmount = Number(discount?.amount || 0);
    if (
      Math.abs(currentPercent - discountPercent) > 0.0001 ||
      Math.abs(currentAmount - discountAmount) > 0.5
    ) {
      updateConfiguration({
        discount: {
          ...discount,
          percentage: discountPercent,
          amount: discountAmount,
        },
      });
    }
  }, [discount, discountAmount, discountPercent, updateConfiguration]);

  const totalFabricForDisplay = fabricPlan?.claddingPlan === "Dual Colour"
    ? (fabricSplit.structure || 0) + (fabricSplit.seat || 0)
    : fabricSplit.total;

  const handleFabricSelection = (code: string | null, target: typeof openFabricPicker) => {
    switch (target) {
      case "singleChair":
        updateConfiguration({
          fabricPlan: {
            ...fabricPlan,
            singleFabricCode: code || "",
          },
        });
        break;
      case "structureChair":
        updateConfiguration({
          fabricPlan: {
            ...fabricPlan,
            structureFabricCode: code || "",
          },
        });
        break;
      case "seatChair":
        updateConfiguration({
          fabricPlan: {
            ...fabricPlan,
            seatFabricCode: code || "",
          },
        });
        break;
      case "pillowSingle":
        updateConfiguration({
          pillows: {
            ...pillows,
            fabrics: {
              ...pillows.fabrics,
              single: code || "",
            },
          },
        });
        break;
      case "pillowColour1":
        updateConfiguration({
          pillows: {
            ...pillows,
            fabrics: {
              ...pillows.fabrics,
              colour1: code || "",
            },
          },
        });
        break;
      case "pillowColour2":
        updateConfiguration({
          pillows: {
            ...pillows,
            fabrics: {
              ...pillows.fabrics,
              colour2: code || "",
            },
          },
        });
        break;
    }
    setOpenFabricPicker(null);
  };

  const renderFabricButton = (
    label: string,
    code: string | undefined,
    onClick: () => void
  ) => (
    <Button variant="outline" className="justify-start" onClick={onClick}>
      {code ? (
        <span className="truncate">{code}</span>
      ) : (
        <span className="text-muted-foreground">Select fabric…</span>
      )}
    </Button>
  );

  const pillowsRequired = pillows?.required === "Yes" && pillows?.quantity > 0;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="base" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="base">Base Model</TabsTrigger>
          <TabsTrigger value="fabric">Fabric & Pillows</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="base" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Base Configuration</CardTitle>
              <CardDescription>Dimensions and leg style for the chair.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Seat Width</Label>
                {seatWidthResponse.isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={dimensions?.seatWidth || seatWidthOptions[0]?.option_value || "24 in"}
                    onValueChange={(value) =>
                      updateConfiguration({
                        dimensions: {
                          ...dimensions,
                          seatWidth: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {seatWidthOptions.map((option: any) => (
                        <SelectItem key={option.option_value} value={option.option_value}>
                          {option.display_label || option.option_value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  Width charge multiplier: {(widthMultiplier * 100).toFixed(1)}%
                </p>
              </div>

              <div className="space-y-2">
                <Label>Seat Depth</Label>
                {seatDepthResponse.isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={dimensions?.seatDepth || seatDepthOptions[0]?.option_value || "22 in"}
                    onValueChange={(value) =>
                      updateConfiguration({
                        dimensions: {
                          ...dimensions,
                          seatDepth: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {seatDepthOptions.map((option: any) => (
                        <SelectItem key={option.option_value} value={option.option_value}>
                          {option.display_label || option.option_value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">
                  Depth charge multiplier: {(depthMultiplier * 100).toFixed(1)}%
                </p>
              </div>

              <div className="space-y-2">
                <Label>Seat Height</Label>
                {seatHeightResponse.isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={dimensions?.seatHeight || seatHeightOptions[1]?.option_value || "18 in"}
                    onValueChange={(value) =>
                      updateConfiguration({
                        dimensions: {
                          ...dimensions,
                          seatHeight: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {seatHeightOptions.map((option: any) => (
                        <SelectItem key={option.option_value} value={option.option_value}>
                          {option.display_label || option.option_value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Legs</Label>
                {legResponse.isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={legs?.type || legOptions[0]?.option_value || "Kulfi Leg-Brown with Gold"}
                    onValueChange={(value) => {
                      const option = legOptions.find((opt: any) => opt.option_value === value);
                      updateConfiguration({
                        legs: {
                          type: value,
                          size: option?.metadata?.size || legs?.size || "16 in",
                        },
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {legOptions.map((option: any) => (
                        <SelectItem key={option.option_value} value={option.option_value}>
                          {option.display_label || option.option_value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">Leg size: {legs?.size || "16 in"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Additional Pillows</CardTitle>
              <CardDescription>Configure optional pillows for this chair.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Additional Pillows Required?</Label>
                <RadioGroup
                  value={pillows?.required || "No"}
                  onValueChange={(value) =>
                    updateConfiguration({
                      pillows: {
                        ...pillows,
                        required: value,
                        quantity: value === "Yes" ? Math.min(Math.max(pillows?.quantity || 1, 1), PILLOW_MAX_QUANTITY) : 0,
                      },
                    })
                  }
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="pillows-yes" />
                    <Label htmlFor="pillows-yes" className="cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="pillows-no" />
                    <Label htmlFor="pillows-no" className="cursor-pointer">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {pillowsRequired && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>No. of Pillows</Label>
                    <Input
                      type="number"
                      min={1}
                      max={PILLOW_MAX_QUANTITY}
                      value={pillows?.quantity || 1}
                      onChange={(event) =>
                        updateConfiguration({
                          pillows: {
                            ...pillows,
                            quantity: Math.min(Math.max(Number(event.target.value) || 1, 1), PILLOW_MAX_QUANTITY),
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Pillow Type</Label>
                    {pillowTypeResponse.isLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={pillows?.type || pillowTypeOptions[0]?.option_value || "Simple pillow"}
                        onValueChange={(value) =>
                          updateConfiguration({
                            pillows: {
                              ...pillows,
                              type: value,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {pillowTypeOptions.map((option: any) => (
                            <SelectItem key={option.option_value} value={option.option_value}>
                              {option.display_label || option.option_value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Pillow Size</Label>
                    {pillowSizeResponse.isLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={pillows?.size || pillowSizeOptions[0]?.option_value || "18 in X 18 in"}
                        onValueChange={(value) =>
                          updateConfiguration({
                            pillows: {
                              ...pillows,
                              size: value,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {pillowSizeOptions.map((option: any) => (
                            <SelectItem key={option.option_value} value={option.option_value}>
                              {option.display_label || option.option_value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Pillow Fabric Plan</Label>
                    {pillowFabricPlanResponse.isLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={pillows?.fabricPlan || pillowFabricPlanOptions[0]?.option_value || "Single Colour"}
                        onValueChange={(value) =>
                          updateConfiguration({
                            pillows: {
                              ...pillows,
                              fabricPlan: value,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {pillowFabricPlanOptions.map((option: any) => (
                            <SelectItem key={option.option_value} value={option.option_value}>
                              {option.display_label || option.option_value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {pillows?.fabricPlan === "Single Colour" ? (
                    <div className="space-y-2">
                      <Label>Pillow Fabric</Label>
                      {renderFabricButton("Pillow Fabric", pillows?.fabrics?.single, () =>
                        setOpenFabricPicker("pillowSingle")
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Colour 1</Label>
                        {renderFabricButton("Colour 1", pillows?.fabrics?.colour1, () =>
                          setOpenFabricPicker("pillowColour1")
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Colour 2</Label>
                        {renderFabricButton("Colour 2", pillows?.fabrics?.colour2, () =>
                          setOpenFabricPicker("pillowColour2")
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="rounded-md border bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">Pillow Pricing Overview</p>
                <p className="text-sm">
                  Pillow Price: <strong>₹{pillowPriceAndFabric.price.toFixed(2)}</strong>
                </p>
                <p className="text-sm">
                  Pillow Fabric: <strong>{pillowPriceAndFabric.fabric.toFixed(2)} m</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fabric" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Chair Fabric Plan</CardTitle>
              <CardDescription>Configure fabric for structure and seat.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Fabric Plan</Label>
                {fabricPlanResponse.isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <RadioGroup
                    value={fabricPlan?.claddingPlan || "Single Colour"}
                    onValueChange={(value) =>
                      updateConfiguration({
                        fabricPlan: {
                          ...fabricPlan,
                          claddingPlan: value,
                        },
                      })
                    }
                    className="flex gap-6"
                  >
                    {fabricPlanOptions.map((option: any) => (
                      <div key={option.option_value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.option_value} id={`chair-plan-${option.option_value}`} />
                        <Label htmlFor={`chair-plan-${option.option_value}`} className="cursor-pointer">
                          {option.display_label || option.option_value}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>

              {fabricPlan?.claddingPlan === "Single Colour" ? (
                <div className="space-y-2">
                  <Label>Single Colour Fabric</Label>
                  {renderFabricButton("Chair Fabric", fabricPlan?.singleFabricCode, () =>
                    setOpenFabricPicker("singleChair")
                  )}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Structure Fabric</Label>
                    {renderFabricButton("Structure", fabricPlan?.structureFabricCode, () =>
                      setOpenFabricPicker("structureChair")
                    )}
                    <p className="text-xs text-muted-foreground">
                      Structure meters: {(fabricSplit.structure || 0).toFixed(2)} m
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Seat Fabric</Label>
                    {renderFabricButton("Seat", fabricPlan?.seatFabricCode, () =>
                      setOpenFabricPicker("seatChair")
                    )}
                    <p className="text-xs text-muted-foreground">
                      Seat meters: {(fabricSplit.seat || 0).toFixed(2)} m
                    </p>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Extra Fabric (meters)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={extraFabricMeters}
                    onChange={(event) =>
                      updateConfiguration({
                        fabricPlan: {
                          ...fabricPlan,
                          extraFabricMeters: Number(event.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fabric Upgrade Charges (₹)</Label>
                  <Input value={Math.round(fabricUpgradeCharges)} readOnly />
                </div>
              </div>

              <div className="rounded-md border bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">Fabric Summary</p>
                <p className="text-sm">
                  Base Fabric: <strong>{baseFabricMeters.toFixed(2)} m</strong>
                </p>
                <p className="text-sm">
                  Extra Fabric: <strong>{extraFabricMeters.toFixed(2)} m</strong>
                </p>
                <p className="text-sm">
                  Chair Fabric Total: <strong>{totalFabricForDisplay.toFixed(2)} m</strong>
                </p>
                {pillowsRequired && (
                  <p className="text-sm">
                    Pillow Fabric: <strong>{pillowPriceAndFabric.fabric.toFixed(2)} m</strong>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Summary</CardTitle>
              <CardDescription>Live pricing snapshot based on current selections.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <SummaryTile label="Base Price" value={formatCurrency(basePrice)} />
                <SummaryTile label="Fabric Upgrade" value={formatCurrency(fabricUpgradeCharges)} />
                <SummaryTile label="Extra Fabric" value={formatCurrency(extraFabricCost)} />
                <SummaryTile label="Pillow Price" value={formatCurrency(pillowPrice)} />
                <SummaryTile label="Foam Upgrade" value={formatCurrency(foamUpgradePrice)} />
                <SummaryTile label="Dimension Upgrade" value={formatCurrency(dimensionUpgrade)} />
                <SummaryTile label="Total Invoice Value" value={formatCurrency(totalInvoiceValue)} />
                {discountAmount > 0 && (
                  <SummaryTile label="Discount" value={`-${formatCurrency(discountAmount)}`} />
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Invoice Value</p>
                  <p className="text-2xl font-serif">{formatCurrency(netInvoiceValue)}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Discount Approved By</Label>
                  {discountApproverResponse.isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={discount?.approvedBy || discountApproverOptions[0]?.option_value || "Director"}
                      onValueChange={(value) =>
                        updateConfiguration({
                          discount: {
                            ...discount,
                            approvedBy: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {discountApproverOptions.map((option: any) => (
                          <SelectItem key={option.option_value} value={option.option_value}>
                            {option.display_label || option.option_value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Discount Code</Label>
                  {discountCodeResponse.isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={discount?.discountCode || discountCodeOptions[0]?.option_value || "EVIP"}
                      onValueChange={(value) =>
                        updateConfiguration({
                          discount: {
                            ...discount,
                            discountCode: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {discountCodeOptions.map((option: any) => (
                          <SelectItem key={option.option_value} value={option.option_value}>
                            {option.display_label || option.option_value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Discount: {(discountPercent * 100).toFixed(0)}% ({discountAmount.toFixed(2)})
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/40 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Invoice Value</p>
                  <p className="text-2xl font-semibold">₹{netInvoiceValue.toFixed(2)}</p>
                </div>
                <Badge variant="secondary">Approx Width: {approxOverallWidth}"</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <FabricLibrary
        open={openFabricPicker === "singleChair"}
        onOpenChange={(open) => setOpenFabricPicker(open ? "singleChair" : null)}
        onSelect={(code) => handleFabricSelection(code, "singleChair")}
        selectedCode={fabricPlan?.singleFabricCode}
        title="Select Chair Fabric"
      />
      <FabricLibrary
        open={openFabricPicker === "structureChair"}
        onOpenChange={(open) => setOpenFabricPicker(open ? "structureChair" : null)}
        onSelect={(code) => handleFabricSelection(code, "structureChair")}
        selectedCode={fabricPlan?.structureFabricCode}
        title="Select Structure Fabric"
      />
      <FabricLibrary
        open={openFabricPicker === "seatChair"}
        onOpenChange={(open) => setOpenFabricPicker(open ? "seatChair" : null)}
        onSelect={(code) => handleFabricSelection(code, "seatChair")}
        selectedCode={fabricPlan?.seatFabricCode}
        title="Select Seat Fabric"
      />
      <FabricLibrary
        open={openFabricPicker === "pillowSingle"}
        onOpenChange={(open) => setOpenFabricPicker(open ? "pillowSingle" : null)}
        onSelect={(code) => handleFabricSelection(code, "pillowSingle")}
        selectedCode={pillows?.fabrics?.single}
        title="Select Pillow Fabric"
      />
      <FabricLibrary
        open={openFabricPicker === "pillowColour1"}
        onOpenChange={(open) => setOpenFabricPicker(open ? "pillowColour1" : null)}
        onSelect={(code) => handleFabricSelection(code, "pillowColour1")}
        selectedCode={pillows?.fabrics?.colour1}
        title="Select Pillow Colour 1"
      />
      <FabricLibrary
        open={openFabricPicker === "pillowColour2"}
        onOpenChange={(open) => setOpenFabricPicker(open ? "pillowColour2" : null)}
        onSelect={(code) => handleFabricSelection(code, "pillowColour2")}
        selectedCode={pillows?.fabrics?.colour2}
        title="Select Pillow Colour 2"
      />
    </div>
  );
};

const formatCurrency = (value: number) => `₹${Math.round(value).toLocaleString()}`;

export default ArmChairConfigurator;
