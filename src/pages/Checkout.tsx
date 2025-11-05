import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { StepIndicator } from "@/components/checkout/StepIndicator";
import { DeliveryStep } from "@/components/checkout/DeliveryStep";
import { ReviewStep } from "@/components/checkout/ReviewStep";
import { PaymentStep } from "@/components/checkout/PaymentStep";

const STEPS = [
  { id: 1, name: "Delivery", description: "Shipping details" },
  { id: 2, name: "Review", description: "Confirm order" },
  { id: 3, name: "Payment", description: "Complete payment" },
];

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
  });
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<Date>();
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: cartItems, isLoading } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("customer_orders")
        .select("*")
        .eq("status", "draft")
        .eq("customer_email", user.email)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!user || !cartItems || cartItems.length === 0) {
        throw new Error("Cart is empty");
      }

      const orderNumber = `ORD-${Date.now()}`;
      const subtotal = cartItems.reduce((sum, item) => sum + (item.calculated_price || 0), 0);

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: user.id,
          customer_name: user.user_metadata?.full_name || user.email,
          customer_email: user.email || "",
          customer_phone: user.user_metadata?.phone || "",
          delivery_address: deliveryAddress,
          expected_delivery_date: expectedDeliveryDate?.toISOString().split('T')[0],
          special_instructions: specialInstructions,
          subtotal_rs: subtotal,
          net_total_rs: subtotal,
          status: "pending",
          payment_status: "pending",
          payment_method: paymentMethod,
          advance_percent: 50,
          advance_amount_rs: subtotal * 0.5,
          balance_amount_rs: subtotal * 0.5,
          terms_accepted: termsAccepted,
          terms_accepted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_category: item.product_type,
        product_title: (item.configuration as any)?.productTitle || "Custom Product",
        configuration: item.configuration,
        unit_price_rs: item.calculated_price / (item.quantity || 1),
        total_price_rs: item.calculated_price,
        quantity: item.quantity || 1,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create initial timeline entry
      await supabase.from("order_timeline").insert({
        order_id: order.id,
        status: "pending",
        title: "Order Placed",
        description: "Your order has been received and is pending approval",
        created_by: user.id,
      });

      const { error: deleteError } = await supabase
        .from("customer_orders")
        .delete()
        .eq("status", "draft")
        .eq("customer_email", user.email);

      if (deleteError) throw deleteError;

      return order;
    },
    onSuccess: (order) => {
      toast({
        title: "Order Placed Successfully!",
        description: `Order ${order.order_number} has been created. You will be contacted for payment details.`,
      });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      navigate(`/orders`);
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isDeliveryValid = deliveryAddress.street && deliveryAddress.city && 
                          deliveryAddress.state && deliveryAddress.pincode;

  const handleNext = () => {
    if (currentStep === 1 && !isDeliveryValid) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required delivery details",
        variant: "destructive",
      });
      return;
    }
    if (currentStep === 2 && !termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions",
        variant: "destructive",
      });
      return;
    }
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate("/cart");
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    navigate("/cart");
    return null;
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.calculated_price || 0), 0);
  const discount = 0;
  const total = subtotal - discount;
  const advanceAmount = total * 0.5;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-6">Checkout</h1>
          <StepIndicator steps={STEPS} currentStep={currentStep} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {currentStep === 1 && (
            <DeliveryStep
              address={deliveryAddress}
              onAddressChange={setDeliveryAddress}
              expectedDeliveryDate={expectedDeliveryDate}
              onDateChange={setExpectedDeliveryDate}
              specialInstructions={specialInstructions}
              onInstructionsChange={setSpecialInstructions}
            />
          )}

          {currentStep === 2 && (
            <ReviewStep
              cartItems={cartItems}
              deliveryAddress={deliveryAddress}
              expectedDeliveryDate={expectedDeliveryDate}
              specialInstructions={specialInstructions}
              subtotal={subtotal}
              discount={discount}
              total={total}
              advanceAmount={advanceAmount}
              termsAccepted={termsAccepted}
              onTermsChange={setTermsAccepted}
              onEditDelivery={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <PaymentStep
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              advanceAmount={advanceAmount}
            />
          )}

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {currentStep === 1 ? "Back to Cart" : "Previous"}
            </Button>

            {currentStep < STEPS.length ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={() => placeOrder.mutate()}
                disabled={placeOrder.isPending || !termsAccepted}
                size="lg"
              >
                {placeOrder.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Place Order
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
