import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SaleOrderDocument } from "@/components/orders/SaleOrderDocument";
import { generateSaleOrderData, SaleOrderGeneratedData } from "@/lib/sale-order-generator";
import { calculateDynamicPrice } from "@/lib/dynamic-pricing";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const SaleOrder = () => {
  const { orderId, itemId } = useParams();
  const navigate = useNavigate();
  const [saleOrderData, setSaleOrderData] = useState<SaleOrderGeneratedData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch order
  const { data: order, isLoading: loadingOrder } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });

  // Fetch order items
  const { data: orderItems, isLoading: loadingItems } = useQuery({
    queryKey: ["order-items", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!orderId,
  });

  // Generate sale order data
  const generateSaleOrder = useCallback(async () => {
    if (!order || !orderItems || orderItems.length === 0) return;

    setIsGenerating(true);
    try {
      // Use the first order item, or the specified itemId
      const orderItem = itemId 
        ? orderItems.find((item: any) => item.id === itemId)
        : orderItems[0];

      if (!orderItem) {
        throw new Error("Order item not found");
      }

      // Recalculate pricing breakdown
      const pricing = await calculateDynamicPrice(
        orderItem.product_category,
        orderItem.product_id,
        orderItem.configuration
      );

      // Generate sale order data
      const saleData = await generateSaleOrderData(
        order,
        orderItem,
        orderItem.configuration,
        pricing.breakdown
      );

      setSaleOrderData(saleData);
    } catch (error: any) {
      console.error("Error generating sale order:", error);
      alert("Error generating sale order: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  }, [order, orderItems, itemId]);

  // Auto-generate on load
  useEffect(() => {
    if (order && orderItems && orderItems.length > 0 && !saleOrderData && !isGenerating) {
      generateSaleOrder();
    }
  }, [order, orderItems, saleOrderData, isGenerating, generateSaleOrder]);

  if (loadingOrder || loadingItems) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order || !orderItems || orderItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Order not found</p>
          <Button onClick={() => navigate("/orders")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p>Generating Sale Order...</p>
        </div>
      </div>
    );
  }

  if (!saleOrderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Preparing sale order...</p>
          <Button onClick={generateSaleOrder} disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Generate Sale Order"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 print:hidden">
          <Button variant="outline" onClick={() => navigate("/orders")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </div>
        <SaleOrderDocument data={saleOrderData} orderNumber={order.order_number} />
      </div>
    </div>
  );
};

export default SaleOrder;

