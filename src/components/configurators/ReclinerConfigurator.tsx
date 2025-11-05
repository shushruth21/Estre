import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import FabricSelector from "./FabricSelector";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { Skeleton } from "@/components/ui/skeleton";

interface ReclinerConfiguratorProps {
  product: any;
  configuration: any;
  onConfigurationChange: (config: any) => void;
}

const ReclinerConfigurator = ({ product, configuration, onConfigurationChange }: ReclinerConfiguratorProps) => {
  const [seats, setSeats] = useState<any[]>([]);
  
  // Fetch dropdown options
  const { data: baseShapes, isLoading: loadingShapes } = useDropdownOptions("recliner", "base_shape");
  const { data: seatTypes, isLoading: loadingSeats } = useDropdownOptions("recliner", "seat_type");
  const { data: mechanismTypesFront, isLoading: loadingMechanismsFront } = useDropdownOptions("recliner", "mechanism_type");
  const { data: mechanismTypesLeft, isLoading: loadingMechanismsLeft } = useDropdownOptions("recliner", "mechanism_type");
  const { data: consoleSizes, isLoading: loadingConsoles } = useDropdownOptions("common", "console_size");
  const { data: foamTypes, isLoading: loadingFoam } = useDropdownOptions("common", "foam_type");
  const { data: seatDepths } = useDropdownOptions("recliner", "seat_depth");
  const { data: seatWidths } = useDropdownOptions("recliner", "seat_width");
  const { data: seatHeights } = useDropdownOptions("recliner", "seat_height");

  useEffect(() => {
    if (!configuration.productId) {
      const initialSeats = [{ position: "F", type: "1-Seater", qty: 1, width: 26 }];
      setSeats(initialSeats);
      onConfigurationChange({
        productId: product.id,
        category: "recliner",
        baseShape: "STANDARD",
        seats: initialSeats,
        mechanism: {
          front: "Manual",
        },
        console: {
          required: "No",
          quantity: 0,
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
    } else if (configuration.seats) {
      setSeats(configuration.seats);
    }
  }, [product.id, configuration.productId, onConfigurationChange]);

  const updateConfiguration = (updates: any) => {
    onConfigurationChange({ ...configuration, ...updates });
  };

  const addSeat = () => {
    const newSeat = { position: `R${seats.length}`, type: "1-Seater", qty: 1, width: 26 };
    const updatedSeats = [...seats, newSeat];
    setSeats(updatedSeats);
    updateConfiguration({ seats: updatedSeats });
  };

  const removeSeat = (index: number) => {
    const updatedSeats = seats.filter((_, i) => i !== index);
    setSeats(updatedSeats);
    updateConfiguration({ seats: updatedSeats });
  };

  const updateSeat = (index: number, field: string, value: any) => {
    const updatedSeats = seats.map((seat, i) =>
      i === index ? { ...seat, [field]: value } : seat
    );
    setSeats(updatedSeats);
    updateConfiguration({ seats: updatedSeats });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="base" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="base">Base</TabsTrigger>
          <TabsTrigger value="features">Mechanism</TabsTrigger>
          <TabsTrigger value="fabric">Fabric</TabsTrigger>
          <TabsTrigger value="specs">Specs</TabsTrigger>
        </TabsList>

        <TabsContent value="base" className="space-y-6">
          {/* Base Shape */}
          <div className="space-y-2">
            <Label>Base Shape</Label>
            <RadioGroup
              value={configuration.baseShape || "STANDARD"}
              onValueChange={(value) => updateConfiguration({ baseShape: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="STANDARD" id="standard" />
                <Label htmlFor="standard" className="font-normal cursor-pointer">Standard</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="L SHAPE" id="lshape" />
                <Label htmlFor="lshape" className="font-normal cursor-pointer">L Shape</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Seats Configuration */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Seat Configuration</Label>
              <Button onClick={addSeat} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Seat
              </Button>
            </div>
            {seats.map((seat, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="font-semibold">Seat {index + 1}</Label>
                  {seats.length > 1 && (
                    <Button
                      onClick={() => removeSeat(index)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Input
                      value={seat.position}
                      onChange={(e) => updateSeat(index, "position", e.target.value)}
                      placeholder="F, R1, L1, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={seat.type}
                      onValueChange={(value) => updateSeat(index, "type", value)}
                    >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {seatTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.option_value}>
                          {type.display_label || type.option_value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Width (inches)</Label>
                    <Input
                      type="number"
                      value={seat.width}
                      onChange={(e) => updateSeat(index, "width", Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          {/* Front Mechanism */}
          <div className="space-y-2">
            <Label>Front Recliner Mechanism</Label>
            <Select
              value={configuration.mechanism?.front || "Manual"}
              onValueChange={(value) => updateConfiguration({
                mechanism: { ...configuration.mechanism, front: value }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manual">Manual</SelectItem>
                <SelectItem value="Manual-RRR">Manual RRR</SelectItem>
                <SelectItem value="Electric">Electric</SelectItem>
                <SelectItem value="Electric-RRR">Electric RRR</SelectItem>
                <SelectItem value="Only Sofa">Only Sofa (No Recliner)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* L Shape Left Mechanism */}
          {configuration.baseShape === "L SHAPE" && (
            <div className="space-y-2">
              <Label>Left Recliner Mechanism</Label>
              <Select
                value={configuration.mechanism?.left || "Manual"}
                onValueChange={(value) => updateConfiguration({
                  mechanism: { ...configuration.mechanism, left: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="Manual-RRR">Manual RRR</SelectItem>
                  <SelectItem value="Electric">Electric</SelectItem>
                  <SelectItem value="Electric-RRR">Electric RRR</SelectItem>
                  <SelectItem value="Only Sofa">Only Sofa (No Recliner)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Console */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Console Required</Label>
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
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={configuration.console?.quantity || 1}
                    onChange={(e) => updateConfiguration({
                      console: { ...configuration.console, quantity: Number(e.target.value) }
                    })}
                  />
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
                value={String(configuration.dimensions?.seatDepth || 24)}
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
                value={String(configuration.dimensions?.seatWidth || 26)}
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

export default ReclinerConfigurator;
