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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { FabricLibrary } from "@/components/ui/FabricLibrary";

interface KidsBedConfiguratorProps {
  product: any;
  configuration: any;
  onConfigurationChange: (config: any) => void;
}

const BASE_PRICING = {
  standardLength: 75,
  standardWidth: 36,
  standardArea: 2700,
  baseFabricPrice: 800,
};

const BED_SIZES: Record<string, Array<{ length: number; widthOptions: number[] }>> = {
  Single: [
    { length: 72, widthOptions: [30] },
    { length: 75, widthOptions: [35] },
    { length: 78, widthOptions: [36] },
  ],
  Double: [{ length: 84, widthOptions: [42, 47, 48] }],
  Queen: [{ length: 84, widthOptions: [60, 66] }],
  King: [{ length: 84, widthOptions: [70, 72, 78] }],
};

const STORAGE_PRICES: Record<string, number> = {
  Manual: 4200,
  "Hydraulic / Electric": 7000,
  "Side Drawer": 4704,
};

const MULTI_COLOUR_SPLIT = {
  structure: 0.6,
  headboard: 0.2,
  headboardDesign: 0.1,
  headboardElement: 0.1,
};

const STORAGE_TYPES = ["Box Storage", "Side Drawer"] as const;
const BOX_STORAGE_TYPES = ["Manual", "Hydraulic / Electric"] as const;
const FABRIC_PLANS = ["Single Colour", "Multi Colour"] as const;

const DISCOUNT_CODE_KEY = "percentage";

const normalizeOption = (value: string) => (value || "").trim();

