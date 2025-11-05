import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loadDropdownOptions } from "@/lib/pricing-engine";
import { Plus, Trash2 } from "lucide-react";
import FabricSelector from "./FabricSelector";

interface SofaConfiguratorProps {
  product: any;
  configuration: any;
  onConfigurationChange: (config: any) => void;
}

const SofaConfigurator = ({
  product,
  configuration,
  onConfigurationChange,
}: SofaConfiguratorProps) => {
  const [seats, setSeats] = useState([
    { position: "F", type: "2-Seater", qty: 1, width: 48 },
  ]);

  // Load dropdown options from database
  const { data: loungerSizes } = useQuery({
    queryKey: ["dropdown", "sofa", "lounger_size"],
    queryFn: () => loadDropdownOptions("sofa", "lounger_size"),
  });

  const { data: consoleSizes } = useQuery({
    queryKey: ["dropdown", "sofa", "console_size"],
    queryFn: () => loadDropdownOptions("sofa", "console_size"),
  });

  const { data: foamTypes } = useQuery({
    queryKey: ["dropdown", "sofa", "foam_type"],
    queryFn: () => loadDropdownOptions("sofa", "foam_type"),
  });

  const { data: seatDepths } = useQuery({
    queryKey: ["dropdown", "sofa", "seat_depth"],
    queryFn: () => loadDropdownOptions("sofa", "seat_depth"),
  });

  const { data: seatWidths } = useQuery({
    queryKey: ["dropdown", "sofa", "seat_width"],
    queryFn: () => loadDropdownOptions("sofa", "seat_width"),
  });

  useEffect(() => {
    updateConfiguration({
      productId: product.id,
      sofaType: "Standard",
      seats,
      fabric: {
        claddingPlan: "Single Colour",
        structureCode: "",
      },
      foam: {
        type: "Firm",
      },
      dimensions: {
        seatDepth: 24,
        seatWidth: 24,
        seatHeight: 18,
      },
    });
  }, [product.id]);

  const updateConfiguration = (updates: any) => {
    const newConfig = { ...configuration, ...updates };
    onConfigurationChange(newConfig);
  };

  const addSeat = () => {
    const newSeats = [
      ...seats,
      { position: `S${seats.length + 1}`, type: "1-Seater", qty: 1, width: 24 },
    ];
    setSeats(newSeats);
    updateConfiguration({ seats: newSeats });
  };

  const removeSeat = (index: number) => {
    const newSeats = seats.filter((_, i) => i !== index);
    setSeats(newSeats);
    updateConfiguration({ seats: newSeats });
  };

  const updateSeat = (index: number, field: string, value: any) => {
    const newSeats = [...seats];
    newSeats[index] = { ...newSeats[index], [field]: value };
    setSeats(newSeats);
    updateConfiguration({ seats: newSeats });
  };

  return (
    <Tabs defaultValue="base" className="w-full">
      <TabsList className="grid grid-cols-5 w-full">
        <TabsTrigger value="base">Base</TabsTrigger>
        <TabsTrigger value="features">Features</TabsTrigger>
        <TabsTrigger value="fabric">Fabric</TabsTrigger>
        <TabsTrigger value="specs">Specs</TabsTrigger>
        <TabsTrigger value="accessories">Accessories</TabsTrigger>
      </TabsList>

      {/* Base Configuration */}
      <TabsContent value="base" className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>Sofa Type</Label>
            <Select
              value={configuration.sofaType || "Standard"}
              onValueChange={(value) => updateConfiguration({ sofaType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="L Shape">L Shape</SelectItem>
                <SelectItem value="U Shape">U Shape</SelectItem>
                <SelectItem value="Combo">Combo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Seats Configuration</Label>
              <Button onClick={addSeat} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Seat
              </Button>
            </div>
            <div className="space-y-3">
              {seats.map((seat, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">Position</Label>
                        <Input
                          value={seat.position}
                          onChange={(e) =>
                            updateSeat(index, "position", e.target.value)
                          }
                          placeholder="F, L1, R1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={seat.type}
                          onValueChange={(value) =>
                            updateSeat(index, "type", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-Seater">1-Seater</SelectItem>
                            <SelectItem value="2-Seater">2-Seater</SelectItem>
                            <SelectItem value="3-Seater">3-Seater</SelectItem>
                            <SelectItem value="4-Seater">4-Seater</SelectItem>
                            <SelectItem value="Corner">Corner</SelectItem>
                            <SelectItem value="Backrest">Backrest</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Width (in)</Label>
                        <Input
                          type="number"
                          value={seat.width}
                          onChange={(e) =>
                            updateSeat(index, "width", parseInt(e.target.value))
                          }
                        />
                      </div>
                      <div className="flex items-end">
                        {seats.length > 1 && (
                          <Button
                            onClick={() => removeSeat(index)}
                            size="sm"
                            variant="destructive"
                            className="w-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Features */}
      <TabsContent value="features" className="space-y-6">
        {/* Lounger */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Lounger</Label>
              <Select
                value={configuration.lounger?.required ? "Yes" : "No"}
                onValueChange={(value) =>
                  updateConfiguration({
                    lounger: {
                      ...configuration.lounger,
                      required: value === "Yes",
                    },
                  })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {configuration.lounger?.required && (
              <>
                <div>
                  <Label>Lounger Size</Label>
                  <Select
                    value={configuration.lounger?.size}
                    onValueChange={(value) =>
                      updateConfiguration({
                        lounger: { ...configuration.lounger, size: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {loungerSizes?.map((option) => (
                        <SelectItem key={option.id} value={option.option_value}>
                          {option.display_label || option.option_value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Quantity</Label>
                  <Select
                    value={configuration.lounger?.quantity?.toString() || "1"}
                    onValueChange={(value) =>
                      updateConfiguration({
                        lounger: {
                          ...configuration.lounger,
                          quantity: parseInt(value),
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Storage</Label>
                  <Select
                    value={configuration.lounger?.storage || "No"}
                    onValueChange={(value) =>
                      updateConfiguration({
                        lounger: { ...configuration.lounger, storage: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Console */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Console</Label>
              <Select
                value={configuration.console?.required ? "Yes" : "No"}
                onValueChange={(value) =>
                  updateConfiguration({
                    console: {
                      ...configuration.console,
                      required: value === "Yes",
                    },
                  })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {configuration.console?.required && (
              <>
                <div>
                  <Label>Console Size</Label>
                  <Select
                    value={configuration.console?.size}
                    onValueChange={(value) =>
                      updateConfiguration({
                        console: { ...configuration.console, size: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {consoleSizes?.map((option) => (
                        <SelectItem key={option.id} value={option.option_value}>
                          {option.display_label || option.option_value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={configuration.console?.quantity || 1}
                    onChange={(e) =>
                      updateConfiguration({
                        console: {
                          ...configuration.console,
                          quantity: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Fabric Selection */}
      <TabsContent value="fabric">
        <FabricSelector
          configuration={configuration}
          onConfigurationChange={updateConfiguration}
        />
      </TabsContent>

      {/* Specifications */}
      <TabsContent value="specs" className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Foam Type</Label>
            <Select
              value={configuration.foam?.type || "Firm"}
              onValueChange={(value) =>
                updateConfiguration({ foam: { type: value } })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {foamTypes?.map((option) => (
                  <SelectItem key={option.id} value={option.option_value}>
                    {option.option_value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Seat Depth (inches)</Label>
            <Select
              value={configuration.dimensions?.seatDepth?.toString() || "24"}
              onValueChange={(value) =>
                updateConfiguration({
                  dimensions: {
                    ...configuration.dimensions,
                    seatDepth: parseInt(value),
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {seatDepths?.map((option) => (
                  <SelectItem key={option.id} value={option.option_value}>
                    {option.option_value}"
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Seat Width (inches)</Label>
            <Select
              value={configuration.dimensions?.seatWidth?.toString() || "24"}
              onValueChange={(value) =>
                updateConfiguration({
                  dimensions: {
                    ...configuration.dimensions,
                    seatWidth: parseInt(value),
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {seatWidths?.map((option) => (
                  <SelectItem key={option.id} value={option.option_value}>
                    {option.option_value}"
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Seat Height (inches)</Label>
            <Select
              value={configuration.dimensions?.seatHeight?.toString() || "18"}
              onValueChange={(value) =>
                updateConfiguration({
                  dimensions: {
                    ...configuration.dimensions,
                    seatHeight: parseInt(value),
                  },
                })
              }
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

      {/* Accessories */}
      <TabsContent value="accessories" className="space-y-6">
        <div className="text-center py-12 text-muted-foreground">
          Accessories selection coming soon
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default SofaConfigurator;
