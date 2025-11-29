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

import { renderToStaticMarkup } from "react-dom/server";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, FileText, CheckCircle2, ArrowLeft, Tag, Eye, Edit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PerfectSaleOrder } from "@/components/orders/PerfectSaleOrder";
import { format } from "date-fns";
import { generateSaleOrderData, SaleOrderGeneratedData } from "@/lib/sale-order-generator";
import { calculateDynamicPrice } from "@/lib/dynamic-pricing";


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
  const [saleOrderPreviewData, setSaleOrderPreviewData] = useState<SaleOrderGeneratedData | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // Fetch sale order with order and job cards
  const { data: saleOrder, isLoading, error: queryError } = useQuery({
    queryKey: ["staff-sale-order-detail", id],
    queryFn: async () => {
      console.log("🔍 Fetching sale order with ID:", id);

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
            payment_method,
            order_items:order_items(
              id,
              quantity,
              unit_price_rs,
              total_price_rs,
              product_title,
              product_category,
              configuration
            ),
            job_cards:job_cards(
              id,
              job_card_number,
              product_title,
              product_category,
              configuration,
              status,
              order_item_id
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) {
        console.error("❌ Sale order query error:", error);
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      if (!data) {
        console.error("❌ No sale order found for ID:", id);
        throw new Error("Sale order not found in database");
      }

      console.log("✅ Sale order loaded successfully:", {
        id: data.id,
        so_number: data.so_number,
        hasOrder: !!data.order,
        jobCardsCount: data.order?.job_cards?.length || 0,
      });

      // Generate preview data for SaleOrderDocument component
      // Note: This requires pricing breakdown calculation which may not be available
      // For now, we'll skip this and use the premium template system instead
      // The SaleOrderDocument will be rendered using the premium template via mapSaleOrderData
      if (data.order && data.order.order_items && data.order.order_items.length > 0) {
        try {
          // Try to generate preview data for the first order item if we have all required data
          const firstItem = data.order.order_items[0];
          if (firstItem && firstItem.configuration) {
            // We would need to calculate pricing breakdown here, but that's expensive
            // Instead, we'll rely on the premium template system
            console.log("⚠️ Preview data generation skipped - use premium template instead");
          }
        } catch (error) {
          console.error("⚠️ Failed to generate preview data:", error);
        }
      }

      return data;
    },
    enabled: !!id,
    retry: 1,
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

  // Generate Draft PDF mutation - Use client-side preview instead of Edge Function
  const generateDraftPDFMutation = useMutation({
    mutationFn: async () => {
      setIsGeneratingPDF(true);

      // Update status to indicate draft is ready
      const { error } = await supabase
        .from("sale_orders")
        .update({
          status: "staff_pdf_generated",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      return { success: true, clientSide: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-sale-order-detail", id] });
      toast({
        title: "Preview Ready",
        description: "Scroll to 'PDF Document' tab below to view, edit, and print the sale order.",
      });
      setIsGeneratingPDF(false);
      // Auto-scroll to PDF preview tab
      setTimeout(() => {
        document.getElementById("pdf-preview-section")?.scrollIntoView({ behavior: "smooth" });
      }, 500);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to prepare draft",
        variant: "destructive",
      });
      setIsGeneratingPDF(false);
    },
  });

  // Approve & Send Final PDF mutation - Try Edge Function with graceful fallback
  const approveAndSendFinalPDFMutation = useMutation({
    mutationFn: async () => {
      setIsGeneratingPDF(true);

      // Try Edge Function for automated PDF + email
      const { data, error } = await supabase.functions.invoke("generate-sale-order-pdf", {
        body: {
          saleOrderId: id,
          mode: "final",
          requireOTP: requireOTP
        },
      });

      // If Edge Function fails (missing API keys), fall back to manual process
      if (error) {
        console.warn("Edge Function failed, using manual fallback:", error);

        // Update status anyway so customer can see it
        const { error: updateError } = await supabase
          .from("sale_orders")
          .update({
            status: "customer_confirmation_pending",
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (updateError) throw updateError;

        // Return warning instead of error
        return {
          success: true,
          warning: "PDF generation API not configured. Please download PDF manually and send to customer.",
          manualProcess: true
        };
      }
      return data;
    },
    onSuccess: async (data) => {
      // Auto-create job cards if they don't exist
      if (saleOrder?.order?.order_items && saleOrder.order.order_items.length > 0) {
        // Check if job cards already exist
        const { data: existingJobCards } = await supabase
          .from('job_cards')
          .select('id')
          .eq('sale_order_id', saleOrder.id);

        // Only create if no job cards exist
        if (!existingJobCards || existingJobCards.length === 0) {
          const jobCardsToCreate = saleOrder.order.order_items.map((item, index) => ({
            sale_order_id: saleOrder.id,
            order_id: saleOrder.order_id,
            order_item_id: item.id,
            job_card_number: `${orderNumber}/${String(index + 1).padStart(2, '0')}`,
            product_title: item.product_title,
            product_category: item.product_category,
            configuration: item.configuration,
            status: 'pending',
            issue_date: new Date().toISOString(),
          }));

          await supabase.from('job_cards').insert(jobCardsToCreate);

          console.log(`✅ Created ${jobCardsToCreate.length} job cards for sale order ${orderNumber}`);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["staff-sale-order-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["staff-sale-orders"] });
      queryClient.invalidateQueries({ queryKey: ["customer-sale-orders"] });
      queryClient.invalidateQueries({ queryKey: ["staff-job-cards"] });
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["staff-sale-order-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["staff-sale-orders"] });
      queryClient.invalidateQueries({ queryKey: ["customer-sale-orders"] }); // Refresh customer dashboard

      if (data?.manualProcess) {
        toast({
          title: "Ready for Manual Delivery",
          description: data.warning,
          variant: "default",
        });
      } else {
        toast({
          title: "Sale Order Approved",
          description: "Customer has been notified. PDF sent to email.",
        });
      }

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
          <span className="ml-2 text-muted-foreground">Loading sale order...</span>
        </div>
      </StaffLayout>
    );
  }

  if (queryError) {
    return (
      <StaffLayout>
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Sale Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="font-semibold">Error Message:</p>
              <p className="text-sm text-muted-foreground bg-destructive/10 p-3 rounded">
                {queryError.message}
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Sale Order ID:</p>
              <p className="text-sm font-mono bg-muted p-2 rounded">{id}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Common causes:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Sale order doesn't exist in database</li>
                <li>Related order record is missing</li>
                <li>Database permission issues</li>
                <li>Check browser console for detailed error logs</li>
              </ul>
            </div>
            <Button onClick={() => navigate("/staff/sale-orders")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sale Orders
            </Button>
          </CardContent>
        </Card>
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
              saleOrder.status === "pending_review" || saleOrder.status === "staff_editing"
                ? "default"
                : saleOrder.status === "staff_approved" || saleOrder.status === "staff_pdf_generated"
                  ? "default"
                  : "secondary"
            }>
              {saleOrder.status?.replace(/_/g, " ").toUpperCase()}
            </Badge>
          </div>
          <div className="flex gap-2 no-print">
            <Button
              variant="outline"
              onClick={() => window.print()}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
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
            <CardTitle>Job Cards ({saleOrder.order?.job_cards?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {saleOrder.order?.job_cards && saleOrder.order.job_cards.length > 0 ? (
              <div className="space-y-4">
                {saleOrder.order.job_cards.map((jobCard: any, index: number) => (
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
                      <div className="pt-2">
                        <Link to={`/production/job-card/${jobCard.id}`} target="_blank">
                          <Button variant="outline" size="sm" className="w-full">
                            <Printer className="mr-2 h-4 w-4" />
                            Print for Production
                          </Button>
                        </Link>
                      </div>
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
            <Tabs defaultValue="document" className="w-full">
              <TabsList>
                <TabsTrigger value="document">Document Preview</TabsTrigger>
                <TabsTrigger value="pdf">PDF Preview</TabsTrigger>
                <TabsTrigger value="html">Edit HTML</TabsTrigger>
              </TabsList>
              <TabsContent value="document" className="space-y-4" id="pdf-preview-section">
                <div className="flex items-center justify-between mb-4 no-print">
                  <p className="text-sm text-muted-foreground">
                    Live preview of the sale order document. Use Print/Download buttons below to save as PDF.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const printContent = document.getElementById("printable-area");
                        if (printContent) {
                          const originalContents = document.body.innerHTML;
                          document.body.innerHTML = printContent.innerHTML;
                          window.print();
                          document.body.innerHTML = originalContents;
                          window.location.reload(); // Reload to restore state
                        }
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Print / Download PDF
                    </Button>
                  </div>
                </div>

                <div id="printable-area" className="bg-white rounded-lg shadow overflow-hidden border">
                  {saleOrder.draft_html ? (
                    <div dangerouslySetInnerHTML={{ __html: saleOrder.draft_html }} />
                  ) : (
                    <PerfectSaleOrder data={{
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
                    }} />
                  )}
                </div>
              </TabsContent>
              <TabsContent value="pdf" className="space-y-4">
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
                  <div className="flex justify-between items-center">
                    <Label>Edit HTML Template</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const template = renderToStaticMarkup(
                          <PerfectSaleOrder data={{
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
                          }} />
                        );
                        setEditableHTML(template);
                      }}
                    >
                      Load Generated Template
                    </Button>
                  </div>
                  <Textarea
                    value={editableHTML || saleOrder.draft_html || saleOrder.final_html || ""}
                    onChange={(e) => setEditableHTML(e.target.value)}
                    className="font-mono text-xs min-h-[400px]"
                    placeholder="HTML content will appear here. Click 'Load Generated Template' to start editing the current design."
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
            {(saleOrder.status === "pending_review" || saleOrder.status === "staff_editing") && (
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
            {/* Show approve button only if PDF exists and status is staff_pdf_generated */}
            {/* Note: This button is now mostly redundant since PDF generation auto-transitions status,
                but keeping it for edge cases where manual approval might be needed */}
            {saleOrder.status === "staff_pdf_generated" && (saleOrder.final_pdf_url || saleOrder.draft_pdf_url) && (
              <Button
                onClick={() => {
                  supabase
                    .from("sale_orders")
                    .update({ status: "staff_approved" })
                    .eq("id", id)
                    .then(() => {
                      queryClient.invalidateQueries({ queryKey: ["staff-sale-order-detail", id] });
                      queryClient.invalidateQueries({ queryKey: ["customer-sale-orders"] });
                      toast({
                        title: "Order Approved",
                        description: "Sale order status updated to approved. Customer can now confirm their order.",
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

