import { useState } from "react";
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
}

const FabricSelector = ({
  configuration,
  onConfigurationChange,
}: FabricSelectorProps) => {
  const [openLibrary, setOpenLibrary] = useState<string | null>(null);

  // Fetch selected fabric details for display
  const { data: selectedFabrics } = useQuery({
    queryKey: ["selected-fabrics", configuration.fabric],
    queryFn: async () => {
      const codes = [
        configuration.fabric?.structureCode,
        configuration.fabric?.backrestCode,
        configuration.fabric?.seatCode,
        configuration.fabric?.headrestCode,
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
      configuration.fabric?.structureCode ||
      configuration.fabric?.backrestCode ||
      configuration.fabric?.seatCode ||
      configuration.fabric?.headrestCode
    ),
  });

  const selectFabric = (fabricCode: string, part: string) => {
    const fabricUpdates: any = { ...configuration.fabric };

    if (part === "structure") {
      fabricUpdates.structureCode = fabricCode;
    } else if (part === "backrest") {
      fabricUpdates.backrestCode = fabricCode;
    } else if (part === "seat") {
      fabricUpdates.seatCode = fabricCode;
    } else if (part === "headrest") {
      fabricUpdates.headrestCode = fabricCode;
    }

    onConfigurationChange({ fabric: fabricUpdates });
    setOpenLibrary(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Cladding Plan</Label>
        <Select
          value={configuration.fabric?.claddingPlan || "Single Colour"}
          onValueChange={(value) =>
            onConfigurationChange({
              fabric: { ...configuration.fabric, claddingPlan: value },
            })
          }
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
          selectedCode={configuration.fabric?.structureCode}
          selectedFabric={selectedFabrics?.[configuration.fabric?.structureCode || ""]}
          onOpenLibrary={() => setOpenLibrary("structure")}
        />

        {configuration.fabric?.claddingPlan === "Multi Colour" && (
          <>
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
        selectedCode={configuration.fabric?.headrestCode}
        title="Select Headrest Fabric"
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
