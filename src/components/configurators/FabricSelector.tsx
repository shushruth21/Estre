import { useState, useMemo, useCallback } from "react";
import { logger } from "@/lib/logger";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FabricLibrary } from "@/components/ui/FabricLibrary";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface FabricSelectorProps {
  configuration: any;
  onConfigurationChange: (updates: any) => void;
  category?: string; // Optional category to customize fabric parts
}

const FabricSelector = ({
  configuration,
  onConfigurationChange,
  category = "sofa", // Default to sofa for backward compatibility
}: FabricSelectorProps) => {
  // Get category from configuration if not provided
  const effectiveCategory = category || configuration.category || "sofa";
  const [openLibrary, setOpenLibrary] = useState<string | null>(null);

  // Memoize fabric codes to prevent unnecessary re-renders
  const fabricCodes = useMemo(() => {
    const codes: string[] = [];

    if (configuration.fabric?.structureCode) {
      codes.push(configuration.fabric.structureCode);
    }

    if (effectiveCategory === "bed" || effectiveCategory === "kids_bed") {
      // Bed: Structure and Headrest/Headboard only
      const headrestCode = configuration.fabric?.headrestCode || configuration.fabric?.headboardCode;
      if (headrestCode) {
        codes.push(headrestCode);
      }
    } else {
      // Sofa/Sofabed: All parts
      if (configuration.fabric?.backrestCode) codes.push(configuration.fabric.backrestCode);
      if (configuration.fabric?.seatCode) codes.push(configuration.fabric.seatCode);
      if (configuration.fabric?.headrestCode) codes.push(configuration.fabric.headrestCode);
    }

    return codes.sort(); // Sort for stable query key
  }, [
    configuration.fabric?.structureCode,
    configuration.fabric?.headrestCode,
    configuration.fabric?.headboardCode,
    configuration.fabric?.backrestCode,
    configuration.fabric?.seatCode,
    effectiveCategory,
  ]);

  // Create stable query key from fabric codes
  const queryKey = useMemo(
    () => ["selected-fabrics", effectiveCategory, ...fabricCodes],
    [effectiveCategory, fabricCodes]
  );

  // Fetch selected fabric details for display
  const { data: selectedFabrics } = useQuery({
    queryKey,
    queryFn: async () => {
      if (fabricCodes.length === 0) return {};

      const { data, error } = await supabase
        .from("fabric_coding")
        .select("*")
        .in("estre_code", fabricCodes);

      if (error) throw error;

      const fabricMap: Record<string, any> = {};
      data?.forEach((f) => {
        fabricMap[f.estre_code] = f;
      });
      return fabricMap;
    },
    enabled: fabricCodes.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes to prevent flickering
  });

  const selectFabric = useCallback((fabricCode: string, part: string) => {
    try {
      const currentFabric = configuration.fabric || {};
      const fabricUpdates: any = {
        ...currentFabric,
        // Preserve claddingPlan if it exists
        claddingPlan: currentFabric.claddingPlan || "Single Colour",
      };

      if (part === "structure") {
        fabricUpdates.structureCode = fabricCode;
      } else if (part === "backrest") {
        fabricUpdates.backrestCode = fabricCode;
      } else if (part === "seat") {
        fabricUpdates.seatCode = fabricCode;
      } else if (part === "headrest") {
        // For beds, support both headrestCode and headboardCode
        if (effectiveCategory === "bed" || effectiveCategory === "kids_bed") {
          fabricUpdates.headrestCode = fabricCode;
          fabricUpdates.headboardCode = fabricCode; // Set both for compatibility
        } else {
          fabricUpdates.headrestCode = fabricCode;
        }
      }

      // Merge with existing configuration to preserve other fields
      onConfigurationChange({
        ...configuration,
        fabric: fabricUpdates
      });
      setOpenLibrary(null);
    } catch (error) {
      logger.error(error, {
        part,
        fabricCode,
        configuration: configuration.fabric,
        effectiveCategory,
        action: "selectFabric"
      }, "FABRIC_SELECTION_ERROR");
    }
  }, [configuration, effectiveCategory, onConfigurationChange]);

  const handleCladdingPlanChange = useCallback((value: string) => {
    try {
      const currentFabric = configuration.fabric || {};
      const updatedFabric: any = {
        ...currentFabric,
        claddingPlan: value,
      };

      // When switching to Multi Colour, ensure structureCode is preserved
      // When switching to Single Colour, clear multi-colour specific codes
      if (value === "Single Colour") {
        // Keep only structureCode for single colour
        updatedFabric.structureCode = currentFabric.structureCode;
        // Clear multi-colour specific codes by removing them from the object
        if (effectiveCategory === "bed" || effectiveCategory === "kids_bed") {
          delete updatedFabric.headrestCode;
          delete updatedFabric.headboardCode;
        } else {
          delete updatedFabric.backrestCode;
          delete updatedFabric.seatCode;
          delete updatedFabric.headrestCode;
        }
      } else if (value === "Multi Colour") {
        // Preserve structureCode when switching to multi-colour
        updatedFabric.structureCode = currentFabric.structureCode;
        // For beds, ensure headrestCode/headboardCode fields exist (even if undefined)
        // This helps with the UI showing the selector
      }

      // Merge with existing configuration to preserve other fields
      onConfigurationChange({
        ...configuration,
        fabric: updatedFabric
      });
    } catch (error) {
      logger.error(error, {
        value,
        configuration: configuration.fabric,
        effectiveCategory,
        action: "handleCladdingPlanChange"
      }, "CLADDING_PLAN_CHANGE_ERROR");
    }
  }, [configuration, effectiveCategory, onConfigurationChange]);

  return (
    <div className="space-y-6">
      <div>
        <Label>Cladding Plan</Label>
        <Select
          value={configuration.fabric?.claddingPlan || "Single Colour"}
          onValueChange={handleCladdingPlanChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Single Colour">Single Colour</SelectItem>
            <SelectItem value="Dual Colour">Dual Colour</SelectItem>
            <SelectItem value="Multi Colour">Multi Colour</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Fabric Selection */}
      <div className="space-y-4">
        {/* Validation Warnings */}
        {configuration.fabric?.claddingPlan === "Single Colour" && !configuration.fabric?.structureCode && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a Structure fabric for Single Colour plan.
            </AlertDescription>
          </Alert>
        )}

        {configuration.fabric?.claddingPlan === "Dual Colour" && (
          (!configuration.fabric?.structureCode || !configuration.fabric?.seatCode) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Dual Colour plan requires both Primary (Structure) and Secondary (Cushions) fabrics.
              </AlertDescription>
            </Alert>
          )
        )}

        {configuration.fabric?.claddingPlan === "Multi Colour" && (
          <>
            {/* Bed category validation */}
            {(effectiveCategory === "bed" || effectiveCategory === "kids_bed") &&
              (!configuration.fabric?.structureCode || (!configuration.fabric?.headrestCode && !configuration.fabric?.headboardCode)) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Multi Colour plan requires both Structure and Headrest fabrics to be selected.
                  </AlertDescription>
                </Alert>
              )}
            {/* Sofa/Sofabed category validation */}
            {(effectiveCategory !== "bed" && effectiveCategory !== "kids_bed") &&
              (!configuration.fabric?.structureCode || !configuration.fabric?.backrestCode || !configuration.fabric?.seatCode || !configuration.fabric?.headrestCode) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Multi Colour plan requires Structure, Backrest, Seat, and Headrest fabrics to be selected.
                  </AlertDescription>
                </Alert>
              )}
          </>
        )}

        {/* --- Single Colour Mode --- */}
        {configuration.fabric?.claddingPlan === "Single Colour" && (
          <FabricPartSelector
            label="Structure Fabric"
            selectedCode={configuration.fabric?.structureCode || undefined}
            selectedFabric={configuration.fabric?.structureCode ? selectedFabrics?.[configuration.fabric.structureCode] : undefined}
            onOpenLibrary={() => setOpenLibrary("structure")}
          />
        )}

        {/* --- Dual Colour Mode --- */}
        {configuration.fabric?.claddingPlan === "Dual Colour" && (
          <>
            <FabricPartSelector
              label="Primary Colour (Structure)"
              selectedCode={configuration.fabric?.structureCode || undefined}
              selectedFabric={configuration.fabric?.structureCode ? selectedFabrics?.[configuration.fabric.structureCode] : undefined}
              onOpenLibrary={() => setOpenLibrary("structure")}
            />

            <FabricPartSelector
              label="Secondary Colour (Seat, Backrest, Headrest)"
              selectedCode={configuration.fabric?.seatCode || undefined}
              selectedFabric={configuration.fabric?.seatCode ? selectedFabrics?.[configuration.fabric.seatCode] : undefined}
              onOpenLibrary={() => setOpenLibrary("dual_secondary")}
            />
          </>
        )}

        {/* --- Multi Colour Mode --- */}
        {configuration.fabric?.claddingPlan === "Multi Colour" && (
          <>
            {/* Structure is always first for Multi */}
            <FabricPartSelector
              label="Structure Fabric"
              selectedCode={configuration.fabric?.structureCode || undefined}
              selectedFabric={configuration.fabric?.structureCode ? selectedFabrics?.[configuration.fabric.structureCode] : undefined}
              onOpenLibrary={() => setOpenLibrary("structure")}
            />

            {/* Bed category: Only Structure and Headrest */}
            {(effectiveCategory === "bed" || effectiveCategory === "kids_bed") ? (
              <>
                <FabricPartSelector
                  label="Headrest Fabric (40% of total)"
                  selectedCode={configuration.fabric?.headrestCode || configuration.fabric?.headboardCode || undefined}
                  selectedFabric={
                    (configuration.fabric?.headrestCode && selectedFabrics?.[configuration.fabric.headrestCode]) ||
                    (configuration.fabric?.headboardCode && selectedFabrics?.[configuration.fabric.headboardCode]) ||
                    undefined
                  }
                  onOpenLibrary={() => setOpenLibrary("headrest")}
                />
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Multi Colour Plan:</strong> Structure (60%) + Headrest (40%) = 100% of total fabric
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Sofa/Sofabed: All parts */}
                <FabricPartSelector
                  label="Backrest Fabric"
                  selectedCode={configuration.fabric?.backrestCode || undefined}
                  selectedFabric={configuration.fabric?.backrestCode ? selectedFabrics?.[configuration.fabric.backrestCode] : undefined}
                  onOpenLibrary={() => setOpenLibrary("backrest")}
                />

                <FabricPartSelector
                  label="Seat Fabric"
                  selectedCode={configuration.fabric?.seatCode || undefined}
                  selectedFabric={configuration.fabric?.seatCode ? selectedFabrics?.[configuration.fabric.seatCode] : undefined}
                  onOpenLibrary={() => setOpenLibrary("seat")}
                />

                <FabricPartSelector
                  label="Headrest Fabric"
                  selectedCode={configuration.fabric?.headrestCode || undefined}
                  selectedFabric={configuration.fabric?.headrestCode ? selectedFabrics?.[configuration.fabric.headrestCode] : undefined}
                  onOpenLibrary={() => setOpenLibrary("headrest")}
                />
              </>
            )}
          </>
        )}
      </div>

      {/* Fabric Library Dialogs */}
      <FabricLibrary
        open={openLibrary === "structure"}
        onOpenChange={(open) => setOpenLibrary(open ? "structure" : null)}
        onSelect={(code) => selectFabric(code, "structure")}
        selectedCode={configuration.fabric?.structureCode || undefined}
        title="Select Structure Fabric"
      />
      {/* Dual Colour Secondary Selector (Maps to multiple) */}
      <FabricLibrary
        open={openLibrary === "dual_secondary"}
        onOpenChange={(open) => setOpenLibrary(open ? "dual_secondary" : null)}
        onSelect={(code) => {
          // Update Seat, Backrest, and Headrest simultaneously
          onConfigurationChange({
            ...configuration,
            fabric: {
              ...configuration.fabric,
              seatCode: code,
              backrestCode: code,
              headrestCode: code,
              // Also set headboard for beds if needed
              headboardCode: (effectiveCategory === "bed" || effectiveCategory === "kids_bed") ? code : undefined
            }
          });
          setOpenLibrary(null);
        }}
        selectedCode={configuration.fabric?.seatCode}
        title="Select Secondary Fabric"
      />
      <FabricLibrary
        open={openLibrary === "backrest"}
        onOpenChange={(open) => setOpenLibrary(open ? "backrest" : null)}
        onSelect={(code) => selectFabric(code, "backrest")}
        selectedCode={configuration.fabric?.backrestCode}
        title="Select Backrest Fabric"
      />
      <FabricLibrary
        open={openLibrary === "seat"}
        onOpenChange={(open) => setOpenLibrary(open ? "seat" : null)}
        onSelect={(code) => selectFabric(code, "seat")}
        selectedCode={configuration.fabric?.seatCode}
        title="Select Seat Fabric"
      />
      <FabricLibrary
        open={openLibrary === "headrest"}
        onOpenChange={(open) => setOpenLibrary(open ? "headrest" : null)}
        onSelect={(code) => selectFabric(code, "headrest")}
        selectedCode={configuration.fabric?.headrestCode || configuration.fabric?.headboardCode}
        title={effectiveCategory === "bed" || effectiveCategory === "kids_bed" ? "Select Headrest Fabric (40% of total)" : "Select Headrest Fabric"}
      />
    </div>
  );
};

