import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import FabricSelector from "./FabricSelector";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CinemaChairConfiguratorProps {
  product: any;
  configuration: any;
  onConfigurationChange: (config: any) => void;
}

const CinemaChairConfigurator = ({ product, configuration, onConfigurationChange }: CinemaChairConfiguratorProps) => {
  // Fetch dropdown options
  const { data: seatCounts, isLoading: loadingSeats } = useDropdownOptions("cinema_chairs", "seat_count");
  const { data: mechanismTypes, isLoading: loadingMechanisms } = useDropdownOptions("cinema_chairs", "mechanism_type");
  const { data: consoleSizes, isLoading: loadingConsoles } = useDropdownOptions("common", "console_size");
  const { data: foamTypes, isLoading: loadingFoam } = useDropdownOptions("common", "foam_type");
  const { data: seatDepths, isLoading: loadingDepths } = useDropdownOptions("cinema_chairs", "seat_depth");
  const { data: seatWidths, isLoading: loadingWidths } = useDropdownOptions("cinema_chairs", "seat_width");
  const { data: seatHeights, isLoading: loadingHeights } = useDropdownOptions("cinema_chairs", "seat_height");
  
  // Load accessories for armrests and consoles
  const { data: accessories, isLoading: loadingAccessories } = useQuery({
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
  
  // Parse seater type to get seat count
  const parseSeaterType = (seaterType: string | number | undefined): number => {
    if (typeof seaterType === "number") return seaterType;
    if (!seaterType) return 1;
    const match = seaterType.toString().match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  };

  // Calculate total width based on seater type and seat width
  const calculateTotalWidth = (): number => {
    const seaterType = configuration.seaterType || "1-Seater";
    const seatWidth = configuration.dimensions?.seatWidth || 22;
    const seatCount = parseSeaterType(seaterType);
    return seatCount * Number(seatWidth);
  };

  // Calculate max consoles (seats - 1)
  const maxConsoles = Math.max(0, parseSeaterType(configuration.seaterType || configuration.numberOfSeats || 1) - 1);

  const updateConfiguration = (updates: any) => {
    onConfigurationChange({ ...configuration, ...updates });
  };

  useEffect(() => {
    if (!configuration.productId) {
      onConfigurationChange({
        productId: product.id,
        category: "cinema_chairs",
        seaterType: "2-Seater",
        numberOfSeats: 2,
        mechanism: "Single Motor",
        console: {
          required: "No",
          quantity: 0,
          size: "Console-6 in",
          placements: [],
        },
        accessories: {
          leftArmRest: null,
          rightArmRest: null,
          consoleAccessories: [],
        },
        headrest: {
          comesWithProduct: product.whether_comes_with_headrest === "Yes",
          required: "No",
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
          seatHeight: 18,
        },
      });
    }
  }, [product.id, configuration.productId, onConfigurationChange, product.whether_comes_with_headrest]);

  // Auto-update console quantity when seats change
  useEffect(() => {
    const seatCount = parseSeaterType(configuration.seaterType || configuration.numberOfSeats || 1);
    const newMaxConsoles = Math.max(0, seatCount - 1);
    
    if (configuration.console?.required === "Yes") {
      const currentQuantity = configuration.console?.quantity || 0;
      if (currentQuantity > newMaxConsoles) {
        updateConfiguration({
          console: {
            ...configuration.console,
            quantity: newMaxConsoles,
            placements: configuration.console?.placements?.slice(0, newMaxConsoles) || [],
          },
        });
      }
    }
  }, [configuration.seaterType, configuration.numberOfSeats, configuration.console, updateConfiguration]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="base" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="base">Base</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="fabric">Fabric</TabsTrigger>
          <TabsTrigger value="specs">Specs</TabsTrigger>
        </TabsList>

        <TabsContent value="base" className="space-y-6">
          {/* Seater Type */}
          <div className="space-y-2">
            <Label>Seater Type</Label>
            {loadingSeats ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={configuration.seaterType || "2-Seater"}
                onValueChange={(value) => {
                  const seatCount = parseSeaterType(value);
                  updateConfiguration({ 
                    seaterType: value,
                    numberOfSeats: seatCount,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select seater type" />
                </SelectTrigger>
                <SelectContent>
                  {seatCounts?.map((seat) => (
                    <SelectItem key={seat.id} value={seat.option_value}>
                      {seat.display_label || seat.option_value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-sm text-muted-foreground">
              Selected: {parseSeaterType(configuration.seaterType || configuration.numberOfSeats || 1)} seat(s)
            </p>
          </div>

          {/* Mechanism Type */}
          <div className="space-y-2">
            <Label>Mechanism Type</Label>
            {loadingMechanisms ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <RadioGroup
                value={configuration.mechanism || "Single Motor"}
                onValueChange={(value) => updateConfiguration({ mechanism: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Single Motor" id="single-motor" />
                  <Label htmlFor="single-motor" className="font-normal cursor-pointer">Single Motor (No additional charge)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Dual Motor" id="dual-motor" />
                  <Label htmlFor="dual-motor" className="font-normal cursor-pointer">Dual Motor (+₹28,000 per seat)</Label>
                </div>
              </RadioGroup>
            )}
          </div>

          {/* Total Width Display */}
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium">Total Physical Width</p>
            <p className="text-2xl font-bold">{calculateTotalWidth()}" ({Math.round(calculateTotalWidth() * 2.54)} cm)</p>
            <p className="text-xs text-muted-foreground mt-1">
              Calculated: {parseSeaterType(configuration.seaterType || configuration.numberOfSeats || 1)} seats × {configuration.dimensions?.seatWidth || 24}" per seat
            </p>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          {/* Console Configuration */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Console Required</Label>
              <RadioGroup
                value={configuration.console?.required || "No"}
                onValueChange={(value) => {
                  const seatCount = parseSeaterType(configuration.seaterType || configuration.numberOfSeats || 1);
                  const maxConsoles = Math.max(0, seatCount - 1);
                  updateConfiguration({
                    console: { 
                      ...configuration.console, 
                      required: value,
                      quantity: value === "Yes" ? Math.min(configuration.console?.quantity || 1, maxConsoles) : 0,
                      placements: value === "Yes" ? (configuration.console?.placements || Array(maxConsoles).fill(null)) : [],
                    }
                  });
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Yes" id="console-yes" />
                  <Label htmlFor="console-yes" className="font-normal cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="No" id="console-no" />
                  <Label htmlFor="console-no" className="font-normal cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </div>

            {configuration.console?.required === "Yes" && (
              <>
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
                      <SelectItem value="Console-6 in">6 inches (₹8,000)</SelectItem>
                      <SelectItem value="Console-10 In">10 inches (₹12,000)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Number of Consoles</Label>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-sm font-medium">
                      {maxConsoles} console{maxConsoles !== 1 ? 's' : ''} available
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Formula: {parseSeaterType(configuration.seaterType || configuration.numberOfSeats || 1)} seats - 1 = {maxConsoles} console{maxConsoles !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max={maxConsoles}
                    value={configuration.console?.quantity || 0}
                    onChange={(e) => {
                      const qty = Math.min(Math.max(0, Number(e.target.value)), maxConsoles);
                      const currentPlacements = configuration.console?.placements || [];
                      updateConfiguration({
                        console: { 
                          ...configuration.console, 
                          quantity: qty,
                          placements: Array(qty).fill(null).map((_, i) => currentPlacements[i] || null),
                        }
                      });
                    }}
                  />
                </div>

                {/* Console Placements */}
                {configuration.console?.quantity > 0 && (
                  <div className="space-y-3">
                    <Label>Console Placements</Label>
                    {Array.from({ length: configuration.console.quantity }).map((_, index) => {
                      const seatCount = parseSeaterType(configuration.seaterType || configuration.numberOfSeats || 1);
                      const placementOptions = Array.from({ length: seatCount - 1 }, (_, i) => ({
                        value: `after_${i + 1}`,
                        label: `After ${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} Seat from Left`,
                      }));
                      
                      return (
                        <div key={index} className="space-y-2">
                          <Label className="text-sm">Console {index + 1} Placement</Label>
                          <Select
                            value={configuration.console?.placements?.[index] || "none"}
                            onValueChange={(value) => {
                              const placements = [...(configuration.console?.placements || [])];
                              placements[index] = value === "none" ? null : value;
                              updateConfiguration({
                                console: { ...configuration.console, placements }
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select placement" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None (Unassigned)</SelectItem>
                              {placementOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {/* Console Accessory */}
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Console {index + 1} Accessory</Label>
                            {loadingAccessories ? (
                              <Skeleton className="h-9 w-full" />
                            ) : (
                              <Select
                                value={configuration.accessories?.consoleAccessories?.[index] || "none"}
                                onValueChange={(value) => {
                                  const consoleAccessories = [...(configuration.accessories?.consoleAccessories || [])];
                                  consoleAccessories[index] = value === "none" ? null : value;
                                  updateConfiguration({
                                    accessories: {
                                      ...configuration.accessories,
                                      consoleAccessories,
                                    }
                                  });
                                }}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select accessory" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {accessories?.map((acc: any) => (
                                    <SelectItem key={acc.id} value={acc.id.toString()}>
                                      {acc.description} - ₹{acc.sale_price?.toLocaleString() || 0}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Accessories - Armrests */}
          <div className="space-y-4">
            <Label>Armrest Accessories</Label>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Left Arm Rest</Label>
                {loadingAccessories ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={configuration.accessories?.leftArmRest || "none"}
                    onValueChange={(value) => updateConfiguration({
                      accessories: {
                        ...configuration.accessories,
                        leftArmRest: value === "none" ? null : value,
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select accessory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {accessories?.map((acc: any) => (
                        <SelectItem key={acc.id} value={acc.id.toString()}>
                          {acc.description} - ₹{acc.sale_price?.toLocaleString() || 0}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Right Arm Rest</Label>
                {loadingAccessories ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={configuration.accessories?.rightArmRest || "none"}
                    onValueChange={(value) => updateConfiguration({
                      accessories: {
                        ...configuration.accessories,
                        rightArmRest: value === "none" ? null : value,
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select accessory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {accessories?.map((acc: any) => (
                        <SelectItem key={acc.id} value={acc.id.toString()}>
                          {acc.description} - ₹{acc.sale_price?.toLocaleString() || 0}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          {/* Headrest Configuration */}
          <div className="space-y-2">
            <Label>Headrest</Label>
            <div className="rounded-lg bg-muted p-4 space-y-3">
              <div>
                <p className="text-sm font-medium">Model Has Headrest</p>
                <p className="text-sm text-muted-foreground">
                  {product.whether_comes_with_headrest === "Yes" ? "Yes" : "No"}
                </p>
              </div>
              {product.whether_comes_with_headrest === "Yes" && (
                <div className="space-y-2">
                  <Label className="text-sm">Headrest Required</Label>
                  <RadioGroup
                    value={configuration.headrest?.required || "No"}
                    onValueChange={(value) => updateConfiguration({
                      headrest: {
                        ...configuration.headrest,
                        required: value,
                      }
                    })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Yes" id="headrest-yes" />
                      <Label htmlFor="headrest-yes" className="font-normal cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="No" id="headrest-no" />
                      <Label htmlFor="headrest-no" className="font-normal cursor-pointer">No</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fabric" className="space-y-6">
          <FabricSelector
            configuration={configuration}
            onConfigurationChange={onConfigurationChange}
          />
        </TabsContent>

        <TabsContent value="specs" className="space-y-6">
          <div className="space-y-2">
            <Label>Foam Type</Label>
            <Select
              value={configuration.foam?.type || "Firm"}
              onValueChange={(value) => updateConfiguration({
                foam: { type: value }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {foamTypes?.map((foam) => (
                  <SelectItem key={foam.id} value={foam.option_value}>
                    {foam.display_label || foam.option_value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Seat Depth (inches)</Label>
              {loadingDepths ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={String(configuration.dimensions?.seatDepth || 22)}
                  onValueChange={(value) => updateConfiguration({
                    dimensions: { ...configuration.dimensions, seatDepth: Number(value) }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select depth" />
                  </SelectTrigger>
                  <SelectContent>
                    {seatDepths && seatDepths.length > 0 ? (
                      seatDepths.map((depth) => {
                        const metadata = depth.metadata || {};
                        const upgradePercent = metadata.upgrade_percent || metadata.price_adjustment || 0;
                        const upgradeLabel = upgradePercent > 0 ? ` (+${(upgradePercent * 100).toFixed(1)}%)` : " (Standard)";
                        return (
                          <SelectItem key={depth.id} value={depth.option_value}>
                            {depth.display_label || depth.option_value}{upgradeLabel}
                          </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem value="no-data" disabled>No options available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Seat Width (inches)</Label>
              {loadingWidths ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={String(configuration.dimensions?.seatWidth || 24)}
                  onValueChange={(value) => updateConfiguration({
                    dimensions: { ...configuration.dimensions, seatWidth: Number(value) }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select width" />
                  </SelectTrigger>
                  <SelectContent>
                    {seatWidths && seatWidths.length > 0 ? (
                      seatWidths.map((width) => {
                        const metadata = width.metadata || {};
                        const upgradePercent = metadata.upgrade_percent || metadata.price_adjustment || 0;
                        const upgradeLabel = upgradePercent > 0 ? ` (+${(upgradePercent * 100).toFixed(1)}%)` : " (Standard)";
                        return (
                          <SelectItem key={width.id} value={width.option_value}>
                            {width.display_label || width.option_value}{upgradeLabel}
                          </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem value="no-data" disabled>No options available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Seat Height (inches)</Label>
              {loadingHeights ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={String(configuration.dimensions?.seatHeight || 18)}
                  onValueChange={(value) => updateConfiguration({
                    dimensions: { ...configuration.dimensions, seatHeight: Number(value) }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select height" />
                  </SelectTrigger>
                  <SelectContent>
                    {seatHeights && seatHeights.length > 0 ? (
                      seatHeights.map((height) => (
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CinemaChairConfigurator;
