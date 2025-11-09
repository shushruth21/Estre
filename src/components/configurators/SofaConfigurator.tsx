import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import FabricSelector from "./FabricSelector";
import { FabricLibrary } from "@/components/ui/FabricLibrary";
import { SelectionCard } from "@/components/ui/SelectionCard";
import { ChevronDown, Download, Info, Loader2, Square, LayoutGrid } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateAllConsolePlacements as generateConsolePlacementsUtil, calculateMaxConsoles, getSeatCountFromSeaterType } from "@/lib/console-validation";

interface SofaConfiguratorProps {
  product: any;
  configuration: any;
  onConfigurationChange: (config: any) => void;
}

const SofaConfigurator = ({
  product,
  configuration,
  onConfigurationChange,
}: SofaConfiguratorProps) => {
  // Load all dropdown options from database with error handling
  const shapesResult = useDropdownOptions("sofa", "base_shape");
  const frontSeatCountsResult = useDropdownOptions("sofa", "front_seat_count");
  const foamTypesResult = useDropdownOptions("sofa", "foam_type");
  const seatDepthsResult = useDropdownOptions("sofa", "seat_depth");
  const seatWidthsResult = useDropdownOptions("sofa", "seat_width");
  const seatHeightsResult = useDropdownOptions("sofa", "seat_height");
  const legTypesResult = useDropdownOptions("sofa", "leg_type");
  const woodTypesResult = useDropdownOptions("sofa", "wood_type");
  const stitchTypesResult = useDropdownOptions("sofa", "stitch_type");
  const loungerSizesResult = useDropdownOptions("sofa", "lounger_size");
  const loungerPlacementsResult = useDropdownOptions("sofa", "lounger_placement");
  const consoleSizesResult = useDropdownOptions("sofa", "console_size");
  const consolePlacementsResult = useDropdownOptions("sofa", "console_placement");
  const pillowTypesResult = useDropdownOptions("sofa", "pillow_type");
  const pillowSizesResult = useDropdownOptions("sofa", "pillow_size");
  const pillowFabricPlanResult = useDropdownOptions("sofa", "pillow_fabric_plan");
  const armrestTypesResult = useDropdownOptions("sofa", "armrest_type");
  
  // Shape-specific dropdown options
  const l1OptionsResult = useDropdownOptions("sofa", "l1_option");
  const r1OptionsResult = useDropdownOptions("sofa", "r1_option");
  const l2SeatCountsResult = useDropdownOptions("sofa", "l2_seat_count");
  const r2SeatCountsResult = useDropdownOptions("sofa", "r2_seat_count");
  
  // Headrest options - separate fields
  const modelHasHeadrestResult = useDropdownOptions("sofa", "model_has_headrest");
  const headrestRequiredResult = useDropdownOptions("sofa", "headrest_required");

  // Read comes_with_headrest from product (sofa_database)
  const productComesWithHeadrest = product?.comes_with_headrest || "No";
  const canSelectHeadrest = productComesWithHeadrest === "Yes" || productComesWithHeadrest === "yes";

  // Safely extract data with defaults
  const shapes = Array.isArray(shapesResult.data) ? shapesResult.data : [];
  const frontSeatCounts = Array.isArray(frontSeatCountsResult.data) ? frontSeatCountsResult.data : [];
  const foamTypes = Array.isArray(foamTypesResult.data) ? foamTypesResult.data : [];
  const seatDepths = Array.isArray(seatDepthsResult.data) ? seatDepthsResult.data : [];
  const seatWidths = Array.isArray(seatWidthsResult.data) ? seatWidthsResult.data : [];
  const seatHeights = Array.isArray(seatHeightsResult.data) ? seatHeightsResult.data : [];
  const legTypes = Array.isArray(legTypesResult.data) ? legTypesResult.data : [];
  const woodTypes = Array.isArray(woodTypesResult.data) ? woodTypesResult.data : [];
  const stitchTypes = Array.isArray(stitchTypesResult.data) ? stitchTypesResult.data : [];
  const loungerSizes = Array.isArray(loungerSizesResult.data) ? loungerSizesResult.data : [];
  const loungerPlacements = Array.isArray(loungerPlacementsResult.data) ? loungerPlacementsResult.data : [];
  const consoleSizes = Array.isArray(consoleSizesResult.data) ? consoleSizesResult.data : [];
  const consolePlacements = Array.isArray(consolePlacementsResult.data) ? consolePlacementsResult.data : [];
  const pillowTypes = Array.isArray(pillowTypesResult.data) ? pillowTypesResult.data : [];
  const pillowSizes = Array.isArray(pillowSizesResult.data) ? pillowSizesResult.data : [];
  const pillowFabricPlans = Array.isArray(pillowFabricPlanResult.data) ? pillowFabricPlanResult.data : [];
  const armrestTypes = Array.isArray(armrestTypesResult.data) ? armrestTypesResult.data : [];
  
  const l1Options = Array.isArray(l1OptionsResult.data) ? l1OptionsResult.data : [];
  const r1Options = Array.isArray(r1OptionsResult.data) ? r1OptionsResult.data : [];
  const l2SeatCounts = Array.isArray(l2SeatCountsResult.data) ? l2SeatCountsResult.data : [];
  const r2SeatCounts = Array.isArray(r2SeatCountsResult.data) ? r2SeatCountsResult.data : [];
  const modelHasHeadrestOptions = Array.isArray(modelHasHeadrestResult.data) ? modelHasHeadrestResult.data : [];
  const headrestRequiredOptions = Array.isArray(headrestRequiredResult.data) ? headrestRequiredResult.data : [];

  // Helper: Convert shape to standardized format (must be defined before use)
  const normalizeShape = (shape: string): 'standard' | 'l-shape' | 'u-shape' | 'combo' => {
    if (!shape) return 'standard';
    const lower = shape.toLowerCase();
    if (lower.includes('l-shape') || lower.includes('l shape')) return 'l-shape';
    if (lower.includes('u-shape') || lower.includes('u shape')) return 'u-shape';
    if (lower.includes('combo')) return 'combo';
    return 'standard';
  };

  // Helper: Convert seat count string to number (e.g., "2-Seater" -> 2)
  const parseSeatCount = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (!value) return 2; // Default
    const match = value.toString().match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 2;
  };

  // Get current shape and determine conditional fields
  const currentShapeValue = configuration.shape || (shapes && shapes.length > 0 ? shapes[0].option_value : "Standard");
  const normalizedShape = normalizeShape(currentShapeValue);
  const currentShape = normalizedShape;
  
  const isStandard = normalizedShape === 'standard';
  const isLShape = normalizedShape === 'l-shape';
  const isUShape = normalizedShape === 'u-shape';
  const isCombo = normalizedShape === 'combo';

  const isLoadingDropdowns = shapesResult.isLoading || frontSeatCountsResult.isLoading || foamTypesResult.isLoading || 
                              seatDepthsResult.isLoading || seatWidthsResult.isLoading || seatHeightsResult.isLoading || legTypesResult.isLoading || 
                              woodTypesResult.isLoading || stitchTypesResult.isLoading || loungerSizesResult.isLoading || 
                              consoleSizesResult.isLoading;

  // Load legs prices for pricing display
  const { data: legsPrices } = useQuery({
    queryKey: ["legs-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legs_prices")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  // Load accessories for console dropdowns from accessories_prices table
  // Filter to get unique accessories (no duplicates)
  const { data: consoleAccessories, isLoading: loadingAccessories } = useQuery({
    queryKey: ["console-accessories-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accessories_prices")
        .select("id, description, sale_price")
        .eq("is_active", true)
        .order("description");
      if (error) throw error;
      
      // Remove duplicates based on description (in case there are any)
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

  // State for fabric library modals
  const [openPillowFabricLibrary, setOpenPillowFabricLibrary] = useState<"colour1" | "colour2" | "single" | null>(null);

  // Fetch selected pillow fabric details for display
  const { data: selectedPillowFabrics } = useQuery({
    queryKey: ["selected-pillow-fabrics", configuration.additionalPillows],
    queryFn: async () => {
      const codes = [
        configuration.additionalPillows?.fabricColour1,
        configuration.additionalPillows?.fabricColour2,
        configuration.additionalPillows?.fabricColour, // Single colour
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

  // Reset headrestRequired if model doesn't support headrest
  useEffect(() => {
    if (!canSelectHeadrest && configuration.headrestRequired === "Yes") {
      const newConfig = { ...configuration, headrestRequired: "No" };
      onConfigurationChange(newConfig);
    }
  }, [canSelectHeadrest, configuration.headrestRequired, configuration, onConfigurationChange]);

  // Calculate total seats dynamically (must be defined before useEffect)
  const getTotalSeats = (): number => {
    let total = 0;
    const shape = normalizeShape(configuration.shape || 'standard');
    
    // Front seats - selectable for ALL shapes (1-4)
    const frontSeats = parseSeatCount(configuration.frontSeatCount || configuration.frontSeats || 2);
    total += frontSeats;
    
    // Add left section seats (L2) - for L-Shape, U-Shape, and Combo
    if (shape === 'l-shape' || shape === 'u-shape' || shape === 'combo') {
      const l2 = parseSeatCount(configuration.l2SeatCount || configuration.l2 || 0);
      total += l2;
    }
    
    // Add right section seats (R2) - only for U-Shape and Combo
    if (shape === 'u-shape' || shape === 'combo') {
      const r2 = parseSeatCount(configuration.r2SeatCount || configuration.r2 || 0);
      total += r2;
    }
    
    return total;
  };

  // Get section-specific seater types for console placement validation
  const getSectionSeaterTypes = () => {
    const shape = normalizeShape(configuration.shape || 'standard');
    const frontSeaterType = configuration.frontSeatCount || "2-Seater";
    const leftSeaterType = (shape === 'l-shape' || shape === 'u-shape' || shape === 'combo') 
      ? (configuration.l2SeatCount || "2-Seater")
      : undefined;
    const rightSeaterType = (shape === 'u-shape' || shape === 'combo')
      ? (configuration.r2SeatCount || "2-Seater")
      : undefined;
    
    return {
      front: frontSeaterType,
      left: leftSeaterType,
      right: rightSeaterType,
    };
  };

  // Helper for ordinal suffix (kept for backward compatibility)
  const getOrdinalSuffix = (num: number) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  // Generate all possible console placements based on sections using explicit validation formulas
  // Returns array of placement objects with section, position, and label matching spreadsheet formulas
  const generateAllConsolePlacements = () => {
    const consoleRequired = configuration.console?.required === "Yes" || configuration.console?.required === true;
    const shape = configuration.shape || "STANDARD";
    const sectionSeaterTypes = getSectionSeaterTypes();

    // Use the console validation utility to generate placements
    const placements = generateConsolePlacementsUtil(
      consoleRequired,
      {
        front: sectionSeaterTypes.front,
        left: sectionSeaterTypes.left,
        right: sectionSeaterTypes.right,
      },
      shape
    );

    return placements;
  };

  // Auto-update console quantity when total seats change (if console is required)
  const totalSeats = getTotalSeats();
  useEffect(() => {
    if (configuration.console?.required) {
      const maxConsoles = calculateMaxConsoles(totalSeats);
      const currentPlacements = configuration.console?.placements || [];
      
      // Always maintain maxConsoles slots in the array
      // This ensures slots maintain their positions even when set to "none"
      let placements = [...currentPlacements];
      
      // Ensure we have exactly maxConsoles slots
      if (placements.length < maxConsoles) {
        // Fill missing slots with "none" placeholder
        while (placements.length < maxConsoles) {
          placements.push({
            section: null,
            position: "none",
            afterSeat: null,
            accessoryId: null
          });
        }
      } else if (placements.length > maxConsoles) {
        // Trim excess slots
        placements = placements.slice(0, maxConsoles);
      }
      
      // Only update if placements array changed or quantity is different
      const placementsChanged = JSON.stringify(placements) !== JSON.stringify(currentPlacements);
      
      if (placementsChanged || configuration.console?.quantity !== maxConsoles) {
        updateConfiguration({
          console: {
            ...configuration.console,
            quantity: maxConsoles,
            placements: placements
          }
        });
      }
    }
  }, [totalSeats, configuration.console?.required]);

  // Initialize configuration
  useEffect(() => {
    if (product?.id && !configuration.productId) {
      const defaultShapeValue = (shapes && shapes.length > 0) ? shapes[0].option_value : "Standard";
      const defaultShape = normalizeShape(defaultShapeValue);
      const defaultFrontSeats = 2; // Default to 2-seater
      
      // Filter front seat counts to only 1-4
      const validFrontSeatCounts = frontSeatCounts.filter((count: any) => {
        if (!count || !count.option_value) return false;
        const seatNum = parseInt(count.option_value.replace("-Seater", "") || "0");
        return seatNum >= 1 && seatNum <= 4;
      });
      
      const defaultFrontSeatValue = validFrontSeatCounts.length > 0 
        ? validFrontSeatCounts[0].option_value 
        : "2-Seater";
      // Parse seat count - extract number from string like "2-Seater"
      const defaultFrontSeatsNum = (() => {
        const match = defaultFrontSeatValue.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 2;
      })();
      
      const defaultConfig = {
      productId: product.id,
        shape: defaultShape, // Normalized: 'standard' | 'l-shape' | 'u-shape' | 'combo'
        frontSeats: defaultFrontSeatsNum, // Number 1-4
        frontSeatCount: defaultFrontSeatValue, // Keep for display compatibility
        // Shape-specific defaults
        l1: "corner", // 'corner' | 'backrest'
        r1: "corner", // 'corner' | 'backrest'
        l2: 2, // Number 1-6
        r2: 2, // Number 1-6
        // Keep string versions for dropdown compatibility
        l1Option: "Corner",
        r1Option: "Corner",
        l2SeatCount: "2",
        r2SeatCount: "2",
        console: { 
          required: false,
          quantity: 0,
          size: "",
          placements: [] // Array of { position: "front"|"left"|"right", afterSeat: number }
        },
        lounger: { 
          required: false,
          quantity: 1,
          size: "",
          placement: "LHS", // LHS, RHS, Both
          storage: "No"
        },
        additionalPillows: { 
          required: false,
          quantity: 1,
          type: "",
          size: "",
          fabricPlan: "Single Colour"
        },
      fabric: {
        claddingPlan: "Single Colour",
        structureCode: "",
      },
      foam: {
          type: (foamTypes && foamTypes.length > 0) 
            ? (foamTypes.find((f: any) => f.metadata?.default)?.option_value || foamTypes[0].option_value)
            : "Firm",
      },
      dimensions: {
          seatDepth: (seatDepths && seatDepths.length > 0)
            ? (seatDepths.find((d: any) => d.metadata?.default || d.option_value?.includes("22"))?.option_value?.replace(/["\s]/g, '')?.replace('in', '') || seatDepths[0].option_value?.replace(/["\s]/g, '')?.replace('in', ''))
            : "22",
          seatWidth: (seatWidths && seatWidths.length > 0)
            ? (seatWidths.find((w: any) => w.metadata?.default || w.option_value?.includes("22"))?.option_value?.replace(/["\s]/g, '')?.replace('in', '') || seatWidths[0].option_value?.replace(/["\s]/g, '')?.replace('in', ''))
            : "22",
          seatHeight: (seatHeights && seatHeights.length > 0)
            ? (seatHeights.find((h: any) => h.metadata?.default || h.option_value?.includes("18"))?.option_value?.replace(/["\s]/g, '')?.replace('in', '') || seatHeights[0].option_value?.replace(/["\s]/g, '')?.replace('in', ''))
            : "18",
        },
        legs: {
          type: (legTypes && legTypes.length > 0) ? legTypes[0].option_value : "",
        },
        wood: {
          type: (woodTypes && woodTypes.length > 0) ? woodTypes[0].option_value : "",
        },
        stitch: {
          type: (stitchTypes && stitchTypes.length > 0) ? stitchTypes[0].option_value : "",
      },
        comesWithHeadrest: productComesWithHeadrest || "No", // Keep for backward compatibility
        modelHasHeadrest: productComesWithHeadrest || "No", // Read from product (sofa_database)
        headrestRequired: "No", // Whether headrest is required (only if model has headrest)
        customerInfo: {
          fullName: "",
          email: "",
          phoneNumber: "",
          specialRequests: "",
        },
      };
      onConfigurationChange(defaultConfig);
    }
  }, [product?.id, product?.comes_with_headrest, shapes, frontSeatCounts, foamTypes, seatDepths, seatWidths, seatHeights, woodTypes, stitchTypes]);

  const updateConfiguration = (updates: any) => {
    const newConfig = { ...configuration, ...updates };
    onConfigurationChange(newConfig);
  };

  // Get foam type pricing from metadata
  const getFoamPrice = (foamType: string) => {
    if (!foamType || !Array.isArray(foamTypes) || foamTypes.length === 0) return 0;
    const foam = foamTypes.find((f: any) => f && f.option_value === foamType);
    return foam?.metadata?.price_adjustment || 0;
  };

  // Get dimension percentage from metadata
  const getDimensionPercentage = (dimension: string, value: string) => {
    if (!value) return 0;
    const dim = dimension === "depth" ? seatDepths : seatWidths;
    if (!Array.isArray(dim) || dim.length === 0) return 0;
    // Normalize both the value and option_value for comparison
    const normalizedValue = value.replace(/["\s]/g, '').replace('in', '').trim();
    const option = dim.find((d: any) => {
      if (!d || !d.option_value) return false;
      const normalizedOption = d.option_value.replace(/["\s]/g, '').replace('in', '').trim();
      return normalizedOption === normalizedValue || d.option_value === value;
    });
    return option?.metadata?.percentage || 0;
  };

  // Normalize dimension value for display/storage
  const normalizeDimensionValue = (value: string) => {
    if (!value) return "";
    // Remove quotes, spaces, and 'in' suffix
    return value.replace(/["\s]/g, '').replace('in', '').trim();
  };

  // Calculate dimensions for preview
  const calculateDimensions = (): { width: number; depth: number; label: string } => {
    try {
      const totalSeats = getTotalSeats();
      const baseWidth = 48; // Base width per seat
      const totalWidth = totalSeats * baseWidth;
      const depth = 95; // Standard depth
      const shapeLabel = (configuration.shape || 'standard').toUpperCase().replace('-', ' ');
      
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

  // Show loading state if all dropdowns are loading (but allow rendering if data exists)
  // Don't block rendering if data is available - only show loading if we have NO data at all
  if (isLoadingDropdowns && (!shapes || shapes.length === 0) && (!frontSeatCounts || frontSeatCounts.length === 0)) {
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
      <Card className="luxury-card-glass border-2">
        <CardHeader>
          <CardTitle className="text-2xl font-serif">Configuration</CardTitle>
          <CardDescription>Customize your perfect sofa piece</CardDescription>
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
            <Label className="text-base font-semibold">Shape</Label>
            {shapesResult.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : shapes && shapes.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {shapes
                  .filter((shape: any) => shape && shape.option_value)
                  .map((shape: any) => {
                    const shapeValue = shape.option_value;
                    const normalizedShapeValue = normalizeShape(shapeValue);
                    const currentNormalizedShape = normalizeShape(configuration.shape || '');
                    const isSelected = currentNormalizedShape === normalizedShapeValue;
                    
                    // Icon based on shape type
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
                          updateConfiguration({ 
                            shape: normalized,
                            // Reset shape-specific fields when shape changes
                            ...(normalized === 'standard' && {
                              l1: undefined,
                              l2: undefined,
                              r1: undefined,
                              r2: undefined,
                            }),
                            ...(normalized === 'l-shape' && {
                              r1: undefined,
                              r2: undefined,
                            }),
                          });
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

          {/* Front Seat Count - Only show after shape is selected */}
          {configuration.shape && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Front Seat Count</Label>
            {frontSeatCountsResult.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : frontSeatCounts && frontSeatCounts.length > 0 ? (
              <div className="grid grid-cols-4 gap-4">
                {frontSeatCounts
                  .filter((count: any) => {
                    if (!count || !count.option_value) return false;
                    // Only allow 1-4 seaters for front seat count
                    const seatNumber = parseInt(count.option_value.replace("-Seater", "") || "0");
                    return seatNumber >= 1 && seatNumber <= 4;
                  })
                  .map((count: any) => {
                    const countValue = count.option_value;
                    const isSelected = configuration.frontSeatCount === countValue;
                    const seatNumber = parseInt(countValue.replace("-Seater", "") || "1");
                    
                    // Icon showing number of seats
                    const getSeatIcon = () => {
                      return (
                        <div className="flex gap-1">
                          {Array.from({ length: seatNumber }).map((_, i) => (
                            <Square key={i} className="w-6 h-6" />
                          ))}
                        </div>
                      );
                    };
                    
                    return (
                      <SelectionCard
                        key={count.id}
                        label={count.display_label || count.option_value}
                        icon={getSeatIcon()}
                        isSelected={isSelected}
                        onClick={() => {
                          const seatNum = parseSeatCount(countValue);
                          updateConfiguration({ 
                            frontSeats: seatNum,
                            frontSeatCount: countValue // Keep for display
                          });
                        }}
                      />
                    );
                  })}
              </div>
            ) : (
              <Alert>
                <AlertDescription>No seat count options available</AlertDescription>
              </Alert>
            )}
            </div>
          )}

          {/* Left Section - For L Shape, U Shape, Combo - Only show after shape is selected */}
          {(isLShape || isUShape || isCombo) && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-base font-semibold">Left Section</Label>
                <div className="grid grid-cols-2 gap-4">
                  {/* L1 Option */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">L1 (Section Type)</Label>
            <Select
                      value={configuration.l1Option || configuration.l1 || ""}
                      onValueChange={(value) => {
                        const normalized = value.toLowerCase();
                        updateConfiguration({ 
                          l1: normalized, // 'corner' | 'backrest'
                          l1Option: value // Keep for display
                        });
                      }}
            >
              <SelectTrigger>
                        <SelectValue placeholder="Select L1 option" />
              </SelectTrigger>
              <SelectContent>
                        {l1OptionsResult.isLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : l1Options && l1Options.length > 0 ? (
                          l1Options
                            .filter((opt: any) => opt && opt.option_value)
                            .map((opt: any) => (
                              <SelectItem key={opt.id} value={opt.option_value}>
                                {opt.display_label || opt.option_value}
                  </SelectItem>
                            ))
                        ) : (
                          <SelectItem value="no-data" disabled>No options available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

                  {/* L2 Seat Count */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">L2 (Seat Count)</Label>
                    <Select
                      value={configuration.l2SeatCount || configuration.l2?.toString() || ""}
                      onValueChange={(value) => {
                        const seatNum = parseSeatCount(value);
                        updateConfiguration({ 
                          l2: seatNum, // Number 1-6
                          l2SeatCount: value // Keep for display
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select seat count" />
                      </SelectTrigger>
                      <SelectContent>
                        {l2SeatCountsResult.isLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : l2SeatCounts && l2SeatCounts.length > 0 ? (
                          l2SeatCounts
                            .filter((count: any) => count && count.option_value)
                            .map((count: any) => (
                              <SelectItem key={count.id} value={count.option_value}>
                                {count.display_label || count.option_value}
                              </SelectItem>
                            ))
                        ) : (
                          <SelectItem value="no-data" disabled>No options available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
            </div>
                      </div>
              </div>
            </>
          )}

          {/* Right Section - For U Shape, Combo only */}
          {(isUShape || isCombo) && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-base font-semibold">Right Section</Label>
                <div className="grid grid-cols-2 gap-4">
                  {/* R1 Option */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">R1 (Section Type)</Label>
                        <Select
                      value={configuration.r1Option || configuration.r1 || ""}
                      onValueChange={(value) => {
                        const normalized = value.toLowerCase();
                        updateConfiguration({ 
                          r1: normalized, // 'corner' | 'backrest'
                          r1Option: value // Keep for display
                        });
                      }}
                        >
                          <SelectTrigger>
                        <SelectValue placeholder="Select R1 option" />
                          </SelectTrigger>
                          <SelectContent>
                        {r1OptionsResult.isLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : r1Options && r1Options.length > 0 ? (
                          r1Options
                            .filter((opt: any) => opt && opt.option_value)
                            .map((opt: any) => (
                              <SelectItem key={opt.id} value={opt.option_value}>
                                {opt.display_label || opt.option_value}
                              </SelectItem>
                            ))
                        ) : (
                          <SelectItem value="no-data" disabled>No options available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                  
                  {/* R2 Seat Count */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">R2 (Seat Count)</Label>
                    <Select
                      value={configuration.r2SeatCount || configuration.r2?.toString() || ""}
                      onValueChange={(value) => {
                        const seatNum = parseSeatCount(value);
                        updateConfiguration({ 
                          r2: seatNum, // Number 1-6
                          r2SeatCount: value // Keep for display
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select seat count" />
                      </SelectTrigger>
                      <SelectContent>
                        {r2SeatCountsResult.isLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : r2SeatCounts && r2SeatCounts.length > 0 ? (
                          r2SeatCounts
                            .filter((count: any) => count && count.option_value)
                            .map((count: any) => (
                              <SelectItem key={count.id} value={count.option_value}>
                                {count.display_label || count.option_value}
                              </SelectItem>
                            ))
                        ) : (
                          <SelectItem value="no-data" disabled>No options available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                      </div>
                    </div>
            </div>
            </>
          )}

          <Separator />

          {/* Console */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Console</Label>
              <Select
                value={configuration.console?.required ? "Yes" : "No"}
                onValueChange={(value) => {
                  const isRequired = value === "Yes";
                  const totalSeats = getTotalSeats();
                  const maxConsoles = calculateMaxConsoles(totalSeats);
                  const autoQuantity = isRequired ? maxConsoles : 0;
                  
                  // Initialize placements array - always maintain maxConsoles slots
                  // Use "none" placeholder to maintain slot positions
                  const placements = isRequired 
                    ? Array(autoQuantity).fill(null).map((_, i) => {
                        const existing = configuration.console?.placements?.[i];
                        // If existing placement is valid, keep it; otherwise set to "none"
                        if (existing && existing.position && existing.position !== "none" && existing.section) {
                          return existing;
                        }
                        // Return "none" placeholder to maintain slot position
                        return {
                          section: null,
                          position: "none",
                          afterSeat: null,
                          accessoryId: null
                        };
                      })
                    : [];
                  
                  updateConfiguration({
                    console: {
                      ...configuration.console,
                      required: isRequired,
                      quantity: autoQuantity,
                      placements: placements
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
            {configuration.console?.required && (
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
                        <SelectItem value="no-data" disabled>No options available</SelectItem>
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
                        (Auto-calculated: Total Seats - 1 = {getTotalSeats()} - 1 = {calculateMaxConsoles(getTotalSeats())})
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
                  const maxConsoles = calculateMaxConsoles(getTotalSeats());
                  
                  // Always maintain maxConsoles slots in the array
                  // This ensures slots maintain their positions even when set to "none"
                  let currentPlacements = configuration.console?.placements || [];
                  
                  // Ensure we have exactly maxConsoles slots
                  if (currentPlacements.length < maxConsoles) {
                    currentPlacements = [...currentPlacements];
                    // Fill missing slots with "none" placeholder
                    while (currentPlacements.length < maxConsoles) {
                      currentPlacements.push({
                        section: null,
                        position: "none",
                        afterSeat: null,
                        accessoryId: null
                      });
                    }
                  } else if (currentPlacements.length > maxConsoles) {
                    // Trim excess slots
                    currentPlacements = currentPlacements.slice(0, maxConsoles);
                  }
                  
                  // Display all slots (including "none" ones) to maintain correct slot numbers
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
                      ? `${currentPlacement.section}_${currentPlacement.afterSeat || 1}`
                      : "none";
                    
                    // Filter out placements that are already selected by OTHER console slots
                    // Only consider ACTIVE slots (not "none") when filtering
                    const otherActivePlacements = currentPlacements
                      .map((p: any, i: number) => {
                        if (i === index) return null; // Exclude current slot
                        if (p.position && p.position !== "none" && p.section) {
                          return `${p.section}_${p.afterSeat || 1}`;
                        }
                        return null;
                      })
                      .filter(Boolean);
                    
                    // Get available placement options - exclude already selected ones (except current)
                    const availablePlacements = allPlacements.length > 0 
                      ? allPlacements.filter((placement) => {
                          // Always include the current placement (so user can see what's selected)
                          if (placement.value === currentPlacementValue) return true;
                          // Exclude placements already selected by other ACTIVE console slots
                          return !otherActivePlacements.includes(placement.value);
                        })
                      : [{ section: "front", position: "after_1", label: "After 1st Seat from Left (Front)", value: "front_1" }];
                    
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
                              // Get fresh placements from configuration to ensure we have the latest state
                              const freshPlacements = [...(configuration.console?.placements || [])];
                              
                              // Ensure we have exactly maxConsoles slots
                              while (freshPlacements.length < maxConsoles) {
                                freshPlacements.push({
                                  section: null,
                                  position: "none",
                                  afterSeat: null,
                                  accessoryId: null
                                });
                              }
                              
                              if (value === "none") {
                                // Set to "none" but keep in array
                                freshPlacements[index] = {
                                  section: null,
                                  position: "none",
                                  afterSeat: null,
                                  accessoryId: null // Clear accessory when set to none
                                };
                              } else {
                                // Set to a valid placement
                                const placement = availablePlacements.find(p => p.value === value);
                                if (placement) {
                                  const afterSeat = parseInt(placement.position.split('_')[1] || "1", 10);
                                  freshPlacements[index] = {
                                    section: placement.section,
                                    position: placement.position,
                                    afterSeat: afterSeat,
                                    accessoryId: freshPlacements[index]?.accessoryId || null // Keep existing accessory or null
                                  };
                                }
                              }
                              
                              updateConfiguration({
                                console: { 
                                  ...configuration.console, 
                                  placements: freshPlacements,
                                  quantity: maxConsoles // Keep quantity at maxConsoles
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
                                // Get fresh placements from configuration to ensure we have the latest state
                                const freshPlacements = [...(configuration.console?.placements || [])];
                                // Ensure we have the slot at this index
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
                                  consoleAccessories
                                    .filter((acc: any, idx: number, self: any[]) => 
                                      idx === self.findIndex((a: any) => a.id === acc.id && a.description === acc.description)
                                    )
                                    .map((acc: any) => (
                                      <SelectItem key={`${acc.id}-${acc.description}`} value={acc.id}>
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
                    (p: any) => p && p.position && p.position !== null && p.section !== null && p.position !== "none"
                  );
                  
                  if (activePlacements.length === 0) return null;

                  // Get console size for base price calculation
                  const consoleSize = configuration.console?.size || "";
                  const is6Inch = consoleSize.includes("6") || consoleSize === "6 in" || consoleSize === "Console-6 in";
                  const baseConsolePrice = is6Inch ? 8000 : 12000; // Default prices, will be overridden by pricing calculation

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
                            p => p.value === `${placement.section}_${placement.afterSeat || 1}`
                          )?.label || `${placement.section}: After ${placement.afterSeat || 1}${getOrdinalSuffix(placement.afterSeat || 1)} Seat`;
                          
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
                        
                        {/* Total Console Cost Note */}
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

          {/* Lounger */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Lounger</Label>
              <Select
                value={configuration.lounger?.required ? "Yes" : "No"}
                onValueChange={(value) =>
                  updateConfiguration({
                    lounger: {
                      ...configuration.lounger,
                      required: value === "Yes",
                      quantity: value === "Yes" ? (configuration.lounger?.quantity || 1) : 0,
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
            {configuration.lounger?.required && (
              <div className="space-y-4 pt-2 pl-4 border-l-2 border-muted">
                <div className="space-y-2">
                  <Label>Number of Loungers</Label>
                  <Select
                    value={(configuration.lounger?.quantity || 1).toString()}
                    onValueChange={(value) =>
                      updateConfiguration({
                        lounger: { ...configuration.lounger, quantity: parseInt(value, 10) },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 No.</SelectItem>
                      <SelectItem value="2">2 Nos.</SelectItem>
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
                        <SelectItem value="no-data" disabled>No options available</SelectItem>
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
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {configuration.lounger?.quantity === 2 ? (
                        // If 2 loungers, only show "Both"
                        <>
                          <SelectItem value="Both">Both LHS & RHS</SelectItem>
                        </>
                      ) : configuration.lounger?.quantity === 1 ? (
                        // If 1 lounger, only show LHS and RHS
                        <>
                          <SelectItem value="LHS">Left Hand Side (LHS)</SelectItem>
                          <SelectItem value="RHS">Right Hand Side (RHS)</SelectItem>
                        </>
                      ) : (
                        // Fallback: show all options
                        <>
                          <SelectItem value="LHS">Left Hand Side (LHS)</SelectItem>
                          <SelectItem value="RHS">Right Hand Side (RHS)</SelectItem>
                          <SelectItem value="Both">Both LHS & RHS</SelectItem>
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
                value={configuration.additionalPillows?.required ? "Yes" : "No"}
                onValueChange={(value) =>
                  updateConfiguration({
                    additionalPillows: {
                      ...configuration.additionalPillows,
                      required: value === "Yes",
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
            {configuration.additionalPillows?.required && (
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
                          <SelectItem value="Diamond with pipen quilting pillow">Diamond with pipen quilting pillow</SelectItem>
                          <SelectItem value="Tassels with pillow">Tassels with pillow</SelectItem>
                          <SelectItem value="Tassels without a pillow">Tassels without a pillow</SelectItem>
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
                          // Reset fabric selections when changing plan
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
                              ₹{selectedPillowFabrics[configuration.additionalPillows.fabricColour1].price?.toLocaleString() || 0}
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
                              ₹{selectedPillowFabrics[configuration.additionalPillows.fabricColour2].price?.toLocaleString() || 0}
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
                            <div className="flex items-center justify-between w-full">
                              <span>{foam.display_label || foam.option_value}</span>
                              {getFoamPrice(foam.option_value) > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                  +₹{getFoamPrice(foam.option_value).toLocaleString()}
                                </Badge>
                              )}
                            </div>
                        </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-data" disabled>No options available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {configuration.foam?.type && (
                    <Alert>
                      <AlertDescription>
                        <strong>Selected: {configuration.foam.type}</strong>
                        <br />
                        {getFoamPrice(configuration.foam.type) === 0
                          ? "Standard firmness - No extra cost"
                          : `Additional charge: ₹${getFoamPrice(configuration.foam.type).toLocaleString()}`}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Seat Depth */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Seat Depth Upgrade Charges</Label>
                  <Select
                    value={configuration.dimensions?.seatDepth?.toString() || (seatDepths && seatDepths.length > 0 && seatDepths[0]?.option_value ? normalizeDimensionValue(seatDepths[0].option_value) : "")}
                    onValueChange={(value) =>
                      updateConfiguration({
                        dimensions: {
                          ...configuration.dimensions,
                          seatDepth: value,
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
                          const percentage = depth.metadata?.percentage || 0;
                          const normalizedValue = normalizeDimensionValue(depth.option_value);
                          return (
                            <SelectItem key={depth.id || Math.random()} value={normalizedValue}>
                              <div className="flex items-center justify-between w-full">
                                <span>{depth.display_label || depth.option_value}</span>
                                {percentage > 0 && (
                                  <Badge variant="secondary" className="ml-2">
                                    Upgrade: {percentage}%
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
                          : `Upgrade charge: ${getDimensionPercentage("depth", configuration.dimensions.seatDepth)}%`}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Seat Width */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Seat Width Upgrade Charges</Label>
            <Select
                    value={configuration.dimensions?.seatWidth?.toString() || (seatWidths && seatWidths.length > 0 && seatWidths[0]?.option_value ? normalizeDimensionValue(seatWidths[0].option_value) : "")}
              onValueChange={(value) =>
                      updateConfiguration({
                        dimensions: {
                          ...configuration.dimensions,
                          seatWidth: value,
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
                          const percentage = width.metadata?.percentage || 0;
                          const normalizedValue = normalizeDimensionValue(width.option_value);
                          return (
                            <SelectItem key={width.id || Math.random()} value={normalizedValue}>
                              <div className="flex items-center justify-between w-full">
                                <span>{width.display_label || width.option_value}</span>
                                {percentage > 0 && (
                                  <Badge variant="secondary" className="ml-2">
                                    Upgrade: {percentage}%
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
                          : `Upgrade charge: ${getDimensionPercentage("width", configuration.dimensions.seatWidth)}%`}
                      </AlertDescription>
                    </Alert>
                  )}
          </div>

                {/* Seat Height */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Seat Height</Label>
                  <Select
                    value={configuration.dimensions?.seatHeight?.toString() || (seatHeights && seatHeights.length > 0 && seatHeights[0]?.option_value ? normalizeDimensionValue(seatHeights[0].option_value) : "")}
                    onValueChange={(value) =>
                      updateConfiguration({
                        dimensions: {
                          ...configuration.dimensions,
                          seatHeight: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Seat Height" />
                    </SelectTrigger>
                    <SelectContent>
                      {seatHeightsResult.isLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : seatHeights && seatHeights.length > 0 ? (
                        seatHeights.map((height: any) => {
                          const heightValue = normalizeDimensionValue(height.option_value);
                          return (
                            <SelectItem key={height.id} value={heightValue}>
                              {height.display_label || height.option_value || `${heightValue} in`}
                            </SelectItem>
                          );
                        })
                      ) : (
                        <>
                          <SelectItem value="16">16 in</SelectItem>
                          <SelectItem value="18">18 in</SelectItem>
                          <SelectItem value="20">20 in</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {configuration.dimensions?.seatHeight && (
                    <Alert>
                      <AlertDescription>
                        <strong>Selected: {configuration.dimensions.seatHeight} in height</strong>
                        <br />
                        Standard seat height option
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
                      Premium leg finish for your sofa
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

                {/* Armrest Type */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Armrest</Label>
            <Select
                    value={configuration.armrest?.type || ""}
              onValueChange={(value) =>
                updateConfiguration({
                        armrest: { ...configuration.armrest, type: value },
                })
              }
            >
              <SelectTrigger>
                      <SelectValue placeholder="Select Armrest Type" />
              </SelectTrigger>
              <SelectContent>
                      {armrestTypesResult.isLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : armrestTypes && armrestTypes.length > 0 ? (
                        armrestTypes
                          .filter((armrest: any) => armrest && armrest.option_value)
                          .map((armrest: any) => {
                            const price = armrest.metadata?.price_rs || 0;
                            const width = armrest.metadata?.width_in;
                            return (
                              <SelectItem key={armrest.id} value={armrest.option_value}>
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex flex-col">
                                    <span>{armrest.display_label || armrest.option_value}</span>
                                    {width && (
                                      <span className="text-xs text-muted-foreground">
                                        Width: {width}" 
                                      </span>
                                    )}
                                  </div>
                                  {price > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                      +₹{price.toLocaleString()}
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
                  {configuration.armrest?.type && (() => {
                    const selectedArmrest = armrestTypes.find((a: any) => a?.option_value === configuration.armrest?.type);
                    const price = selectedArmrest?.metadata?.price_rs || 0;
                    const width = selectedArmrest?.metadata?.width_in;
                    return (
                      <Alert>
                        <AlertDescription>
                          <strong>Selected: {selectedArmrest?.display_label || configuration.armrest.type}</strong>
                          {width && (
                            <>
                              <br />
                              Width: {width} inches
                            </>
                          )}
                          <br />
                          {price === 0
                            ? "Standard armrest - No extra cost"
                            : `Additional charge: ₹${price.toLocaleString()}`}
                        </AlertDescription>
                      </Alert>
                    );
                  })()}
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

                {/* Model Has Headrest - Read-only from product */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Model Has Headrest</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={productComesWithHeadrest || "No"}
                      readOnly
                      disabled
                      className="bg-muted cursor-not-allowed"
                    />
                    <p className="text-sm text-muted-foreground">
                      {canSelectHeadrest 
                        ? "This model supports headrest selection" 
                        : "This model does not support headrest"}
                    </p>
                  </div>
                </div>

                {/* Headrest Required - Only enabled if model has headrest */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Headrest Required</Label>
                  <Select
                    value={configuration.headrestRequired || "No"}
                    onValueChange={(value) =>
                      updateConfiguration({
                        headrestRequired: value,
                      })
                    }
                    disabled={!canSelectHeadrest}
                  >
                    <SelectTrigger className={!canSelectHeadrest ? "bg-muted cursor-not-allowed" : ""}>
                      <SelectValue placeholder={canSelectHeadrest ? "Select option" : "Not available for this model"} />
                    </SelectTrigger>
                    <SelectContent>
                      {headrestRequiredResult.isLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : headrestRequiredOptions && headrestRequiredOptions.length > 0 ? (
                        headrestRequiredOptions
                          .filter((opt: any) => opt && opt.option_value)
                          .map((opt: any) => (
                            <SelectItem key={opt.id} value={opt.option_value}>
                              {opt.display_label || opt.option_value}
                            </SelectItem>
                          ))
                      ) : (
                        <>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {!canSelectHeadrest && (
                    <p className="text-sm text-muted-foreground">
                      Headrest is not available for this model. The model does not come with headrest support.
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card className="luxury-card-glass border-2">
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
      <Card className="luxury-card-glass border-2">
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
                <p>Shape: {configuration.shape?.toUpperCase() || "STANDARD"}</p>
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

export default SofaConfigurator;
