import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { FabricLibrary } from "@/components/ui/FabricLibrary";

interface PouffeConfiguratorProps {
  product: any;
  configuration: any;
  onConfigurationChange: (config: any) => void;
}

const BASE_FABRIC_PRICE_PER_METER = 800;
const WIDTH_MAP: Record<string, number> = {
  "22 in": 22,
  "24 in": 24,
  "26 in": 26,
  "30 in": 30,
};

const DEPTH_UPGRADE_PERCENTAGES: Record<string, number> = {
  "22 in": 0.0,
  "24 in": 0.0,
  "26 in": 0.03,
  "28 in": 0.06,
};

const WIDTH_UPGRADE_PERCENTAGES: Record<string, number> = {
  "22 in": 0.0,
  "24 in": 0.0,
  "26 in": 0.065,
  "30 in": 0.195,
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

const getBaseWidth = (seatWidth: string): number => {
  return WIDTH_MAP[seatWidth] || 0;
};

const calculateOverallWidth = (baseWidth: number): number => {
  return baseWidth + 3;
};

const PouffeConfigurator = ({
  product,
  configuration,
  onConfigurationChange,
}: PouffeConfiguratorProps) => {
  // Dropdown options
  const fabricPlanOptionsResponse = useDropdownOptions("database_pouffes", "fabric_cladding_plan");
  const foamOptionsResponse = useDropdownOptions("database_pouffes", "foam_type");
  const seatDepthOptionsResponse = useDropdownOptions("database_pouffes", "seat_depth");
  const seatWidthOptionsResponse = useDropdownOptions("database_pouffes", "seat_width");
  const seatHeightOptionsResponse = useDropdownOptions("database_pouffes", "seat_height");
  const legOptionsResponse = useDropdownOptions("database_pouffes", "leg_type");
  const discountApproversResponse = useDropdownOptions("database_pouffes", "discount_approver");
  const discountCodesResponse = useDropdownOptions("database_pouffes", "discount_code");

  const fabricPlanOptions = useMemo(
    () => dedupeOptions(fabricPlanOptionsResponse.data as any[], normalizeText),
    [fabricPlanOptionsResponse.data]
  );
  const foamOptions = useMemo(
    () => dedupeOptions(foamOptionsResponse.data as any[], normalizeText),
    [foamOptionsResponse.data]
  );
  const seatDepthOptions = useMemo(
    () => dedupeOptions(seatDepthOptionsResponse.data as any[], normalizeInches),
    [seatDepthOptionsResponse.data]
  );
  const seatWidthOptions = useMemo(
    () => dedupeOptions(seatWidthOptionsResponse.data as any[], normalizeInches),
    [seatWidthOptionsResponse.data]
  );
  const seatHeightOptions = useMemo(
    () => dedupeOptions(seatHeightOptionsResponse.data as any[], normalizeInches),
    [seatHeightOptionsResponse.data]
  );
  const legOptions = useMemo(
    () => dedupeOptions(legOptionsResponse.data as any[], normalizeText),
    [legOptionsResponse.data]
  );
  const discountApproverOptions = useMemo(
    () => dedupeOptions(discountApproversResponse.data as any[], normalizeText),
    [discountApproversResponse.data]
  );
  const discountCodeOptions = useMemo(
    () => dedupeOptions(discountCodesResponse.data as any[], normalizeText),
    [discountCodesResponse.data]
  );

  const updateConfiguration = useCallback(
    (updates: any) => {
      onConfigurationChange({ ...configuration, ...updates });
    },
    [configuration, onConfigurationChange]
  );

  // Initialize configuration
  useEffect(() => {
    if (!configuration.productId) {
      const defaultSeatWidth = seatWidthOptions[0]?.option_value || "22 in";
      const defaultSeatDepth = seatDepthOptions[0]?.option_value || "22 in";
      const defaultSeatHeight = seatHeightOptions.find((opt: any) => opt.metadata?.default)?.option_value || seatHeightOptions[0]?.option_value || "18 in";
      const defaultLeg = legOptions[0];
      const defaultApprover = discountApproverOptions.find((opt: any) => opt.metadata?.default) || discountApproverOptions[0];
      const defaultDiscount = discountCodeOptions[0];

      updateConfiguration({
        productId: product.id,
        category: "database_pouffes",
        baseModel: {
          width: getBaseWidth(defaultSeatWidth),
          fabric: Number(product?.fabric_required_mtr || product?.fabric_mtrs || product?.base_fabric_meters || 3),
          price: Number(product?.net_price || product?.net_price_rs || product?.base_price || 0),
        },
        dimensions: {
          seatWidth: defaultSeatWidth,
          seatDepth: defaultSeatDepth,
          seatHeight: defaultSeatHeight,
        },
        fabricPlan: {
          claddingPlan: "Single Colour",
          singleColour: {
            fabricCode: "",
          },
          dualColour: {
            structureFabricCode: "",
            seatFabricCode: "",
          },
          baseFabricMeters: Number(product?.fabric_required_mtr || product?.fabric_mtrs || product?.base_fabric_meters || 3),
          fabricUpgradeCharges: 0,
        },
        foam: {
          type: foamOptions[0]?.option_value || "Firm",
        },
        legs: {
          type: defaultLeg?.option_value || "",
          size: defaultLeg?.metadata?.size || "",
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
    product?.fabric_required_mtr,
    product?.fabric_mtrs,
    product?.base_fabric_meters,
    product?.net_price,
    product?.net_price_rs,
    product?.base_price,
    updateConfiguration,
    seatWidthOptions,
    seatDepthOptions,
    seatHeightOptions,
    legOptions,
    foamOptions,
    discountApproverOptions,
    discountCodeOptions,
  ]);

  const baseModel = configuration.baseModel || {};
  const dimensions = configuration.dimensions || {};
  const fabricPlan = configuration.fabricPlan || {};
  const foam = configuration.foam || {};
  const legs = configuration.legs || {};
  const discountConfig = configuration.discount || {};

  const [openFabricPicker, setOpenFabricPicker] = useState<null | "single" | "structure" | "seat">(null);

  // Update base model when dimensions change
  useEffect(() => {
    const seatWidth = dimensions?.seatWidth || "22 in";
    const baseWidth = getBaseWidth(seatWidth);
    const baseFabric = Number(product?.fabric_required_mtr || product?.fabric_mtrs || product?.base_fabric_meters || fabricPlan?.baseFabricMeters || 3);
    const basePrice = Number(product?.net_price || product?.net_price_rs || product?.base_price || baseModel?.price || 0);

    if (
      baseModel?.width !== baseWidth ||
      baseModel?.fabric !== baseFabric ||
      baseModel?.price !== basePrice
    ) {
      updateConfiguration({
        baseModel: {
          width: baseWidth,
          fabric: baseFabric,
          price: basePrice,
        },
        fabricPlan: {
          ...fabricPlan,
          baseFabricMeters: baseFabric,
        },
      });
    }
  }, [dimensions?.seatWidth, product, baseModel, fabricPlan, updateConfiguration]);

  const selectedFabricCodes = useMemo(() => {
    const codes: string[] = [];
    if (fabricPlan?.claddingPlan === "Single Colour" && fabricPlan?.singleColour?.fabricCode) {
      codes.push(fabricPlan.singleColour.fabricCode);
    }
    if (fabricPlan?.claddingPlan === "Dual Colour") {
      if (fabricPlan?.dualColour?.structureFabricCode) {
        codes.push(fabricPlan.dualColour.structureFabricCode);
      }
      if (fabricPlan?.dualColour?.seatFabricCode) {
        codes.push(fabricPlan.dualColour.seatFabricCode);
      }
    }
    return codes;
  }, [fabricPlan]);

  const fabricPricesQuery = useQuery({
    queryKey: ["pouffe-fabric-prices", selectedFabricCodes],
    queryFn: async () => {
      if (selectedFabricCodes.length === 0) {
        return {} as Record<string, number>;
      }
      const { data, error } = await supabase
        .from("fabric_coding")
        .select("estre_code, price")
        .in("estre_code", selectedFabricCodes);
      if (error) throw error;
      const result: Record<string, number> = {};
      (data || []).forEach((item) => {
        result[item.estre_code] = Number(item.price) || 0;
      });
      return result;
    },
    enabled: selectedFabricCodes.length > 0,
  });

  const baseFabricMeters = Number(fabricPlan?.baseFabricMeters || baseModel?.fabric || 3);

  const fabricSplit = useMemo(() => {
    if (fabricPlan?.claddingPlan === "Dual Colour") {
      const half = baseFabricMeters * 0.5;
      return {
        structure: half,
        seat: half,
        total: baseFabricMeters,
      };
    }
    return {
      structure: baseFabricMeters,
      seat: baseFabricMeters,
      total: baseFabricMeters,
    };
  }, [fabricPlan?.claddingPlan, baseFabricMeters]);

  const fabricUpgradeCharges = useMemo(() => {
    if (fabricPricesQuery.isLoading || fabricPricesQuery.isError) return 0;
    const priceMap = fabricPricesQuery.data || {};

    if (fabricPlan?.claddingPlan === "Dual Colour") {
      const structureCode = fabricPlan?.dualColour?.structureFabricCode;
      const seatCode = fabricPlan?.dualColour?.seatFabricCode;
      let total = 0;
      if (structureCode) {
        const price = priceMap[structureCode] ?? BASE_FABRIC_PRICE_PER_METER;
        total += (price - BASE_FABRIC_PRICE_PER_METER) * fabricSplit.structure;
      }
      if (seatCode) {
        const price = priceMap[seatCode] ?? BASE_FABRIC_PRICE_PER_METER;
        total += (price - BASE_FABRIC_PRICE_PER_METER) * fabricSplit.seat;
      }
      return Math.max(0, total);
    }

    const singleCode = fabricPlan?.singleColour?.fabricCode;
    if (singleCode) {
      const price = priceMap[singleCode] ?? BASE_FABRIC_PRICE_PER_METER;
      return Math.max(0, (price - BASE_FABRIC_PRICE_PER_METER) * baseFabricMeters);
    }

    return 0;
  }, [fabricPlan, fabricPricesQuery.data, fabricPricesQuery.isError, fabricPricesQuery.isLoading, fabricSplit, baseFabricMeters]);

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

  const baseWidth = baseModel?.width || getBaseWidth(dimensions?.seatWidth || "22 in");
  const overallWidth = calculateOverallWidth(baseWidth);

  const basePrice = Number(baseModel?.price || product?.net_price || product?.net_price_rs || 0);
  const depthUpgradePercent = DEPTH_UPGRADE_PERCENTAGES[dimensions?.seatDepth || "22 in"] || 0;
  const widthUpgradePercent = WIDTH_UPGRADE_PERCENTAGES[dimensions?.seatWidth || "22 in"] || 0;
  const depthUpgradeCharge = basePrice * depthUpgradePercent;
  const widthUpgradeCharge = basePrice * widthUpgradePercent;

  const totalInvoiceValue = basePrice + depthUpgradeCharge + widthUpgradeCharge + fabricUpgradeCharges;

  const selectedDiscount = discountCodeOptions.find(
    (option: any) => option.option_value === discountConfig.discountCode
  );
  const discountPercent = Number(selectedDiscount?.metadata?.percentage || 0);
  const discountAmount = totalInvoiceValue * discountPercent;
  const netInvoiceValue = totalInvoiceValue - discountAmount;

  useEffect(() => {
    const currentPercent = Number(discountConfig?.percentage || 0);
    const currentAmount = Number(discountConfig?.amount || 0);
    if (
      Math.abs(currentPercent - discountPercent) > 0.0001 ||
      Math.abs(currentAmount - discountAmount) > 0.5
    ) {
      updateConfiguration({
        discount: {
          ...discountConfig,
          percentage: discountPercent,
          amount: discountAmount,
        },
      });
    }
  }, [discountAmount, discountConfig, discountPercent, updateConfiguration]);

  const handleFabricSelection = (code: string | null, target: "single" | "structure" | "seat") => {
    if (target === "single") {
      updateConfiguration({
        fabricPlan: {
          ...fabricPlan,
          singleColour: {
            fabricCode: code || "",
          },
        },
      });
    } else if (target === "structure") {
      updateConfiguration({
        fabricPlan: {
          ...fabricPlan,
          dualColour: {
            ...fabricPlan.dualColour,
            structureFabricCode: code || "",
          },
        },
      });
    } else if (target === "seat") {
      updateConfiguration({
        fabricPlan: {
          ...fabricPlan,
          dualColour: {
            ...fabricPlan.dualColour,
            seatFabricCode: code || "",
          },
        },
      });
    }
    setOpenFabricPicker(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Base Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Base Configuration</CardTitle>
          <CardDescription>Select model and base dimensions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Model</Label>
            <div className="text-sm font-medium text-muted-foreground">
              {product?.title || product?.model_name || "N/A"}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Seat Width</Label>
              <Select
                value={dimensions?.seatWidth || "22 in"}
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
                    <SelectItem key={option.id || option.option_value} value={option.option_value}>
                      {option.display_label || option.option_value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                Base Width: {baseWidth} in
              </div>
            </div>

            <div className="space-y-2">
              <Label>Seat Depth</Label>
              <Select
                value={dimensions?.seatDepth || "22 in"}
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
                    <SelectItem key={option.id || option.option_value} value={option.option_value}>
                      {option.display_label || option.option_value}
                      {DEPTH_UPGRADE_PERCENTAGES[option.option_value] > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          +{(DEPTH_UPGRADE_PERCENTAGES[option.option_value] * 100).toFixed(1)}%
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {depthUpgradePercent > 0 && (
                <div className="text-xs text-muted-foreground">
                  Upgrade: {formatCurrency(depthUpgradeCharge)}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Seat Height</Label>
              <Select
                value={dimensions?.seatHeight || "18 in"}
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
                    <SelectItem key={option.id || option.option_value} value={option.option_value}>
                      {option.display_label || option.option_value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Base Width:</span>{" "}
                <span className="font-medium">{baseWidth} in</span>
              </div>
              <div>
                <span className="text-muted-foreground">Overall Width:</span>{" "}
                <span className="font-medium">{overallWidth} in</span>
              </div>
              <div>
                <span className="text-muted-foreground">Base Fabric:</span>{" "}
                <span className="font-medium">{baseFabricMeters.toFixed(1)} m</span>
              </div>
              <div>
                <span className="text-muted-foreground">Base Price:</span>{" "}
                <span className="font-medium">{formatCurrency(basePrice)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fabric Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Fabric Plan</CardTitle>
          <CardDescription>Select fabric cladding plan and fabrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Cladding Plan</Label>
            <Select
              value={fabricPlan?.claddingPlan || "Single Colour"}
              onValueChange={(value) =>
                updateConfiguration({
                  fabricPlan: {
                    ...fabricPlan,
                    claddingPlan: value,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fabricPlanOptions.map((option: any) => (
                  <SelectItem key={option.id || option.option_value} value={option.option_value}>
                    {option.display_label || option.option_value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {fabricPlan?.claddingPlan === "Single Colour" && (
            <div className="space-y-2">
              <Label>Fabric Selection</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={fabricPlan?.singleColour?.fabricCode || ""}
                  placeholder="Select fabric..."
                  readOnly
                  onClick={() => setOpenFabricPicker("single")}
                  className="cursor-pointer"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenFabricPicker("single")}
                >
                  Browse
                </Button>
              </div>
              {fabricPlan?.singleColour?.fabricCode && (
                <div className="text-sm text-muted-foreground">
                  Quantity: {baseFabricMeters.toFixed(1)} m
                </div>
              )}
            </div>
          )}

          {fabricPlan?.claddingPlan === "Dual Colour" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Structure Fabric (50%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={fabricPlan?.dualColour?.structureFabricCode || ""}
                    placeholder="Select structure fabric..."
                    readOnly
                    onClick={() => setOpenFabricPicker("structure")}
                    className="cursor-pointer"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenFabricPicker("structure")}
                  >
                    Browse
                  </Button>
                </div>
                {fabricPlan?.dualColour?.structureFabricCode && (
                  <div className="text-sm text-muted-foreground">
                    Quantity: {fabricSplit.structure.toFixed(1)} m
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Seat Fabric (50%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={fabricPlan?.dualColour?.seatFabricCode || ""}
                    placeholder="Select seat fabric..."
                    readOnly
                    onClick={() => setOpenFabricPicker("seat")}
                    className="cursor-pointer"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpenFabricPicker("seat")}
                  >
                    Browse
                  </Button>
                </div>
                {fabricPlan?.dualColour?.seatFabricCode && (
                  <div className="text-sm text-muted-foreground">
                    Quantity: {fabricSplit.seat.toFixed(1)} m
                  </div>
                )}
              </div>
            </div>
          )}

          {fabricUpgradeCharges > 0 && (
            <div className="pt-2 border-t">
              <div className="text-sm">
                <span className="text-muted-foreground">Fabric Upgrade Charges:</span>{" "}
                <span className="font-medium">{formatCurrency(fabricUpgradeCharges)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Foam Options */}
      <Card>
        <CardHeader>
          <CardTitle>Foam Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Foam Type</Label>
            <Select
              value={foam?.type || "Firm"}
              onValueChange={(value) =>
                updateConfiguration({
                  foam: {
                    type: value,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {foamOptions.map((option: any) => (
                  <SelectItem key={option.id || option.option_value} value={option.option_value}>
                    {option.display_label || option.option_value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Legs */}
      <Card>
        <CardHeader>
          <CardTitle>Legs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Leg Type</Label>
            <Select
              value={legs?.type || ""}
              onValueChange={(value) => {
                const selectedLeg = legOptions.find((opt: any) => opt.option_value === value);
                updateConfiguration({
                  legs: {
                    type: value,
                    size: selectedLeg?.metadata?.size || "",
                  },
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select leg type..." />
              </SelectTrigger>
              <SelectContent>
                {legOptions.map((option: any) => (
                  <SelectItem key={option.id || option.option_value} value={option.option_value}>
                    {option.display_label || option.option_value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Discount */}
      <Card>
        <CardHeader>
          <CardTitle>Discount</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Approved By</Label>
            <Select
              value={discountConfig?.approvedBy || "Director"}
              onValueChange={(value) =>
                updateConfiguration({
                  discount: {
                    ...discountConfig,
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
                  <SelectItem key={option.id || option.option_value} value={option.option_value}>
                    {option.display_label || option.option_value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Discount Code</Label>
            <Select
              value={discountConfig?.discountCode || "EVIP"}
              onValueChange={(value) =>
                updateConfiguration({
                  discount: {
                    ...discountConfig,
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
                  <SelectItem key={option.id || option.option_value} value={option.option_value}>
                    {option.display_label || option.option_value} (
                    {((option.metadata?.percentage || 0) * 100).toFixed(0)}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {discountAmount > 0 && (
            <div className="pt-2 border-t">
              <div className="text-sm">
                <span className="text-muted-foreground">Discount Amount:</span>{" "}
                <span className="font-medium text-green-600">
                  -{formatCurrency(discountAmount)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base Price:</span>
              <span className="font-medium">{formatCurrency(basePrice)}</span>
            </div>
            {depthUpgradeCharge > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Depth Upgrade:</span>
                <span className="font-medium">{formatCurrency(depthUpgradeCharge)}</span>
              </div>
            )}
            {widthUpgradeCharge > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Width Upgrade:</span>
                <span className="font-medium">{formatCurrency(widthUpgradeCharge)}</span>
              </div>
            )}
            {fabricUpgradeCharges > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fabric Upgrade:</span>
                <span className="font-medium">{formatCurrency(fabricUpgradeCharges)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total Invoice:</span>
              <span>{formatCurrency(totalInvoiceValue)}</span>
            </div>
            {discountAmount > 0 && (
              <>
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Net Invoice:</span>
                  <span>{formatCurrency(netInvoiceValue)}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fabric Library Modal */}
      {openFabricPicker && (
        <FabricLibrary
          open={!!openFabricPicker}
          onOpenChange={(open) => !open && setOpenFabricPicker(null)}
          onSelect={(fabricCode) => {
            if (openFabricPicker === "single") {
              handleFabricSelection(fabricCode, "single");
            } else if (openFabricPicker === "structure") {
              handleFabricSelection(fabricCode, "structure");
            } else if (openFabricPicker === "seat") {
              handleFabricSelection(fabricCode, "seat");
            }
          }}
          selectedCode={
            openFabricPicker === "single"
              ? fabricPlan?.singleColour?.fabricCode || ""
              : openFabricPicker === "structure"
              ? fabricPlan?.dualColour?.structureFabricCode || ""
              : fabricPlan?.dualColour?.seatFabricCode || ""
          }
        />
      )}
    </div>
  );
};

export default PouffeConfigurator;

