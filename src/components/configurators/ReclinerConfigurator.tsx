import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import FabricSelector from "./FabricSelector";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { Loader2 } from "lucide-react";

interface ReclinerConfiguratorProps {
  product: any;
  configuration: any;
  onConfigurationChange: (config: any) => void;
}

const ReclinerConfigurator = ({ product, configuration, onConfigurationChange }: ReclinerConfiguratorProps) => {
  // Fetch dropdown options
  const { data: baseShapes, isLoading: loadingShapes } = useDropdownOptions("recliner", "base_shape");
  const { data: seatTypes, isLoading: loadingSeats } = useDropdownOptions("recliner", "seat_type");
  const { data: mechanismTypes, isLoading: loadingMechanisms } = useDropdownOptions("recliner", "mechanism_type");
  const { data: consoleSizes, isLoading: loadingConsoles } = useDropdownOptions("common", "console_size");
  const { data: foamTypes, isLoading: loadingFoam } = useDropdownOptions("common", "foam_type");
  const { data: seatDepths, isLoading: loadingDepths } = useDropdownOptions("recliner", "seat_depth");
  const { data: seatWidths, isLoading: loadingWidths } = useDropdownOptions("recliner", "seat_width");
  const { data: seatHeights, isLoading: loadingHeights } = useDropdownOptions("recliner", "seat_height");

  // Helper: Get seat count from type string
  const getSeatCount = (type: string): number => {
    if (type === "Corner" || type === "Backrest") return 0;
    const match = type.match(/(\d+)-Seater/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Calculate total seats across all sections
  const getTotalSeats = (): number => {
    let total = 0;
    if (configuration.sections?.F?.type) {
      total += getSeatCount(configuration.sections.F.type);
    }
    if (configuration.sections?.L2?.type) {
      total += getSeatCount(configuration.sections.L2.type);
    }
    return total;
  };

  // Calculate physical width per section based on seater type and seat width
  const calculateSectionWidth = (seaterType: string, seatWidth: number): number => {
    const seatCount = getSeatCount(seaterType);
    if (seaterType === "Backrest") {
      // Backrest: 14 inches for 22" width, not applicable for other widths
      return seatWidth === 22 ? 14 : 0;
    }
    if (seaterType === "Corner") {
      // Corner: same as seat width
      return seatWidth;
    }
    // Regular seats: seat count × seat width
    return seatCount * seatWidth;
  };

  // Calculate total physical width
  const calculateTotalWidth = (): number => {
    const seatWidth = configuration.dimensions?.seatWidth || 22;
    let totalWidth = 0;
    
    if (configuration.sections?.F) {
      totalWidth += calculateSectionWidth(configuration.sections.F.type, seatWidth);
    }
    if (configuration.sections?.L1) {
      totalWidth += calculateSectionWidth(configuration.sections.L1.type, seatWidth);
    }
    if (configuration.sections?.L2) {
      totalWidth += calculateSectionWidth(configuration.sections.L2.type, seatWidth);
    }
    
    return totalWidth;
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
          L1: null, // Only for L SHAPE
          L2: null, // Only for L SHAPE
        },
        mechanism: {
          front: "Manual",
          left: "Manual", // Only for L SHAPE
        },
        dummySeats: {
          required: "No",
          F: 0,
          L: 0,
          placements: {},
        },
        console: {
          required: "No",
          quantity: 0,
          size: "Console-6 in",
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

  // Auto-update console quantity when seats change
  useEffect(() => {
    if (configuration.console?.required === "Yes") {
      const totalSeats = getTotalSeats();
      const maxConsoles = Math.max(0, totalSeats - 1);
      if (configuration.console.quantity !== maxConsoles) {
        onConfigurationChange({
          ...configuration,
          console: {
            ...configuration.console,
            quantity: maxConsoles,
          },
        });
      }
    }
  }, [configuration.sections, configuration.console?.required]);

  const updateConfiguration = (updates: any) => {
    onConfigurationChange({ ...configuration, ...updates });
  };

  const updateSection = (section: "F" | "L1" | "L2", field: string, value: any) => {
    const sections = { ...configuration.sections };
    if (!sections[section]) {
      sections[section] = { type: "", qty: 1 };
    }
    sections[section] = { ...sections[section], [field]: value };
    updateConfiguration({ sections });
  };

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

  const totalSeats = getTotalSeats();
  const isLShape = configuration.baseShape === "L SHAPE";
  const fSeatCount = configuration.sections?.F ? getSeatCount(configuration.sections.F.type) : 0;
  const l2SeatCount = configuration.sections?.L2 ? getSeatCount(configuration.sections.L2.type) : 0;

  // Show loading only for critical initial data
  if (loadingShapes || loadingSeats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="base" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="base">Base</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="fabric">Fabric</TabsTrigger>
          <TabsTrigger value="specs">Specs</TabsTrigger>
          <TabsTrigger value="dummy">Dummy Seats</TabsTrigger>
        </TabsList>

        <TabsContent value="base" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shape & Sections</CardTitle>
              <CardDescription>Configure the base shape and seat sections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Base Shape */}
              <div className="space-y-2">
                <Label>Base Shape</Label>
                <RadioGroup
                  value={configuration.baseShape || "STANDARD"}
                  onValueChange={(value) => {
                    const updates: any = { baseShape: value };
                    if (value === "STANDARD") {
                      // Remove L1 and L2 sections
                      updates.sections = {
                        F: configuration.sections?.F || { type: "1-Seater", qty: 1 },
                        L1: null,
                        L2: null,
                      };
                    } else if (value === "L SHAPE") {
                      // Add L1 and L2 sections
                      updates.sections = {
                        F: configuration.sections?.F || { type: "1-Seater", qty: 1 },
                        L1: { type: "Corner", qty: 1 },
                        L2: { type: "1-Seater", qty: 1 },
                      };
                    }
                    updateConfiguration(updates);
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="STANDARD" id="standard" />
                    <Label htmlFor="standard" className="font-normal cursor-pointer">Standard</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="L SHAPE" id="lshape" />
                    <Label htmlFor="lshape" className="font-normal cursor-pointer">L Shape</Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Front Section (F) */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Front Section (F)</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Seat Type</Label>
                    <Select
                      value={configuration.sections?.F?.type || "1-Seater"}
                      onValueChange={(value) => updateSection("F", "type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {seatTypes?.map((type: any) => (
                          <SelectItem key={type.id} value={type.option_value}>
                            {type.display_label || type.option_value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      max="4"
                      value={configuration.sections?.F?.qty || 1}
                      onChange={(e) => updateSection("F", "qty", parseInt(e.target.value, 10) || 1)}
                    />
                  </div>
                </div>
              </div>

              {/* L1 Section (Corner) - Only for L SHAPE */}
              {isLShape && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Left Section - Corner (L1)</Label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={configuration.sections?.L1?.type || "Corner"}
                          onValueChange={(value) => updateSection("L1", "type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Corner">Corner</SelectItem>
                            <SelectItem value="Backrest">Backrest</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={configuration.sections?.L1?.qty || 1}
                          onChange={(e) => updateSection("L1", "qty", parseInt(e.target.value, 10) || 1)}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* L2 Section (Left Seats) - Only for L SHAPE */}
              {isLShape && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Left Section - Seats (L2)</Label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Seat Type</Label>
                        <Select
                          value={configuration.sections?.L2?.type || "1-Seater"}
                          onValueChange={(value) => updateSection("L2", "type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {seatTypes?.filter((type: any) => 
                              type.option_value !== "Corner" && type.option_value !== "Backrest"
                            ).map((type: any) => (
                              <SelectItem key={type.id} value={type.option_value}>
                                {type.display_label || type.option_value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          max="4"
                          value={configuration.sections?.L2?.qty || 1}
                          onChange={(e) => updateSection("L2", "qty", parseInt(e.target.value, 10) || 1)}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Total Seats & Width Display */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-sm font-semibold">Total Seats: {totalSeats}</Label>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-sm font-semibold">Total Width: {calculateTotalWidth()}" ({Math.round(calculateTotalWidth() * 2.54)} cm)</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mechanism & Console</CardTitle>
              <CardDescription>Configure recliner mechanisms and console options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Front Mechanism */}
              <div className="space-y-2">
                <Label>Front Recliner Mechanism</Label>
                <Select
                  value={configuration.mechanism?.front || "Manual"}
                  onValueChange={(value) => updateConfiguration({
                    mechanism: { ...configuration.mechanism, front: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mechanismTypes?.map((type: any) => (
                      <SelectItem key={type.id} value={type.option_value}>
                        {type.display_label || type.option_value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Left Mechanism - Only for L SHAPE */}
              {isLShape && (
                <div className="space-y-2">
                  <Label>Left Recliner Mechanism</Label>
                  <Select
                    value={configuration.mechanism?.left || "Manual"}
                    onValueChange={(value) => updateConfiguration({
                      mechanism: { ...configuration.mechanism, left: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mechanismTypes?.map((type: any) => (
                        <SelectItem key={type.id} value={type.option_value}>
                          {type.display_label || type.option_value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              {/* Console */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Console Required</Label>
                  <RadioGroup
                    value={configuration.console?.required || "No"}
                    onValueChange={(value) => {
                      const totalSeats = getTotalSeats();
                      const maxConsoles = Math.max(0, totalSeats - 1);
                      updateConfiguration({
                        console: {
                          ...configuration.console,
                          required: value,
                          quantity: value === "Yes" ? maxConsoles : 0,
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
                          <SelectItem value="Console-6 in">6 inches</SelectItem>
                          <SelectItem value="Console-10 In">10 inches</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Console quantity: <strong>{configuration.console?.quantity || 0}</strong> (Auto-calculated: Total Seats - 1)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fabric" className="space-y-6">
          <FabricSelector
            configuration={configuration}
            onConfigurationChange={onConfigurationChange}
          />
        </TabsContent>

        <TabsContent value="specs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
              <CardDescription>Configure foam, dimensions, and other specifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                    {foamTypes?.map((foam: any) => (
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
                            const upgradeLabel = upgradePercent > 0 ? ` (+${upgradePercent}% upgrade)` : " (Standard)";
                            return (
                              <SelectItem key={depth.id} value={depth.option_value}>
                                {label}{upgradeLabel}
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
                            const upgradeLabel = upgradePercent > 0 ? ` (+${upgradePercent}% upgrade)` : " (Standard)";
                            return (
                              <SelectItem key={width.id} value={width.option_value}>
                                {label}{upgradeLabel}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dummy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dummy Seats</CardTitle>
              <CardDescription>Configure non-reclining dummy seats (priced at 55% of base)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Dummy Seats Required</Label>
                <RadioGroup
                  value={configuration.dummySeats?.required || "No"}
                  onValueChange={(value) => updateConfiguration({
                    dummySeats: {
                      ...configuration.dummySeats,
                      required: value,
                      F: value === "No" ? 0 : configuration.dummySeats?.F || 0,
                      L: value === "No" ? 0 : configuration.dummySeats?.L || 0,
                    }
                  })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="dummy-yes" />
                    <Label htmlFor="dummy-yes" className="font-normal cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="dummy-no" />
                    <Label htmlFor="dummy-no" className="font-normal cursor-pointer">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {configuration.dummySeats?.required === "Yes" && (
                <>
                  <Separator />
                  
                  {/* Front Section Dummy Seats */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Front Section (F) Dummy Seats</Label>
                    <div className="space-y-2">
                      <Label>Number of Dummy Seats</Label>
                      <Input
                        type="number"
                        min="0"
                        max={fSeatCount}
                        value={configuration.dummySeats?.F || 0}
                        onChange={(e) => {
                          const count = parseInt(e.target.value, 10) || 0;
                          const placements = { ...configuration.dummySeats?.placements || {} };
                          // Remove placements for removed dummy seats
                          for (let i = count + 1; i <= fSeatCount; i++) {
                            delete placements[`front_dummy_${i}`];
                          }
                          updateConfiguration({
                            dummySeats: {
                              ...configuration.dummySeats,
                              F: count,
                              placements,
                            }
                          });
                        }}
                      />
                    </div>
                    
                    {/* Dummy Seat Placements for Front */}
                    {Array.from({ length: configuration.dummySeats?.F || 0 }, (_, i) => {
                      const dummyIndex = i + 1;
                      const placementKey = `front_dummy_${dummyIndex}`;
                      const currentPlacement = configuration.dummySeats?.placements?.[placementKey] || "none";
                      const placementOptions = generateDummyPlacementOptions("F", fSeatCount);
                      
                      return (
                        <div key={i} className="space-y-2 p-3 border rounded-lg">
                          <Label className="text-sm">Front Dummy Seat {dummyIndex} Placement</Label>
                          <Select
                            value={currentPlacement}
                            onValueChange={(value) => {
                              const placements = {
                                ...configuration.dummySeats?.placements || {},
                                [placementKey]: value,
                              };
                              updateConfiguration({
                                dummySeats: {
                                  ...configuration.dummySeats,
                                  placements,
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
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">Left Section (L) Dummy Seats</Label>
                        <div className="space-y-2">
                          <Label>Number of Dummy Seats</Label>
                          <Input
                            type="number"
                            min="0"
                            max={l2SeatCount}
                            value={configuration.dummySeats?.L || 0}
                            onChange={(e) => {
                              const count = parseInt(e.target.value, 10) || 0;
                              const placements = { ...configuration.dummySeats?.placements || {} };
                              // Remove placements for removed dummy seats
                              for (let i = count + 1; i <= l2SeatCount; i++) {
                                delete placements[`left_dummy_${i}`];
                              }
                              updateConfiguration({
                                dummySeats: {
                                  ...configuration.dummySeats,
                                  L: count,
                                  placements,
                                }
                              });
                            }}
                          />
                        </div>
                        
                        {/* Dummy Seat Placements for Left */}
                        {Array.from({ length: configuration.dummySeats?.L || 0 }, (_, i) => {
                          const dummyIndex = i + 1;
                          const placementKey = `left_dummy_${dummyIndex}`;
                          const currentPlacement = configuration.dummySeats?.placements?.[placementKey] || "none";
                          const placementOptions = generateDummyPlacementOptions("L", l2SeatCount);
                          
                          return (
                            <div key={i} className="space-y-2 p-3 border rounded-lg">
                              <Label className="text-sm">Left Dummy Seat {dummyIndex} Placement</Label>
                              <Select
                                value={currentPlacement}
                                onValueChange={(value) => {
                                  const placements = {
                                    ...configuration.dummySeats?.placements || {},
                                    [placementKey]: value,
                                  };
                                  updateConfiguration({
                                    dummySeats: {
                                      ...configuration.dummySeats,
                                      placements,
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
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReclinerConfigurator;
