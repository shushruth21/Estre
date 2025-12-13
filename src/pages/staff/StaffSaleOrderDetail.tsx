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

import { useState, useEffect } from "react";
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
import { Loader2, Download, FileText, CheckCircle2, ArrowLeft, Tag, Eye, Edit, ClipboardList, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PerfectSaleOrder } from "@/components/orders/PerfectSaleOrder";
import { format } from "date-fns";
import { generateSaleOrderData, SaleOrderGeneratedData } from "@/lib/sale-order-generator";
import { calculateDynamicPrice } from "@/lib/dynamic-pricing";
import { generateTechnicalSpecifications } from "@/lib/technical-specifications-generator";
import { JobCardsDisplay } from "@/components/staff/JobCardsDisplay";
import { EmailDeliveryMonitor } from "@/components/staff/EmailDeliveryMonitor";
import { generatePremiumSaleOrderHTML, mapSaleOrderData } from "@/lib/sale-order-pdf";
import { generatePremiumJobCardHTML, mapJobCardData } from "@/lib/job-card-pdf";
import { downloadPDF, getSaleOrderPDFUrl, generatePDFFilename } from "@/lib/pdf-download";


const formatCurrency = (value: number | null | undefined) => {
  if (!value || Number.isNaN(value)) return "₹0";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
};

const StaffSaleOrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isCreatingJobCards, setIsCreatingJobCards] = useState(false);
  const [discount, setDiscount] = useState<string>("");
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
              product_id,
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

  // Generate HTML for preview
  const previewHTML = saleOrder ? generatePremiumSaleOrderHTML(mapSaleOrderData(saleOrder)) : "";

  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (previewHTML) {
      const blob = new Blob([previewHTML], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setBlobUrl(null);
    }
  }, [previewHTML]);

  const handleCreateJobCards = async () => {
    if (!saleOrder?.order?.order_items || saleOrder.order.order_items.length === 0) {
      toast({
        title: "Error",
        description: "No order items found to create job cards from.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingJobCards(true);
    try {
      // Check if job cards already exist
      const { data: existingJobCards } = await supabase
        .from('job_cards')
        .select('id')
        .eq('sale_order_id', saleOrder.id);

      if (existingJobCards && existingJobCards.length > 0) {
        toast({
          title: "Info",
          description: "Job cards already exist for this order.",
        });
        setIsCreatingJobCards(false);
        return;
      }

      const jobCardInserts: any[] = [];

      for (const item of saleOrder.order.order_items) {
        const pricing = await calculateDynamicPrice(
          item.product_category,
          item.product_id,
          item.configuration
        );

        const saleData = await generateSaleOrderData(
          saleOrder.order,
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

          const jobCardData = {
            job_card_number: jobCard.jobCardNumber,
            so_number: jobCard.soNumber,
            line_item_id: jobCard.lineItemId,
            order_id: saleOrder.order_id,
            order_item_id: item.id,
            sale_order_id: saleOrder.id,
            order_number: jobCard.soNumber,
            customer_name: jobCard.customer.name,
            customer_phone: jobCard.customer.phone,
            customer_email: jobCard.customer.email || saleOrder.order.customer_email,
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
            issue_date: new Date().toISOString(),
          };

          // Generate HTML
          const templateData = mapJobCardData(jobCardData, saleOrder);
          const finalHtml = generatePremiumJobCardHTML(templateData);

          jobCardInserts.push({
            ...jobCardData,
            final_html: finalHtml,
            draft_html: finalHtml,
          });
        });
      }

      if (jobCardInserts.length > 0) {
        const { error } = await supabase.from('job_cards').insert(jobCardInserts);
        if (error) throw error;

        toast({
          title: "Success",
          description: `Created ${jobCardInserts.length} job cards successfully.`,
        });

        queryClient.invalidateQueries({ queryKey: ["staff-sale-order-detail", id] });
        queryClient.invalidateQueries({ queryKey: ["staff-job-cards"] });
      }
    } catch (error: any) {
      console.error("Error creating job cards:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create job cards",
        variant: "destructive",
      });
    } finally {
      setIsCreatingJobCards(false);
    }
  };

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
          requireOTP: false
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
      // Auto-create job cards with full HTML if they don't exist
      if (saleOrder?.order?.order_items && saleOrder.order.order_items.length > 0) {
        const { data: existingJobCards } = await supabase
          .from('job_cards')
          .select('id')
          .eq('sale_order_id', saleOrder.id);

        // Only create if no job cards exist
        if (!existingJobCards || existingJobCards.length === 0) {
          try {
            const jobCardsToCreate = [];

            for (let index = 0; index < saleOrder.order.order_items.length; index++) {
              const item = saleOrder.order.order_items[index];
              const jobCardNumber = `${orderNumber}/${String(index + 1).padStart(2, '0')}`;

              // Generate technical specifications
              const technicalSpecs = generateTechnicalSpecifications(
                item,
                item.configuration,
                { lineItemId: index + 1, jobCardNumber }
              );

              // Prepare job card data for HTML generation
              const jobCardForHTML = {
                job_card_number: jobCardNumber,
                so_number: orderNumber,
                order_number: orderNumber,
                product_title: item.product_title,
                product_category: item.product_category,
                configuration: item.configuration,
                technical_specifications: technicalSpecs,
                customer_name: saleOrder.order.customer_name,
                customer_email: saleOrder.order.customer_email,
                created_at: new Date().toISOString(),
              };

              // Generate HTML
              let finalHtml = "";
              try {
                const templateData = mapJobCardData(jobCardForHTML, saleOrder);
                finalHtml = generatePremiumJobCardHTML(templateData);
              } catch (e) {
                console.error("Error generating Job Card HTML", e);
              }

              jobCardsToCreate.push({
                sale_order_id: saleOrder.id,
                order_id: saleOrder.order_id,
                order_item_id: item.id,
                job_card_number: jobCardNumber,
                so_number: orderNumber,
                order_number: orderNumber,
                customer_name: saleOrder.order.customer_name,
                customer_email: saleOrder.order.customer_email,
                customer_phone: saleOrder.order.customer_phone,
                delivery_address: saleOrder.order.delivery_address,
                product_title: item.product_title,
                product_category: item.product_category,
                configuration: item.configuration,
                technical_specifications: technicalSpecs,
                fabric_codes: {},
                fabric_meters: {},
                accessories: {},
                dimensions: {},
                status: 'pending',
                priority: 'normal',
                issue_date: new Date().toISOString(),
                final_html: finalHtml,
                draft_html: finalHtml,
              });
            }

            const { data: createdJobCards, error: jobCardError } = await supabase
              .from('job_cards')
              .insert(jobCardsToCreate)
              .select();

            if (jobCardError) {
              console.error('Error creating job cards:', jobCardError);
            } else {
              console.log(`✅ Created ${createdJobCards.length} job cards for sale order ${orderNumber}`);

              // Create QIRs for each job card
              if (createdJobCards && createdJobCards.length > 0) {
                const qirsToCreate = createdJobCards.map((jc, idx) => ({
                  job_card_id: jc.id,
                  qir_number: `QIR-${orderNumber}-${String(idx + 1).padStart(2, '0')}`,
                  sale_order_number: orderNumber,
                  job_card_number: jc.job_card_number,
                  inspection_date: new Date().toISOString(),
                  inspection_data: jc.technical_specifications || {},
                  status: 'pending',
                }));

                if (qirsToCreate.length > 0) {
                  const { error: qirError } = await supabase
                    .from('quality_inspections')
                    .insert(qirsToCreate);

                  if (qirError) {
                    console.error('Error creating QIRs:', qirError);
                  } else {
                    console.log(`✅ Created ${qirsToCreate.length} QIRs`);
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error in job card/QIR creation:', error);
          }
        }
      }

      // Update sale order status to confirmed (no customer confirmation needed)
      await supabase
        .from('sale_orders')
        .update({ status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('id', id);

      queryClient.invalidateQueries({ queryKey: ["staff-sale-order-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["staff-sale-orders"] });
      queryClient.invalidateQueries({ queryKey: ["customer-sale-orders"] });
      queryClient.invalidateQueries({ queryKey: ["staff-job-cards"] });

      toast({
        title: "Order Sent to Customer",
        description: `PDF sent to customer. Job cards and quality inspection reports created for production.`,
        variant: data?.emailSent === false ? "destructive" : "default",
      });

      setIsGeneratingPDF(false);
      navigate("/staff/sale-orders");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send order",
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

  // Verify OTP Mutation
  // Note: OTP verification now happens automatically when customer clicks link in email
  // Staff no longer needs to manually enter OTP - workflow is streamlined

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

  const handleSendToProduction = async () => {
    try {
      const { error } = await supabase
        .from("sale_orders")
        .update({
          status: "in_production",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sent to Production",
        description: "Order status updated to In Production.",
      });
      queryClient.invalidateQueries({ queryKey: ["staff-sale-order-detail", id] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };




  const isConfirmed = saleOrder?.status === "confirmed_by_customer" || saleOrder?.status === "in_production";

  console.log("DEBUG PREVIEW HTML:", previewHTML ? previewHTML.substring(0, 200) : "EMPTY");

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
                : saleOrder.status === "staff_approved"
                  ? "secondary" // Waiting for OTP
                  : "outline"
            }>
              {saleOrder.status?.replace(/_/g, " ").toUpperCase()}
            </Badge>
          </div>
          <div className="flex gap-2 no-print">
            {getSaleOrderPDFUrl(saleOrder) ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    const pdfUrl = getSaleOrderPDFUrl(saleOrder);
                    if (pdfUrl) window.open(pdfUrl, '_blank');
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    const pdfUrl = getSaleOrderPDFUrl(saleOrder);
                    if (pdfUrl) {
                      try {
                        const filename = generatePDFFilename(
                          saleOrder.order_number || saleOrder.order?.order_number || `SO-${saleOrder.id.slice(0, 8)}`
                        );
                        await downloadPDF(pdfUrl, filename);
                        toast({
                          title: "Download Started",
                          description: "PDF is being downloaded.",
                        });
                      } catch (error: any) {
                        toast({
                          title: "Download Failed",
                          description: error.message || "Failed to download PDF.",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => window.print()}
              >
                <Download className="mr-2 h-4 w-4" />
                Print Order
              </Button>
            )}
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
                  disabled={isConfirmed}
                />
                <Button
                  onClick={() => updateDiscountMutation.mutate(Number(discount))}
                  disabled={updateDiscountMutation.isPending || !discount || isConfirmed}
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
              {isConfirmed && (
                <p className="text-sm text-amber-600 mt-2">
                  ⚠️ This sale order has been confirmed by the customer. Manual discount editing is disabled. Use discount codes before customer confirmation.
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
        <div className="space-y-4">
          <JobCardsDisplay
            jobCards={saleOrder.order?.job_cards || []}
            saleOrderNumber={saleOrder.order_number}
            saleOrderDate={new Date(saleOrder.created_at).toLocaleDateString("en-IN")}
          />

          {(!saleOrder.order?.job_cards || saleOrder.order.job_cards.length === 0) && (
            <div className="flex justify-center">
              <Button
                onClick={handleCreateJobCards}
                disabled={isCreatingJobCards}
                variant="outline"
              >
                {isCreatingJobCards ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ClipboardList className="mr-2 h-4 w-4" />
                )}
                Create Job Cards Manually
              </Button>
            </div>
          )}
        </div>

        {/* SECTION 3: HTML Preview & PDF Document */}
        <Card>
          <CardHeader>
            <CardTitle>Sale Order Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between mb-4 no-print">
              <p className="text-sm text-muted-foreground">
                This document is automatically sent to customers when orders are confirmed.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(previewHTML);
                      printWindow.document.close();
                      printWindow.print();
                    }
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Print / Download PDF
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border p-4 h-[600px] overflow-y-auto">
              {blobUrl ? (
                <iframe
                  src={blobUrl}
                  className="w-full h-full border-0"
                  title="Sale Order Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Generating preview...
                </div>
              )}
            </div>

            {/* Automated Email Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-blue-900">Automated Email System Active</p>
                  <p className="text-sm text-blue-800 mt-1">
                    Confirmation emails with PDF attachments are sent automatically when customers place orders.
                    No manual action required. Monitor email delivery status below.
                  </p>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* SECTION 4: Email Delivery Monitoring */}
        <EmailDeliveryMonitor
          saleOrderId={id!}
          saleOrderNumber={orderNumber}
          customerEmail={saleOrder.customer_email || saleOrder.order?.customer_email || ''}
        />

        {/* SECTION 5: Order Management */}
        <Card>
          <CardHeader>
            <CardTitle>Order Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {saleOrder.status === "confirmed_by_customer" && (
                <Button
                  onClick={handleSendToProduction}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Send to Production
                </Button>
              )}

              <Separator />

              <Button
                variant="destructive"
                className="w-full"
                onClick={async () => {
                  if (!confirm("Are you sure you want to delete this sale order? This action cannot be undone.")) {
                    return;
                  }

                  const { error } = await supabase
                    .from("sale_orders")
                    .delete()
                    .eq("id", id);

                  if (error) {
                    toast({
                      title: "Error",
                      description: "Failed to delete order: " + error.message,
                      variant: "destructive",
                    });
                  } else {
                    toast({
                      title: "Order Deleted",
                      description: "Sale order has been deleted successfully.",
                    });
                    navigate("/staff/sale-orders");
                  }
                }}
              >
                Delete Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </StaffLayout>
  );
}

export default StaffSaleOrderDetail;

