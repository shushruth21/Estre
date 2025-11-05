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
  const isConfigComplete =
    configuration.productId &&
    configuration.fabric?.structureCode &&
    configuration.seats?.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCalculating ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : pricing ? (
          <>
            <div className="space-y-2 text-sm">
              {pricing.breakdown.baseSeatPrice > 0 && (
                <div className="flex justify-between">
                  <span>Base Seat</span>
                  <span>₹{Math.round(pricing.breakdown.baseSeatPrice).toLocaleString()}</span>
                </div>
              )}
              {pricing.breakdown.additionalSeatsPrice > 0 && (
                <div className="flex justify-between">
                  <span>Additional Seats</span>
                  <span>
                    ₹{Math.round(pricing.breakdown.additionalSeatsPrice).toLocaleString()}
                  </span>
                </div>
              )}
              {pricing.breakdown.cornerSeatsPrice > 0 && (
                <div className="flex justify-between">
                  <span>Corner Seats</span>
                  <span>
                    ₹{Math.round(pricing.breakdown.cornerSeatsPrice).toLocaleString()}
                  </span>
                </div>
              )}
              {pricing.breakdown.backrestSeatsPrice > 0 && (
                <div className="flex justify-between">
                  <span>Backrest Seats</span>
                  <span>
                    ₹{Math.round(pricing.breakdown.backrestSeatsPrice).toLocaleString()}
                  </span>
                </div>
              )}
              {pricing.breakdown.loungerPrice > 0 && (
                <div className="flex justify-between">
                  <span>Lounger</span>
                  <span>₹{Math.round(pricing.breakdown.loungerPrice).toLocaleString()}</span>
                </div>
              )}
              {pricing.breakdown.consolePrice > 0 && (
                <div className="flex justify-between">
                  <span>Console</span>
                  <span>₹{Math.round(pricing.breakdown.consolePrice).toLocaleString()}</span>
                </div>
              )}
              {pricing.breakdown.pillowsPrice > 0 && (
                <div className="flex justify-between">
                  <span>Pillows</span>
                  <span>₹{Math.round(pricing.breakdown.pillowsPrice).toLocaleString()}</span>
                </div>
              )}
              {pricing.breakdown.fabricCharges > 0 && (
                <div className="flex justify-between">
                  <span>Fabric Charges</span>
                  <span>₹{Math.round(pricing.breakdown.fabricCharges).toLocaleString()}</span>
                </div>
              )}
              {pricing.breakdown.foamUpgrade > 0 && (
                <div className="flex justify-between">
                  <span>Foam Upgrade</span>
                  <span>₹{Math.round(pricing.breakdown.foamUpgrade).toLocaleString()}</span>
                </div>
              )}
              {pricing.breakdown.dimensionUpgrade > 0 && (
                <div className="flex justify-between">
                  <span>Dimension Upgrade</span>
                  <span>
                    ₹{Math.round(pricing.breakdown.dimensionUpgrade).toLocaleString()}
                  </span>
                </div>
              )}
              {pricing.breakdown.accessoriesPrice > 0 && (
                <div className="flex justify-between">
                  <span>Accessories</span>
                  <span>
                    ₹{Math.round(pricing.breakdown.accessoriesPrice).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex justify-between font-semibold">
              <span>Subtotal</span>
              <span>₹{Math.round(pricing.breakdown.subtotal).toLocaleString()}</span>
            </div>

            {pricing.breakdown.discountAmount > 0 && (
              <>
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>-₹{Math.round(pricing.breakdown.discountAmount).toLocaleString()}</span>
                </div>
                <Separator />
              </>
            )}

            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">
                ₹{Math.round(pricing.total).toLocaleString()}
              </span>
            </div>

            <Button
              onClick={onAddToCart}
              className="w-full"
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
          <div className="text-center py-8 text-muted-foreground">
            <p>Configure your product to see pricing</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PricingSummary;