interface FabricPartSelectorProps {
  label: string;
  selectedCode?: string;
  selectedFabric?: any;
  onOpenLibrary: () => void;
}

const FabricPartSelector = ({
  label,
  selectedCode,
  selectedFabric,
  onOpenLibrary,
}: FabricPartSelectorProps) => {
  return (
    <div>
      <Label className="mb-2 text-walnut font-medium">{label}</Label>
      <Button
        variant="outline"
        className="w-full justify-start h-auto py-3 border-gold/20 hover:border-gold hover:bg-gold/5 transition-all duration-300"
        onClick={onOpenLibrary}
      >
        {selectedFabric ? (
          <div className="flex items-center gap-3 w-full">
            <div
              className="w-10 h-10 rounded-full border border-gold/20 flex-shrink-0 shadow-sm"
              style={{
                backgroundColor: selectedFabric.colour_link || `hsl(${selectedFabric.estre_code.charCodeAt(0) % 360}, 70%, 75%)`,
              }}
            />
            <Badge variant="outline" className="border-gold/30 text-walnut bg-ivory">{selectedFabric.estre_code}</Badge>
            <span className="flex-1 truncate text-walnut font-medium">
              {selectedFabric.description || selectedFabric.colour || selectedFabric.estre_code}
            </span>
            <span className="ml-auto text-gold font-bold">
              ₹{selectedFabric.price?.toLocaleString() || 0}
            </span>
          </div>
        ) : (
          <span className="text-walnut/50 italic">Select fabric...</span>
        )}
      </Button>
    </div>
  );
};

export default FabricSelector;
