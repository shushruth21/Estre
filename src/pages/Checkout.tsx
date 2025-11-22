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
import { calculateDynamicPrice } from "@/lib/dynamic-pricing";
import { generateSaleOrderData } from "@/lib/sale-order-generator";

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
  const [buyerGst, setBuyerGst] = useState<string>("");
  const [dispatchMethod, setDispatchMethod] = useState<string>("Safe Express");

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

      // Create order first (for reference and order_items)
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
          discount_code: null, // No discount at checkout - staff applies it
          discount_amount_rs: 0,
          net_total_rs: subtotal,
          status: "pending",
          payment_status: "pending",
          payment_method: paymentMethod,
          advance_percent: 50,
          advance_amount_rs: 0, // Will be set after staff review
          // balance_amount_rs is GENERATED ALWAYS, don't insert it
          buyer_gst: buyerGst || null,
          dispatch_method: dispatchMethod || "Safe Express",
          terms_accepted: termsAccepted,
          terms_accepted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create sale_order for staff review workflow
      const { data: saleOrder, error: saleOrderError } = await supabase
        .from("sale_orders")
        .insert({
          customer_id: user.id,
          order_id: order.id,
          status: "pending_staff_review",
          base_price: subtotal,
          discount: 0,
          final_price: subtotal,
        })
        .select()
        .single();

      if (saleOrderError) throw saleOrderError;

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

      const { data: insertedItems, error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems)
        .select();

      if (itemsError) throw itemsError;

      const saleOrderSnapshots: any[] = [];
      const jobCardInserts: any[] = [];

      if (insertedItems && insertedItems.length > 0) {
        for (const item of insertedItems) {
          const pricing = await calculateDynamicPrice(
            item.product_category,
            item.product_id,
            item.configuration
          );

          const saleData = await generateSaleOrderData(
            order,
            item,
            item.configuration,
            pricing.breakdown
          );

          saleOrderSnapshots.push(saleData);

          saleData.jobCards.forEach((jobCard) => {
            jobCardInserts.push({
              job_card_number: jobCard.jobCardNumber,
              so_number: jobCard.soNumber,
              line_item_id: jobCard.lineItemId,
              order_id: order.id,
              order_item_id: item.id,
              order_number: jobCard.soNumber,
              customer_name: jobCard.customer.name,
              customer_phone: jobCard.customer.phone,
              customer_email: jobCard.customer.email || order.customer_email,
              delivery_address: jobCard.customer.address,
              product_category: jobCard.category,
              product_title: jobCard.modelName,
              configuration: jobCard.configuration,
              fabric_codes: jobCard.fabricPlan.fabricCodes,
              fabric_meters: jobCard.fabricPlan,
              accessories: {
                console: jobCard.console,
                dummySeats: jobCard.dummySeats,
                sections: jobCard.sections,
                pricing: jobCard.pricing,
              },
              dimensions: jobCard.dimensions,
              status: "pending",
              priority: "normal",
            });
          });
        }
      }

      if (jobCardInserts.length > 0) {
        const { data: createdJobCards, error: jobCardsError } = await supabase
          .from("job_cards")
          .insert(jobCardInserts)
          .select("id");

        if (jobCardsError) throw jobCardsError;

        const defaultTasks = [
          { task_name: "Fabric Cutting", task_type: "fabric_cutting", sort_order: 1 },
          { task_name: "Frame Work", task_type: "frame_work", sort_order: 2 },
          { task_name: "Upholstery", task_type: "upholstery", sort_order: 3 },
          { task_name: "Assembly", task_type: "assembly", sort_order: 4 },
          { task_name: "Finishing", task_type: "finishing", sort_order: 5 },
          { task_name: "Quality Check", task_type: "quality_check", sort_order: 6 },
        ];

        const tasksToInsert =
          createdJobCards?.flatMap((jobCard: any) =>
            defaultTasks.map((task) => ({
              job_card_id: jobCard.id,
              task_name: task.task_name,
              task_type: task.task_type as "fabric_cutting" | "frame_work" | "upholstery" | "assembly" | "finishing" | "quality_check",
              sort_order: task.sort_order,
            }))
          ) ?? [];

        if (tasksToInsert.length > 0) {
          await supabase.from("job_card_tasks").insert(tasksToInsert);
        }
      }

      const orderMetadata = order.metadata as Record<string, any> | null;
      await supabase
        .from("orders")
        .update({
          status: "confirmed",
          metadata: {
            ...(orderMetadata || {}),
            sale_orders: saleOrderSnapshots,
          },
        })
        .eq("id", order.id);

      // Create initial timeline entry
      // Create timeline entry for order submission
      await supabase.from("order_timeline").insert({
        order_id: order.id,
        status: "pending",
        title: "Order Submitted",
        description: "Your order has been submitted and is pending staff review",
        created_by: user.id,
      });

      const { error: deleteError } = await supabase
        .from("customer_orders")
        .delete()
        .eq("status", "draft")
        .eq("customer_email", user.email);

      if (deleteError) throw deleteError;

      return { order, saleOrder };
    },
    onSuccess: () => {
      toast({
        title: "Order Submitted!",
        description: "Your order is being reviewed by Estre Staff. You'll receive a confirmation shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      navigate("/dashboard");
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
  
  const subtotal = cartItems?.reduce((sum, item) => sum + (item.calculated_price || 0), 0) || 0;
  const total = subtotal; // No discount at checkout

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
              buyerGst={buyerGst}
              onBuyerGstChange={setBuyerGst}
              dispatchMethod={dispatchMethod}
              onDispatchMethodChange={setDispatchMethod}
            />
          )}

          {currentStep === 2 && (
            <ReviewStep
              cartItems={cartItems || []}
              deliveryAddress={deliveryAddress}
              expectedDeliveryDate={expectedDeliveryDate}
              specialInstructions={specialInstructions}
              subtotal={subtotal}
              discount={0}
              discountCode={undefined}
              total={total}
              advanceAmount={0}
              termsAccepted={termsAccepted}
              onTermsChange={setTermsAccepted}
              onEditDelivery={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <PaymentStep
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              advanceAmount={0}
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
