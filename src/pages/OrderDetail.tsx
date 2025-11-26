/**
 * OrderDetail Page
 * 
 * Displays detailed view of a sale order including:
 * - Order information and status
 * - Line items with links to job cards
 * - Production timeline with realtime updates
 * - Delivery/dispatch details
 * - Discount code application (if order status allows)
 * 
 * Route: /orders/:id
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { DiscountCodeSelector } from "@/components/DiscountCodeSelector";
import {
  Loader2,
  ArrowLeft,
  Package,
  Truck,
  Clock,
  Tag,
  FileText,
  Calendar,
} from "lucide-react";

const formatCurrency = (value: number | null | undefined) => {
  if (!value || Number.isNaN(value)) return "₹0";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
};

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isCustomer } = useAuth();
  const queryClient = useQueryClient();

  // Set up realtime subscription for this order
  useRealtimeOrders({ orderIds: id ? [id] : [], enabled: !!id });

  // Fetch order details
  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      if (!id || !user) return null;

      const { data, error } = await supabase
        .from("orders")
        .select(
          `*, order_items(
            id,
            quantity,
            unit_price_rs,
            total_price_rs,
            product_title,
            product_category,
            configuration,
            product:products(id, title, category, images)
          ), discount_codes(code, label, percent)`
        )
        .eq("id", id)
        .eq("customer_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user && isCustomer(),
  });

  // Fetch job cards for this order
  const { data: jobCards, isLoading: jobCardsLoading } = useQuery({
    queryKey: ["job-cards", id],
    queryFn: async () => {
      if (!id) return [];

      const { data, error } = await supabase
        .from("job_cards")
        .select("*")
        .eq("order_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Fetch order timeline
  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["order-timeline", id],
    queryFn: async () => {
      if (!id) return [];

      const { data, error } = await supabase
        .from("order_timeline")
        .select("*")
        .eq("order_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Apply discount code mutation
  const applyDiscountMutation = useMutation({
    mutationFn: async (discountCode: string) => {
      if (!id || !order) throw new Error("Order not found");

      // Fetch discount code details
      const { data: discountData, error: discountError } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("code", discountCode)
        .eq("is_active", true)
        .single();

      if (discountError || !discountData) {
        throw new Error("Invalid or inactive discount code");
      }

      // Calculate discount amount
      const subtotal = order.subtotal_rs || order.net_total_rs;
      let discountAmount = 0;

      if (discountData.type === "percent") {
        discountAmount = (subtotal * discountData.percent) / 100;
      } else {
        discountAmount = discountData.value || 0;
      }

      const newTotal = subtotal - discountAmount;

      // Update order with discount
      const { data, error } = await supabase
        .from("orders")
        .update({
          discount_code: discountCode,
          discount_amount_rs: discountAmount,
          net_total_rs: newTotal,
          balance_amount_rs: newTotal - (order.advance_amount_rs || 0),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Add timeline entry
      await supabase.from("order_timeline").insert({
        order_id: id,
        status: order.status,
        title: "Discount Applied",
        description: `Discount code ${discountCode} applied. Discount: ${formatCurrency(discountAmount)}`,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      toast({
        title: "Discount Applied",
        description: "Discount code has been successfully applied to your order.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Applying Discount",
        description: error.message || "Failed to apply discount code",
        variant: "destructive",
      });
    },
  });

  const isLoading = orderLoading || jobCardsLoading || timelineLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Order Not Found</h2>
              <p className="text-muted-foreground">
                The order you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canApplyDiscount = order.status === "pending" || order.status === "draft";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-gold/20 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl lg:text-4xl font-serif font-bold tracking-tight">
                  Order Details
                </h1>
                <p className="text-muted-foreground mt-1">
                  Sale Order: {order.order_number || `SO-${order.id.slice(0, 8).toUpperCase()}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10 space-y-6">
        {/* Order Summary Card */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-2xl font-serif">
                  Order Summary
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Placed on {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge
                className={`uppercase tracking-wide ${
                  order.status === "delivered"
                    ? "bg-green-500/10 text-green-600 border-green-500/30"
                    : order.status === "shipped"
                    ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                    : order.status === "ready_for_delivery"
                    ? "bg-purple-500/10 text-purple-600 border-purple-500/30"
                    : order.status === "production"
                    ? "bg-orange-500/10 text-orange-600 border-orange-500/30"
                    : order.status === "confirmed"
                    ? "bg-cyan-500/10 text-cyan-600 border-cyan-500/30"
                    : "bg-yellow-500/10 text-yellow-600 border-yellow-500/30"
                }`}
              >
                {order.status?.replace(/_/g, " ") || "PENDING"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pricing Breakdown */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Subtotal
                </p>
                <p className="text-lg font-semibold">
                  {formatCurrency(order.subtotal_rs || order.net_total_rs)}
                </p>
              </div>
              {order.discount_code && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Discount ({order.discount_code})
                  </p>
                  <p className="text-lg font-semibold text-green-600">
                    -{formatCurrency(order.discount_amount_rs || 0)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Net Total
                </p>
                <p className="text-lg font-semibold text-gold">
                  {formatCurrency(order.net_total_rs)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Balance Due
                </p>
                <p className="text-lg font-semibold">
                  {formatCurrency(order.balance_amount_rs)}
                </p>
              </div>
            </div>

            {/* Discount Code Application */}
            {canApplyDiscount && !order.discount_code && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">Apply Discount Code</p>
                  </div>
                  <DiscountCodeSelector
                    onApply={(code) => applyDiscountMutation.mutate(code)}
                    disabled={applyDiscountMutation.isPending}
                  />
                </div>
              </>
            )}

            {/* Delivery Information */}
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2 mb-2">
                  <Truck className="h-4 w-4" />
                  Delivery Information
                </p>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Expected Delivery:</span>{" "}
                    {order.expected_delivery_date || order.delivery_date
                      ? new Date(
                          order.expected_delivery_date || order.delivery_date
                        ).toLocaleDateString()
                      : "TBD"}
                  </p>
                  {order.delivery_method && (
                    <p className="text-sm">
                      <span className="font-medium">Method:</span> {order.delivery_method}
                    </p>
                  )}
                  {order.delivery_address && (
                    <div className="text-sm">
                      <span className="font-medium">Address:</span>
                      <p className="text-muted-foreground mt-1">
                        {typeof order.delivery_address === "string"
                          ? order.delivery_address
                          : JSON.stringify(order.delivery_address)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  Payment Information
                </p>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Advance Paid:</span>{" "}
                    {formatCurrency(order.advance_amount_rs || 0)}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Payment Status:</span>{" "}
                    {order.payment_status?.replace(/_/g, " ") || "Pending"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Line Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.order_items && order.order_items.length > 0 ? (
              <div className="space-y-4">
                {order.order_items.map((item: any) => {
                  const jobCard = jobCards?.find((jc) => jc.order_item_id === item.id);
                  return (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">
                            {item.product_title || "Product"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Category: {item.product_category}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity || 1}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(item.total_price_rs || item.unit_price_rs)}
                          </p>
                          {jobCard && (
                            <Link to={`/orders/${order.id}/job-card/${jobCard.id}`}>
                              <Button variant="outline" size="sm" className="mt-2">
                                <FileText className="mr-2 h-4 w-4" />
                                View Job Card
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                      {jobCard && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                Job Card: {jobCard.job_card_number}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Status: {jobCard.status?.replace(/_/g, " ") || "Pending"}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {jobCard.priority?.toUpperCase() || "NORMAL"}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No line items found for this order.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Production Timeline */}
        {timeline && timeline.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Production Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {timeline.map((entry: any) => (
                  <div
                    key={entry.id}
                    className="border-l-2 border-primary/30 pl-4 py-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{entry.title}</p>
                        {entry.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {entry.description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;

