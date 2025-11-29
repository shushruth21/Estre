import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { JobCardDocument } from "@/components/orders/JobCardDocument";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProductionJobCard = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: jobCard, isLoading, error } = useQuery({
        queryKey: ["production-job-card", id],
        queryFn: async () => {
            if (!id) throw new Error("Job Card ID is required");

            const { data, error } = await supabase
                .from("job_cards")
                .select(`
          *,
          order:orders(
            order_number,
            customer_name,
            customer_email,
            customer_phone,
            shipping_address,
            billing_address
          ),
          sale_order:sale_orders(
            order_number,
            expected_delivery_date
          )
        `)
                .eq("id", id)
                .single();

            if (error) throw error;
            return data;
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !jobCard) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-destructive font-medium">Error loading job card</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    // Map data to JobCardDocument format
    const orderData = jobCard.order as any;
    const saleOrderData = jobCard.sale_order as any;
    const config = jobCard.configuration as any;

    const documentData = {
        job_card_number: jobCard.job_card_number,
        so_number: saleOrderData?.order_number,
        order_number: orderData?.order_number,
        product_title: jobCard.product_title,
        product_category: jobCard.product_category,
        customer_name: orderData?.customer_name || "Guest",
        customer_email: orderData?.customer_email,
        customer_phone: orderData?.customer_phone,
        quantity: 1, // Job cards are usually per unit, but check if quantity exists
        expected_completion_date: saleOrderData?.expected_delivery_date,
        created_at: jobCard.created_at,
        dimensions: config?.dimensions,
        fabric_meters: config?.fabric_meters,
        fabric_codes: config?.fabric_codes,
        accessories: config?.accessories,
        technical_specifications: config,
        admin_notes: jobCard.admin_notes,
    };

    return (
        <div className="min-h-screen bg-gray-100 print:bg-white p-4 md:p-8">
            {/* Header - Hidden in Print */}
            <div className="max-w-[8.5in] mx-auto mb-6 flex justify-between items-center print:hidden">
                <Button variant="ghost" onClick={() => navigate(-1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <div className="flex gap-2">
                    <Button onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Job Card
                    </Button>
                </div>
            </div>

            {/* Document Container */}
            <div className="max-w-[8.5in] mx-auto bg-white shadow-lg print:shadow-none">
                <JobCardDocument data={documentData} />
            </div>
        </div>
    );
};

export default ProductionJobCard;
