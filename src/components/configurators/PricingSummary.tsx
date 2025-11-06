import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, ShoppingCart } from "lucide-react";

interface PricingSummaryProps {
  pricing: any;
  isCalculating: boolean;
  onAddToCart: () => void;
  configuration: any;
}

const PricingSummary = ({
  pricing,
  isCalculating,
  onAddToCart,
  configuration,
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
    <Card className="luxury-card border-muted/50">
      <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
        <CardTitle className="font-serif text-2xl">Price Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCalculating ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : pricing ? (
          <>
            <div className="space-y-3 text-sm">
              {/* Base Price */}
              {pricing.breakdown.basePrice > 0 && pricing.breakdown.basePrice !== pricing.breakdown.baseSeatPrice && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Price</span>
                  <span className="font-semibold">₹{Math.round(pricing.breakdown.basePrice).toLocaleString()}</span>
                </div>
              )}
              
              {/* Base Seat Price */}
              {pricing.breakdown.baseSeatPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base Seat</span>
                  <span className="font-semibold">₹{Math.round(pricing.breakdown.baseSeatPrice).toLocaleString()}</span>
                </div>
              )}
              
              {/* Additional Seats */}
              {pricing.breakdown.additionalSeatsPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Additional Seats</span>
                  <span className="font-semibold">
                    ₹{Math.round(pricing.breakdown.additionalSeatsPrice).toLocaleString()}
                  </span>
                </div>
              )}
              
              {/* Corner Seats */}
              {pricing.breakdown.cornerSeatsPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Corner Seats</span>
                  <span className="font-semibold">
                    ₹{Math.round(pricing.breakdown.cornerSeatsPrice).toLocaleString()}
                  </span>
                </div>
              )}
              
              {/* Backrest Seats */}
              {pricing.breakdown.backrestSeatsPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Backrest Seats</span>
                  <span className="font-semibold">
                    ₹{Math.round(pricing.breakdown.backrestSeatsPrice).toLocaleString()}
                  </span>
                </div>
              )}
              
              {/* Lounger */}
              {pricing.breakdown.loungerPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lounger</span>
                  <span className="font-semibold">₹{Math.round(pricing.breakdown.loungerPrice).toLocaleString()}</span>
                </div>
              )}
              
              {/* Console */}
              {pricing.breakdown.consolePrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Console</span>
                  <span className="font-semibold">₹{Math.round(pricing.breakdown.consolePrice).toLocaleString()}</span>
                </div>
              )}
              
              {/* Pillows */}
              {pricing.breakdown.pillowsPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pillows</span>
                  <span className="font-semibold">₹{Math.round(pricing.breakdown.pillowsPrice).toLocaleString()}</span>
                </div>
              )}
              
              {/* Mechanism Upgrade */}
              {pricing.breakdown.mechanismUpgrade > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mechanism Upgrade</span>
                  <span className="font-semibold">₹{Math.round(pricing.breakdown.mechanismUpgrade).toLocaleString()}</span>
                </div>
              )}
              
              {/* Storage */}
              {pricing.breakdown.storagePrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Storage</span>
                  <span className="font-semibold">₹{Math.round(pricing.breakdown.storagePrice).toLocaleString()}</span>
                </div>
              )}
              
              {/* Fabric Charges */}
              {pricing.breakdown.fabricCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fabric Charges</span>
                  <span className="font-semibold">₹{Math.round(pricing.breakdown.fabricCharges).toLocaleString()}</span>
                </div>
              )}
              
              {/* Foam Upgrade */}
              {pricing.breakdown.foamUpgrade > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Foam Upgrade</span>
                  <span className="font-semibold">₹{Math.round(pricing.breakdown.foamUpgrade).toLocaleString()}</span>
                </div>
              )}
              
              {/* Dimension Upgrade */}
              {pricing.breakdown.dimensionUpgrade > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dimension Upgrade</span>
                  <span className="font-semibold">
                    ₹{Math.round(pricing.breakdown.dimensionUpgrade).toLocaleString()}
                  </span>
                </div>
              )}
              
              {/* Accessories */}
              {pricing.breakdown.accessoriesPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accessories</span>
                  <span className="font-semibold">
                    ₹{Math.round(pricing.breakdown.accessoriesPrice).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex justify-between font-semibold text-base">
              <span>Subtotal</span>
              <span>₹{Math.round(pricing.breakdown.subtotal).toLocaleString()}</span>
            </div>

            {pricing.breakdown.discountAmount > 0 && (
              <>
                <div className="flex justify-between text-success font-semibold">
                  <span>Discount</span>
                  <span>-₹{Math.round(pricing.breakdown.discountAmount).toLocaleString()}</span>
                </div>
                <Separator />
              </>
            )}

            <div className="flex justify-between text-xl font-bold pt-2">
              <span className="font-serif">Total</span>
              <span className="text-primary font-serif">
                ₹{Math.round(pricing.total).toLocaleString()}
              </span>
            </div>

            <Button
              onClick={onAddToCart}
              className="w-full luxury-button shadow-lg"
              size="lg"
              disabled={!isConfigComplete}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>

            {!isConfigComplete && (
              <p className="text-xs text-center text-muted-foreground">
                Complete configuration to add to cart
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-base">Configure your product to see pricing</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PricingSummary;
