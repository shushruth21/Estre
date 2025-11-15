import { useState, useMemo, useCallback } from "react";
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
    const fabricUpdates: any = { ...configuration.fabric };

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

    onConfigurationChange({ fabric: fabricUpdates });
    setOpenLibrary(null);
  }, [configuration.fabric, effectiveCategory, onConfigurationChange]);

  const handleCladdingPlanChange = useCallback((value: string) => {
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
    
    onConfigurationChange({ fabric: updatedFabric });
  }, [configuration.fabric, effectiveCategory, onConfigurationChange]);

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
            <SelectItem value="Multi Colour">Multi Colour</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Fabric Selection */}
      <div className="space-y-4">
        <FabricPartSelector
          label="Structure Fabric"
          selectedCode={configuration.fabric?.structureCode || undefined}
          selectedFabric={configuration.fabric?.structureCode ? selectedFabrics?.[configuration.fabric.structureCode] : undefined}
          onOpenLibrary={() => setOpenLibrary("structure")}
        />

        {configuration.fabric?.claddingPlan === "Multi Colour" && (
          <>
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
                  selectedCode={configuration.fabric?.backrestCode}
                  selectedFabric={selectedFabrics?.[configuration.fabric?.backrestCode || ""]}
                  onOpenLibrary={() => setOpenLibrary("backrest")}
                />

                <FabricPartSelector
                  label="Seat Fabric"
                  selectedCode={configuration.fabric?.seatCode}
                  selectedFabric={selectedFabrics?.[configuration.fabric?.seatCode || ""]}
                  onOpenLibrary={() => setOpenLibrary("seat")}
                />

                <FabricPartSelector
                  label="Headrest Fabric"
                  selectedCode={configuration.fabric?.headrestCode}
                  selectedFabric={selectedFabrics?.[configuration.fabric?.headrestCode || ""]}
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
        selectedCode={configuration.fabric?.structureCode}
        title="Select Structure Fabric"
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
      <Label className="mb-2">{label}</Label>
      <Button variant="outline" className="w-full justify-start" onClick={onOpenLibrary}>
        {selectedFabric ? (
          <div className="flex items-center gap-2 w-full">
            <div
              className="w-8 h-8 rounded-full border-2 border-gray-200 flex-shrink-0"
              style={{
                backgroundColor: selectedFabric.colour_link || `hsl(${selectedFabric.estre_code.charCodeAt(0) % 360}, 70%, 75%)`,
              }}
            />
            <Badge variant="outline">{selectedFabric.estre_code}</Badge>
            <span className="flex-1 truncate">
              {selectedFabric.description || selectedFabric.colour || selectedFabric.estre_code}
            </span>
            <span className="ml-auto text-primary font-semibold">
              ₹{selectedFabric.price?.toLocaleString() || 0}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">Select fabric...</span>
        )}
      </Button>
    </div>
  );
};

export default FabricSelector;
