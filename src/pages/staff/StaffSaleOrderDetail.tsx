/**
 * Staff Sale Order Detail Page
 * Route: /staff/sale-orders/:id
 * 
 * Features:
 * - View complete sale order details
 * - Edit discount
 * - View all job cards (one per product)
 * - Preview/Download PDF
 * - Approve sale order
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, FileText, CheckCircle2, ArrowLeft, Tag, Eye, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

const formatCurrency = (value: number | null | undefined) => {
  if (!value || Number.isNaN(value)) return "₹0";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
};

export default function StaffSaleOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [discount, setDiscount] = useState<string>("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [requireOTP, setRequireOTP] = useState(false);
  const [showHTMLPreview, setShowHTMLPreview] = useState(false);
  const [editableHTML, setEditableHTML] = useState<string>("");

  // Fetch sale order with order and job cards
  const { data: saleOrder, isLoading } = useQuery({
    queryKey: ["staff-sale-order-detail", id],
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
            payment_method
          ),
          job_cards:job_cards(
            id,
            job_card_number,
            product_title,
            product_category,
            configuration,
            status
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Update discount mutation
  const updateDiscountMutation = useMutation({
    mutationFn: async (discountAmount: number) => {
      if (!saleOrder) throw new Error("Sale order not found");
      
      const finalPrice = saleOrder.base_price - discountAmount;
      
      const { error } = await supabase
        .from("sale_orders")
        .update({
          discount: discountAmount,
          final_price: finalPrice,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-sale-order-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["staff-sale-orders"] });
      toast({
        title: "Discount Updated",
        description: "Discount has been applied successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update discount",
        variant: "destructive",
      });
    },
  });

  // Generate Draft PDF mutation
  const generateDraftPDFMutation = useMutation({
    mutationFn: async () => {
      setIsGeneratingPDF(true);
      const { data, error } = await supabase.functions.invoke("generate-sale-order-pdf", {
        body: { saleOrderId: id, mode: "draft" },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-sale-order-detail", id] });
      toast({
        title: "Draft PDF Generated",
        description: "Preview the PDF below. You can approve and send the final PDF when ready.",
      });
      setIsGeneratingPDF(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate draft PDF",
        variant: "destructive",
      });
      setIsGeneratingPDF(false);
    },
  });

  // Approve & Send Final PDF mutation
  const approveAndSendFinalPDFMutation = useMutation({
    mutationFn: async () => {
      setIsGeneratingPDF(true);
      const { data, error } = await supabase.functions.invoke("generate-sale-order-pdf", {
        body: { 
          saleOrderId: id, 
          mode: "final", 
          requireOTP: requireOTP 
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-sale-order-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["staff-sale-orders"] });
      queryClient.invalidateQueries({ queryKey: ["customer-sale-orders"] });
      toast({
        title: "Order Approved",
        description: `Final PDF sent to customer. ${requireOTP ? 'OTP generated and sent.' : 'Customer can confirm directly.'}`,
      });
      setIsGeneratingPDF(false);
      navigate("/staff/sale-orders");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve and send PDF",
        variant: "destructive",
      });
      setIsGeneratingPDF(false);
    },
  });

  // Approve sale order mutation
  const approveSaleOrderMutation = useMutation({
    mutationFn: async () => {
      // Update status to staff_approved
      const { error } = await supabase
        .from("sale_orders")
        .update({
          status: "staff_approved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-sale-order-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["staff-sale-orders"] });
      queryClient.invalidateQueries({ queryKey: ["customer-sale-orders"] }); // Refresh customer dashboard
      toast({
        title: "Sale Order Approved",
        description: "Customer has been notified. PDF sent to email.",
      });
      navigate("/staff/sale-orders");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve sale order",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <StaffLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </StaffLayout>
    );
  }

  if (!saleOrder) {
    return (
      <StaffLayout>
        <Card>
          <CardContent className="pt-6">
            <p>Sale order not found</p>
            <Button onClick={() => navigate("/staff/sale-orders")}>Back to Sale Orders</Button>
          </CardContent>
        </Card>
      </StaffLayout>
    );
  }

  const orderNumber = saleOrder.order?.order_number || `SO-${id?.slice(0, 8).toUpperCase()}`;
  const currentDiscount = discount || saleOrder.discount || 0;

  return (
    <StaffLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate("/staff/sale-orders")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold mt-4">
              Sale Order #{orderNumber}
            </h1>
            <p className="text-muted-foreground mt-1">
              Customer: {saleOrder.order?.customer_name}
            </p>
            <Badge className="mt-2" variant={
              saleOrder.status === "pending_review" || saleOrder.status === "pending_staff_review" 
                ? "default" 
                : saleOrder.status === "staff_approved" || saleOrder.status === "staff_pdf_generated"
                ? "default" 
                : "secondary"
            }>
              {saleOrder.status?.replace(/_/g, " ").toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* SECTION 1: Sale Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Sale Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Base Price</Label>
                <p className="text-2xl font-bold">{formatCurrency(saleOrder.base_price)}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Final Price</Label>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(saleOrder.final_price)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Discount Applied</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={currentDiscount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="Enter discount"
                  min="0"
                  max={saleOrder.base_price}
                />
                <Button
                  onClick={() => updateDiscountMutation.mutate(Number(discount))}
                  disabled={updateDiscountMutation.isPending || !discount}
                >
                  {updateDiscountMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Tag className="mr-2 h-4 w-4" />
                      Apply Discount
                    </>
                  )}
                </Button>
              </div>
              {saleOrder.discount > 0 && (
                <p className="text-sm text-green-600">
                  Current discount: {formatCurrency(saleOrder.discount)}
                </p>
              )}
            </div>

            <Separator />

            <div>
              <Label className="text-sm text-muted-foreground">Payment Mode</Label>
              <p className="font-semibold">
                {saleOrder.order?.payment_method === "cash" ? "Cash on Delivery" : "Online Payment"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: Job Cards List */}
        <Card>
          <CardHeader>
            <CardTitle>Job Cards ({saleOrder.job_cards?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {saleOrder.job_cards && saleOrder.job_cards.length > 0 ? (
              <div className="space-y-4">
                {saleOrder.job_cards.map((jobCard: any, index: number) => (
                  <Card key={jobCard.id} className="bg-muted">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Jobcard {index + 1} — Product {index + 1}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="font-semibold">Product: {jobCard.product_title}</p>
                        <p className="text-sm text-muted-foreground">
                          Category: {jobCard.product_category}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold mb-2">Configuration:</p>
                        <div className="bg-background p-3 rounded-lg">
                          <pre className="text-xs overflow-auto">
                            {JSON.stringify(jobCard.configuration, null, 2)}
                          </pre>
                        </div>
                      </div>
                      <Badge variant="outline">{jobCard.status}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No job cards found for this sale order.
              </p>
            )}
          </CardContent>
        </Card>

        {/* SECTION 3: HTML Preview & PDF Generation */}
        <Card>
          <CardHeader>
            <CardTitle>HTML Preview & PDF Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="preview" className="w-full">
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="html">Edit HTML</TabsTrigger>
              </TabsList>
              <TabsContent value="preview" className="space-y-4">
                {(saleOrder.draft_pdf_url || saleOrder.final_pdf_url || saleOrder.pdf_url) ? (
                  <>
                    <div className="border rounded-lg p-4 bg-muted">
                      <iframe
                        src={saleOrder.final_pdf_url || saleOrder.draft_pdf_url || saleOrder.pdf_url}
                        className="w-full h-96 border-0 rounded"
                        title="Sale Order PDF"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" className="flex-1">
                        <a href={saleOrder.final_pdf_url || saleOrder.draft_pdf_url || saleOrder.pdf_url} download target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </a>
                      </Button>
                      {saleOrder.draft_html && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditableHTML(saleOrder.draft_html || saleOrder.final_html || "");
                            setShowHTMLPreview(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View HTML
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">PDF not generated yet</p>
                    <Button
                      onClick={() => generateDraftPDFMutation.mutate()}
                      disabled={isGeneratingPDF}
                    >
                      {isGeneratingPDF ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Generate Draft PDF
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="html" className="space-y-4">
                <div className="space-y-2">
                  <Label>Edit HTML Template</Label>
                  <Textarea
                    value={editableHTML || saleOrder.draft_html || saleOrder.final_html || ""}
                    onChange={(e) => setEditableHTML(e.target.value)}
                    className="font-mono text-xs min-h-[400px]"
                    placeholder="HTML content will appear here after generating draft PDF"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        if (!editableHTML) return;
                        const { error } = await supabase
                          .from("sale_orders")
                          .update({ draft_html: editableHTML })
                          .eq("id", id);
                        if (error) {
                          toast({
                            title: "Error",
                            description: error.message,
                            variant: "destructive",
                          });
                        } else {
                          toast({
                            title: "HTML Saved",
                            description: "HTML template updated successfully.",
                          });
                          queryClient.invalidateQueries({ queryKey: ["staff-sale-order-detail", id] });
                        }
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Save HTML
                    </Button>
                    {editableHTML && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const newWindow = window.open();
                          if (newWindow) {
                            newWindow.document.write(editableHTML);
                            newWindow.document.close();
                          }
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview HTML
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* SECTION 4: Actions */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {(saleOrder.status === "pending_review" || saleOrder.status === "pending_staff_review" || saleOrder.status === "staff_editing") && (
              <>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      // Update status to staff_editing
                      supabase
                        .from("sale_orders")
                        .update({ status: "staff_editing" })
                        .eq("id", id)
                        .then(() => {
                          queryClient.invalidateQueries({ queryKey: ["staff-sale-order-detail", id] });
                        });
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Order
                  </Button>
                  <Button
                    onClick={() => generateDraftPDFMutation.mutate()}
                    disabled={isGeneratingPDF}
                    variant="outline"
                    className="flex-1"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Draft PDF
                      </>
                    )}
                  </Button>
                </div>
                {(saleOrder.draft_pdf_url || saleOrder.draft_html) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="requireOTP"
                        checked={requireOTP}
                        onChange={(e) => setRequireOTP(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="requireOTP" className="cursor-pointer">
                        Require OTP for customer confirmation
                      </Label>
                    </div>
                    <Button
                      onClick={() => approveAndSendFinalPDFMutation.mutate()}
                      disabled={approveAndSendFinalPDFMutation.isPending || isGeneratingPDF}
                      className="w-full"
                      size="lg"
                    >
                      {approveAndSendFinalPDFMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve & Send Final PDF to Customer
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
            {saleOrder.status === "staff_pdf_generated" && (
              <Button
                onClick={() => {
                  supabase
                    .from("sale_orders")
                    .update({ status: "staff_approved" })
                    .eq("id", id)
                    .then(() => {
                      queryClient.invalidateQueries({ queryKey: ["staff-sale-order-detail", id] });
                      toast({
                        title: "Order Approved",
                        description: "Sale order status updated to approved.",
                      });
                    });
                }}
                className="w-full"
                size="lg"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve Sale Order
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}

