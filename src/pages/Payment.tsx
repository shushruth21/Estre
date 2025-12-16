/**
 * Payment Page
 * 
 * Handles payment for sale orders after customer confirmation.
 * Currently shows payment integration status (payment gateway integration pending).
 * 
 * Route: /payment/:saleOrderId
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle, CreditCard, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Payment() {
  const { saleOrderId } = useParams<{ saleOrderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch sale order data
  const { data: saleOrder, isLoading } = useQuery({
    queryKey: ["sale-order", saleOrderId],
    queryFn: async () => {
      if (!saleOrderId) return null;

      const { data, error } = await supabase
        .from("sale_orders")
        .select(`
          *,
          order:orders(
            id,
            order_number,
            customer_name,
            customer_email,
            payment_method
          )
        `)
        .eq("id", saleOrderId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!saleOrderId,
  });

  // Mark payment as completed (for cash/manual payments)
  const markPaymentCompleteMutation = useMutation({
    mutationFn: async () => {
      if (!saleOrderId) throw new Error("Sale order ID is required");

      const { error } = await supabase
        .from("sale_orders")
        .update({
          payment_status: saleOrder?.order?.payment_method === "cash" ? "cash_pending" : "advance_paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", saleOrderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sale-order", saleOrderId] });
      queryClient.invalidateQueries({ queryKey: ["customer-sale-orders"] });
      
      toast({
        title: "Payment Recorded",
        description: saleOrder?.order?.payment_method === "cash" 
          ? "Your cash payment has been recorded. Pay on delivery."
          : "Your advance payment has been recorded.",
      });
      
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const handleCashPayment = async () => {
    setIsProcessing(true);
    markPaymentCompleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!saleOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <h2 className="text-2xl font-bold">Sale Order Not Found</h2>
              <p className="text-muted-foreground">
                The sale order you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const paymentMethod = saleOrder.order?.payment_method || "cash";
  const advanceAmount = saleOrder.advance_amount_rs || (saleOrder.final_price || 0) * 0.5;
  const isCashPayment = paymentMethod === "cash";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Payment</CardTitle>
          <CardDescription>
            Order: {saleOrder.order?.order_number || saleOrderId?.slice(0, 8)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Summary */}
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span>Final Price:</span>
              <span className="font-semibold">₹{Math.round(saleOrder.final_price || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Advance Payment (50%):</span>
              <span>₹{Math.round(advanceAmount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Balance Payment:</span>
              <span>₹{Math.round((saleOrder.final_price || 0) - advanceAmount).toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method Info */}
          {isCashPayment ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Cash on Delivery</strong>
                <br />
                You will pay the advance amount (50%) when the product is ready for dispatch.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CreditCard className="h-4 w-4" />
              <AlertDescription>
                <strong>Online Payment</strong>
                <br />
                Payment gateway integration is being configured. For now, please contact support to complete your payment.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {isCashPayment ? (
              <Button
                onClick={handleCashPayment}
                disabled={isProcessing || markPaymentCompleteMutation.isPending}
                className="w-full bg-gold text-walnut hover:bg-gold/90"
                size="lg"
              >
                {isProcessing || markPaymentCompleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirm Cash Payment
                  </>
                )}
              </Button>
            ) : (
              <Alert variant="default">
                <AlertDescription>
                  Please contact Estre support to complete your online payment.
                  <br />
                  <strong>Email:</strong> support@estre.in
                  <br />
                  <strong>Order Number:</strong> {saleOrder.order?.order_number || saleOrderId?.slice(0, 8)}
                </AlertDescription>
              </Alert>
            )}

            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}











