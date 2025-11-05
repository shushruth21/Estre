import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import FabricSelector from "./FabricSelector";

interface CinemaChairConfiguratorProps {
  product: any;
  configuration: any;
  onConfigurationChange: (config: any) => void;
}

const CinemaChairConfigurator = ({ product, configuration, onConfigurationChange }: CinemaChairConfiguratorProps) => {
  useEffect(() => {
    if (!configuration.productId) {
      onConfigurationChange({
        productId: product.id,
        category: "cinema_chairs",
        numberOfSeats: 2,
        mechanism: "Manual",
        console: {
          required: "No",
          quantity: 0,
          size: "Console-6 in",
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
          seatWidth: 26,
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="base">Base</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="fabric">Fabric</TabsTrigger>
          <TabsTrigger value="specs">Specs</TabsTrigger>
        </TabsList>

        <TabsContent value="base" className="space-y-6">
          {/* Number of Seats */}
          <div className="space-y-2">
            <Label>Number of Seats</Label>
            <Select
              value={String(configuration.numberOfSeats || 2)}
              onValueChange={(value) => updateConfiguration({ numberOfSeats: Number(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <SelectItem key={num} value={String(num)}>
                    {num} Seat{num > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recliner Mechanism */}
          <div className="space-y-2">
            <Label>Recliner Mechanism</Label>
            <RadioGroup
              value={configuration.mechanism || "Manual"}
              onValueChange={(value) => updateConfiguration({ mechanism: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Manual" id="manual" />
                <Label htmlFor="manual" className="font-normal cursor-pointer">Manual</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Electric" id="electric" />
                <Label htmlFor="electric" className="font-normal cursor-pointer">Electric</Label>
              </div>
            </RadioGroup>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          {/* Console Configuration */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Console Required (Between Seats)</Label>
              <RadioGroup
                value={configuration.console?.required || "No"}
                onValueChange={(value) => updateConfiguration({
                  console: { ...configuration.console, required: value }
                })}
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
                      <SelectItem value="Console-6 in">6 inches</SelectItem>
                      <SelectItem value="Console-10 In">10 inches</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Number of Consoles</Label>
                  <Input
                    type="number"
                    min="1"
                    max={configuration.numberOfSeats - 1}
                    value={configuration.console?.quantity || 1}
                    onChange={(e) => updateConfiguration({
                      console: { ...configuration.console, quantity: Number(e.target.value) }
                    })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum {configuration.numberOfSeats - 1} consoles for {configuration.numberOfSeats} seats
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Headrest Info */}
          {product.whether_comes_with_headrest && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm">
                <strong>Headrest:</strong> {product.whether_comes_with_headrest}
              </p>
            </div>
          )}
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
                <SelectItem value="Latex">Latex</SelectItem>
                <SelectItem value="Memory">Memory Foam</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Seat Depth (inches)</Label>
              <Select
                value={String(configuration.dimensions?.seatDepth || 24)}
                onValueChange={(value) => updateConfiguration({
                  dimensions: { ...configuration.dimensions, seatDepth: Number(value) }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="22">22"</SelectItem>
                  <SelectItem value="24">24"</SelectItem>
                  <SelectItem value="26">26"</SelectItem>
                  <SelectItem value="28">28"</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Seat Width (inches)</Label>
              <Select
                value={String(configuration.dimensions?.seatWidth || 26)}
                onValueChange={(value) => updateConfiguration({
                  dimensions: { ...configuration.dimensions, seatWidth: Number(value) }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="22">22"</SelectItem>
                  <SelectItem value="24">24"</SelectItem>
                  <SelectItem value="26">26"</SelectItem>
                  <SelectItem value="30">30"</SelectItem>
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

export default CinemaChairConfigurator;
