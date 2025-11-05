import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FabricSelector from "./FabricSelector";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { Skeleton } from "@/components/ui/skeleton";

interface BenchConfiguratorProps {
  product: any;
  configuration: any;
  onConfigurationChange: (config: any) => void;
}

const BenchConfigurator = ({ product, configuration, onConfigurationChange }: BenchConfiguratorProps) => {
  // Fetch dropdown options
  const { data: seatingCapacities, isLoading: loadingCapacities } = useDropdownOptions("benches", "seating_capacity");
  const { data: storageTypes, isLoading: loadingStorage } = useDropdownOptions("benches", "storage_type");
  const { data: benchLengths } = useDropdownOptions("benches", "bench_length");
  const { data: benchDepths } = useDropdownOptions("benches", "bench_depth");
  const { data: benchHeights } = useDropdownOptions("benches", "bench_height");
  
  useEffect(() => {
    if (!configuration.productId) {
      onConfigurationChange({
        productId: product.id,
        category: "benches",
        seatingCapacity: "2-seater",
        storage: {
          required: "No",
          type: "None",
        },
        fabric: {
          claddingPlan: "Single Colour",
          structureCode: "",
        },
        dimensions: {
          length: 48,
          depth: 18,
          height: 18,
        },
      });
    }
  }, [product.id, configuration.productId, onConfigurationChange]);

  const updateConfiguration = (updates: any) => {
    onConfigurationChange({ ...configuration, ...updates });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="base" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="base">Base Configuration</TabsTrigger>
          <TabsTrigger value="fabric">Fabric Selection</TabsTrigger>
          <TabsTrigger value="specs">Specifications</TabsTrigger>
        </TabsList>

        <TabsContent value="base" className="space-y-6">
          {/* Seating Capacity */}
          <div className="space-y-2">
            <Label>Seating Capacity</Label>
            <Select
              value={configuration.seatingCapacity || "2-seater"}
              onValueChange={(value) => updateConfiguration({ seatingCapacity: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {seatingCapacities?.map((capacity) => (
                  <SelectItem key={capacity.id} value={capacity.option_value}>
                    {capacity.display_label || capacity.option_value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Storage */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Storage Required</Label>
              <RadioGroup
                value={configuration.storage?.required || "No"}
                onValueChange={(value) => updateConfiguration({
                  storage: { ...configuration.storage, required: value }
                })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Yes" id="storage-yes" />
                  <Label htmlFor="storage-yes" className="font-normal cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="No" id="storage-no" />
                  <Label htmlFor="storage-no" className="font-normal cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </div>

            {configuration.storage?.required === "Yes" && (
              <div className="space-y-2">
                <Label>Storage Type</Label>
                <Select
                  value={configuration.storage?.type || "Lift-top"}
                  onValueChange={(value) => updateConfiguration({
                    storage: { ...configuration.storage, type: value }
                  })}
                >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {storageTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.option_value}>
                      {type.display_label || type.option_value}
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="fabric" className="space-y-6">
          <FabricSelector
            configuration={configuration}
            onConfigurationChange={onConfigurationChange}
          />
        </TabsContent>

        <TabsContent value="specs" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Length (inches)</Label>
              <Select
                value={String(configuration.dimensions?.length || 48)}
                onValueChange={(value) => updateConfiguration({
                  dimensions: { ...configuration.dimensions, length: Number(value) }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {benchLengths?.map((length) => (
                    <SelectItem key={length.id} value={length.option_value}>
                      {length.display_label || length.option_value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Depth (inches)</Label>
              <Select
                value={String(configuration.dimensions?.depth || 18)}
                onValueChange={(value) => updateConfiguration({
                  dimensions: { ...configuration.dimensions, depth: Number(value) }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {benchDepths?.map((depth) => (
                    <SelectItem key={depth.id} value={depth.option_value}>
                      {depth.display_label || depth.option_value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Height (inches)</Label>
              <Select
                value={String(configuration.dimensions?.height || 18)}
                onValueChange={(value) => updateConfiguration({
                  dimensions: { ...configuration.dimensions, height: Number(value) }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {benchHeights?.map((height) => (
                    <SelectItem key={height.id} value={height.option_value}>
                      {height.display_label || height.option_value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BenchConfigurator;
