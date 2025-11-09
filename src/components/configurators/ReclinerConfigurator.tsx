import { useEffect } from "react";
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

// Mechanism price mapping
const MECHANISM_PRICES: Record<string, number> = {
  "Manual": 0,
  "Manual-RRR": 6800,
  "Electrical": 14500,
  "Electric": 14500,
  "Electrical-RRR": 16500,
  "Electric-RRR": 16500,
  "Only Sofa": 0,
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
      return seatWidth === 22 ? 14 : 0;
    }
    if (seaterType === "Corner") {
      return seatWidth;
    }
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

  // Get mechanism price
  const getMechanismPrice = (mechanismType: string): number => {
    return MECHANISM_PRICES[mechanismType] || 0;
  };

  // Normalize shape for comparison
  const normalizeShape = (shape: string): 'STANDARD' | 'L SHAPE' => {
    if (!shape) return 'STANDARD';
    const upper = shape.toUpperCase();
    if (upper.includes('L SHAPE') || upper.includes('L-SHAPE')) return 'L SHAPE';
    return 'STANDARD';
  };

  // Generate console placement options for recliner using explicit validation formulas
  const generateAllConsolePlacements = () => {
    const consoleRequired = configuration.console?.required === "Yes" || configuration.console?.required === true;
    const sections = configuration.sections || {};
    const shape = normalizeShape(configuration.baseShape || "STANDARD");

    // Get seater types for each section
    // For recliner, sections use "type" field (e.g., "1-Seater", "2-Seater", "4-Seater")
    const frontSeaterType = sections.F?.type || "1-Seater";
    const leftSeaterType = (shape === "L SHAPE") 
      ? (sections.L2?.type || "1-Seater")
      : undefined;

    // Use the console validation utility to generate placements
    const placements = generateConsolePlacementsUtil(
      consoleRequired,
      {
        front: frontSeaterType,
        left: leftSeaterType,
      },
      shape
    );

    return placements;
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

  const totalSeats = getTotalSeats();
  const isLShape = normalizeShape(configuration.baseShape || "STANDARD") === 'L SHAPE';
  const fSeatCount = configuration.sections?.F ? getSeatCount(configuration.sections.F.type) : 0;
  const l2SeatCount = configuration.sections?.L2 ? getSeatCount(configuration.sections.L2.type) : 0;
  
  const frontMechanism = configuration.mechanism?.sections?.front || configuration.mechanism?.front || "Manual";
  const leftMechanism = configuration.mechanism?.sections?.left || configuration.mechanism?.left || "Manual";
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

  const sections = configuration.sections || {};

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
                          value={sections.F?.type || "1-Seater"}
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
                          value={sections.L1?.type || "Corner"}
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
                              value={sections.L2?.type || "1-Seater"}
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
                Mechanism pricing: Manual (₹0), Manual-RRR (₹6,800), Electrical (₹14,500), Electrical-RRR (₹16,500), Only Sofa (₹0)
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
                    {mechanismTypes?.map((type: any) => {
                      const price = getMechanismPrice(type.option_value);
                      return (
                        <SelectItem key={type.id} value={type.option_value}>
                          <div className="flex items-center justify-between w-full">
                            <span>{type.display_label || type.option_value}</span>
                            {price > 0 && (
                              <Badge variant="outline" className="ml-2">
                                ₹{price.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
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
                      {mechanismTypes?.map((type: any) => {
                        const price = getMechanismPrice(type.option_value);
                        return (
                          <SelectItem key={type.id} value={type.option_value}>
                            <div className="flex items-center justify-between w-full">
                              <span>{type.display_label || type.option_value}</span>
                              {price > 0 && (
                                <Badge variant="outline" className="ml-2">
                                  ₹{price.toLocaleString()}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
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
                    Console quantity is manually set (not auto-calculated). Maximum: {getTotalSeats()} based on total seats.
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
                    max={getTotalSeats()}
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
                    Manually set console quantity (max: {getTotalSeats()})
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
                  const activePlacements = (configuration.console?.placements || []).filter(
                    (p: any) => p && p.position && p.position !== "none" && p.section
                  );
                  
                  if (activePlacements.length === 0) return null;

                  const consoleSize = configuration.console?.size || "";
                  const is6Inch = consoleSize.includes("6") || consoleSize === "Console-6 in";
                  const baseConsolePrice = is6Inch ? 8000 : 12000;

                  return (
                    <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-green-300 dark:from-green-950/20 dark:to-blue-950/20 dark:border-green-800">
                      <CardHeader className="p-0 pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <span>✓</span> Active Consoles Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 space-y-2">
                        {activePlacements.map((placement: any, index: number) => {
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
                            {activePlacements.length} active console{activePlacements.length !== 1 ? 's' : ''} configured
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
