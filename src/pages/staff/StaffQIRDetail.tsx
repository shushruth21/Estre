import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StaffLayout } from "@/components/staff/StaffLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Printer, Download } from "lucide-react";
import { generateQIRHTML, mapQIRData } from "@/lib/qir-pdf";
import { useToast } from "@/hooks/use-toast";

export default function StaffQIRDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    const { data: qir, isLoading, error } = useQuery({
        queryKey: ["staff-qir-detail", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("quality_inspections")
                .select(`
          *,
          job_card:job_cards(job_card_number, product_title),
          order:orders(order_number, customer_name)
        `)
                .eq("id", id)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });

    const previewHTML = qir ? generateQIRHTML(mapQIRData(qir)) : "";

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

    const handlePrint = () => {
        if (!previewHTML) return;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(previewHTML);
            printWindow.document.close();
            printWindow.print();
        } else {
            toast({
                title: "Error",
                description: "Pop-up blocked. Please allow pop-ups to print.",
                variant: "destructive",
            });
        }
    };

    if (isLoading) {
        return (
            <StaffLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2 text-muted-foreground">Loading report...</span>
                </div>
            </StaffLayout>
        );
    }

    if (error || !qir) {
        return (
            <StaffLayout>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-destructive">Error loading report: {(error as any)?.message || "Report not found"}</p>
                        <Button onClick={() => navigate("/staff/quality-reports")} className="mt-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Reports
                        </Button>
                    </CardContent>
                </Card>
            </StaffLayout>
        );
    }

    return (
        <StaffLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Button variant="ghost" onClick={() => navigate("/staff/quality-reports")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <h1 className="text-3xl font-bold mt-4">
                            Quality Inspection Report
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {qir.job_card?.job_card_number} • {qir.job_card?.product_title}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print / Download PDF
                        </Button>
                    </div>
                </div>

                <Card className="h-[800px] overflow-hidden border-2">
                    <CardContent className="p-0 h-full">
                        {blobUrl ? (
                            <iframe
                                src={blobUrl}
                                className="w-full h-full border-0"
                                title="QIR Preview"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                Generating preview...
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </StaffLayout>
    );
}
