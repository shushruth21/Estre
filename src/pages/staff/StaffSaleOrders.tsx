/**
 * StaffSaleOrders Page
 * 
 * Staff dashboard for reviewing sale orders and applying discounts.
 * Features:
 * - View all sale orders pending staff review
 * - Apply discount codes or manual discount amounts
 * - Approve orders to trigger PDF generation
 * - View order details and customer information
 * 
 * Route: /staff/sale-orders
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { DiscountCodeSelector } from "@/components/DiscountCodeSelector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Tag, Eye, CheckCircle2, AlertCircle, ClipboardList, FileCheck, Download } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { PerfectSaleOrder } from "@/components/orders/PerfectSaleOrder";

const formatCurrency = (value: number | null | undefined) => {
  if (!value || Number.isNaN(value)) return "₹0";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
};

export default function StaffSaleOrders() {
  const { user, isStaff, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSaleOrder, setSelectedSaleOrder] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [manualDiscount, setManualDiscount] = useState<string>("");
  const [isCompletingOrder, setIsCompletingOrder] = useState(false);

  // Real-time subscription
  useEffect(() => {
    console.log("🔌 Setting up real-time subscription for sale_orders");
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sale_orders'
        },
        (payload) => {
          console.log('🔔 Real-time update received:', payload);
          queryClient.invalidateQueries({ queryKey: ["staff-sale-orders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch pending sale orders with better error handling
  const { data: saleOrders, isLoading, error: saleOrdersError, refetch } = useQuery({
    queryKey: ["staff-sale-orders"],
    queryFn: async () => {
      console.log("🔍 Fetching sale orders...", {
        isStaff: isStaff(),
        isAdmin: isAdmin(),
        userId: user?.id,
      });

      // First, verify we can access the table at all (test query)
      const testQuery = await supabase
        .from("sale_orders")
        .select("id")
        .limit(1);

      if (testQuery.error) {
        console.error("❌ Cannot access sale_orders table:", testQuery.error);
        throw new Error(`RLS Policy Error: ${testQuery.error.message}. Please ensure RLS policies are configured correctly.`);
      }

      const queryPromise = supabase
        .from("sale_orders")
        .select(`
          *,
          order:orders(
            id,
            order_number,
            customer_name,
            customer_email,
            customer_phone,
            delivery_address,
            expected_delivery_date,
            special_instructions,
            order_items:order_items(
              id,
              quantity,
              unit_price_rs,
              total_price_rs,
              product_title,
              product_category,
              configuration
            )
          )
        `)
        .order("created_at", { ascending: false });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Query timeout after 10 seconds")), 10000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) {
        console.error("❌ Sale orders query error:", error);
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        // Check if it's a permission error
        if (error.code === 'PGRST301' || error.message?.includes('permission') || error.message?.includes('RLS')) {
          throw new Error("Permission denied. Please ensure you have staff/admin role and RLS policies are configured.");
        }

        // Check if table doesn't exist
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          throw new Error("sale_orders table not found. Please run database migration: 20251121000002_create_sale_orders.sql");
        }

        // Check if column doesn't exist
        if (error.message?.includes('column') && error.message?.includes('does not exist')) {
          throw new Error(`Database column error: ${error.message}. Please run database migrations.`);
        }

        throw error;
      }

      console.log("✅ Sale orders fetched:", data?.length || 0, "orders");
      return data || [];
    },
    enabled: (isStaff() || isAdmin()) && !!user,
    retry: 1,
    refetchOnWindowFocus: true,
  });

  // Apply discount code mutation
  const applyDiscountCodeMutation = useMutation({
    mutationFn: async ({
      saleOrderId,
      discountCode,
    }: {
      saleOrderId: string;
      discountCode: string;
    }) => {
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

      // Get current sale order
      const { data: saleOrder, error: orderError } = await supabase
        .from("sale_orders")
        .select("base_price")
        .eq("id", saleOrderId)
        .single();

      if (orderError) throw orderError;

      // Calculate discount amount
      let discountAmount = 0;
      if (discountData.type === "percent") {
        discountAmount = (saleOrder.base_price * discountData.percent) / 100;
      } else {
        discountAmount = discountData.value || 0;
      }

      const finalPrice = saleOrder.base_price - discountAmount;

      // Update sale order
      const { error: updateError } = await supabase
        .from("sale_orders")
        .update({
          discount: discountAmount,
          final_price: finalPrice,
          status: "awaiting_customer_confirmation",
          updated_at: new Date().toISOString(),
        })
        .eq("id", saleOrderId);

      if (updateError) throw updateError;

      // Update usage count
      await supabase
        .from("discount_codes")
        .update({ usage_count: (discountData.usage_count || 0) + 1 })
        .eq("code", discountCode);

      // Trigger PDF generation (via Edge Function)
      try {
        const { data: pdfData, error: pdfError } = await supabase.functions.invoke("generate-sale-order-pdf", {
          body: { saleOrderId },
        });

        if (pdfError) {
          console.error("PDF generation error:", pdfError);
          // Don't throw - PDF generation can be retried
          toast({
            title: "PDF Generation Initiated",
            description: "PDF is being generated. Customer will receive email shortly.",
            variant: "default",
          });
        } else if (pdfData?.success) {
          toast({
            title: "PDF Generated",
            description: "PDF has been generated and email sent to customer.",
          });
        }
      } catch (invokeError) {
        console.error("Function invoke error:", invokeError);
        // Don't throw - allow retry
      }

      return { discountAmount, finalPrice };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-sale-orders"] });
      setIsDiscountDialogOpen(false);
      setSelectedSaleOrder(null);
      toast({
        title: "Discount Applied",
        description: "Sale order approved. PDF generated and sent to customer for confirmation.",
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

  // Apply manual discount mutation
  const applyManualDiscountMutation = useMutation({
    mutationFn: async ({
      saleOrderId,
      discountAmount,
    }: {
      saleOrderId: string;
      discountAmount: number;
    }) => {
      const { data: saleOrder, error: orderError } = await supabase
        .from("sale_orders")
        .select("base_price")
        .eq("id", saleOrderId)
        .single();

      if (orderError) throw orderError;

      if (discountAmount < 0 || discountAmount > saleOrder.base_price) {
        throw new Error("Discount amount must be between 0 and base price");
      }

      const finalPrice = saleOrder.base_price - discountAmount;

      const { error: updateError } = await supabase
        .from("sale_orders")
        .update({
          discount: discountAmount,
          final_price: finalPrice,
          status: "awaiting_customer_confirmation",
          updated_at: new Date().toISOString(),
        })
        .eq("id", saleOrderId);

      if (updateError) throw updateError;

      // Trigger PDF generation
      try {
        const { data: pdfData, error: pdfError } = await supabase.functions.invoke("generate-sale-order-pdf", {
          body: { saleOrderId },
        });

        if (pdfError) {
          console.error("PDF generation error:", pdfError);
          toast({
            title: "PDF Generation Initiated",
            description: "PDF is being generated. Customer will receive email shortly.",
            variant: "default",
          });
        } else if (pdfData?.success) {
          toast({
            title: "PDF Generated",
            description: "PDF has been generated and email sent to customer.",
          });
        }
      } catch (invokeError) {
        console.error("Function invoke error:", invokeError);
        // Don't throw - allow retry
      }

      return { discountAmount, finalPrice };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-sale-orders"] });
      setIsDiscountDialogOpen(false);
      setSelectedSaleOrder(null);
      setManualDiscount("");
      toast({
        title: "Discount Applied",
        description: "Sale order approved. PDF generated and sent to customer for confirmation.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Applying Discount",
        description: error.message || "Failed to apply discount",
        variant: "destructive",
      });
    },
  });

  const handleApplyDiscountCode = (code: string) => {
    if (selectedSaleOrder) {
      applyDiscountCodeMutation.mutate({
        saleOrderId: selectedSaleOrder.id,
        discountCode: code,
      });
    }
  };

  const handleApplyManualDiscount = () => {
    if (selectedSaleOrder && manualDiscount) {
      const discountAmount = parseFloat(manualDiscount);
      if (isNaN(discountAmount) || discountAmount < 0) {
        toast({
          title: "Invalid Discount",
          description: "Please enter a valid discount amount",
          variant: "destructive",
        });
        return;
      }
      applyManualDiscountMutation.mutate({
        saleOrderId: selectedSaleOrder.id,
        discountAmount,
      });
    }
  };

  // Complete order mutation (mark as advance_paid after customer confirms)
  const completeOrderMutation = useMutation({
    mutationFn: async (saleOrderId: string) => {
      const { error } = await supabase
        .from("sale_orders")
        .update({
          status: "advance_paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", saleOrderId);

      if (error) throw error;

      // Update main order status to confirmed
      const { data: saleOrder } = await supabase
        .from("sale_orders")
        .select("order_id, final_price")
        .eq("id", saleOrderId)
        .single();

      if (saleOrder?.order_id) {
        const { error: orderError } = await supabase
          .from("orders")
          .update({
            status: "confirmed",
            payment_status: "advance_paid",
            advance_amount_rs: saleOrder.final_price * 0.5,
            updated_at: new Date().toISOString(),
          })
          .eq("id", saleOrder.order_id);

        if (orderError) throw orderError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-sale-orders"] });
      toast({
        title: "Order Completed",
        description: "Order marked as advance paid and moved to production.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Completing Order",
        description: error.message || "Failed to complete order",
        variant: "destructive",
      });
    },
  });

  // Finish order mutation (mark order as production ready)
  const finishOrderMutation = useMutation({
    mutationFn: async ({ saleOrderId, orderId }: { saleOrderId: string; orderId: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "production",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-sale-orders"] });
      toast({
        title: "Order Finished",
        description: "Order moved to production phase.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Finishing Order",
        description: error.message || "Failed to finish order",
        variant: "destructive",
      });
    },
  });

  if (!isStaff() && !isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have permission to access this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <StaffLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sale Orders Review</h1>
          <p className="text-muted-foreground">
            Review and approve customer orders. Apply discounts and trigger PDF generation.
          </p>
        </div>

        {saleOrdersError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading sale orders: {saleOrdersError.message || "Unknown error"}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="ml-4"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              Pending Review ({saleOrders?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading sale orders...</span>
              </div>
            ) : saleOrders && saleOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Base Price</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {saleOrders.map((saleOrder: any) => (
                      <TableRow key={saleOrder.id}>
                        <TableCell className="font-mono font-medium">
                          {saleOrder.order?.order_number || `SO-${saleOrder.id.slice(0, 8).toUpperCase()}`}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{saleOrder.order?.customer_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {saleOrder.order?.customer_email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(saleOrder.base_price)}
                        </TableCell>
                        <TableCell>
                          {format(new Date(saleOrder.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(saleOrder.final_pdf_url || saleOrder.draft_pdf_url || saleOrder.pdf_url) && (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                title="View PDF"
                              >
                                <a href={saleOrder.final_pdf_url || saleOrder.draft_pdf_url || saleOrder.pdf_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <Link to={`/staff/sale-orders/${saleOrder.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Dialog
                              open={isDetailDialogOpen && selectedSaleOrder?.id === saleOrder.id}
                              onOpenChange={(open) => {
                                setIsDetailDialogOpen(open);
                                if (open) {
                                  setSelectedSaleOrder(saleOrder);
                                } else {
                                  setSelectedSaleOrder(null);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Tag className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Sale Order Details</DialogTitle>
                                  <DialogDescription>
                                    Order: {saleOrder.order?.order_number}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  {/* Use the new Perfect Sale Order Template */}
                                  <div className="border rounded-lg overflow-hidden bg-gray-50">
                                    <PerfectSaleOrder
                                      data={{
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
                                          sections: [], // Simplified for preview, would need full mapping
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
                                          // ... map other fields as best as possible from available data
                                          // Note: Ideally we should store the full generated snapshot in sale_orders table
                                          // For now, we are reconstructing it for display
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
                                      }}
                                    />
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                                    {(saleOrder.status === "confirmed_by_customer" || saleOrder.status === "customer_confirmed") && (
                                      <Button
                                        onClick={() => {
                                          completeOrderMutation.mutate(saleOrder.id);
                                          setIsDetailDialogOpen(false);
                                        }}
                                        disabled={completeOrderMutation.isPending}
                                        className="flex-1"
                                      >
                                        {completeOrderMutation.isPending ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Completing...
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Complete Order
                                          </>
                                        )}
                                      </Button>
                                    )}

                                    {saleOrder.status === "advance_paid" && saleOrder.order?.status === "confirmed" && (
                                      <Button
                                        onClick={() => {
                                          finishOrderMutation.mutate({
                                            saleOrderId: saleOrder.id,
                                            orderId: saleOrder.order.id,
                                          });
                                          setIsDetailDialogOpen(false);
                                        }}
                                        disabled={finishOrderMutation.isPending}
                                        variant="default"
                                        className="flex-1"
                                      >
                                        {finishOrderMutation.isPending ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Finishing...
                                          </>
                                        ) : (
                                          <>
                                            <FileCheck className="mr-2 h-4 w-4" />
                                            Finish Order
                                          </>
                                        )}
                                      </Button>
                                    )}

                                    {saleOrder.order?.id && (
                                      <Button
                                        asChild
                                        variant="outline"
                                        className="flex-1"
                                      >
                                        <Link to={`/admin/job-cards?orderId=${saleOrder.order.id}`}>
                                          <ClipboardList className="mr-2 h-4 w-4" />
                                          View/Create Job Cards
                                        </Link>
                                      </Button>
                                    )}

                                    {saleOrder.status === "pending_review" && (
                                      <Button
                                        onClick={() => {
                                          applyManualDiscountMutation.mutate({
                                            saleOrderId: saleOrder.id,
                                            discountAmount: 0 // Approve with 0 discount
                                          });
                                        }}
                                        disabled={applyManualDiscountMutation.isPending}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        {applyManualDiscountMutation.isPending ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Approving...
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Approve & Send to Customer
                                          </>
                                        )}
                                      </Button>
                                    )}

                                    {(saleOrder.final_pdf_url || saleOrder.draft_pdf_url || saleOrder.pdf_url) && (
                                      <div className="flex gap-2 w-full">
                                        <Button
                                          asChild
                                          variant="default"
                                          className="flex-1 bg-gold text-walnut border-gold hover:bg-gold/90"
                                        >
                                          <a href={saleOrder.final_pdf_url || saleOrder.draft_pdf_url || saleOrder.pdf_url} target="_blank" rel="noopener noreferrer">
                                            <Eye className="mr-2 h-4 w-4" />
                                            View PDF
                                          </a>
                                        </Button>
                                        <Button
                                          asChild
                                          variant="outline"
                                          className="flex-1"
                                        >
                                          <a href={saleOrder.final_pdf_url || saleOrder.draft_pdf_url || saleOrder.pdf_url} download target="_blank" rel="noopener noreferrer">
                                            <Download className="mr-2 h-4 w-4" />
                                            Download
                                          </a>
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Dialog
                              open={isDiscountDialogOpen && selectedSaleOrder?.id === saleOrder.id}
                              onOpenChange={(open) => {
                                setIsDiscountDialogOpen(open);
                                if (open) {
                                  setSelectedSaleOrder(saleOrder);
                                } else {
                                  setSelectedSaleOrder(null);
                                  setManualDiscount("");
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="default" size="sm">
                                  <Tag className="h-4 w-4 mr-2" />
                                  Apply Discount
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Apply Discount</DialogTitle>
                                  <DialogDescription>
                                    Apply a discount code or enter a manual discount amount
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div>
                                    <Label>Apply Discount Code</Label>
                                    <DiscountCodeSelector
                                      onApply={handleApplyDiscountCode}
                                      disabled={
                                        applyDiscountCodeMutation.isPending ||
                                        applyManualDiscountMutation.isPending
                                      }
                                    />
                                  </div>
                                  <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                      <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                      <span className="bg-background px-2 text-muted-foreground">
                                        Or
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Manual Discount Amount</Label>
                                    <Input
                                      type="number"
                                      placeholder="Enter discount amount"
                                      value={manualDiscount}
                                      onChange={(e) => setManualDiscount(e.target.value)}
                                      disabled={
                                        applyDiscountCodeMutation.isPending ||
                                        applyManualDiscountMutation.isPending
                                      }
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Maximum: {formatCurrency(saleOrder.base_price)}
                                    </p>
                                  </div>
                                  <Button
                                    onClick={handleApplyManualDiscount}
                                    disabled={
                                      !manualDiscount ||
                                      applyDiscountCodeMutation.isPending ||
                                      applyManualDiscountMutation.isPending
                                    }
                                    className="w-full"
                                  >
                                    {applyManualDiscountMutation.isPending && (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Apply Manual Discount
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No sale orders pending review.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}

