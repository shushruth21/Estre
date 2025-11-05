import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FabricSelector from "./FabricSelector";

interface DiningChairConfiguratorProps {
  product: any;
  configuration: any;
  onConfigurationChange: (config: any) => void;
}

const DiningChairConfigurator = ({ product, configuration, onConfigurationChange }: DiningChairConfiguratorProps) => {
  useEffect(() => {
    if (!configuration.productId) {
      onConfigurationChange({
        productId: product.id,
        category: "dining_chairs",
        setQuantity: 4,
        fabric: {
          claddingPlan: "Single Colour",
          structureCode: "",
        },
        foam: {
          type: "Firm",
        },
        dimensions: {
          seatDepth: 18,
          seatWidth: 18,
          seatHeight: 18,
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
          {/* Set Quantity */}
          <div className="space-y-2">
            <Label>Set Quantity</Label>
            <Select
              value={String(configuration.setQuantity || 4)}
              onValueChange={(value) => updateConfiguration({ setQuantity: Number(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">Set of 2 Chairs</SelectItem>
                <SelectItem value="4">Set of 4 Chairs</SelectItem>
                <SelectItem value="6">Set of 6 Chairs</SelectItem>
                <SelectItem value="8">Set of 8 Chairs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              Price shown is for a set of {configuration.setQuantity || 4} chairs
            </p>
          </div>
        </TabsContent>

        <TabsContent value="fabric" className="space-y-6">
          <FabricSelector
            configuration={configuration}
            onConfigurationChange={onConfigurationChange}
          />
        </TabsContent>

        <TabsContent value="specs" className="space-y-6">
          <div className="space-y-2">
            <Label>Foam Type</Label>
            <Select
              value={configuration.foam?.type || "Firm"}
              onValueChange={(value) => updateConfiguration({
                foam: { type: value }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Firm">Firm</SelectItem>
                <SelectItem value="Soft">Soft</SelectItem>
                <SelectItem value="Super Soft">Super Soft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Seat Depth (inches)</Label>
              <Select
                value={String(configuration.dimensions?.seatDepth || 18)}
                onValueChange={(value) => updateConfiguration({
                  dimensions: { ...configuration.dimensions, seatDepth: Number(value) }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16">16"</SelectItem>
                  <SelectItem value="18">18"</SelectItem>
                  <SelectItem value="20">20"</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Seat Width (inches)</Label>
              <Select
                value={String(configuration.dimensions?.seatWidth || 18)}
                onValueChange={(value) => updateConfiguration({
                  dimensions: { ...configuration.dimensions, seatWidth: Number(value) }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16">16"</SelectItem>
                  <SelectItem value="18">18"</SelectItem>
                  <SelectItem value="20">20"</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Seat Height (inches)</Label>
              <Select
                value={String(configuration.dimensions?.seatHeight || 18)}
                onValueChange={(value) => updateConfiguration({
                  dimensions: { ...configuration.dimensions, seatHeight: Number(value) }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16">16"</SelectItem>
                  <SelectItem value="18">18"</SelectItem>
                  <SelectItem value="20">20"</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DiningChairConfigurator;
