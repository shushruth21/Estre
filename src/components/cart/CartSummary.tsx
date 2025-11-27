import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface CartSummaryProps {
  subtotal: number;
  discount?: number;
  advancePercent?: number;
  onCheckout: () => void;
  checkoutDisabled?: boolean;
}

export const CartSummary = ({
  subtotal,
  discount = 0,
  advancePercent = 50,
  onCheckout,
  checkoutDisabled = false,
}: CartSummaryProps) => {
  const total = subtotal - discount;
  const advanceAmount = total * (advancePercent / 100);
  const balanceAmount = total - advanceAmount;

  return (
    <Card className="bg-white/80 backdrop-blur-md border border-gold/20 shadow-sm sticky top-24">
      <CardHeader>
        <CardTitle className="text-2xl font-serif font-bold">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">₹{Math.round(subtotal).toLocaleString()}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-gold font-semibold">-₹{Math.round(discount).toLocaleString()}</span>
            </div>
          )}

          <Separator className="border-gold/20" />

          <div className="flex justify-between font-semibold text-lg">
            <span className="font-serif">Total</span>
            <span className="text-gold font-serif text-xl">₹{Math.round(total).toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-gold/5 border border-gold/20 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Advance ({advancePercent}%)</span>
            <span className="font-medium text-gold">₹{Math.round(advanceAmount).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Balance on delivery</span>
            <span className="font-medium">₹{Math.round(balanceAmount).toLocaleString()}</span>
          </div>
        </div>

        <Button
          onClick={onCheckout}
          className="w-full"
          variant="luxury"
          size="lg"
          disabled={checkoutDisabled}
        >
          Proceed to Checkout
        </Button>
      </CardContent>
    </Card>
  );
};
