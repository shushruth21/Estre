import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface FabricSelectorProps {
  configuration: any;
  onConfigurationChange: (updates: any) => void;
}

const FabricSelector = ({
  configuration,
  onConfigurationChange,
}: FabricSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPart, setSelectedPart] = useState<string>("structure");

  const { data: fabrics, isLoading } = useQuery({
    queryKey: ["fabric_coding", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("fabric_coding")
        .select("*")
        .eq("is_active", true)
        .order("estre_code");

      if (searchTerm) {
        query = query.or(
          `estre_code.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data;
    },
  });

  const selectFabric = (fabricCode: string) => {
    const fabricUpdates: any = { ...configuration.fabric };

    if (selectedPart === "structure") {
      fabricUpdates.structureCode = fabricCode;
    } else if (selectedPart === "backrest") {
      fabricUpdates.backrestCode = fabricCode;
    } else if (selectedPart === "seat") {
      fabricUpdates.seatCode = fabricCode;
    } else if (selectedPart === "headrest") {
      fabricUpdates.headrestCode = fabricCode;
    }

    onConfigurationChange({ fabric: fabricUpdates });
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
          fabrics={fabrics}
          isLoading={isLoading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSelect={(code) => {
            setSelectedPart("structure");
            selectFabric(code);
          }}
        />

        {configuration.fabric?.claddingPlan === "Multi Colour" && (
          <>
            <FabricPartSelector
              label="Backrest Fabric"
              selectedCode={configuration.fabric?.backrestCode}
              fabrics={fabrics}
              isLoading={isLoading}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSelect={(code) => {
                setSelectedPart("backrest");
                selectFabric(code);
              }}
            />

            <FabricPartSelector
              label="Seat Fabric"
              selectedCode={configuration.fabric?.seatCode}
              fabrics={fabrics}
              isLoading={isLoading}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSelect={(code) => {
                setSelectedPart("seat");
                selectFabric(code);
              }}
            />

            <FabricPartSelector
              label="Headrest Fabric"
              selectedCode={configuration.fabric?.headrestCode}
              fabrics={fabrics}
              isLoading={isLoading}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSelect={(code) => {
                setSelectedPart("headrest");
                selectFabric(code);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};

interface FabricPartSelectorProps {
  label: string;
  selectedCode?: string;
  fabrics?: any[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelect: (code: string) => void;
}

const FabricPartSelector = ({
  label,
  selectedCode,
  fabrics,
  isLoading,
  searchTerm,
  onSearchChange,
  onSelect,
}: FabricPartSelectorProps) => {
  const selectedFabric = fabrics?.find((f) => f.estre_code === selectedCode);

  return (
    <div>
      <Label className="mb-2">{label}</Label>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            {selectedFabric ? (
              <div className="flex items-center gap-2">
                <Badge>{selectedFabric.estre_code}</Badge>
                <span>{selectedFabric.title || selectedFabric.description}</span>
                <span className="ml-auto text-primary">
                  ₹{selectedFabric.price || 0}/mtr
                </span>
              </div>
            ) : (
              "Select fabric..."
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by code or title..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading fabrics...
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {fabrics?.map((fabric) => (
                  <Card
                    key={fabric.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => onSelect(fabric.estre_code)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {fabric.colour_link && (
                          <img
                            src={fabric.colour_link}
                            alt={fabric.title || fabric.description || ''}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <Badge variant="outline" className="mb-1">
                                {fabric.estre_code}
                              </Badge>
                              <h4 className="font-semibold">{fabric.title || fabric.description}</h4>
                            </div>
                            <p className="text-sm font-bold text-primary">
                              ₹{fabric.price || 0}/mtr
                            </p>
                          </div>
                          {fabric.brand && (
                            <p className="text-xs text-muted-foreground">
                              {fabric.brand}
                            </p>
                          )}
                          {fabric.colour && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {fabric.colour}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FabricSelector;