const KidsBedConfigurator = ({
  product,
  configuration,
  onConfigurationChange,
}: KidsBedConfiguratorProps) => {
  const legOptionsResponse = useDropdownOptions("kids_bed", "leg_type");
  const discountApproversResponse = useDropdownOptions("kids_bed", "discount_approver");
  const discountCodeResponse = useDropdownOptions("kids_bed", "discount_code");

  const legOptions = useMemo(
    () => legOptionsResponse.data || [],
    [legOptionsResponse.data]
  );
  const discountApproverOptions = useMemo(
    () => discountApproversResponse.data || [],
    [discountApproversResponse.data]
  );
  const discountCodeOptions = useMemo(
    () => discountCodeResponse.data || [],
    [discountCodeResponse.data]
  );

  const updateConfiguration = useCallback(
    (updates: any) => {
      onConfigurationChange({ ...configuration, ...updates });
    },
    [configuration, onConfigurationChange]
  );

  const getDefaultSizeCategory = () => Object.keys(BED_SIZES)[0] as keyof typeof BED_SIZES;

  const calculateAreaRatio = (length: number, width: number) =>
    (length * width) / BASE_PRICING.standardArea;

  const getBaseProductPrice = () =>
    Number(
      product?.netpricers ||
        product?.net_price_rs ||
        product?.strike_price_1seater_rs ||
        product?.strike_price_rs ||
        product?.base_price ||
        0
    );

  const getBaseProductFabric = () =>
    Number(
      product?.fabric_single_bed_mtrs ||
        product?.fabricmtrs ||
        product?.fabric_mtrs ||
        product?.fabricsinglechairmtrs ||
        6
    );

  useEffect(() => {
    if (!configuration.productId) {
      const defaultSizeCategory = getDefaultSizeCategory();
      const defaultLength = BED_SIZES[defaultSizeCategory][0].length;
      const defaultWidth = BED_SIZES[defaultSizeCategory][0].widthOptions[0];
      const basePrice = getBaseProductPrice();
      const baseFabric = getBaseProductFabric();
      const areaRatio = calculateAreaRatio(defaultLength, defaultWidth);

      const defaultLeg = legOptions[0];
      const defaultApprover =
        discountApproverOptions.find((opt: any) => opt.metadata?.default) || discountApproverOptions[0];
      const defaultDiscount = discountCodeOptions[0];

      updateConfiguration({
        productId: product.id,
        category: "kids_bed",
        bedDimensions: {
          sizeCategory: defaultSizeCategory,
          length: defaultLength,
          width: defaultWidth,
          areaRatio,
        },
        baseModel: {
          price: basePrice * areaRatio,
          fabric: baseFabric * areaRatio,
          basePrice,
          baseFabric,
        },
        storage: {
          required: "No",
          type: "Box Storage",
          boxStorageType: "Manual",
        },
        fabricPlan: {
          claddingPlan: "Single Colour",
          singleFabricCode: "",
          structureFabricCode: "",
          headboardFabricCode: "",
          headboardDesignFabricCode: "",
          headboardElementFabricCode: "",
          extraFabricMeters: 0,
          fabricUpgradeCharges: 0,
          baseFabricMeters: baseFabric * areaRatio,
        },
        legs: {
          type: defaultLeg?.option_value || "Kulfi Leg-Gold",
          size: Array.isArray(defaultLeg?.metadata?.sizes)
            ? defaultLeg.metadata.sizes[0]
            : defaultLeg?.metadata?.size || "6 in",
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
    legOptions,
    discountApproverOptions,
    discountCodeOptions,
    updateConfiguration,
  ]);

  const bedDimensions = configuration.bedDimensions || {};
  const baseModel = configuration.baseModel || {};
  const storage = configuration.storage || {};
  const fabricPlan = configuration.fabricPlan || {};
  const legs = configuration.legs || {};
  const discount = configuration.discount || {};

  const [openFabricPicker, setOpenFabricPicker] = useState<
    | null
    | "single"
    | "structure"
    | "headboard"
    | "headboardDesign"
    | "headboardElement"
  >(null);

  const bedLengthOptions = useMemo(() => {
    const size = bedDimensions.sizeCategory || getDefaultSizeCategory();
    return BED_SIZES[size];
  }, [bedDimensions.sizeCategory]);

  const currentLengthEntry = useMemo(() => {
    const length = bedDimensions.length || bedLengthOptions[0].length;
    return bedLengthOptions.find((entry) => entry.length === length) || bedLengthOptions[0];
  }, [bedDimensions.length, bedLengthOptions]);

  const widthOptions = currentLengthEntry?.widthOptions || [];

  const areaRatio = bedDimensions.areaRatio || calculateAreaRatio(currentLengthEntry.length, widthOptions[0]);

  const selectedFabricCodes = useMemo(() => {
    const codes: string[] = [];
    if (fabricPlan?.claddingPlan === "Single Colour" && fabricPlan?.singleFabricCode) {
      codes.push(fabricPlan.singleFabricCode);
    }
    if (fabricPlan?.claddingPlan === "Multi Colour") {
      if (fabricPlan?.structureFabricCode) codes.push(fabricPlan.structureFabricCode);
      if (fabricPlan?.headboardFabricCode) codes.push(fabricPlan.headboardFabricCode);
      if (fabricPlan?.headboardDesignFabricCode) codes.push(fabricPlan.headboardDesignFabricCode);
      if (fabricPlan?.headboardElementFabricCode) codes.push(fabricPlan.headboardElementFabricCode);
    }
    return codes;
  }, [fabricPlan]);

  const fabricPricesQuery = useQuery({
    queryKey: ["kids-bed-fabric-prices", selectedFabricCodes],
    queryFn: async () => {
      if (selectedFabricCodes.length === 0) return {} as Record<string, number>;
      const { data, error } = await supabase
        .from("fabric_coding")
        .select("estre_code, price")
        .in("estre_code", selectedFabricCodes);
      if (error) throw error;
      const map: Record<string, number> = {};
      (data || []).forEach((item) => {
        map[item.estre_code] = Number(item.price) || 0;
      });
      return map;
    },
    enabled: selectedFabricCodes.length > 0,
  });

  const storagePrice = useMemo(() => {
    if (storage?.required !== "Yes") return 0;
    if (storage?.type === "Side Drawer") return STORAGE_PRICES["Side Drawer"];
    if (storage?.type === "Box Storage") {
      return STORAGE_PRICES[storage?.boxStorageType || "Manual"] || 0;
    }
    return 0;
  }, [storage]);

  useEffect(() => {
    if (configuration.storage?.price !== storagePrice) {
      updateConfiguration({
        storage: {
          ...storage,
          price: storagePrice,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storagePrice]);

  const storageFabricAddition = storage?.required === "Yes" ? 1 : 0;

  const totalBaseFabric = (baseModel?.fabric || 0) + storageFabricAddition;
  const extraFabricMeters = Number(fabricPlan?.extraFabricMeters || 0);
  const totalFabricWithExtras = totalBaseFabric + extraFabricMeters;

  const fabricQuantities = useMemo(() => {
    if (fabricPlan?.claddingPlan === "Multi Colour") {
      return {
        structure: totalFabricWithExtras * MULTI_COLOUR_SPLIT.structure,
        headboard: totalFabricWithExtras * MULTI_COLOUR_SPLIT.headboard,
        headboardDesign: totalFabricWithExtras * MULTI_COLOUR_SPLIT.headboardDesign,
        headboardElement: totalFabricWithExtras * MULTI_COLOUR_SPLIT.headboardElement,
        total: totalFabricWithExtras,
      };
    }
    return {
      total: totalFabricWithExtras,
    };
  }, [fabricPlan?.claddingPlan, totalFabricWithExtras]);

  const fabricUpgradeCharges = useMemo(() => {
    if (fabricPricesQuery.isLoading || fabricPricesQuery.isError) return 0;
    const priceMap = fabricPricesQuery.data || {};

    if (fabricPlan?.claddingPlan === "Multi Colour") {
      let total = 0;
      if (fabricPlan?.structureFabricCode && fabricQuantities.structure) {
        const price = priceMap[fabricPlan.structureFabricCode] ?? BASE_PRICING.baseFabricPrice;
        total += (price - BASE_PRICING.baseFabricPrice) * fabricQuantities.structure;
      }
      if (fabricPlan?.headboardFabricCode && fabricQuantities.headboard) {
        const price = priceMap[fabricPlan.headboardFabricCode] ?? BASE_PRICING.baseFabricPrice;
        total += (price - BASE_PRICING.baseFabricPrice) * fabricQuantities.headboard;
      }
      if (fabricPlan?.headboardDesignFabricCode && fabricQuantities.headboardDesign) {
        const price = priceMap[fabricPlan.headboardDesignFabricCode] ?? BASE_PRICING.baseFabricPrice;
        total += (price - BASE_PRICING.baseFabricPrice) * fabricQuantities.headboardDesign;
      }
      if (fabricPlan?.headboardElementFabricCode && fabricQuantities.headboardElement) {
        const price = priceMap[fabricPlan.headboardElementFabricCode] ?? BASE_PRICING.baseFabricPrice;
        total += (price - BASE_PRICING.baseFabricPrice) * fabricQuantities.headboardElement;
      }
      return Math.max(0, total);
    }

    if (fabricPlan?.singleFabricCode) {
      const price = priceMap[fabricPlan.singleFabricCode] ?? BASE_PRICING.baseFabricPrice;
      return Math.max(0, (price - BASE_PRICING.baseFabricPrice) * fabricQuantities.total);
    }

    return 0;
  }, [fabricPlan, fabricPricesQuery.data, fabricPricesQuery.isError, fabricPricesQuery.isLoading, fabricQuantities]);

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

  const basePrice = Number(baseModel?.price || 0);
  const extraFabricCost = extraFabricMeters * BASE_PRICING.baseFabricPrice;

  const discountCodePercent = useMemo(() => {
    const selected = discountCodeOptions.find((opt: any) => opt.option_value === discount?.discountCode);
    const percentage = Number(selected?.metadata?.[DISCOUNT_CODE_KEY] || 0);
    return percentage;
  }, [discount?.discountCode, discountCodeOptions]);

  const totalInvoiceValue = basePrice + storagePrice + fabricUpgradeCharges + extraFabricCost;
  const discountAmount = totalInvoiceValue * discountCodePercent;
  const netInvoiceValue = totalInvoiceValue - discountAmount;

  const overallDimensions = useMemo(() => {
    const length = bedDimensions.length || currentLengthEntry.length;
    const width = bedDimensions.width || widthOptions[0];
    return {
      length: length + 3,
      width: width + 3,
    };
  }, [bedDimensions.length, bedDimensions.width, currentLengthEntry.length, widthOptions]);

  const handleSizeCategoryChange = (sizeCategory: string) => {
    const lengthEntry = BED_SIZES[sizeCategory][0];
    const newLength = lengthEntry.length;
    const newWidth = lengthEntry.widthOptions[0];
    const areaRatio = calculateAreaRatio(newLength, newWidth);
    const basePriceValue = getBaseProductPrice();
    const baseFabricValue = getBaseProductFabric();

    updateConfiguration({
      bedDimensions: {
        sizeCategory,
        length: newLength,
        width: newWidth,
        areaRatio,
      },
      baseModel: {
        price: basePriceValue * areaRatio,
        fabric: baseFabricValue * areaRatio,
        basePrice: basePriceValue,
        baseFabric: baseFabricValue,
      },
      fabricPlan: {
        ...fabricPlan,
        baseFabricMeters: baseFabricValue * areaRatio,
      },
    });
  };

  const handleLengthChange = (length: number) => {
    const widthOptions = BED_SIZES[bedDimensions.sizeCategory || getDefaultSizeCategory()].find(
      (entry) => entry.length === length
    )?.widthOptions || [];
    const newWidth = widthOptions.includes(bedDimensions.width) ? bedDimensions.width : widthOptions[0];
    const areaRatio = calculateAreaRatio(length, newWidth);
    const basePriceValue = baseModel.basePrice || getBaseProductPrice();
    const baseFabricValue = baseModel.baseFabric || getBaseProductFabric();

    updateConfiguration({
      bedDimensions: {
        sizeCategory: bedDimensions.sizeCategory,
        length,
        width: newWidth,
        areaRatio,
      },
      baseModel: {
        price: basePriceValue * areaRatio,
        fabric: baseFabricValue * areaRatio,
        basePrice: basePriceValue,
        baseFabric: baseFabricValue,
      },
      fabricPlan: {
        ...fabricPlan,
        baseFabricMeters: baseFabricValue * areaRatio,
      },
    });
  };

  const handleWidthChange = (width: number) => {
    const length = bedDimensions.length || currentLengthEntry.length;
    const areaRatio = calculateAreaRatio(length, width);
    const basePriceValue = baseModel.basePrice || getBaseProductPrice();
    const baseFabricValue = baseModel.baseFabric || getBaseProductFabric();

    updateConfiguration({
      bedDimensions: {
        ...bedDimensions,
        width,
        areaRatio,
      },
      baseModel: {
        price: basePriceValue * areaRatio,
        fabric: baseFabricValue * areaRatio,
        basePrice: basePriceValue,
        baseFabric: baseFabricValue,
      },
      fabricPlan: {
        ...fabricPlan,
        baseFabricMeters: baseFabricValue * areaRatio,
      },
    });
  };

  const handleFabricSelection = (code: string | null, target: typeof openFabricPicker) => {
    updateConfiguration({
      fabricPlan: {
        ...fabricPlan,
        singleFabricCode:
          target === "single" ? code || "" : fabricPlan.singleFabricCode || "",
        structureFabricCode:
          target === "structure" ? code || "" : fabricPlan.structureFabricCode || "",
        headboardFabricCode:
          target === "headboard" ? code || "" : fabricPlan.headboardFabricCode || "",
        headboardDesignFabricCode:
          target === "headboardDesign" ? code || "" : fabricPlan.headboardDesignFabricCode || "",
        headboardElementFabricCode:
          target === "headboardElement" ? code || "" : fabricPlan.headboardElementFabricCode || "",
      },
    });
    setOpenFabricPicker(null);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="base" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="base">Base Model</TabsTrigger>
          <TabsTrigger value="storage">Storage & Fabric</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="base" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Bed Dimensions</CardTitle>
              <CardDescription>Select size, length and width for the kids bed.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Bed Size</Label>
                <Select
                  value={bedDimensions.sizeCategory || getDefaultSizeCategory()}
                  onValueChange={handleSizeCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(BED_SIZES).map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bed Length (inches)</Label>
                <Select
                  value={String(bedDimensions.length || currentLengthEntry.length)}
                  onValueChange={(value) => handleLengthChange(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bedLengthOptions.map((entry) => (
                      <SelectItem key={entry.length} value={String(entry.length)}>
                        {entry.length}"
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bed Width (inches)</Label>
                <Select
                  value={String(bedDimensions.width || widthOptions[0])}
                  onValueChange={(value) => handleWidthChange(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {widthOptions.map((width) => (
                      <SelectItem key={width} value={String(width)}>
                        {width}"
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Legs</Label>
                {legOptionsResponse.isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={legs?.type || legOptions[0]?.option_value || "Kulfi Leg-Gold"}
                    onValueChange={(value) => {
                      const option = legOptions.find((opt: any) => opt.option_value === value);
                      const sizes = option?.metadata?.sizes || option?.metadata?.size;
                      const sizeValue = Array.isArray(sizes) ? sizes[0] : sizes || "6 in";
                      updateConfiguration({
                        legs: {
                          type: value,
                          size: sizeValue,
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
                <p className="text-xs text-muted-foreground">Leg height: {legs?.size || "6 in"}</p>
              </div>

              <div className="rounded-lg border bg-muted/40 p-4 md:col-span-2">
                <p className="text-sm text-muted-foreground">Base Model Overview</p>
                <p className="text-sm">Area ratio: {areaRatio.toFixed(2)} × standard</p>
                <p className="text-sm">Base price: ₹{Math.round(basePrice).toLocaleString()}</p>
                <p className="text-sm">Base fabric: {totalBaseFabric.toFixed(2)} m (incl. storage)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl font-serif">Storage Options</CardTitle>
              <CardDescription>Add storage and configure fabric selections.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Storage Required?</Label>
                <RadioGroup
                  value={storage?.required || "No"}
                  onValueChange={(value) =>
                    updateConfiguration({
                      storage: {
                        ...storage,
                        required: value,
                      },
                    })
                  }
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="storage-yes" />
                    <Label htmlFor="storage-yes" className="cursor-pointer">
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="storage-no" />
                    <Label htmlFor="storage-no" className="cursor-pointer">
                      No
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {storage?.required === "Yes" && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Storage Type</Label>
                    <Select
                      value={storage?.type || "Box Storage"}
                      onValueChange={(value) =>
                        updateConfiguration({
                          storage: {
                            ...storage,
                            type: value,
                            boxStorageType: value === "Box Storage" ? storage?.boxStorageType || "Manual" : undefined,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STORAGE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {storage?.type === "Box Storage" && (
                    <div className="space-y-2">
                      <Label>Box Storage Type</Label>
                      <Select
                        value={storage?.boxStorageType || "Manual"}
                        onValueChange={(value) =>
                          updateConfiguration({
                            storage: {
                              ...storage,
                              boxStorageType: value,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BOX_STORAGE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label>Fabric Plan</Label>
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
                  {FABRIC_PLANS.map((plan) => (
                    <div key={plan} className="flex items-center space-x-2">
                      <RadioGroupItem value={plan} id={`fabric-${plan}`} />
                      <Label htmlFor={`fabric-${plan}`} className="cursor-pointer">
                        {plan}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {fabricPlan?.claddingPlan === "Single Colour" ? (
                <div className="space-y-2">
                  <Label>Fabric</Label>
                  {renderFabricButton("Single Fabric", fabricPlan?.singleFabricCode, () => setOpenFabricPicker("single"))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Structure Fabric</Label>
                    {renderFabricButton("Structure", fabricPlan?.structureFabricCode, () => setOpenFabricPicker("structure"))}
                    <p className="text-xs text-muted-foreground">
                      {fabricQuantities.structure?.toFixed(2) ?? 0} m
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Headboard Fabric</Label>
                    {renderFabricButton("Headboard", fabricPlan?.headboardFabricCode, () => setOpenFabricPicker("headboard"))}
                    <p className="text-xs text-muted-foreground">
                      {fabricQuantities.headboard?.toFixed(2) ?? 0} m
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Headboard Design Fabric</Label>
                    {renderFabricButton("Headboard Design", fabricPlan?.headboardDesignFabricCode, () =>
                      setOpenFabricPicker("headboardDesign")
                    )}
                    <p className="text-xs text-muted-foreground">
                      {fabricQuantities.headboardDesign?.toFixed(2) ?? 0} m
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Headboard Element Fabric</Label>
                    {renderFabricButton("Headboard Element", fabricPlan?.headboardElementFabricCode, () =>
                      setOpenFabricPicker("headboardElement")
                    )}
                    <p className="text-xs text-muted-foreground">
                      {fabricQuantities.headboardElement?.toFixed(2) ?? 0} m
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
              <CardTitle className="text-2xl font-serif">Pricing Summary</CardTitle>
              <CardDescription>Review totals, discounts, and invoice.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <SummaryRow label="Base Price" value={basePrice} />
                <SummaryRow label="Storage Price" value={storagePrice} />
                <SummaryRow label="Fabric Upgrade" value={fabricUpgradeCharges} />
                <SummaryRow label="Extra Fabric" value={extraFabricCost} />
                <SummaryRow label="Total Invoice" value={totalInvoiceValue} highlight />
                <SummaryRow label="Discount" value={discountAmount} />
                <SummaryRow label="Net Invoice" value={netInvoiceValue} highlight />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Discount Approved By</Label>
                  {discountApproversResponse.isLoading ? (
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
                    Discount: {(discountCodePercent * 100).toFixed(0)}% ({discountAmount.toFixed(2)})
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/40 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Dimensions</p>
                  <p className="text-sm">
                    Length: {overallDimensions.length}" • Width: {overallDimensions.width}"
                  </p>
                </div>
                <Badge variant="secondary">Net: ₹{netInvoiceValue.toFixed(2)}</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <FabricLibrary
        open={openFabricPicker === "single"}
        onOpenChange={(open) => setOpenFabricPicker(open ? "single" : null)}
        onSelect={(code) => handleFabricSelection(code, "single")}
        selectedCode={fabricPlan?.singleFabricCode}
        title="Select Fabric"
      />
      <FabricLibrary
        open={openFabricPicker === "structure"}
        onOpenChange={(open) => setOpenFabricPicker(open ? "structure" : null)}
        onSelect={(code) => handleFabricSelection(code, "structure")}
        selectedCode={fabricPlan?.structureFabricCode}
        title="Select Structure Fabric"
      />
      <FabricLibrary
        open={openFabricPicker === "headboard"}
        onOpenChange={(open) => setOpenFabricPicker(open ? "headboard" : null)}
        onSelect={(code) => handleFabricSelection(code, "headboard")}
        selectedCode={fabricPlan?.headboardFabricCode}
        title="Select Headboard Fabric"
      />
      <FabricLibrary
        open={openFabricPicker === "headboardDesign"}
        onOpenChange={(open) => setOpenFabricPicker(open ? "headboardDesign" : null)}
        onSelect={(code) => handleFabricSelection(code, "headboardDesign")}
        selectedCode={fabricPlan?.headboardDesignFabricCode}
        title="Select Headboard Design Fabric"
      />
      <FabricLibrary
        open={openFabricPicker === "headboardElement"}
        onOpenChange={(open) => setOpenFabricPicker(open ? "headboardElement" : null)}
        onSelect={(code) => handleFabricSelection(code, "headboardElement")}
        selectedCode={fabricPlan?.headboardElementFabricCode}
        title="Select Headboard Element Fabric"
      />
    </div>
  );
};

const renderFabricButton = (label: string, code: string | undefined, onClick: () => void) => (
  <Button variant="outline" className="justify-start" onClick={onClick}>
    {code ? <span className="truncate">{code}</span> : <span className="text-muted-foreground">Select fabric…</span>}
  </Button>
);

const SummaryRow = ({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) => (
  <div className="rounded-md border bg-background p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`text-sm font-semibold ${highlight ? "text-primary" : ""}`}>₹{value.toFixed(2)}</p>
  </div>
);

export default KidsBedConfigurator;
