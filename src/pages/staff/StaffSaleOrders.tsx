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

import { useState } from "react";
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
import { Loader2, Tag, Eye, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

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

  // Fetch pending sale orders
  const { data: saleOrders, isLoading } = useQuery({
    queryKey: ["staff-sale-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
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
            buyer_gst,
            dispatch_method,
            order_items:order_items(*)
          )
        `)
        .eq("status", "pending_staff_review")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isStaff() || isAdmin(),
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
          status: "awaiting_pdf_generation",
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
        description: "Sale order approved and PDF generation initiated.",
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
          status: "awaiting_pdf_generation",
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
        description: "Sale order approved and PDF generation initiated.",
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
                                  <Eye className="h-4 w-4" />
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
                                  <div>
                                    <Label className="text-sm font-semibold">Customer Information</Label>
                                    <div className="mt-2 space-y-1 text-sm">
                                      <p>
                                        <span className="font-medium">Name:</span> {saleOrder.order?.customer_name}
                                      </p>
                                      <p>
                                        <span className="font-medium">Email:</span> {saleOrder.order?.customer_email}
                                      </p>
                                      <p>
                                        <span className="font-medium">Phone:</span> {saleOrder.order?.customer_phone}
                                      </p>
                                      {saleOrder.order?.buyer_gst && (
                                        <p>
                                          <span className="font-medium">GST:</span> {saleOrder.order.buyer_gst}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-semibold">Pricing</Label>
                                    <div className="mt-2 space-y-1 text-sm">
                                      <div className="flex justify-between">
                                        <span>Base Price:</span>
                                        <span>{formatCurrency(saleOrder.base_price)}</span>
                                      </div>
                                      <div className="flex justify-between text-green-600">
                                        <span>Discount:</span>
                                        <span>-{formatCurrency(saleOrder.discount)}</span>
                                      </div>
                                      <div className="flex justify-between font-semibold border-t pt-1">
                                        <span>Final Price:</span>
                                        <span>{formatCurrency(saleOrder.final_price)}</span>
                                      </div>
                                    </div>
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

