import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FabricLibrary } from "@/components/ui/FabricLibrary";
import { SummaryTile } from "@/components/ui/SummaryTile";

interface DiningChairConfiguratorProps {
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

const normalizeText = (value: string) => (value || "").trim();
const normalizeSeatOption = (value: string) => {
  const match = value.match(/(\d+)/);
  if (!match) return normalizeText(value);
  return `${match[1]}-Seater`;
};
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

const getSeatWidthValue = (seatWidth: string) => WIDTH_MAP[seatWidth] ?? 22;
const calculateApproxWidth = (seatWidthValue: number) => seatWidthValue + 3;

const DiningChairConfigurator = ({
  product,
  configuration,
  onConfigurationChange,
}: DiningChairConfiguratorProps) => {
  const seatWidthOptionsResponse = useDropdownOptions("dining_chairs", "seat_width");
  const seatDepthOptionsResponse = useDropdownOptions("dining_chairs", "seat_depth");
  const seatHeightOptionsResponse = useDropdownOptions("dining_chairs", "seat_height");
  const legOptionsResponse = useDropdownOptions("dining_chairs", "leg_type");
  const discountApproversResponse = useDropdownOptions("dining_chairs", "discount_approver");
  const discountCodesResponse = useDropdownOptions("dining_chairs", "discount_code");

  const seatWidthOptions = useMemo(
    () => dedupeOptions(seatWidthOptionsResponse.data as any[], normalizeInches),
    [seatWidthOptionsResponse.data]
  );
  const seatDepthOptions = useMemo(
    () => dedupeOptions(seatDepthOptionsResponse.data as any[], normalizeInches),
    [seatDepthOptionsResponse.data]
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

  useEffect(() => {
    if (!configuration.productId) {
      const defaultSeatWidth = seatWidthOptions[0]?.option_value || "22 in";
      const defaultSeatDepth = seatDepthOptions[0]?.option_value || "22 in";
      const defaultSeatHeight = seatHeightOptions[1]?.option_value || "18 in";
      const defaultLeg = legOptions[0];
      const defaultApprover = discountApproverOptions.find((opt: any) => opt.metadata?.default) || discountApproverOptions[0];
      const defaultDiscount = discountCodeOptions[0];

      updateConfiguration({
        productId: product.id,
        category: "dining_chairs",
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
            frontFabricCode: "",
            backFabricCode: "",
          },
          extraFabricMeters: 0,
          fabricUpgradeCharges: 0,
          baseFabricMeters: Number(product?.fabric_mtrs || product?.metadata?.fabric_mtrs || 3),
        },
        legs: {
          type: defaultLeg?.option_value || "Kulfi Leg-Brown with Gold",
          size: defaultLeg?.metadata?.size || "16 in",
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
    discountApproverOptions,
    discountCodeOptions,
  ]);

  const fabricPlan = configuration.fabricPlan || {};
  const dimensions = configuration.dimensions || {};
  const legs = configuration.legs || {};
  const discountConfig = configuration.discount || {};

  const [openFabricPicker, setOpenFabricPicker] = useState<null | "single" | "front" | "back">(null);

  const selectedFabricCodes = useMemo(() => {
    const codes: string[] = [];
    if (fabricPlan?.claddingPlan === "Single Colour" && fabricPlan?.singleColour?.fabricCode) {
      codes.push(fabricPlan.singleColour.fabricCode);
    }
    if (fabricPlan?.claddingPlan === "Dual Colour") {
      if (fabricPlan?.dualColour?.frontFabricCode) {
        codes.push(fabricPlan.dualColour.frontFabricCode);
      }
      if (fabricPlan?.dualColour?.backFabricCode) {
        codes.push(fabricPlan.dualColour.backFabricCode);
      }
    }
    return codes;
  }, [fabricPlan]);

  const fabricPricesQuery = useQuery({
    queryKey: ["dining-chair-fabric-prices", selectedFabricCodes],
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

  const baseFabricMeters = useMemo(() => {
    return Number(product?.fabric_mtrs || product?.metadata?.fabric_mtrs || 3);
  }, [product]);

  const extraFabricMeters = Number(fabricPlan?.extraFabricMeters || 0);
  const totalFabricMeters = baseFabricMeters + extraFabricMeters;

  const fabricSplit = useMemo(() => {
    if (fabricPlan?.claddingPlan === "Dual Colour") {
      const half = totalFabricMeters * 0.5;
      return {
        front: half,
        back: half,
      };
    }
    return {
      front: totalFabricMeters,
      back: totalFabricMeters,
    };
  }, [fabricPlan?.claddingPlan, totalFabricMeters]);

  const fabricUpgradeCharges = useMemo(() => {
    if (fabricPricesQuery.isLoading || fabricPricesQuery.isError) return 0;
    const priceMap = fabricPricesQuery.data || {};

    if (fabricPlan?.claddingPlan === "Dual Colour") {
      const frontCode = fabricPlan?.dualColour?.frontFabricCode;
      const backCode = fabricPlan?.dualColour?.backFabricCode;
      let total = 0;
      if (frontCode) {
        const price = priceMap[frontCode] ?? BASE_FABRIC_PRICE_PER_METER;
        total += (price - BASE_FABRIC_PRICE_PER_METER) * fabricSplit.front;
      }
      if (backCode) {
        const price = priceMap[backCode] ?? BASE_FABRIC_PRICE_PER_METER;
        total += (price - BASE_FABRIC_PRICE_PER_METER) * fabricSplit.back;
      }
      return Math.max(0, total);
    }

    const singleCode = fabricPlan?.singleColour?.fabricCode;
    if (singleCode) {
      const price = priceMap[singleCode] ?? BASE_FABRIC_PRICE_PER_METER;
      return Math.max(0, (price - BASE_FABRIC_PRICE_PER_METER) * totalFabricMeters);
    }

    return 0;
  }, [fabricPlan, fabricPricesQuery.data, fabricPricesQuery.isError, fabricPricesQuery.isLoading, fabricSplit.back, fabricSplit.front, totalFabricMeters]);

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

  const seatWidthValue = getSeatWidthValue(dimensions?.seatWidth || "22 in");
  const approxOverallWidth = calculateApproxWidth(seatWidthValue);

  const basePrice = Number(product?.net_price_rs || product?.base_price_per_seat || 0);
  const extraFabricCost = extraFabricMeters * BASE_FABRIC_PRICE_PER_METER;
  const totalInvoiceValue = basePrice + fabricUpgradeCharges + extraFabricCost;

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

  const handleFabricSelection = (code: string | null, target: "single" | "front" | "back") => {
    if (target === "single") {
      updateConfiguration({
        fabricPlan: {
          ...fabricPlan,
          singleColour: {
            fabricCode: code || "",
          },
        },
      });
    } else {
      updateConfiguration({
        fabricPlan: {
          ...fabricPlan,
          dualColour: {
            ...fabricPlan?.dualColour,
            frontFabricCode:
              target === "front" ? code || "" : fabricPlan?.dualColour?.frontFabricCode || "",
            backFabricCode:
              target === "back" ? code || "" : fabricPlan?.dualColour?.backFabricCode || "",
          },
        },
      });
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

  return (
    <div className="space-y-6">
      <Tabs defaultValue="base" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="base">Base Configuration</TabsTrigger>
          <TabsTrigger value="fabric">Fabric Plan</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="base" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Base Model</CardTitle>
              <CardDescription>Select core dimensions and leg style.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Seat Width</Label>
                {seatWidthOptionsResponse.isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={dimensions?.seatWidth || seatWidthOptions[0]?.option_value || "22 in"}
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
                <p className="text-xs text-muted-foreground">Width multiplier base: {seatWidthValue}"</p>
              </div>

              <div className="space-y-2">
                <Label>Seat Depth</Label>
                {seatDepthOptionsResponse.isLoading ? (
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
              </div>

              <div className="space-y-2">
                <Label>Seat Height</Label>
                {seatHeightOptionsResponse.isLoading ? (
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
                {legOptionsResponse.isLoading ? (
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
        </TabsContent>

        <TabsContent value="fabric" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Fabric Plan</CardTitle>
              <CardDescription>Configure single or dual colour cladding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Cl Adding Plan</Label>
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
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Single Colour" id="dc-single" />
                    <Label htmlFor="dc-single" className="cursor-pointer">Single Colour</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Dual Colour" id="dc-dual" />
                    <Label htmlFor="dc-dual" className="cursor-pointer">Dual Colour</Label>
                  </div>
                </RadioGroup>
              </div>

              {fabricPlan?.claddingPlan === "Single Colour" ? (
                <div className="space-y-2">
                  <Label>Single Colour Fabric</Label>
                  {renderFabricButton("Fabric", fabricPlan?.singleColour?.fabricCode, () => setOpenFabricPicker("single"))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Front Face (Inner)</Label>
                    {renderFabricButton("Front Face", fabricPlan?.dualColour?.frontFabricCode, () =>
                      setOpenFabricPicker("front")
                    )}
                    <p className="text-xs text-muted-foreground">
                      Fabric meters: {fabricSplit.front.toFixed(2)} m
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Back Face (Outer)</Label>
                    {renderFabricButton("Back Face", fabricPlan?.dualColour?.backFabricCode, () =>
                      setOpenFabricPicker("back")
                    )}
                    <p className="text-xs text-muted-foreground">
                      Fabric meters: {fabricSplit.back.toFixed(2)} m
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
                <SummaryTile label="Extra Fabric Cost" value={formatCurrency(extraFabricCost)} />
                <SummaryTile label="Total Invoice Value" value={formatCurrency(totalInvoiceValue)} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Invoice Value</p>
                  <p className="text-2xl font-serif">{formatCurrency(totalInvoiceValue)}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Discount Approved By</Label>
                  {discountApproversResponse.isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={discountConfig?.approvedBy || discountApproverOptions[0]?.option_value || "Director"}
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
                  {discountCodesResponse.isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={discountConfig?.discountCode || discountCodeOptions[0]?.option_value || "EVIP"}
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
        open={openFabricPicker === "single"}
        onOpenChange={(open) => setOpenFabricPicker(open ? "single" : null)}
        onSelect={(code) => handleFabricSelection(code, "single")}
        selectedCode={fabricPlan?.singleColour?.fabricCode}
        title="Select Fabric"
      />
      <FabricLibrary
        open={openFabricPicker === "front"}
        onOpenChange={(open) => setOpenFabricPicker(open ? "front" : null)}
        onSelect={(code) => handleFabricSelection(code, "front")}
        selectedCode={fabricPlan?.dualColour?.frontFabricCode}
        title="Select Front Fabric"
      />
      <FabricLibrary
        open={openFabricPicker === "back"}
        onOpenChange={(open) => setOpenFabricPicker(open ? "back" : null)}
        onSelect={(code) => handleFabricSelection(code, "back")}
        selectedCode={fabricPlan?.dualColour?.backFabricCode}
        title="Select Back Fabric"
      />
    </div>
  );
};

const formatCurrency = (value: number) => `₹${Math.round(value).toLocaleString()}`;

export default DiningChairConfigurator;
