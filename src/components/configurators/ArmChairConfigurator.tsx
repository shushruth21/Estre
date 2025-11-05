import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import FabricSelector from "./FabricSelector";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { Skeleton } from "@/components/ui/skeleton";

interface ArmChairConfiguratorProps {
  product: any;
  configuration: any;
  onConfigurationChange: (config: any) => void;
}

const ArmChairConfigurator = ({ product, configuration, onConfigurationChange }: ArmChairConfiguratorProps) => {
  // Fetch dropdown options
  const { data: pillowTypes, isLoading: loadingPillowTypes } = useDropdownOptions("arm_chairs", "pillow_type");
  const { data: pillowSizes, isLoading: loadingPillowSizes } = useDropdownOptions("arm_chairs", "pillow_size");
  const { data: foamTypes, isLoading: loadingFoam } = useDropdownOptions("common", "foam_type");
  const { data: seatDepths } = useDropdownOptions("arm_chairs", "seat_depth");
  const { data: seatWidths } = useDropdownOptions("arm_chairs", "seat_width");
  const { data: seatHeights } = useDropdownOptions("arm_chairs", "seat_height");
  
  useEffect(() => {
    if (!configuration.productId) {
      onConfigurationChange({
        productId: product.id,
        category: "arm_chairs",
        pillows: {
          required: "No",
          quantity: 0,
          type: "Simple",
          size: '18" x 18"',
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
          {/* Additional Pillows */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Additional Pillows</Label>
              <RadioGroup
                value={configuration.pillows?.required || "No"}
                onValueChange={(value) => updateConfiguration({
                  pillows: { ...configuration.pillows, required: value }
                })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Yes" id="pillows-yes" />
                  <Label htmlFor="pillows-yes" className="font-normal cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="No" id="pillows-no" />
                  <Label htmlFor="pillows-no" className="font-normal cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </div>

            {configuration.pillows?.required === "Yes" && (
              <>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    max="4"
                    value={configuration.pillows?.quantity || 1}
                    onChange={(e) => updateConfiguration({
                      pillows: { ...configuration.pillows, quantity: Number(e.target.value) }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pillow Type</Label>
                  <Select
                    value={configuration.pillows?.type || "Simple"}
                    onValueChange={(value) => updateConfiguration({
                      pillows: { ...configuration.pillows, type: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Simple">Simple</SelectItem>
                      <SelectItem value="Diamond Quilted">Diamond Quilted</SelectItem>
                      <SelectItem value="Belt Quilted">Belt Quilted</SelectItem>
                      <SelectItem value="Tassels">Tassels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Pillow Size</Label>
                  <Select
                    value={configuration.pillows?.size || '18" x 18"'}
                    onValueChange={(value) => updateConfiguration({
                      pillows: { ...configuration.pillows, size: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='18" x 18"'>18" x 18"</SelectItem>
                      <SelectItem value='20" x 20"'>20" x 20"</SelectItem>
                      <SelectItem value='16" x 24"'>16" x 24"</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
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
                {foamTypes?.map((foam) => (
                  <SelectItem key={foam.id} value={foam.option_value}>
                    {foam.display_label || foam.option_value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Seat Depth (inches)</Label>
              <Select
                value={String(configuration.dimensions?.seatDepth || 22)}
                onValueChange={(value) => updateConfiguration({
                  dimensions: { ...configuration.dimensions, seatDepth: Number(value) }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seatDepths?.map((depth) => (
                    <SelectItem key={depth.id} value={depth.option_value}>
                      {depth.display_label || depth.option_value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Seat Width (inches)</Label>
              <Select
                value={String(configuration.dimensions?.seatWidth || 24)}
                onValueChange={(value) => updateConfiguration({
                  dimensions: { ...configuration.dimensions, seatWidth: Number(value) }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seatWidths?.map((width) => (
                    <SelectItem key={width.id} value={width.option_value}>
                      {width.display_label || width.option_value}
                    </SelectItem>
                  ))}
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
                  {seatHeights?.map((height) => (
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

export default ArmChairConfigurator;
