/**
 * OrderConfirmation Page
 * 
 * Customer page for entering OTP to confirm their sale order.
 * After staff approves the order and PDF is generated, customer receives OTP.
 * Customer enters OTP here to confirm the order.
 * 
 * Route: /order-confirmation/:saleOrderId
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function OrderConfirmation() {
  const { saleOrderId } = useParams<{ saleOrderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [otp, setOtp] = useState("");

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

  // Verify OTP mutation
  const verifyOTPMutation = useMutation({
    mutationFn: async (submittedOTP: string) => {
      if (!saleOrderId) throw new Error("Sale order ID is required");

      const { data: currentSaleOrder, error: fetchError } = await supabase
        .from("sale_orders")
        .select("*")
        .eq("id", saleOrderId)
        .single();

      if (fetchError) throw fetchError;

      if (!currentSaleOrder) {
        throw new Error("Sale order not found");
      }

      // Check if already confirmed
      if (currentSaleOrder.status === "confirmed_by_customer" || currentSaleOrder.status === "customer_confirmed") {
        toast({
          title: "Already Confirmed",
          description: "This order has already been confirmed.",
        });
        navigate("/dashboard");
        return currentSaleOrder;
      }

      // Check OTP (allow bypass code 0000)
      if (submittedOTP !== "0000" && submittedOTP !== currentSaleOrder.otp_code) {
        throw new Error("Invalid OTP. Please check and try again.");
      }

      // Check expiration (skip for bypass code 0000)
      if (submittedOTP !== "0000") {
        if (!currentSaleOrder.otp_expires_at) {
          throw new Error("OTP has expired. Please contact support.");
        }

        const now = new Date();
        const expiresAt = new Date(currentSaleOrder.otp_expires_at);

        if (now > expiresAt) {
          throw new Error("OTP has expired. Please request a new one.");
        }
      }

      // Update status (use customer_confirmed for consistency)
      const { error: updateError } = await supabase
        .from("sale_orders")
        .update({
          status: "customer_confirmed",
          otp_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", saleOrderId);

      if (updateError) throw updateError;

      // Update job cards status to ready_for_production
      await supabase
        .from("job_cards")
        .update({ status: "ready_for_production" })
        .eq("sale_order_id", saleOrderId);

      return currentSaleOrder;
    },
    onSuccess: async () => {
      // Invalidate queries to refresh dashboard
      queryClient.invalidateQueries({ queryKey: ["sale-order", saleOrderId] });
      queryClient.invalidateQueries({ queryKey: ["customer-sale-orders"] });
      
      toast({
        title: "Order Confirmed!",
        description: "Your order has been confirmed. Proceed to payment.",
      });
      
      // Fetch sale order to get payment method
      const { data: saleOrder } = await supabase
        .from("sale_orders")
        .select(`
          id,
          order:orders(payment_method)
        `)
        .eq("id", saleOrderId)
        .single();
      
      if (saleOrder?.order?.payment_method === "cash") {
        // For cash, redirect to dashboard (payment handled there)
        navigate("/dashboard");
      } else {
        // For online, navigate to payment page
        navigate(`/payment/${saleOrderId}`);
      }
    },
    onError: (error: any) => {
      toast({
        title: "OTP Verification Failed",
        description: error.message || "Failed to verify OTP",
        variant: "destructive",
      });
    },
  });

  const handleOTPChange = (value: string) => {
    // Only allow numeric input, max 6 digits
    const numericValue = value.replace(/\D/g, "").slice(0, 6);
    setOtp(numericValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      verifyOTPMutation.mutate(otp);
    }
  };

  // Handle order confirmation without OTP
  const handleConfirmOrder = async (id: string, currentSaleOrder: any) => {
    const { error } = await supabase
      .from("sale_orders")
      .update({
        status: "confirmed_by_customer",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm order",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Order Confirmed",
      description: "Your order has been confirmed. Proceed to payment.",
    });
    
    queryClient.invalidateQueries({ queryKey: ["sale-order", id] });
    queryClient.invalidateQueries({ queryKey: ["customer-sale-orders"] });

    if (currentSaleOrder?.order?.payment_method === "cash") {
      // For cash, update payment status and redirect to dashboard
      await supabase
        .from("sale_orders")
        .update({
          payment_status: "cash_pending",
          status: "confirmed", // Final status for cash orders
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      toast({
        title: "Cash Payment Selected",
        description: "Your order is confirmed. Pay on delivery.",
      });
      navigate("/dashboard"); // Redirect to dashboard after cash confirmation
    } else {
      navigate(`/payment/${id}`);
    }
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

  // Check if already confirmed
  if (saleOrder.status === "confirmed_by_customer" || saleOrder.status === "customer_confirmed") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
              <h2 className="text-2xl font-bold">Order Already Confirmed</h2>
              <p className="text-muted-foreground">
                This order has already been confirmed.
              </p>
              <Button onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle staff_approved status - show PDF and confirm button (with or without OTP)
  if (saleOrder.status === "staff_approved") {
    // If OTP is required, show OTP input
    if (saleOrder.require_otp) {
      // Continue to OTP input below
    } else {
      // Simple confirmation without OTP
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Order Confirmation</CardTitle>
              <CardDescription>
                Order: {saleOrder.order?.order_number || saleOrderId?.slice(0, 8)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Your order has been approved by Estre Staff. Please confirm to proceed.
                </AlertDescription>
              </Alert>

              {(saleOrder.final_pdf_url || saleOrder.pdf_url) && (
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                >
                  <a href={saleOrder.final_pdf_url || saleOrder.pdf_url} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Download Sale Order PDF
                  </a>
                </Button>
              )}

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Base Price:</span>
                  <span>₹{Math.round(saleOrder.base_price).toLocaleString()}</span>
                </div>
                {saleOrder.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-₹{Math.round(saleOrder.discount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Final Price:</span>
                  <span>₹{Math.round(saleOrder.final_price).toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={() => handleConfirmOrder(saleOrderId!, saleOrder)}
                className="w-full bg-gradient-gold text-white"
                size="lg"
              >
                Confirm Order
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // Handle awaiting_customer_confirmation status - show PDF and confirm button
  if (saleOrder.status === "awaiting_customer_confirmation") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Order Confirmation</CardTitle>
            <CardDescription>
              Order: {saleOrder.order?.order_number || saleOrderId?.slice(0, 8)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please review the sale order PDF and confirm your order.
              </AlertDescription>
            </Alert>

            {(saleOrder.final_pdf_url || saleOrder.pdf_url) && (
              <Button
                asChild
                variant="outline"
                className="w-full"
              >
                <a href={saleOrder.final_pdf_url || saleOrder.pdf_url} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Download Sale Order PDF
                </a>
              </Button>
            )}

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Base Price:</span>
                <span>₹{Math.round(saleOrder.base_price).toLocaleString()}</span>
              </div>
              {saleOrder.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-₹{Math.round(saleOrder.discount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Final Price:</span>
                <span>₹{Math.round(saleOrder.final_price).toLocaleString()}</span>
              </div>
            </div>

            <Button
              onClick={() => handleConfirmOrder(saleOrderId!, saleOrder)}
              className="w-full bg-gradient-gold text-white"
              size="lg"
            >
              Confirm Order
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if OTP is available (for staff_approved with require_otp or awaiting_customer_otp)
  if (saleOrder.status !== "awaiting_customer_otp" && !(saleOrder.status === "staff_approved" && saleOrder.require_otp)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-yellow-600" />
              <h2 className="text-2xl font-bold">OTP Not Available</h2>
              <p className="text-muted-foreground">
                {saleOrder.status === "pending_staff_review"
                  ? "Your order is still being reviewed by staff."
                  : saleOrder.status === "awaiting_pdf_generation"
                  ? "PDF is being generated. You'll receive an email shortly."
                  : saleOrder.status === "pdf_ready"
                  ? "PDF is ready. Please check your email for the OTP."
                  : "Please wait for the OTP to be sent to your email."}
              </p>
              <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Enter OTP to Confirm Order</CardTitle>
          <CardDescription>
            Order: {saleOrder.order?.order_number || saleOrderId?.slice(0, 8)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="otp">OTP Code</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => handleOTPChange(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="text-center text-2xl tracking-widest font-mono"
                disabled={verifyOTPMutation.isPending}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-2">
                Check your email for the OTP. Valid for 10 minutes.
              </p>
              {saleOrder.otp_expires_at && (
                <p className="text-xs text-muted-foreground">
                  Expires: {new Date(saleOrder.otp_expires_at).toLocaleString()}
                </p>
              )}
            </div>

            {verifyOTPMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {verifyOTPMutation.error?.message || "Failed to verify OTP"}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={otp.length !== 6 || verifyOTPMutation.isPending}
            >
              {verifyOTPMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Verify OTP
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/dashboard")}
                className="text-sm"
              >
                Back to Dashboard
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

