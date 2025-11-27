import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, ShoppingCart } from "lucide-react";
import { SummaryTile } from "@/components/ui/SummaryTile";

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
                  {(() => {
                    const baseProductCost = pricing.breakdown.baseSeatPrice > 0
                      ? pricing.breakdown.baseSeatPrice
                      : (pricing.breakdown.basePrice || 0);
                    return <SummaryTile label="Base Model" value={`₹${Math.round(baseProductCost).toLocaleString()}`} />;
                  })()}
                  <SummaryTile label="Mechanism" value={`₹${Math.round(pricing.breakdown.mechanismUpgrade || 0).toLocaleString()}`} />
                  <SummaryTile label="Consoles" value={`₹${Math.round(pricing.breakdown.consolePrice || 0).toLocaleString()}`} />
                  <SummaryTile label="Armrest Accessories" value={`₹${Math.round(pricing.breakdown.armrestUpgrade || pricing.breakdown.accessoriesPrice || 0).toLocaleString()}`} />
                  <SummaryTile label="Fabric Upgrade" value={`₹${Math.round(pricing.breakdown.fabricCharges || 0).toLocaleString()}`} />
                  <SummaryTile label="Lounger" value={`₹${Math.round(pricing.breakdown.loungerPrice || 0).toLocaleString()}`} />
                  <SummaryTile label="Total Fabric (m)" value={`${(pricing.breakdown.fabricMeters || 0) > 0 ? (pricing.breakdown.fabricMeters || 0).toFixed(1) : "0.0"} m`} />
                  {typeof pricing.breakdown.seatBackrestFabric === "number" && (
                    <SummaryTile label="Seat/Backrest Fabric" value={`${pricing.breakdown.seatBackrestFabric > 0 ? pricing.breakdown.seatBackrestFabric.toFixed(1) : "0.0"} m`} />
                  )}
                  {typeof pricing.breakdown.structureFabric === "number" && (
                    <SummaryTile label="Structure/Armrest Fabric" value={`${pricing.breakdown.structureFabric > 0 ? pricing.breakdown.structureFabric.toFixed(1) : "0.0"} m`} />
                  )}
                  {typeof pricing.breakdown.approxWidth === "number" && (
                    <SummaryTile label="Approx Width" value={`${Math.round(pricing.breakdown.approxWidth)}"`} />
                  )}
                </>
              )}
            </div>

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
