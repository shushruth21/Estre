import { useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import FabricSelector from "./FabricSelector";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Info } from "lucide-react";

interface BedConfiguratorProps {
  product: any;
  configuration: any;
  onConfigurationChange: (config: any) => void;
}

// Width options based on bed size
const BED_WIDTH_OPTIONS: Record<string, number[]> = {
  Single: [30, 35, 36],
  Double: [42, 47, 48],
  Queen: [60, 66],
  King: [70, 72, 78],
};

// Length options (same for all bed sizes: 72, 75, 78, 84)
const BED_LENGTH_OPTIONS = [72, 75, 78, 84];

// Fallback base dimensions (will be overridden by DB if available)
const BASE_DIMENSIONS: Record<string, { width: number; length: number }> = {
  Single: { width: 36, length: 72 },
  Double: { width: 54, length: 75 },
  Queen: { width: 60, length: 78 },
  King: { width: 72, length: 80 },
};

const BedConfigurator = ({ product, configuration, onConfigurationChange }: BedConfiguratorProps) => {
  // Fetch dropdown options
  const { data: bedSizes, isLoading: loadingSizes } = useDropdownOptions("bed", "bed_size");
  const { data: storageTypes, isLoading: loadingStorage } = useDropdownOptions("bed", "storage_type");
  const { data: legOptions, isLoading: loadingLegs } = useDropdownOptions("bed", "leg_type");
  
  // Fetch default dimensions from DB metadata
  const bedSize = configuration.bedSize || "Double";
  const { data: bedSizeMetadata } = useQuery({
    queryKey: ["bed-size-metadata", bedSize],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dropdown_options")
        .select("metadata")
        .eq("category", "bed")
        .eq("field_name", "bed_size")
        .eq("option_value", bedSize)
        .eq("is_active", true)
        .single();
      
      if (error) return null;
      return data?.metadata || null;
    },
    enabled: !!bedSize,
  });

  // Get default dimensions from DB or fallback
  const defaultDimensions = useMemo(() => {
    if (bedSizeMetadata) {
      const metadata = typeof bedSizeMetadata === 'string' 
        ? JSON.parse(bedSizeMetadata) 
        : bedSizeMetadata;
      if (metadata?.width_inches && metadata?.length_inches) {
        return {
          width: metadata.width_inches,
          length: metadata.length_inches,
        };
      }
    }
    return BASE_DIMENSIONS[bedSize] || BASE_DIMENSIONS.Double;
  }, [bedSizeMetadata, bedSize]);
  
  // Get width options based on selected bed size
  const widthOptions = useMemo(() => {
    return BED_WIDTH_OPTIONS[bedSize] || BED_WIDTH_OPTIONS.Double;
  }, [bedSize]);

  // Calculate area ratio for display
  const areaRatio = useMemo(() => {
    const width = configuration.dimensions?.width || defaultDimensions.width;
    const length = configuration.dimensions?.length || defaultDimensions.length;
    return (width * length) / (defaultDimensions.width * defaultDimensions.length);
  }, [configuration.dimensions, defaultDimensions]);

  useEffect(() => {
    if (!configuration.productId) {
      const defaultWidth = widthOptions[0] || 54;
      
      onConfigurationChange({
        productId: product.id,
        category: "bed",
        bedSize: bedSize,
        storage: "No",
        storageType: "None",
        fabric: {
          claddingPlan: "Single Colour",
        },
        dimensions: {
          length: defaultDimensions.length,
          width: defaultWidth,
        },
      });
    }
  }, [product.id, configuration.productId, bedSize, defaultDimensions.length, widthOptions, onConfigurationChange]);

  // Update width when bed size changes
  useEffect(() => {
    if (configuration.bedSize && configuration.dimensions) {
      const newWidthOptions = BED_WIDTH_OPTIONS[configuration.bedSize] || BED_WIDTH_OPTIONS.Double;
      const currentWidth = configuration.dimensions.width;
      
      if (!newWidthOptions.includes(currentWidth)) {
        onConfigurationChange({
          ...configuration,
          dimensions: {
            ...configuration.dimensions,
            width: newWidthOptions[0],
          },
        });
      }
    }
  }, [configuration.bedSize, configuration.dimensions, onConfigurationChange]);

  const updateConfiguration = (updates: any) => {
    onConfigurationChange({ ...configuration, ...updates });
  };

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl font-serif">Bed Configuration</CardTitle>
          <CardDescription>Customize your perfect bed piece</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Accordion type="multiple" defaultValue={["bed-type", "dimensions"]} className="w-full">
            {/* Bed Type & Basic Options */}
            <AccordionItem value="bed-type">
              <AccordionTrigger className="text-lg font-semibold">
                Bed Type & Basic Options
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                {/* Bed Size */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Bed Type</Label>
                  <RadioGroup
                    value={configuration.bedSize || "Double"}
                    onValueChange={(value) => updateConfiguration({ bedSize: value })}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="Single" id="single" />
                      <Label htmlFor="single" className="font-normal cursor-pointer flex-1">Single</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="Double" id="double" />
                      <Label htmlFor="double" className="font-normal cursor-pointer flex-1">Double</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="Queen" id="queen" />
                      <Label htmlFor="queen" className="font-normal cursor-pointer flex-1">Queen</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="King" id="king" />
                      <Label htmlFor="king" className="font-normal cursor-pointer flex-1">King</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                {/* Storage */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Storage Required</Label>
                  <RadioGroup
                    value={configuration.storage || "No"}
                    onValueChange={(value) => updateConfiguration({ storage: value })}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Yes" id="storage-yes" />
                      <Label htmlFor="storage-yes" className="font-normal cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="No" id="storage-no" />
                      <Label htmlFor="storage-no" className="font-normal cursor-pointer">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Storage Type */}
                {configuration.storage === "Yes" && (
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                    <Label className="text-base font-semibold">Storage Type</Label>
                    {loadingStorage ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={configuration.storageType || "Hydraulic"}
                        onValueChange={(value) => updateConfiguration({ storageType: value })}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select storage type" />
                        </SelectTrigger>
                        <SelectContent>
                          {storageTypes && storageTypes.length > 0 ? (
                            storageTypes.map((type: any) => (
                              <SelectItem key={type.id} value={type.option_value}>
                                {type.display_label || type.option_value}
                              </SelectItem>
                            ))
                          ) : (
                            <>
                              <SelectItem value="Hydraulic">Hydraulic Storage</SelectItem>
                              <SelectItem value="Box">Box Storage</SelectItem>
                              <SelectItem value="Drawer">Drawer Storage</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Dimensions */}
            <AccordionItem value="dimensions">
              <AccordionTrigger className="text-lg font-semibold">
                Dimensions
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Width (inches)</Label>
                    <Select
                      value={String(configuration.dimensions?.width || widthOptions[0])}
                      onValueChange={(value) => updateConfiguration({
                        dimensions: { ...configuration.dimensions, width: Number(value) }
                      })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {widthOptions.map(width => (
                          <SelectItem key={width} value={String(width)}>
                            {width}"
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Available widths for {bedSize} bed
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Length (inches)</Label>
                    <Select
                      value={String(configuration.dimensions?.length || defaultDimensions.length)}
                      onValueChange={(value) => updateConfiguration({
                        dimensions: { ...configuration.dimensions, length: Number(value) }
                      })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BED_LENGTH_OPTIONS.map(length => (
                          <SelectItem key={length} value={String(length)}>
                            {length}"
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Standard length options
                    </p>
                  </div>
                </div>

                {/* Area Ratio Information */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">Dimension Information</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Selected Dimensions:</p>
                          <p className="font-medium">
                            {configuration.dimensions?.width || widthOptions[0]}" × {configuration.dimensions?.length || defaultDimensions.length}"
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Default ({bedSize}):</p>
                          <p className="font-medium">
                            {defaultDimensions.width}" × {defaultDimensions.length}"
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium">
                          Area Ratio: <span className="text-primary font-semibold">{areaRatio.toFixed(3)}</span>
                          {areaRatio > 1 && (
                            <span className="text-primary ml-2">
                              (+{((areaRatio - 1) * 100).toFixed(1)}% increase)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Price and fabric will be adjusted based on this area ratio.
                        </p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>

            {/* Fabric Selection */}
            <AccordionItem value="fabric">
              <AccordionTrigger className="text-lg font-semibold">
                Fabric Selection
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <FabricSelector
                  configuration={configuration}
                  onConfigurationChange={onConfigurationChange}
                  category="bed"
                />
              </AccordionContent>
            </AccordionItem>

            {/* Legs & Accessories */}
            <AccordionItem value="accessories">
              <AccordionTrigger className="text-lg font-semibold">
                Legs & Accessories
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Leg Type</Label>
                  {loadingLegs ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={configuration.legsCode || configuration.legType || undefined}
                      onValueChange={(value) => {
                        if (value === "none") {
                          updateConfiguration({ 
                            legsCode: undefined,
                            legType: undefined,
                          });
                        } else {
                          updateConfiguration({ 
                            legsCode: value,
                            legType: value,
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select leg type (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {legOptions?.map((leg: any) => (
                          <SelectItem key={leg.id} value={leg.option_value}>
                            {leg.display_label || leg.option_value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Select leg type for your bed. Price will be calculated based on selection.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default BedConfigurator;
