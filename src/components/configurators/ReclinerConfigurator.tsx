import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, 
  Info, 
  Sofa, 
  Settings, 
  Ruler, 
  Palette, 
  Square,
  ChevronRight,
  HelpCircle,
  CheckCircle2
} from "lucide-react";
import FabricSelector from "./FabricSelector";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const { data: baseShapes, isLoading: loadingShapes } = useDropdownOptions("recliner", "base_shape");
  const { data: seatTypes, isLoading: loadingSeats } = useDropdownOptions("recliner", "seat_type");
  const { data: mechanismTypes, isLoading: loadingMechanisms } = useDropdownOptions("recliner", "mechanism_type");
  const { data: consoleSizes, isLoading: loadingConsoles } = useDropdownOptions("common", "console_size");
  const { data: foamTypes, isLoading: loadingFoam } = useDropdownOptions("common", "foam_type");
  const { data: seatDepths, isLoading: loadingDepths } = useDropdownOptions("recliner", "seat_depth");
  const { data: seatWidths, isLoading: loadingWidths } = useDropdownOptions("recliner", "seat_width");
  const { data: seatHeights, isLoading: loadingHeights } = useDropdownOptions("recliner", "seat_height");

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
  
  const frontMechanism = configuration.mechanism?.sections?.front || configuration.mechanism?.front || "Manual";
  const leftMechanism = configuration.mechanism?.sections?.left || configuration.mechanism?.left || "Manual";
  const frontMechanismPrice = getMechanismPrice(frontMechanism);
  const leftMechanismPrice = isLShape ? getMechanismPrice(leftMechanism) : 0;
  const totalMechanismPrice = frontMechanismPrice + leftMechanismPrice;

  // Show loading only for critical initial data
  if (loadingShapes || loadingSeats) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading configuration options...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Seats</p>
                <p className="text-2xl font-bold">{totalSeats}</p>
              </div>
              <Square className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Width</p>
                <p className="text-2xl font-bold">{calculateTotalWidth()}"</p>
                <p className="text-xs text-muted-foreground">{Math.round(calculateTotalWidth() * 2.54)} cm</p>
              </div>
              <Ruler className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mechanism Cost</p>
                <p className="text-2xl font-bold">₹{totalMechanismPrice.toLocaleString()}</p>
              </div>
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="base" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="base" className="flex items-center gap-2">
            <Sofa className="h-4 w-4" />
            Base
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="fabric" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Fabric
          </TabsTrigger>
          <TabsTrigger value="specs" className="flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            Specs
          </TabsTrigger>
          <TabsTrigger value="dummy" className="flex items-center gap-2">
            <Square className="h-4 w-4" />
            Dummy Seats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="base" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sofa className="h-5 w-5" />
                Shape & Sections
              </CardTitle>
              <CardDescription>Configure the base shape and seat sections for your recliner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Base Shape */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  Base Shape
                  <Badge variant="outline" className="ml-auto">
                    {configuration.baseShape || "STANDARD"}
                  </Badge>
                </Label>
                <RadioGroup
                  value={configuration.baseShape || "STANDARD"}
                  onValueChange={(value) => {
                    const updates: any = { baseShape: value };
                    if (value === "STANDARD") {
                      updates.sections = {
                        F: configuration.sections?.F || { type: "1-Seater", qty: 1 },
                        L1: null,
                        L2: null,
                      };
                    } else if (value === "L SHAPE") {
                      updates.sections = {
                        F: configuration.sections?.F || { type: "1-Seater", qty: 1 },
                        L1: { type: "Corner", qty: 1 },
                        L2: { type: "1-Seater", qty: 1 },
                      };
                    }
                    updateConfiguration(updates);
                  }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="STANDARD" id="standard" />
                    <Label htmlFor="standard" className="font-normal cursor-pointer flex-1">Standard</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="L SHAPE" id="lshape" />
                    <Label htmlFor="lshape" className="font-normal cursor-pointer flex-1">L Shape</Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              <Accordion type="multiple" defaultValue={["front", "left"]} className="w-full">
                {/* Front Section */}
                <AccordionItem value="front">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">F</Badge>
                      <span className="font-semibold">Front Section</span>
                      {configuration.sections?.F && (
                        <Badge variant="outline" className="ml-auto">
                          {configuration.sections.F.type}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-4 pt-4">
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
                  </AccordionContent>
                </AccordionItem>

                {/* L1 Section - Only for L SHAPE */}
                {isLShape && (
                  <AccordionItem value="left-corner">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">L1</Badge>
                        <span className="font-semibold">Left Corner Section</span>
                        {configuration.sections?.L1 && (
                          <Badge variant="outline" className="ml-auto">
                            {configuration.sections.L1.type}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid md:grid-cols-2 gap-4 pt-4">
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
                          <p className="text-xs text-muted-foreground">
                            Corner: 50% of base price | Backrest: 20% of base price
                          </p>
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
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* L2 Section - Only for L SHAPE */}
                {isLShape && (
                  <AccordionItem value="left-seats">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">L2</Badge>
                        <span className="font-semibold">Left Seats Section</span>
                        {configuration.sections?.L2 && (
                          <Badge variant="outline" className="ml-auto">
                            {configuration.sections.L2.type}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid md:grid-cols-2 gap-4 pt-4">
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
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Mechanism & Console
              </CardTitle>
              <CardDescription>Configure recliner mechanisms and console options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Accordion type="multiple" defaultValue={["mechanisms"]} className="w-full">
                {/* Mechanisms */}
                <AccordionItem value="mechanisms">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-semibold">Recliner Mechanisms</span>
                      <Badge variant="secondary" className="ml-auto">
                        ₹{totalMechanismPrice.toLocaleString()}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
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
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Console */}
                <AccordionItem value="console">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-semibold">Console</span>
                      <Badge variant={configuration.console?.required === "Yes" ? "default" : "outline"} className="ml-auto">
                        {configuration.console?.required === "Yes" ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Console Required</Label>
                        <RadioGroup
                          value={configuration.console?.required || "No"}
                          onValueChange={(value) => {
                            updateConfiguration({
                              console: {
                                ...configuration.console,
                                required: value,
                                quantity: value === "Yes" ? (configuration.console?.quantity || 1) : 0,
                                placements: value === "Yes" ? (configuration.console?.placements || []) : [],
                              }
                            });
                          }}
                          className="flex gap-4"
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
                          <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                              Console quantity is manually set (not auto-calculated). Maximum: {getTotalSeats()} based on total seats.
                            </AlertDescription>
                          </Alert>

                          <div className="grid md:grid-cols-2 gap-4">
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
                                  <SelectItem value="Console-6 in">
                                    <div className="flex items-center justify-between w-full">
                                      <span>6 inches</span>
                                      <Badge variant="outline" className="ml-2">₹8,000</Badge>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="Console-10 In">
                                    <div className="flex items-center justify-between w-full">
                                      <span>10 inches</span>
                                      <Badge variant="outline" className="ml-2">₹12,000</Badge>
                                    </div>
                                  </SelectItem>
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
                                  
                                  if (placements.length < quantity) {
                                    while (placements.length < quantity) {
                                      placements.push({
                                        section: "F",
                                        position: "none",
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
                                Maximum: {getTotalSeats()} console(s)
                              </p>
                            </div>
                          </div>

                          {/* Console Placements & Accessories */}
                          {configuration.console?.quantity > 0 && (
                            <div className="space-y-4 mt-4">
                              <Label className="text-sm font-semibold">Console Placements & Accessories</Label>
                              {Array.from({ length: configuration.console.quantity }, (_, i) => {
                                const slotIndex = i;
                                const placement = configuration.console.placements?.[slotIndex] || {
                                  section: "F",
                                  position: "none",
                                  accessoryId: null
                                };

                                return (
                                  <Card key={i} className="p-4">
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary">Console {i + 1}</Badge>
                                      </div>
                                      
                                      <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label className="text-sm">Section</Label>
                                          <Select
                                            value={placement.section || "F"}
                                            onValueChange={(value) => {
                                              const placements = [...(configuration.console.placements || [])];
                                              placements[slotIndex] = {
                                                ...placement,
                                                section: value
                                              };
                                              updateConfiguration({
                                                console: {
                                                  ...configuration.console,
                                                  placements
                                                }
                                              });
                                            }}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="F">Front (F)</SelectItem>
                                              {isLShape && <SelectItem value="L">Left (L)</SelectItem>}
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-sm">Accessory</Label>
                                          <Select
                                            value={placement.accessoryId || "none"}
                                            onValueChange={(value) => {
                                              const placements = [...(configuration.console.placements || [])];
                                              placements[slotIndex] = {
                                                ...placement,
                                                accessoryId: value === "none" ? null : value
                                              };
                                              updateConfiguration({
                                                console: {
                                                  ...configuration.console,
                                                  placements
                                                }
                                              });
                                            }}
                                            disabled={loadingAccessories}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="none">None</SelectItem>
                                              {consoleAccessories?.map((accessory: any) => (
                                                <SelectItem key={accessory.id} value={accessory.id}>
                                                  <div className="flex items-center justify-between w-full">
                                                    <span>{accessory.description}</span>
                                                    <Badge variant="outline" className="ml-2">
                                                      ₹{Number(accessory.sale_price || 0).toLocaleString()}
                                                    </Badge>
                                                  </div>
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    </div>
                                  </Card>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Specifications
              </CardTitle>
              <CardDescription>Configure foam, dimensions, and other specifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Accordion type="multiple" defaultValue={["foam", "dimensions"]} className="w-full">
                {/* Foam */}
                <AccordionItem value="foam">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-semibold">Foam Type</span>
                      {configuration.foam?.type && (
                        <Badge variant="outline" className="ml-auto">
                          {configuration.foam.type}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4">
                      <Select
                        value={configuration.foam?.type || "Firm"}
                        onValueChange={(value) => updateConfiguration({
                          foam: { type: value }
                        })}
                        disabled={loadingFoam}
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
                  </AccordionContent>
                </AccordionItem>

                {/* Dimensions */}
                <AccordionItem value="dimensions">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-semibold">Dimensions</span>
                      <Badge variant="outline" className="ml-auto">
                        {configuration.dimensions?.seatDepth || 24}" × {configuration.dimensions?.seatWidth || 22}" × {configuration.dimensions?.seatHeight || 18}"
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-3 gap-4 pt-4">
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
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dummy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Square className="h-5 w-5" />
                Dummy Seats
              </CardTitle>
              <CardDescription>
                Configure non-reclining dummy seats (priced at 55% of base price per seat)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Dummy seats are non-reclining seats that cost 55% of the regular seat price. They can be placed between reclining seats.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Dummy Seats Required</Label>
                <RadioGroup
                  value={configuration.dummySeats?.required === true || configuration.dummySeats?.required === "Yes" ? "Yes" : "No"}
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
                  className="flex gap-4"
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

              {(configuration.dummySeats?.required === true || configuration.dummySeats?.required === "Yes") && (
                <>
                  <Separator />
                  
                  <Accordion type="multiple" defaultValue={["front-dummy"]} className="w-full">
                    {/* Front Section Dummy Seats */}
                    <AccordionItem value="front-dummy">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2 w-full">
                          <Badge variant="secondary">F</Badge>
                          <span className="font-semibold">Front Section Dummy Seats</span>
                          <Badge variant="outline" className="ml-auto">
                            {(configuration.dummySeats?.quantity_per_section?.front || configuration.dummySeats?.F || 0)} seat(s)
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label>Number of Dummy Seats</Label>
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
                              <Card key={i} className="p-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">Dummy Seat {slot}</Badge>
                                  </div>
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
                              </Card>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Left Section Dummy Seats - Only for L SHAPE */}
                    {isLShape && (
                      <AccordionItem value="left-dummy">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2 w-full">
                            <Badge variant="secondary">L</Badge>
                            <span className="font-semibold">Left Section Dummy Seats</span>
                            <Badge variant="outline" className="ml-auto">
                              {(configuration.dummySeats?.quantity_per_section?.left || configuration.dummySeats?.L || 0)} seat(s)
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>Number of Dummy Seats</Label>
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
                                <Card key={i} className="p-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary">Dummy Seat {slot}</Badge>
                                    </div>
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
                                </Card>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
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
