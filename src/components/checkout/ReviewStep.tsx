import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Package, MapPin, Calendar, Edit, Loader2, CheckCircle2, Tag } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { FabricPreview } from "@/components/common/FabricPreview";

interface ReviewStepProps {
  cartItems: any[];
  deliveryAddress: any;
  expectedDeliveryDate?: Date;
  specialInstructions?: string;
  subtotal: number;
  discount: number;
  discountCode?: string;
  total: number;
  advanceAmount: number;
  termsAccepted: boolean;
  onTermsChange: (accepted: boolean) => void;
  onEditDelivery: () => void;
  onRequestReview?: () => void;
  onApplyDiscount?: (code: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const ReviewStep = ({
  cartItems,
  deliveryAddress,
  expectedDeliveryDate,
  specialInstructions,
  subtotal,
  discount,
  discountCode,
  total,
  advanceAmount,
  termsAccepted,
  onTermsChange,
  onEditDelivery,
  onRequestReview,
  onApplyDiscount,
  isSubmitting,
}: ReviewStepProps) => {
  const [code, setCode] = useState("");
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  const handleApplyDiscount = async () => {
    if (!code || !onApplyDiscount) return;
    setIsApplyingDiscount(true);
    try {
      await onApplyDiscount(code);
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Order Items</CardTitle>
          <Badge variant="secondary">{cartItems.length} items</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {cartItems.map((item) => {
            const fabricCode = item.configuration?.fabric?.structureCode || item.configuration?.fabric?.claddingPlan;

            return (
              <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted">
                <div className="h-16 w-16 rounded-md bg-background flex items-center justify-center overflow-hidden">
                  {fabricCode ? (
                    <FabricPreview fabricCode={fabricCode} showDetails={false} className="border-0 bg-transparent p-0" compact />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{item.product_type?.toUpperCase()}</h4>
                  <p className="text-sm text-muted-foreground">Quantity: {item.quantity || 1}</p>
                  {fabricCode && (
                    <div className="mt-2">
                      <FabricPreview fabricCode={fabricCode} className="bg-background/50" />
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{Math.round(item.calculated_price || 0).toLocaleString()}</p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Delivery Details
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onEditDelivery}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">{deliveryAddress.street}</p>
            <p className="text-sm text-muted-foreground">
              {deliveryAddress.city}, {deliveryAddress.state} - {deliveryAddress.pincode}
            </p>
            {deliveryAddress.landmark && (
              <p className="text-sm text-muted-foreground">Landmark: {deliveryAddress.landmark}</p>
            )}
          </div>

          {expectedDeliveryDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Expected Delivery: {format(expectedDeliveryDate, "PPP")}</span>
            </div>
          )}

          {specialInstructions && (
            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-1">Special Instructions:</p>
              <p className="text-sm text-muted-foreground">{specialInstructions}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{Math.round(subtotal).toLocaleString()}</span>
            </div>

            {onApplyDiscount && (
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Discount Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-9"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApplyDiscount}
                  disabled={!code || isApplyingDiscount}
                >
                  {isApplyingDiscount ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
            )}

            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount {discountCode && `(${discountCode})`}</span>
                <span>-₹{Math.round(discount).toLocaleString()}</span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between font-semibold text-lg">
              <span>Total Amount</span>
              <span className="text-primary">₹{Math.round(total).toLocaleString()}</span>
            </div>

            <div className="bg-primary/5 rounded-lg p-4 space-y-2 border border-primary/20">
              <div className="flex justify-between font-medium">
                <span>Advance Payment (50%)</span>
                <span>₹{Math.round(total * 0.5).toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Pay 50% now to confirm your order. The remaining balance is due before dispatch.
              </p>
            </div>
          </div>

          {onRequestReview && (
            <Button
              onClick={onRequestReview}
              disabled={!termsAccepted || isSubmitting}
              className="w-full mt-4"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm & Pay ₹{Math.round(total * 0.5).toLocaleString()}
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => onTermsChange(checked === true)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I confirm my order, agree to the final price, and authorize the 50% advance payment.
              </label>
              <p className="text-sm text-muted-foreground">
                By placing this order, you agree to our return policy and terms of service.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

