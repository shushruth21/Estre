import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PerfectSaleOrder } from "@/components/orders/PerfectSaleOrder";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const SaleOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: saleOrder, isLoading, refetch } = useQuery({
    queryKey: ["sale-order", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sale_orders")
        .select(`
          *,
          order:orders(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const confirmOrderMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("sale_orders")
        .update({
          status: "customer_confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Order Confirmed",
        description: "Thank you for confirming your order. Proceeding to payment...",
      });
      refetch();
      // Navigate to payment or show payment modal
      // For now, we can navigate back to orders or stay here
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to confirm order. Please try again.",
        variant: "destructive",
      });
      console.error("Error confirming order:", error);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!saleOrder) {
    return <div>Sale Order not found</div>;
  }

  // Construct data for PerfectSaleOrder
  // Note: This mapping logic is duplicated from StaffSaleOrders.tsx. 
  // Ideally, we should move this to a helper function or hook.
  const perfectSaleOrderData = {
    header: {
      so_number: saleOrder.order_number,
      order_date: format(new Date(saleOrder.created_at), "dd-MMM-yyyy"),
      company: {
        name: "ESTRE GLOBAL PRIVATE LTD",
        addressLines: [
          "Near Dhoni Public School, AECS Layout – A Block",
          "Revenue Layout, Singasandra, Bengaluru – 560068"
        ],
        phone: "+91 8722200100",
        email: "support@estre.in",
        gst: "29AAMCE9846D1ZU"
      },
      invoice_to: {
        customer_name: saleOrder.customer_name,
        addressLines: [saleOrder.customer_address?.street, saleOrder.customer_address?.landmark].filter(Boolean),
        city: saleOrder.customer_address?.city,
        pincode: saleOrder.customer_address?.pincode,
        mobile: saleOrder.customer_phone,
        email: saleOrder.customer_email
      },
      dispatch_to: {
        customer_name: saleOrder.customer_name,
        addressLines: [saleOrder.customer_address?.street, saleOrder.customer_address?.landmark].filter(Boolean),
        city: saleOrder.customer_address?.city,
        pincode: saleOrder.customer_address?.pincode,
        mobile: saleOrder.customer_phone,
        email: saleOrder.customer_email
      },
      payment_terms: {
        advance_percent: 50,
        advance_condition: "On placing Sale Order",
        balance_condition: "Upon intimation of product readiness, before dispatch"
      },
      delivery_terms: {
        delivery_days: 30,
        delivery_date: saleOrder.order?.expected_delivery_date || format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "dd-MMM-yyyy"),
        dispatch_through: "Safe Express"
      },
      buyer_gst: saleOrder.order?.buyer_gst,
      status: saleOrder.status,
      created_at: saleOrder.created_at,
      updated_at: saleOrder.updated_at,
      created_by: "system",
      updated_by: "system"
    },
    lineItems: saleOrder.order?.order_items?.map((item: any) => ({
      line_item_id: item.id,
      so_number: saleOrder.order_number,
      category: item.product_category,
      model_name: item.product_title,
      shape: item.configuration?.shape || "",
      sections: [],
      fabric: {
        plan: item.configuration?.fabric?.claddingPlan || "Single Colour",
        upgrade_charge: 0,
        colour_variance_note: ""
      },
      seat_dimensions: {
        depth_in: 0,
        width_in: 0,
        height_in: 0,
        depth_upgrade_charge: 0,
        width_upgrade_charge: 0,
        height_upgrade_charge: 0
      },
      armrest_charge: 0,
      legs_charge: 0,
      accessories: [],
      approximate_widths: { overall_inches: 0 },
      line_total: item.total_price_rs || 0,
      ...((saleOrder.order?.metadata?.sale_orders?.[0]?.lineItems?.find((li: any) => li.line_item_id === item.id)) || {})
    })) || [],
    totals: {
      so_number: saleOrder.order_number,
      subtotal: saleOrder.base_price,
      discount_amount: saleOrder.discount,
      total_amount: saleOrder.final_price,
      advance_amount: saleOrder.final_price * 0.5,
      balance_amount: saleOrder.final_price * 0.5,
      paid_amount: 0,
      outstanding_amount: saleOrder.final_price
    },
    payments: [],
    jobCards: []
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-4" onClick={() => navigate("/orders")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <PerfectSaleOrder data={perfectSaleOrderData} />
        </div>

        {saleOrder.status === "awaiting_customer_confirmation" && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg z-50">
            <div className="container mx-auto flex justify-between items-center">
              <div className="text-lg font-bold">
                Total Amount: ₹{saleOrder.final_price.toLocaleString()}
              </div>
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => confirmOrderMutation.mutate()}
                disabled={confirmOrderMutation.isPending}
              >
                {confirmOrderMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirm & Pay Advance
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleOrder;
