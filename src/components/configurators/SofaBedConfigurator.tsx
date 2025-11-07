import { useState, useEffect } from "react";
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

interface SofaBedConfiguratorProps {
  product: any;
  configuration: any;
  onConfigurationChange: (config: any) => void;
}

const SofaBedConfigurator = ({ product, configuration, onConfigurationChange }: SofaBedConfiguratorProps) => {
  // Fetch all dropdown options from database
  const shapesResult = useDropdownOptions("sofabed", "base_shape");
  const seatTypesResult = useDropdownOptions("sofabed", "seat_type");
  const foamTypesResult = useDropdownOptions("common", "foam_type");
  const seatDepthsResult = useDropdownOptions("sofabed", "seat_depth");
  const seatWidthsResult = useDropdownOptions("sofabed", "seat_width");
  const consoleSizesResult = useDropdownOptions("common", "console_size");
  const loungerSizesResult = useDropdownOptions("sofa", "lounger_size");
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

  const getTotalSeats = (): number => {
    let total = 0;
    const sections = configuration.sections || {};
    
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

  const getMaxConsoles = (): number => {
    return Math.max(0, getTotalSeats() - 1);
  };

  const getSectionOptions = (sectionId: string): string[] => {
    if (["F", "L2", "R2", "C2"].includes(sectionId)) {
      return ["2-Seater", "3-Seater", "4-Seater", "2-Seater No Mech", "3-Seater No Mech", "4-Seater No Mech", "none"];
    }
    if (["L1", "R1"].includes(sectionId)) {
      return ["Corner", "Backrest", "none"];
    }
    if (sectionId === "C1") {
      return ["Backrest", "none"];
    }
    return ["none"];
  };

  // Normalize shape for comparison
  const normalizeShape = (shape: string): 'STANDARD' | 'L SHAPE' | 'U SHAPE' | 'COMBO' => {
    if (!shape) return 'STANDARD';
    const upper = shape.toUpperCase();
    if (upper.includes('L SHAPE') || upper.includes('L-SHAPE')) return 'L SHAPE';
    if (upper.includes('U SHAPE') || upper.includes('U-SHAPE')) return 'U SHAPE';
    if (upper.includes('COMBO')) return 'COMBO';
    return 'STANDARD';
  };

  // Generate console placements (section-based, like SofaConfigurator)
  const generateAllConsolePlacements = () => {
    const placements: Array<{ section: string; position: string; label: string; value: string }> = [];
    const sections = configuration.sections || {};
    const shape = normalizeShape(configuration.baseShape || "STANDARD");
    let consoleIndex = 1;

    // Front section consoles
    const frontSeats = parseSeatCount(sections.F?.seater || "2-Seater") * (sections.F?.qty || 1);
    if (frontSeats > 1) {
      for (let i = 1; i < frontSeats; i++) {
        const ordinal = i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th';
        placements.push({
          section: 'front',
          position: `after_${i}`,
          label: `Front Console ${consoleIndex}: After ${i}${ordinal} Seat from Left`,
          value: `front_${i}`
        });
        consoleIndex++;
      }
    }

    // Left section consoles (L2)
    if (shape === "L SHAPE" || shape === "U SHAPE" || shape === "COMBO") {
      const leftSeats = parseSeatCount(sections.L2?.seater || "2-Seater") * (sections.L2?.qty || 1);
      if (leftSeats > 1) {
        for (let i = 1; i < leftSeats; i++) {
          const ordinal = i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th';
          placements.push({
            section: 'left',
            position: `after_${i}`,
            label: `Left Console ${consoleIndex}: After ${i}${ordinal} Seat from Left (Left Section)`,
            value: `left_${i}`
          });
          consoleIndex++;
        }
      }
    }

    // Right section consoles (R2)
    if (shape === "U SHAPE" || shape === "COMBO") {
      const rightSeats = parseSeatCount(sections.R2?.seater || "2-Seater") * (sections.R2?.qty || 1);
      if (rightSeats > 1) {
        for (let i = 1; i < rightSeats; i++) {
          const ordinal = i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th';
          placements.push({
            section: 'right',
            position: `after_${i}`,
            label: `Right Console ${consoleIndex}: After ${i}${ordinal} Seat from Left (Right Section)`,
            value: `right_${i}`
          });
          consoleIndex++;
        }
      }
    }

    // Combo section consoles (C2)
    if (shape === "COMBO") {
      const comboSeats = parseSeatCount(sections.C2?.seater || "2-Seater") * (sections.C2?.qty || 1);
      if (comboSeats > 1) {
        for (let i = 1; i < comboSeats; i++) {
          const ordinal = i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th';
          placements.push({
            section: 'combo',
            position: `after_${i}`,
            label: `Combo Console ${consoleIndex}: After ${i}${ordinal} Seat from Left (Combo Section)`,
            value: `combo_${i}`
          });
          consoleIndex++;
        }
      }
    }

    return placements;
  };

  const updateConfiguration = (updates: any) => {
    onConfigurationChange({ ...configuration, ...updates });
  };

  // Initialize configuration
  useEffect(() => {
    if (!configuration.productId) {
      onConfigurationChange({
        productId: product.id,
        category: "sofabed",
        baseShape: "STANDARD",
        sections: {
          F: { seater: "2-Seater", qty: 1 },
        },
        lounger: {
          required: "No",
          numberOfLoungers: "1 No.",
          size: "Lounger-5 ft 6 in",
          placement: "LHS",
          storage: "No",
        },
        recliner: {
          F: { required: "No", numberOfRecliners: 0 },
          L: { required: "No", numberOfRecliners: 0 },
          R: { required: "No", numberOfRecliners: 0 },
          C: { required: "No", numberOfRecliners: 0 },
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
      const maxConsoles = getMaxConsoles();
      const currentQuantity = configuration.console?.quantity || 0;
      
      if (currentQuantity !== maxConsoles) {
        const allPlacements = generateAllConsolePlacements();
        const placements = Array(maxConsoles).fill(null).map((_, i) => {
          const existingPlacement = configuration.console?.placements?.[i];
          if (existingPlacement && existingPlacement.section && existingPlacement.position) {
            return existingPlacement;
          }
          
          const defaultPlacement = allPlacements[i] || allPlacements[0] || {
            section: "front",
            position: "after_1",
            label: "After 1st Seat from Left (Front)",
            value: "front_1"
          };
          
          return {
            section: defaultPlacement.section,
            position: defaultPlacement.position,
            afterSeat: parseInt(defaultPlacement.position.split('_')[1] || "1", 10),
            accessoryId: null
          };
        });
        
        updateConfiguration({
          console: {
            ...configuration.console,
            quantity: maxConsoles,
            placements: placements
          },
        });
      }
    }
  }, [getTotalSeats(), configuration.console?.required]);

  const shape = configuration.baseShape || "STANDARD";
  const sections = configuration.sections || {};
  const maxConsoles = getMaxConsoles();
  const isLShape = shape === "L SHAPE";
  const isUShape = shape === "U SHAPE";
  const isCombo = shape === "COMBO";

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
      const totalSeats = getTotalSeats();
      const baseWidth = 48;
      const totalWidth = totalSeats * baseWidth;
      const depth = 95;
      const shapeLabel = shape.replace(' ', '-');
      
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
                      } else if (shapeLower.includes("u-shape") || shapeLower.includes("u shape")) {
                        return (
                          <div className="relative w-12 h-12">
                            <Square className="w-6 h-6 absolute top-0 left-0" />
                            <Square className="w-8 h-8 absolute top-0 right-0" />
                            <Square className="w-6 h-6 absolute bottom-0 right-0" />
                          </div>
                        );
                      } else if (shapeLower.includes("combo")) {
                        return <LayoutGrid className="w-12 h-12" />;
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
                          const newSections: any = { F: sections.F || { seater: "2-Seater", qty: 1 } };
                          
                          if (normalized === "L SHAPE" || normalized === "U SHAPE" || normalized === "COMBO") {
                            newSections.L1 = sections.L1 || { seater: "Corner", qty: 1 };
                            newSections.L2 = sections.L2 || { seater: "2-Seater", qty: 1 };
                          }
                          if (normalized === "U SHAPE" || normalized === "COMBO") {
                            newSections.R1 = sections.R1 || { seater: "Corner", qty: 1 };
                            newSections.R2 = sections.R2 || { seater: "2-Seater", qty: 1 };
                          }
                          if (normalized === "COMBO") {
                            newSections.C1 = sections.C1 || { seater: "Backrest", qty: 1 };
                            newSections.C2 = sections.C2 || { seater: "2-Seater", qty: 1 };
                          }
                          
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
                    <p className="text-2xl font-bold">{getTotalSeats()}</p>
                  </CardContent>
                </Card>
              </div>

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
                  const maxConsoles = getMaxConsoles();
                  const autoQuantity = isRequired ? maxConsoles : 0;
                  
                  const allPlacements = generateAllConsolePlacements();
                  const placements = isRequired 
                    ? Array(autoQuantity).fill(null).map((_, i) => {
                        const existingPlacement = configuration.console?.placements?.[i];
                        if (existingPlacement && existingPlacement.section && existingPlacement.position) {
                          return existingPlacement;
                        }
                        
                        const defaultPlacement = allPlacements[i] || allPlacements[0] || {
                          section: "front",
                          position: "after_1",
                          label: "After 1st Seat from Left (Front)",
                          value: "front_1"
                        };
                        
                        return {
                          section: defaultPlacement.section,
                          position: defaultPlacement.position,
                          afterSeat: parseInt(defaultPlacement.position.split('_')[1] || "1", 10),
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
                        (Auto-calculated: Total Seats - 1 = {getTotalSeats()} - 1 = {maxConsoles})
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Console quantity is automatically set to (Total Seats - 1)
                    </p>
                  </div>
                </div>

                {/* Console Placements & Accessories */}
                {configuration.console?.quantity > 0 && (() => {
                  const allPlacements = generateAllConsolePlacements();
                  
                  return Array.from({ length: configuration.console.quantity }, (_, index) => {
                    const currentPlacement = configuration.console?.placements?.[index] || { 
                      section: "front", 
                      position: "after_1",
                      afterSeat: 1, 
                      accessoryId: null 
                    };
                    
                    const availablePlacements = allPlacements.length > 0 
                      ? allPlacements 
                      : [{ section: "front", position: "after_1", label: "After 1st Seat from Left (Front)", value: "front_1" }];
                    
                    const currentPlacementValue = currentPlacement.position 
                      ? `${currentPlacement.section || "front"}_${currentPlacement.afterSeat || 1}`
                      : availablePlacements[Math.min(index, availablePlacements.length - 1)]?.value || "front_1";
                    
                    const selectedPlacement = availablePlacements.find(p => p.value === currentPlacementValue) || availablePlacements[0];
                    
                    return (
                      <div key={index} className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                        <Label className="text-sm font-semibold">Console {index + 1} Configuration</Label>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Placement</Label>
                          <Select
                            value={selectedPlacement?.value || currentPlacementValue || "none"}
                            onValueChange={(value) => {
                              const placements = [...(configuration.console?.placements || [])];
                              if (value === "none") {
                                // Set placement to null/empty when "None" is selected
                                placements[index] = {
                                  section: null,
                                  position: null,
                                  afterSeat: null,
                                  accessoryId: placements[index]?.accessoryId || null
                                };
                              } else {
                                const placement = availablePlacements.find(p => p.value === value);
                                if (placement) {
                                  const afterSeat = parseInt(placement.position.split('_')[1] || "1", 10);
                                  placements[index] = {
                                    section: placement.section,
                                    position: placement.position,
                                    afterSeat: afterSeat,
                                    accessoryId: placements[index]?.accessoryId || null
                                  };
                                }
                              }
                              updateConfiguration({
                                console: { ...configuration.console, placements },
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
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Accessory</Label>
                          <Select
                            value={currentPlacement.accessoryId || "none"}
                            onValueChange={(value) => {
                              const placements = [...(configuration.console?.placements || [])];
                              placements[index] = {
                                ...placements[index],
                                accessoryId: value === "none" ? null : value
                              };
                              updateConfiguration({
                                console: { ...configuration.console, placements },
                              });
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
                                  <SelectItem key={acc.id} value={acc.id.toString()}>
                                    {acc.description} - ₹{acc.sale_price?.toLocaleString() || 0}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-data" disabled>No accessories available</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          <Separator />

          {/* Lounger Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Lounger</Label>
              <Select
                value={configuration.lounger?.required === "Yes" ? "Yes" : "No"}
                onValueChange={(value) =>
                  updateConfiguration({
                    lounger: {
                      ...configuration.lounger,
                      required: value === "Yes" ? "Yes" : "No",
                      numberOfLoungers: value === "Yes" ? (configuration.lounger?.numberOfLoungers || "1 No.") : "1 No.",
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
            {configuration.lounger?.required === "Yes" && (
              <div className="space-y-4 pt-2 pl-4 border-l-2 border-muted">
                <div className="space-y-2">
                  <Label>Number of Loungers</Label>
                  <Select
                    value={configuration.lounger?.numberOfLoungers || "1 No."}
                    onValueChange={(value) => {
                      updateConfiguration({
                        lounger: {
                          ...configuration.lounger,
                          numberOfLoungers: value,
                          placement: value === "2 Nos." ? "Both" : configuration.lounger?.placement || "LHS",
                        },
                      });
                    }}
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
                    value={configuration.lounger?.size || ""}
                    onValueChange={(value) =>
                      updateConfiguration({
                        lounger: { ...configuration.lounger, size: value },
                      })
                    }
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
                    value={configuration.lounger?.placement || "LHS"}
                    onValueChange={(value) =>
                      updateConfiguration({
                        lounger: { ...configuration.lounger, placement: value },
                      })
                    }
                    disabled={configuration.lounger?.numberOfLoungers === "2 Nos."}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {configuration.lounger?.numberOfLoungers === "2 Nos." ? (
                        <SelectItem value="Both">Both LHS & RHS</SelectItem>
                      ) : (
                        <>
                          <SelectItem value="LHS">Left Hand Side (LHS)</SelectItem>
                          <SelectItem value="RHS">Right Hand Side (RHS)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Storage</Label>
                  <Select
                    value={configuration.lounger?.storage || "No"}
                    onValueChange={(value) =>
                      updateConfiguration({
                        lounger: { ...configuration.lounger, storage: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                  {configuration.lounger?.storage === "No" && (
                    <p className="text-xs text-muted-foreground">
                      Storage-related options are disabled when Storage is set to "No"
                    </p>
                  )}
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
          {["F", "L", "R", "C"].map((section) => {
            const sectionKey = section as "F" | "L" | "R" | "C";
            const reclinerData = configuration.recliner?.[sectionKey] || { required: "No", numberOfRecliners: 0 };
            
            // Only show L section for L/U/Combo shapes
            if (section === "L" && !isLShape && !isUShape && !isCombo) return null;
            // Only show R section for U/Combo shapes
            if (section === "R" && !isUShape && !isCombo) return null;
            // Only show C section for Combo shape
            if (section === "C" && !isCombo) return null;
            
            return (
              <Card key={section} className="bg-muted/30">
                <CardContent className="p-4 space-y-3">
                  <Label className="font-semibold">
                    {section === "F" ? "Front" : section === "L" ? "Left" : section === "R" ? "Right" : "Center"} Section
                  </Label>
                  <RadioGroup
                    value={reclinerData.required || "No"}
                    onValueChange={(value) => {
                      updateConfiguration({
                        recliner: {
                          ...configuration.recliner,
                          [sectionKey]: {
                            ...reclinerData,
                            required: value,
                            numberOfRecliners: value === "Yes" ? reclinerData.numberOfRecliners || 1 : 0,
                          },
                        },
                      });
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Yes" id={`recliner-${section}-yes`} />
                      <Label htmlFor={`recliner-${section}-yes`} className="font-normal cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="No" id={`recliner-${section}-no`} />
                      <Label htmlFor={`recliner-${section}-no`} className="font-normal cursor-pointer">No</Label>
                    </div>
                  </RadioGroup>
                  
                  {reclinerData.required === "Yes" && (
                    <div className="space-y-2">
                      <Label className="text-sm">Number of Recliners</Label>
                      <Input
                        type="number"
                        min="1"
                        value={reclinerData.numberOfRecliners || 1}
                        onChange={(e) => {
                          updateConfiguration({
                            recliner: {
                              ...configuration.recliner,
                              [sectionKey]: {
                                ...reclinerData,
                                numberOfRecliners: Number(e.target.value),
                              },
                            },
                          });
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
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
                <p>Shape: {shape}</p>
                <p>Total Seats: {getTotalSeats()}</p>
                {configuration.legs?.type && (
                  <p>Legs: {configuration.legs.type}</p>
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
