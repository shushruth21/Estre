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
import { calculateDynamicPrice } from "@/lib/dynamic-pricing";
import { generateSaleOrderData } from "@/lib/sale-order-generator";
import { generateTechnicalSpecifications } from "@/lib/technical-specifications-generator";

const STEPS = [
  { id: 1, name: "Delivery", description: "Shipping details" },
  { id: 2, name: "Review", description: "Confirm & Pay" },
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
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [buyerGst, setBuyerGst] = useState<string>("");
  const [dispatchMethod, setDispatchMethod] = useState<string>("Safe Express");

  // Discount state
  const [discountCode, setDiscountCode] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);

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

  const subtotal = cartItems?.reduce((sum, item) => sum + (item.calculated_price || 0), 0) || 0;
  const total = Math.max(0, subtotal - discountAmount);
  const advanceAmount = total * 0.5;

  const applyDiscount = async (code: string) => {
    try {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        throw new Error("Invalid or expired discount code");
      }

      // Check expiry
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        throw new Error("Discount code has expired");
      }

      // Check usage limits
      if (data.max_usage && data.usage_count >= data.max_usage) {
        throw new Error("Discount code usage limit reached");
      }

      let calculatedDiscount = 0;
      if (data.type === "percent") {
        calculatedDiscount = (subtotal * (data.percent || 0)) / 100;
      } else {
        calculatedDiscount = data.value || 0;
      }

      setDiscountCode(code);
      setDiscountAmount(calculatedDiscount);

      toast({
        title: "Discount Applied",
        description: `Saved ₹${Math.round(calculatedDiscount).toLocaleString()}`,
      });
    } catch (error: any) {
      setDiscountCode("");
      setDiscountAmount(0);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!user || !cartItems || cartItems.length === 0) {
        throw new Error("Cart is empty");
      }

      // Generate confirmed order number (will rename DRAFT- to ORD-)
      const orderNumber = `ORD-${Date.now()}`;

      // 1. Update draft orders to confirmed status and rename order numbers
      // Rename all draft orders from DRAFT-xxx to ORD-xxx
      for (const item of cartItems) {
        const draftOrderNumber = item.order_number; // Original DRAFT-xxx number
        const { error: updateError } = await supabase
          .from("customer_orders")
          .update({
            status: "confirmed",
            order_number: orderNumber, // Rename from DRAFT-xxx to ORD-xxx
            updated_at: new Date().toISOString()
          })
          .eq("id", item.id)
          .eq("status", "draft");

        if (updateError) {
          console.error("Error updating draft order:", updateError);
          // Continue with other items even if one fails
        }
      }

      // 2. Create Order in orders table (for order management)
      const orderData: any = {
        order_number: orderNumber,
        customer_id: user.id,
        customer_name: user.user_metadata?.full_name || user.email,
        customer_email: user.email || "",
        customer_phone: user.user_metadata?.phone || "",
        delivery_address: deliveryAddress,
        expected_delivery_date: expectedDeliveryDate?.toISOString().split('T')[0],
        special_instructions: specialInstructions,
        subtotal_rs: subtotal,
        discount_code: discountCode || null,
        discount_amount_rs: discountAmount,
        net_total_rs: total,
        status: "confirmed", // Immediately confirmed
        payment_status: "pending",
        payment_method: paymentMethod,
        advance_percent: 50,
        advance_amount_rs: advanceAmount,
        terms_accepted: termsAccepted,
        terms_accepted_at: new Date().toISOString(),
      };

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Create Order Items
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

      // 4. Create Sale Order (Auto-generated)
      const saleOrderData = {
        customer_id: user.id,
        order_id: order.id,
        status: "confirmed_by_customer",
        base_price: subtotal,
        discount: discountAmount,
        final_price: total,
        advance_amount_rs: advanceAmount,
        // Add customer fields for reliable email sending
        customer_email: user.email || order.customer_email,
        customer_name: user.user_metadata?.full_name || order.customer_name || user.email || "Customer",
        order_number: orderNumber,
        metadata: {
          discount_code: discountCode,
          auto_generated: true
        }
      };

      const { data: saleOrder, error: saleOrderError } = await supabase
        .from("sale_orders")
        .insert(saleOrderData)
        .select()
        .single();

      if (saleOrderError) {
        console.error("Error creating sale order:", saleOrderError);
        // Rollback: Delete the created order to prevent inconsistent state
        await supabase.from("orders").delete().eq("id", order.id);
        // Also revert draft order updates
        for (const item of cartItems) {
          await supabase
            .from("customer_orders")
            .update({
              status: "draft",
              order_number: item.order_number, // Revert to original DRAFT- number
            })
            .eq("id", item.id);
        }
        throw new Error(`Failed to create sale order: ${saleOrderError.message}`);
      }

      // 5. Create Job Cards
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

          saleData.jobCards.forEach((jobCard) => {
            const technicalSpecs = generateTechnicalSpecifications(
              item,
              item.configuration,
              jobCard
            );

            jobCardInserts.push({
              job_card_number: jobCard.jobCardNumber,
              so_number: jobCard.soNumber,
              line_item_id: jobCard.lineItemId,
              order_id: order.id,
              order_item_id: item.id,
              sale_order_id: saleOrder?.id || null,
              order_number: jobCard.soNumber,
              customer_name: jobCard.customer.name,
              customer_phone: jobCard.customer.phone,
              customer_email: jobCard.customer.email || order.customer_email,
              delivery_address: jobCard.customer.address,
              product_category: jobCard.category,
              product_type: technicalSpecs.sofa_type || technicalSpecs.product_type,
              product_title: jobCard.modelName,
              configuration: jobCard.configuration,
              technical_specifications: technicalSpecs,
              fabric_codes: jobCard.fabricPlan.fabricCodes,
              fabric_meters: jobCard.fabricPlan,
              accessories: {
                console: jobCard.console,
                dummySeats: jobCard.dummySeats,
                sections: jobCard.sections,
              },
              dimensions: jobCard.dimensions,
              status: "pending",
              priority: "normal",
            });
          });
        }
      }

      if (jobCardInserts.length > 0) {
        const { data: insertedJobCards, error: jobCardError } = await supabase
          .from("job_cards")
          .insert(jobCardInserts)
          .select();

        if (jobCardError) {
          console.error("❌ Failed to create job cards:", jobCardError);
          // Don't throw - order is created, job cards can be created manually
          toast({
            title: "Warning",
            description: `Order created but job cards failed: ${jobCardError.message}. Staff can create them manually.`,
            variant: "destructive",
          });
        } else {
          console.log(`✅ Created ${insertedJobCards?.length || 0} job cards`);
        }
      }

      // 6. Trigger PDF Generation & Email (via Edge Function)
      if (saleOrder) {
        try {
          await supabase.functions.invoke("generate-sale-order-pdf", {
            body: {
              saleOrderId: saleOrder.id,
              mode: "final", // Send final PDF immediately
              requireOTP: false // No OTP needed as they just confirmed
            },
          });
        } catch (err) {
          console.error("Failed to trigger PDF generation:", err);
        }
      }

      // 7. Create Timeline Entry
      await supabase.from("order_timeline").insert({
        order_id: order.id,
        status: "confirmed",
        title: "Order Confirmed",
        description: "Order placed and confirmed by customer. Order number renamed from DRAFT- to ORD-.",
        created_by: user.id,
      });

      // Note: Draft orders are now updated to confirmed status with renamed order numbers
      // They are NOT deleted - they remain in customer_orders with status "confirmed"

      // Update discount usage if applicable
      if (discountCode) {
        await supabase.rpc('increment_discount_usage', { code: discountCode });
      }

      return { order };
    },
    onSuccess: () => {
      toast({
        title: "Order Confirmed!",
        description: "Your order has been placed successfully. Check your email for the sale order PDF.",
      });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      navigate("/dashboard");
    },
    onError: (error: any) => {
      console.error("Order creation error:", error);
      toast({
        title: "Order Failed",
        description: error.message || "An unexpected error occurred",
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
              discount={discountAmount}
              discountCode={discountCode}
              total={total}
              advanceAmount={advanceAmount}
              termsAccepted={termsAccepted}
              onTermsChange={setTermsAccepted}
              onEditDelivery={() => setCurrentStep(1)}
              onRequestReview={() => placeOrder.mutate()}
              onApplyDiscount={applyDiscount}
              isSubmitting={placeOrder.isPending}
            />
          )}

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {currentStep === 1 ? "Back to Cart" : "Previous"}
            </Button>

            {currentStep < STEPS.length && (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

