import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Loader2, Download, Eye } from "lucide-react";
import { downloadPDF, getSaleOrderPDFUrl, generatePDFFilename } from "@/lib/pdf-download";
import { useToast } from "@/hooks/use-toast";

const formatCurrency = (value: number | null | undefined) => {
    if (!value || Number.isNaN(value)) return "₹0";
    return `₹${Math.round(value).toLocaleString("en-IN")}`;
};

const parsedConfig = (config: any) => {
    try {
        return typeof config === 'string' ? JSON.parse(config) : config;
    } catch (e) {
        return {};
    }
};

export default function StaffOrderDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const { data: order, isLoading, error } = useQuery({
        queryKey: ["staff-order-detail", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("orders")
                .select(`
          *,
          order_items:order_items(
            id,
            quantity,
            unit_price_rs,
            total_price_rs,
            product_title,
            product_category,
            configuration
          ),
          sale_orders:sale_orders(
            id,
            order_number,
            status,
            final_pdf_url,
            draft_pdf_url,
            pdf_url
          )
        `)
                .eq("id", id)
                .single();

            if (error) throw error;
            return data as any;
        },
    });

    if (isLoading) {
        return (
            <StaffLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2 text-muted-foreground">Loading order...</span>
                </div>
            </StaffLayout>
        );
    }

    if (error || !order) {
        return (
            <StaffLayout>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-destructive">Error Loading Order</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Could not load order details. Please try again.</p>
                        <Button onClick={() => navigate("/staff/orders")} className="mt-4">
                            Back to Orders
                        </Button>
                    </CardContent>
                </Card>
            </StaffLayout>
        );
    }

    const hasSaleOrder = order.sale_orders && order.sale_orders.length > 0;

    return (
        <StaffLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Button variant="ghost" onClick={() => navigate("/staff/orders")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Orders
                        </Button>
                        <h1 className="text-3xl font-bold mt-4">
                            Order #{order.order_number}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Customer: {order.customer_name}
                        </p>
                        <Badge className="mt-2" variant="outline">
                            {order.status?.replace(/_/g, " ").toUpperCase()}
                        </Badge>
                    </div>
                    {hasSaleOrder && (
                        <div className="flex gap-2">
                            <Button onClick={() => navigate(`/staff/sale-orders/${order.sale_orders[0].id}`)}>
                                <FileText className="mr-2 h-4 w-4" />
                                View Sale Order
                            </Button>
                            {getSaleOrderPDFUrl(order.sale_orders[0]) && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const pdfUrl = getSaleOrderPDFUrl(order.sale_orders[0]);
                                            if (pdfUrl) window.open(pdfUrl, '_blank');
                                        }}
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View PDF
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={async () => {
                                            const pdfUrl = getSaleOrderPDFUrl(order.sale_orders[0]);
                                            if (pdfUrl) {
                                                try {
                                                    const filename = generatePDFFilename(
                                                        order.sale_orders[0].order_number || order.order_number || `SO-${order.sale_orders[0].id.slice(0, 8)}`
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
                            )}
                        </div>
                    )}
                </div>

                {/* Order Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Customer Name</p>
                                <p className="font-semibold">{order.customer_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-semibold">{order.customer_email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="font-semibold">{order.customer_phone}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Order Date</p>
                                <p className="font-semibold">
                                    {new Date(order.created_at).toLocaleDateString("en-IN")}
                                </p>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Amount</p>
                                    <p className="text-2xl font-bold">{formatCurrency(order.net_total_rs)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Payment Method</p>
                                    <p className="font-semibold">{order.payment_method || "Cash on Delivery"}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                    <CardHeader>
                        <CardTitle>Order Items ({order.order_items?.length || 0})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {order.order_items && order.order_items.length > 0 ? (
                            <div className="space-y-4">
                                {order.order_items.map((item: any, index: number) => (
                                    <div key={item.id} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <Badge variant="outline">Product {index + 1}</Badge>
                                                <h3 className="font-semibold text-lg mt-2">
                                                    {item.product_title || item.product_category}
                                                </h3>
                                            </div>
                                            <p className="text-lg font-bold">{formatCurrency(item.total_price_rs)}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                                            <div>
                                                <p className="text-muted-foreground">Quantity</p>
                                                <p className="font-medium">{item.quantity}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Unit Price</p>
                                                <p className="font-medium">{formatCurrency(item.unit_price_rs)}</p>
                                            </div>
                                        </div>

                                        {/* Configuration Display */}
                                        {item.configuration && (
                                            <div className="mt-4 bg-muted/30 rounded-md p-3 text-sm border">
                                                <p className="font-semibold mb-2">Configuration Details:</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                                    {Object.entries(item.configuration).map(([key, value]) => {
                                                        if (typeof value === 'object' && value !== null) return null; // Skip nested objects for now
                                                        if (key === 'price') return null; // Skip internal price fields

                                                        // Format key text (e.g. "sofa_type" -> "Sofa Type")
                                                        const label = key
                                                            .replace(/_/g, " ")
                                                            .replace(/([A-Z])/g, " $1")
                                                            .replace(/^./, str => str.toUpperCase());

                                                        return (
                                                            <div key={key} className="flex justify-between border-b border-muted/20 pb-1 last:border-0">
                                                                <span className="text-muted-foreground">{label}:</span>
                                                                <span className="font-medium text-right">{String(value)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                    {/* Handle fabric specifically if it exists */}
                                                    {parsedConfig(item.configuration)?.fabric && (
                                                        <div className="flex justify-between border-b border-muted/20 pb-1 col-span-1 md:col-span-2 mt-1 pt-1 bg-white/50 px-2 rounded">
                                                            <span className="text-muted-foreground font-medium">Fabric:</span>
                                                            <span className="font-medium text-right">
                                                                {parsedConfig(item.configuration).fabric.claddingPlan}
                                                                {parsedConfig(item.configuration).fabric.type ? ` - ${parsedConfig(item.configuration).fabric.type}` : ''}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-8">
                                No items found in this order.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Sale Order Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sale Order Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {hasSaleOrder ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold">
                                        Sale Order #{order.sale_orders[0].order_number}
                                    </p>
                                    <Badge className="mt-2">
                                        {order.sale_orders[0].status?.replace(/_/g, " ").toUpperCase()}
                                    </Badge>
                                </div>
                                <Button onClick={() => navigate(`/staff/sale-orders/${order.sale_orders[0].id}`)}>
                                    View Sale Order Details
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground mb-4">
                                    No sale order created yet for this order.
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Sale orders are created when orders are confirmed and ready for processing.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </StaffLayout >
    );
}
