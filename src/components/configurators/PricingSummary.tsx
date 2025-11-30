import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, ShoppingCart } from "lucide-react";
import { SummaryTile } from "@/components/ui/SummaryTile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { getFirstImageUrl } from "@/lib/image-utils";

interface PricingSummaryProps {
  pricing: any;
  isCalculating: boolean;
  onAddToCart: () => void;
  configuration: any;
  isAddingToCart?: boolean;
}

const PricingSummary = ({
  pricing,
  isCalculating,
  onAddToCart,
  configuration,
  isAddingToCart = false,
}: PricingSummaryProps) => {
  // Check if configuration is complete based on category
  const isConfigComplete = (() => {
    if (!configuration.productId) return false;

    // Check for fabric selection (required for most categories)
    if (!configuration.fabric?.structureCode && !configuration.fabric?.claddingPlan) {
      return false;
    }

    // Category-specific checks
    const category = configuration.category || "";

    if (category === "sofa") {
      return !!(configuration.frontSeatCount || configuration.frontSeats || configuration.seats?.length > 0);
    }

    if (category === "bed" || category === "kids_bed") {
      return !!(configuration.bedSize);
    }

    if (category === "recliner" || category === "cinema_chairs") {
      return !!(configuration.seats?.length > 0 || configuration.numberOfSeats);
    }

    if (category === "dining_chairs" || category === "arm_chairs") {
      return !!(configuration.quantity || true); // Quantity optional
    }

    if (category === "benches" || category === "database_pouffes") {
      return !!(configuration.seatingCapacity || configuration.qty || true);
    }

    // Default: fabric selection is enough
    return true;
  })();

  // Fetch fabric details for display
  const fabricCode = configuration.fabric?.structureCode;
  const { data: fabricDetails } = useQuery({
    queryKey: ["fabric-details", fabricCode],
    queryFn: async () => {
      if (!fabricCode) return null;
      const { data, error } = await supabase
        .from("fabric_coding")
        .select("*")
        .eq("estre_code", fabricCode)
        .single();

      if (error) return null;
      return data;
    },
    enabled: !!fabricCode,
  });

  const fabricImageUrl = fabricDetails
    ? (getFirstImageUrl(fabricDetails.colour_link) || getFirstImageUrl(fabricDetails.colour))
    : null;

  return (
    <Card className="border border-gold/20 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-walnut text-ivory rounded-t-xl py-4">
        <CardTitle className="text-2xl font-serif text-gold">Summary</CardTitle>
        <CardDescription className="text-ivory/70">Live pricing snapshot based on current selections.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {isCalculating ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gold" />
          </div>
        ) : pricing ? (
          <>
            <div className="grid grid-cols-1 gap-3">
              {/* Bed-specific pricing summary */}
              {(configuration.category === "bed" || configuration.category === "kids_bed") ? (
                <>
                  <SummaryTile label="Base Model" value={`₹${Math.round(pricing.breakdown.basePrice || 0).toLocaleString()}`} />
                  <SummaryTile label="Dimension Upgrade" value={`₹${Math.round(pricing.breakdown.dimensionUpgrade || 0).toLocaleString()}`} />
                  <SummaryTile label="Storage Price" value={`₹${Math.round(pricing.breakdown.storagePrice || 0).toLocaleString()}`} />
                  <SummaryTile label="Fabric Cost" value={`₹${Math.round(pricing.breakdown.fabricCharges || 0).toLocaleString()}`} />
                  <SummaryTile label="Total Fabric (m)" value={`${(pricing.breakdown.fabricMeters || 0) > 0 ? (pricing.breakdown.fabricMeters || 0).toFixed(1) : "0.0"} m`} />
                  {(pricing.breakdown.accessoriesPrice || 0) > 0 && (
                    <SummaryTile label="Legs & Accessories" value={`₹${Math.round(pricing.breakdown.accessoriesPrice || 0).toLocaleString()}`} />
                  )}
                </>
              ) : (
                <>
                  {/* Sofa & Other Categories Pricing Summary */}
                  {(() => {
                    const baseProductCost = pricing.breakdown.baseSeatPrice > 0
                      ? pricing.breakdown.baseSeatPrice
                      : (pricing.breakdown.basePrice || 0);
                    return <SummaryTile label="Base Model" value={`₹${Math.round(baseProductCost).toLocaleString()}`} />;
                  })()}

                  {/* Additional Seats */}
                  {(pricing.breakdown.additionalSeatsPrice > 0 || pricing.breakdown.cornerSeatsPrice > 0 || pricing.breakdown.backrestSeatsPrice > 0) && (
                    <SummaryTile
                      label="Additional Seats"
                      value={`₹${Math.round((pricing.breakdown.additionalSeatsPrice || 0) + (pricing.breakdown.cornerSeatsPrice || 0) + (pricing.breakdown.backrestSeatsPrice || 0)).toLocaleString()}`}
                    />
                  )}

                  {/* Lounger */}
                  {(pricing.breakdown.loungerPrice || 0) > 0 && (
                    <SummaryTile label="Lounger" value={`₹${Math.round(pricing.breakdown.loungerPrice).toLocaleString()}`} />
                  )}

                  {/* Consoles */}
                  {(pricing.breakdown.consolePrice || 0) > 0 && (
                    <SummaryTile label="Consoles" value={`₹${Math.round(pricing.breakdown.consolePrice).toLocaleString()}`} />
                  )}

                  {/* Pillows */}
                  {(pricing.breakdown.pillowsPrice || 0) > 0 && (
                    <SummaryTile label="Pillows" value={`₹${Math.round(pricing.breakdown.pillowsPrice).toLocaleString()}`} />
                  )}

                  {/* Pillow Fabric */}
                  {(pricing.breakdown.pillowFabricPrice || 0) > 0 && (
                    <SummaryTile label="Pillow Fabric" value={`₹${Math.round(pricing.breakdown.pillowFabricPrice).toLocaleString()}`} />
                  )}

                  {/* Sofa Fabric */}
                  <SummaryTile label="Sofa Fabric Price" value={`₹${Math.round(pricing.breakdown.fabricCharges || 0).toLocaleString()}`} />

                  {/* Foam Upgrade */}
                  {(pricing.breakdown.foamUpgrade || 0) > 0 && (
                    <SummaryTile label="Foam Upgrade" value={`₹${Math.round(pricing.breakdown.foamUpgrade).toLocaleString()}`} />
                  )}

                  {/* Seat Depth Upgrade */}
                  {/* Note: dimensionUpgrade combines depth and width, but if we want to separate them we need to update backend or just show combined */}
                  {/* For now, showing combined Dimension Upgrade if > 0 */}
                  {(pricing.breakdown.dimensionUpgrade || 0) > 0 && (
                    <SummaryTile label="Dimension Upgrade" value={`₹${Math.round(pricing.breakdown.dimensionUpgrade).toLocaleString()}`} />
                  )}

                  {/* Armrest Upgrade */}
                  {(pricing.breakdown.armrestUpgrade || 0) > 0 && (
                    <SummaryTile label="Armrest Upgrade" value={`₹${Math.round(pricing.breakdown.armrestUpgrade).toLocaleString()}`} />
                  )}

                  {/* Accessories (Legs) */}
                  {(pricing.breakdown.accessoriesPrice || 0) > 0 && (
                    <SummaryTile label="Legs & Accessories" value={`₹${Math.round(pricing.breakdown.accessoriesPrice).toLocaleString()}`} />
                  )}

                  {/* Mechanism */}
                  {(pricing.breakdown.mechanismUpgrade || 0) > 0 && (
                    <SummaryTile label="Mechanism" value={`₹${Math.round(pricing.breakdown.mechanismUpgrade).toLocaleString()}`} />
                  )}

                  {/* Fabric Meters Display */}
                  <SummaryTile label="Total Fabric (m)" value={`${(pricing.breakdown.fabricMeters || 0) > 0 ? (pricing.breakdown.fabricMeters || 0).toFixed(1) : "0.0"} m`} />

                  {typeof pricing.breakdown.seatBackrestFabric === "number" && pricing.breakdown.seatBackrestFabric > 0 && (
                    <SummaryTile label="Seat/Backrest Fabric" value={`${pricing.breakdown.seatBackrestFabric.toFixed(1)} m`} />
                  )}
                  {typeof pricing.breakdown.structureFabric === "number" && pricing.breakdown.structureFabric > 0 && (
                    <SummaryTile label="Structure/Armrest Fabric" value={`${pricing.breakdown.structureFabric.toFixed(1)} m`} />
                  )}
                  {typeof pricing.breakdown.approxWidth === "number" && (
                    <SummaryTile label="Approx Width" value={`${Math.round(pricing.breakdown.approxWidth)}"`} />
                  )}
                </>
              )}
            </div>

            {/* Fabric Preview Section */}
            {fabricDetails && (
              <>
                <Separator className="bg-gold/20" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-walnut">Selected Fabric</p>
                  <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg border border-gold/10">
                    <div
                      className="w-12 h-12 rounded-md border border-gray-200 shadow-sm flex-shrink-0 bg-cover bg-center"
                      style={{
                        backgroundColor: fabricDetails.colour_link || `hsl(${(fabricDetails.estre_code.charCodeAt(0) || 0) % 360}, 70%, 75%)`,
                        backgroundImage: fabricImageUrl ? `url(${fabricImageUrl})` : undefined
                      }}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-walnut">
                        {fabricDetails.description || fabricDetails.colour || "Fabric"}
                      </span>
                      <Badge variant="outline" className="w-fit text-[10px] h-5 px-1.5">
                        {fabricDetails.estre_code}
                      </Badge>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator className="bg-gold/20" />

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-walnut/70">Net Invoice Value</p>
                <p className="text-3xl font-serif font-bold text-walnut">{`₹${Math.round(pricing.total).toLocaleString()}`}</p>
              </div>
            </div>

            <Button
              onClick={onAddToCart}
              className="w-full"
              variant="luxury"
              size="lg"
              disabled={!isConfigComplete || isAddingToCart || isCalculating}
            >
              {isAddingToCart ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Adding to Cart...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart
                </>
              )}
            </Button>

            {!isConfigComplete && (
              <p className="text-xs text-center text-destructive font-medium bg-destructive/10 p-2 rounded">
                Complete configuration to add to cart
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-walnut/50">
            <p className="text-base">Configure your product to see pricing</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PricingSummary;
