import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import FabricSelector from "./FabricSelector";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

interface SofaBedConfiguratorProps {
  product: any;
  configuration: any;
  onConfigurationChange: (config: any) => void;
}

const SofaBedConfigurator = ({ product, configuration, onConfigurationChange }: SofaBedConfiguratorProps) => {
  // Fetch dropdown options
  const { data: shapes } = useDropdownOptions("sofabed", "base_shape");
  const { data: seatTypes } = useDropdownOptions("sofabed", "seat_type");
  const { data: foamTypes } = useDropdownOptions("common", "foam_type");
  const { data: seatDepths } = useDropdownOptions("sofabed", "seat_depth");
  const { data: seatWidths } = useDropdownOptions("sofabed", "seat_width");
  const { data: consoleSizes } = useDropdownOptions("common", "console_size");
  
  // Load accessories for consoles
  const { data: consoleAccessories } = useQuery({
    queryKey: ["sofabed-console-accessories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accessories_prices")
        .select("id, description, sale_price")
        .eq("is_active", true)
        .order("description");
      if (error) throw error;
      return data || [];
    },
  });

  // Helper functions
  const parseSeatCount = (seaterType: string): number => {
    if (!seaterType) return 0;
    const lower = seaterType.toLowerCase();
    if (lower.includes("4-seater")) return 4;
    if (lower.includes("3-seater")) return 3;
    if (lower.includes("2-seater")) return 2;
    if (lower.includes("1-seater")) return 1;
    return 0;
  };

  const getTotalSeats = (): number => {
    let total = 0;
    const sections = configuration.sections || {};
    
    ["F", "L2", "R2", "C2"].forEach((sectionId) => {
      const section = sections[sectionId];
      if (section?.seater && section.seater !== "none") {
        const seatCount = parseSeatCount(section.seater);
        const qty = section.qty || 1;
        total += seatCount * qty;
      }
    });
    
    return total;
  };

  const getMaxConsoles = (): number => {
    return Math.max(0, getTotalSeats() - 1);
  };

  const getSectionOptions = (sectionId: string): string[] => {
    if (["F", "L2", "R2", "C2"].includes(sectionId)) {
      return ["2-Seater", "3-Seater", "4-Seater", "2-Seater No Mech", "3-Seater No Mech", "4-Seater No Mech", "none"];
    }
    if (["L1", "R1"].includes(sectionId)) {
      return ["Corner", "Backrest", "none"];
    }
    if (sectionId === "C1") {
      return ["Backrest", "none"];
    }
    return ["none"];
  };

  const updateConfiguration = (updates: any) => {
    onConfigurationChange({ ...configuration, ...updates });
  };

  useEffect(() => {
    if (!configuration.productId) {
      onConfigurationChange({
        productId: product.id,
        category: "sofabed",
        baseShape: "STANDARD",
        sections: {
          F: { seater: "2-Seater", qty: 1 },
        },
        lounger: {
          required: "No",
          numberOfLoungers: "1 No.",
          size: "Lounger-5 ft 6 in",
          placement: "LHS",
          storage: "No",
        },
        recliner: {
          F: { required: "No", numberOfRecliners: 0 },
          L: { required: "No", numberOfRecliners: 0 },
          R: { required: "No", numberOfRecliners: 0 },
          C: { required: "No", numberOfRecliners: 0 },
        },
        console: {
          required: "No",
          quantity: 0,
          size: "Console-6 in",
          placements: [],
          accessories: [],
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
        },
      });
    }
  }, [product.id, configuration.productId, onConfigurationChange]);

  const shape = configuration.baseShape || "STANDARD";
  const sections = configuration.sections || {};
  const maxConsoles = getMaxConsoles();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="base" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="base">Base</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="fabric">Fabric</TabsTrigger>
          <TabsTrigger value="specs">Specs</TabsTrigger>
          <TabsTrigger value="recliner">Recliner</TabsTrigger>
        </TabsList>

        <TabsContent value="base" className="space-y-6">
          {/* Shape Selection */}
          <div className="space-y-2">
            <Label>Base Shape</Label>
            <Select
              value={shape}
              onValueChange={(value) => {
                const newSections: any = { F: sections.F || { seater: "2-Seater", qty: 1 } };
                
                if (value === "L SHAPE" || value === "U SHAPE" || value === "COMBO") {
                  newSections.L1 = sections.L1 || { seater: "Corner", qty: 1 };
                  newSections.L2 = sections.L2 || { seater: "2-Seater", qty: 1 };
                }
                if (value === "U SHAPE" || value === "COMBO") {
                  newSections.R1 = sections.R1 || { seater: "Corner", qty: 1 };
                  newSections.R2 = sections.R2 || { seater: "2-Seater", qty: 1 };
                }
                if (value === "COMBO") {
                  newSections.C1 = sections.C1 || { seater: "Backrest", qty: 1 };
                  newSections.C2 = sections.C2 || { seater: "2-Seater", qty: 1 };
                }
                
                updateConfiguration({ baseShape: value, sections: newSections });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {shapes?.map((shape) => (
                  <SelectItem key={shape.id} value={shape.option_value}>
                    {shape.display_label || shape.option_value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section Configuration */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Section Configuration</Label>
            
            {/* F Section */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <Label>Front Section (F)</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Seater Type</Label>
                    <Select
                      value={sections.F?.seater || "2-Seater"}
                      onValueChange={(value) => {
                        updateConfiguration({
                          sections: {
                            ...sections,
                            F: { ...sections.F, seater: value, qty: sections.F?.qty || 1 },
                          },
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getSectionOptions("F").map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={sections.F?.qty || 1}
                      onChange={(e) => {
                        updateConfiguration({
                          sections: {
                            ...sections,
                            F: { ...sections.F, qty: Number(e.target.value) },
                          },
                        });
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* L1 & L2 Sections (for L, U, Combo) */}
            {(shape === "L SHAPE" || shape === "U SHAPE" || shape === "COMBO") && (
              <>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <Label>Left Corner (L1)</Label>
                    <Select
                      value={sections.L1?.seater || "Corner"}
                      onValueChange={(value) => {
                        updateConfiguration({
                          sections: {
                            ...sections,
                            L1: { ...sections.L1, seater: value, qty: sections.L1?.qty || 1 },
                          },
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getSectionOptions("L1").map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 space-y-3">
                    <Label>Left Section (L2)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Seater Type</Label>
                        <Select
                          value={sections.L2?.seater || "2-Seater"}
                          onValueChange={(value) => {
                            updateConfiguration({
                              sections: {
                                ...sections,
                                L2: { ...sections.L2, seater: value, qty: sections.L2?.qty || 1 },
                              },
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getSectionOptions("L2").map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={sections.L2?.qty || 1}
                          onChange={(e) => {
                            updateConfiguration({
                              sections: {
                                ...sections,
                                L2: { ...sections.L2, qty: Number(e.target.value) },
                              },
                            });
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* R1 & R2 Sections (for U, Combo) */}
            {(shape === "U SHAPE" || shape === "COMBO") && (
              <>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <Label>Right Corner (R1)</Label>
                    <Select
                      value={sections.R1?.seater || "Corner"}
                      onValueChange={(value) => {
                        updateConfiguration({
                          sections: {
                            ...sections,
                            R1: { ...sections.R1, seater: value, qty: sections.R1?.qty || 1 },
                          },
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getSectionOptions("R1").map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 space-y-3">
                    <Label>Right Section (R2)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Seater Type</Label>
                        <Select
                          value={sections.R2?.seater || "2-Seater"}
                          onValueChange={(value) => {
                            updateConfiguration({
                              sections: {
                                ...sections,
                                R2: { ...sections.R2, seater: value, qty: sections.R2?.qty || 1 },
                              },
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getSectionOptions("R2").map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={sections.R2?.qty || 1}
                          onChange={(e) => {
                            updateConfiguration({
                              sections: {
                                ...sections,
                                R2: { ...sections.R2, qty: Number(e.target.value) },
                              },
                            });
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* C1 & C2 Sections (for Combo) */}
            {shape === "COMBO" && (
              <>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <Label>Center Backrest (C1)</Label>
                    <Select
                      value={sections.C1?.seater || "Backrest"}
                      onValueChange={(value) => {
                        updateConfiguration({
                          sections: {
                            ...sections,
                            C1: { ...sections.C1, seater: value, qty: sections.C1?.qty || 1 },
                          },
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getSectionOptions("C1").map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 space-y-3">
                    <Label>Center Section (C2)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Seater Type</Label>
                        <Select
                          value={sections.C2?.seater || "2-Seater"}
                          onValueChange={(value) => {
                            updateConfiguration({
                              sections: {
                                ...sections,
                                C2: { ...sections.C2, seater: value, qty: sections.C2?.qty || 1 },
                              },
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getSectionOptions("C2").map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={sections.C2?.qty || 1}
                          onChange={(e) => {
                            updateConfiguration({
                              sections: {
                                ...sections,
                                C2: { ...sections.C2, qty: Number(e.target.value) },
                              },
                            });
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Total Seats Display */}
            <Card className="bg-muted">
              <CardContent className="p-4">
                <p className="text-sm font-medium">Total Seats</p>
                <p className="text-2xl font-bold">{getTotalSeats()}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          {/* Lounger Configuration */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Lounger</Label>
            <RadioGroup
              value={configuration.lounger?.required || "No"}
              onValueChange={(value) => {
                updateConfiguration({
                  lounger: {
                    ...configuration.lounger,
                    required: value,
                  },
                });
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Yes" id="lounger-yes" />
                <Label htmlFor="lounger-yes" className="font-normal cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="No" id="lounger-no" />
                <Label htmlFor="lounger-no" className="font-normal cursor-pointer">No</Label>
              </div>
            </RadioGroup>

            {configuration.lounger?.required === "Yes" && (
              <>
                <div className="space-y-2">
                  <Label>Number of Loungers</Label>
                  <Select
                    value={configuration.lounger?.numberOfLoungers || "1 No."}
                    onValueChange={(value) => {
                      updateConfiguration({
                        lounger: {
                          ...configuration.lounger,
                          numberOfLoungers: value,
                          placement: value === "2 Nos." ? "Both" : configuration.lounger?.placement || "LHS",
                        },
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 No.">1 No.</SelectItem>
                      <SelectItem value="2 Nos.">2 Nos.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Lounger Size</Label>
                  <Select
                    value={configuration.lounger?.size || "Lounger-5 ft 6 in"}
                    onValueChange={(value) => {
                      updateConfiguration({
                        lounger: {
                          ...configuration.lounger,
                          size: value,
                        },
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lounger-5 ft">5 ft</SelectItem>
                      <SelectItem value="Lounger-5 ft 6 in">5 ft 6 in</SelectItem>
                      <SelectItem value="Lounger-6 ft">6 ft</SelectItem>
                      <SelectItem value="Lounger-6 ft 6 in">6 ft 6 in</SelectItem>
                      <SelectItem value="Lounger-7 ft">7 ft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Placement</Label>
                  <Select
                    value={configuration.lounger?.placement || "LHS"}
                    onValueChange={(value) => {
                      updateConfiguration({
                        lounger: {
                          ...configuration.lounger,
                          placement: value,
                        },
                      });
                    }}
                    disabled={configuration.lounger?.numberOfLoungers === "2 Nos."}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {configuration.lounger?.numberOfLoungers === "2 Nos." ? (
                        <SelectItem value="Both">Both</SelectItem>
                      ) : (
                        <>
                          <SelectItem value="LHS">LHS</SelectItem>
                          <SelectItem value="RHS">RHS</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Storage</Label>
                  <RadioGroup
                    value={configuration.lounger?.storage || "No"}
                    onValueChange={(value) => {
                      updateConfiguration({
                        lounger: {
                          ...configuration.lounger,
                          storage: value,
                        },
                      });
                    }}
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
              </>
            )}
          </div>

          {/* Console Configuration */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Console</Label>
            <RadioGroup
              value={configuration.console?.required || "No"}
              onValueChange={(value) => {
                updateConfiguration({
                  console: {
                    ...configuration.console,
                    required: value,
                    quantity: value === "Yes" ? Math.min(configuration.console?.quantity || 1, maxConsoles) : 0,
                    placements: value === "Yes" ? (configuration.console?.placements || Array(maxConsoles).fill(null)) : [],
                    accessories: value === "Yes" ? (configuration.console?.accessories || Array(maxConsoles).fill(null)) : [],
                  },
                });
              }}
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

            {configuration.console?.required === "Yes" && (
              <>
                <div className="space-y-2">
                  <Label>Console Size</Label>
                  <Select
                    value={configuration.console?.size || "Console-6 in"}
                    onValueChange={(value) => {
                      updateConfiguration({
                        console: {
                          ...configuration.console,
                          size: value,
                        },
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Console-6 in">6 inches (₹8,000)</SelectItem>
                      <SelectItem value="Console-10 In">10 inches (₹12,000)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Number of Consoles</Label>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-sm font-medium">
                      {maxConsoles} console{maxConsoles !== 1 ? 's' : ''} available
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Formula: {getTotalSeats()} seats - 1 = {maxConsoles} console{maxConsoles !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max={maxConsoles}
                    value={configuration.console?.quantity || 0}
                    onChange={(e) => {
                      const qty = Math.min(Math.max(0, Number(e.target.value)), maxConsoles);
                      const currentPlacements = configuration.console?.placements || [];
                      const currentAccessories = configuration.console?.accessories || [];
                      updateConfiguration({
                        console: {
                          ...configuration.console,
                          quantity: qty,
                          placements: Array(qty).fill(null).map((_, i) => currentPlacements[i] || null),
                          accessories: Array(qty).fill(null).map((_, i) => currentAccessories[i] || null),
                        },
                      });
                    }}
                  />
                </div>

                {/* Console Placements */}
                {configuration.console?.quantity > 0 && (
                  <div className="space-y-3">
                    <Label>Console Placements</Label>
                    {Array.from({ length: configuration.console.quantity }).map((_, index) => {
                      const seatCount = getTotalSeats();
                      const placementOptions = Array.from({ length: seatCount - 1 }, (_, i) => ({
                        value: `after_${i + 1}`,
                        label: `After ${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} Seat from Left`,
                      }));
                      
                      return (
                        <div key={index} className="space-y-2">
                          <Label className="text-sm">Console {index + 1} Placement</Label>
                          <Select
                            value={configuration.console?.placements?.[index] || "none"}
                            onValueChange={(value) => {
                              const placements = [...(configuration.console?.placements || [])];
                              placements[index] = value === "none" ? null : value;
                              updateConfiguration({
                                console: { ...configuration.console, placements }
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select placement" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None (Unassigned)</SelectItem>
                              {placementOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {/* Console Accessory */}
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Console {index + 1} Accessory</Label>
                            <Select
                              value={configuration.console?.accessories?.[index] || "none"}
                              onValueChange={(value) => {
                                const accessories = [...(configuration.console?.accessories || [])];
                                accessories[index] = value === "none" ? null : value;
                                updateConfiguration({
                                  console: {
                                    ...configuration.console,
                                    accessories,
                                  }
                                });
                              }}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select accessory" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {consoleAccessories?.map((acc: any) => (
                                  <SelectItem key={acc.id} value={acc.id.toString()}>
                                    {acc.description} - ₹{acc.sale_price?.toLocaleString() || 0}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
              onValueChange={(value) => {
                updateConfiguration({
                  foam: { type: value }
                });
              }}
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

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Seat Depth (inches)</Label>
              <Select
                value={String(configuration.dimensions?.seatDepth || 22)}
                onValueChange={(value) => {
                  updateConfiguration({
                    dimensions: {
                      ...configuration.dimensions,
                      seatDepth: Number(value)
                    }
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seatDepths?.map((depth) => {
                    const metadata = depth.metadata || {};
                    const upgradePercent = metadata.upgrade_percent || 0;
                    const upgradeLabel = upgradePercent > 0 ? ` (+${(upgradePercent * 100).toFixed(1)}%)` : " (Standard)";
                    return (
                      <SelectItem key={depth.id} value={depth.option_value}>
                        {depth.display_label || depth.option_value}{upgradeLabel}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Seat Width (inches)</Label>
              <Select
                value={String(configuration.dimensions?.seatWidth || 24)}
                onValueChange={(value) => {
                  updateConfiguration({
                    dimensions: {
                      ...configuration.dimensions,
                      seatWidth: Number(value)
                    }
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {seatWidths?.map((width) => {
                    const metadata = width.metadata || {};
                    const upgradePercent = metadata.upgrade_percent || 0;
                    const upgradeLabel = upgradePercent > 0 ? ` (+${(upgradePercent * 100).toFixed(1)}%)` : " (Standard)";
                    return (
                      <SelectItem key={width.id} value={width.option_value}>
                        {width.display_label || width.option_value}{upgradeLabel}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recliner" className="space-y-6">
          <Label className="text-lg font-semibold">Recliner Mechanism</Label>
          <p className="text-sm text-muted-foreground">Configure electric recliner mechanisms per section (₹14,000 per recliner)</p>
          
          {["F", "L", "R", "C"].map((section) => {
            const sectionKey = section as "F" | "L" | "R" | "C";
            const reclinerData = configuration.recliner?.[sectionKey] || { required: "No", numberOfRecliners: 0 };
            
            return (
              <Card key={section}>
                <CardContent className="p-4 space-y-3">
                  <Label>{section === "F" ? "Front" : section === "L" ? "Left" : section === "R" ? "Right" : "Center"} Section</Label>
                  <RadioGroup
                    value={reclinerData.required || "No"}
                    onValueChange={(value) => {
                      updateConfiguration({
                        recliner: {
                          ...configuration.recliner,
                          [sectionKey]: {
                            ...reclinerData,
                            required: value,
                            numberOfRecliners: value === "Yes" ? reclinerData.numberOfRecliners || 1 : 0,
                          },
                        },
                      });
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Yes" id={`recliner-${section}-yes`} />
                      <Label htmlFor={`recliner-${section}-yes`} className="font-normal cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="No" id={`recliner-${section}-no`} />
                      <Label htmlFor={`recliner-${section}-no`} className="font-normal cursor-pointer">No</Label>
                    </div>
                  </RadioGroup>
                  
                  {reclinerData.required === "Yes" && (
                    <div className="space-y-2">
                      <Label className="text-sm">Number of Recliners</Label>
                      <Input
                        type="number"
                        min="1"
                        value={reclinerData.numberOfRecliners || 1}
                        onChange={(e) => {
                          updateConfiguration({
                            recliner: {
                              ...configuration.recliner,
                              [sectionKey]: {
                                ...reclinerData,
                                numberOfRecliners: Number(e.target.value),
                              },
                            },
                          });
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SofaBedConfigurator;

