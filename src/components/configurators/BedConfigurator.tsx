import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FabricSelector from "./FabricSelector";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { Skeleton } from "@/components/ui/skeleton";

interface BedConfiguratorProps {
  product: any;
  configuration: any;
  onConfigurationChange: (config: any) => void;
}

const BedConfigurator = ({ product, configuration, onConfigurationChange }: BedConfiguratorProps) => {
  // Fetch dropdown options
  const { data: bedSizes, isLoading: loadingSizes } = useDropdownOptions("bed", "bed_size");
  const { data: storageTypes, isLoading: loadingStorage } = useDropdownOptions("bed", "storage_type");
  const { data: mattressSupports, isLoading: loadingSupport } = useDropdownOptions("bed", "mattress_support");
  const { data: bedLengths } = useDropdownOptions("bed", "bed_length");
  const { data: bedWidths } = useDropdownOptions("bed", "bed_width");
  const { data: headboardHeights } = useDropdownOptions("bed", "headboard_height");
  
  useEffect(() => {
    if (!configuration.productId) {
      onConfigurationChange({
        productId: product.id,
        category: "bed",
        bedSize: "Double",
        storage: "No",
        storageType: "None",
        mattressSupport: "Slat",
        fabric: {
          claddingPlan: "Single Colour",
          structureCode: "",
        },
        dimensions: {
          length: 78,
          width: 54,
          headboardHeight: 36,
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
          {/* Bed Size */}
          <div className="space-y-2">
            <Label>Bed Size</Label>
            <RadioGroup
              value={configuration.bedSize || "Double"}
              onValueChange={(value) => updateConfiguration({ bedSize: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Single" id="single" />
                <Label htmlFor="single" className="font-normal cursor-pointer">Single (36" x 72")</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Double" id="double" />
                <Label htmlFor="double" className="font-normal cursor-pointer">Double (54" x 75")</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Queen" id="queen" />
                <Label htmlFor="queen" className="font-normal cursor-pointer">Queen (60" x 78")</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="King" id="king" />
                <Label htmlFor="king" className="font-normal cursor-pointer">King (72" x 78")</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Storage */}
          <div className="space-y-2">
            <Label>Storage Required</Label>
            <RadioGroup
              value={configuration.storage || "No"}
              onValueChange={(value) => updateConfiguration({ storage: value })}
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

          {/* Storage Type */}
          {configuration.storage === "Yes" && (
            <div className="space-y-2">
              <Label>Storage Type</Label>
              <Select
                value={configuration.storageType || "Hydraulic"}
                onValueChange={(value) => updateConfiguration({ storageType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select storage type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hydraulic">Hydraulic Storage</SelectItem>
                  <SelectItem value="Box">Box Storage</SelectItem>
                  <SelectItem value="Drawer">Drawer Storage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Mattress Support */}
          <div className="space-y-2">
            <Label>Mattress Support</Label>
            <RadioGroup
              value={configuration.mattressSupport || "Slat"}
              onValueChange={(value) => updateConfiguration({ mattressSupport: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Slat" id="slat" />
                <Label htmlFor="slat" className="font-normal cursor-pointer">Slat Base</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Solid" id="solid" />
                <Label htmlFor="solid" className="font-normal cursor-pointer">Solid Base</Label>
              </div>
            </RadioGroup>
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
                value={String(configuration.dimensions?.length || 78)}
                onValueChange={(value) => updateConfiguration({
                  dimensions: { ...configuration.dimensions, length: Number(value) }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="72">72"</SelectItem>
                  <SelectItem value="75">75"</SelectItem>
                  <SelectItem value="78">78"</SelectItem>
                  <SelectItem value="80">80"</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Width (inches)</Label>
              <Select
                value={String(configuration.dimensions?.width || 54)}
                onValueChange={(value) => updateConfiguration({
                  dimensions: { ...configuration.dimensions, width: Number(value) }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="36">36" (Single)</SelectItem>
                  <SelectItem value="54">54" (Double)</SelectItem>
                  <SelectItem value="60">60" (Queen)</SelectItem>
                  <SelectItem value="72">72" (King)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Headboard Height (inches)</Label>
              <Select
                value={String(configuration.dimensions?.headboardHeight || 36)}
                onValueChange={(value) => updateConfiguration({
                  dimensions: { ...configuration.dimensions, headboardHeight: Number(value) }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30"</SelectItem>
                  <SelectItem value="36">36"</SelectItem>
                  <SelectItem value="42">42"</SelectItem>
                  <SelectItem value="48">48"</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BedConfigurator;
