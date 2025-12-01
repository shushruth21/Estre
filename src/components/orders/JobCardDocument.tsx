import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { FabricPreview } from "@/components/common/FabricPreview";

interface JobCardDocumentProps {
    data: {
        job_card_number: string;
        so_number?: string;
        order_number?: string;
        product_title: string;
        product_category: string;
        customer_name: string;
        customer_email?: string;
        customer_phone?: string;
        quantity?: number;
        expected_completion_date?: string;
        created_at: string;
        dimensions?: any;
        fabric_meters?: any;
        fabric_codes?: Record<string, string>;
        accessories?: any;
        technical_specifications?: any;
        admin_notes?: string;
    };
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const renderTechnicalSpecs = (specs: any) => {
    if (!specs) return null;

    return (
        <div className="space-y-6">
            {/* PRODUCT DESCRIPTION */}
            <div className="border border-gray-300 rounded-md bg-[#F4F5F0] p-5">
                <h4 className="text-base font-bold text-[#937867] border-b-2 border-[#D6B485] pb-1 mb-3 uppercase">PRODUCT DESCRIPTION</h4>
                <div className="flex justify-between gap-4 text-sm">
                    <div className="w-[48%] space-y-1.5">
                        <div className="flex gap-2"><strong className="text-[#222] min-w-[100px]">Product:</strong> <span>{specs.product_type || "Sofa"}</span></div>
                        <div className="flex gap-2"><strong className="text-[#222] min-w-[100px]">Model:</strong> <span>{specs.model_name}</span></div>
                        <div className="flex gap-2"><strong className="text-[#222] min-w-[100px]">Sofa Type:</strong> <span>{specs.sofa_type}</span></div>
                    </div>
                    <div className="w-[48%] space-y-1.5">
                        <div className="flex gap-2"><strong className="text-[#222] min-w-[100px]">Reference:</strong> <span>{specs.model_name}-{specs.sofa_type}</span></div>
                        <div className="flex gap-2"><strong className="text-[#222] min-w-[100px]">Category:</strong> <span>{specs.category || "Living Room"}</span></div>
                    </div>
                </div>
            </div>

            {/* SEATING CONFIGURATION */}
            {specs.sections && specs.sections.length > 0 && (
                <div className="border border-gray-300 rounded-md bg-[#F4F5F0] p-5">
                    <h4 className="text-base font-bold text-[#937867] border-b-2 border-[#D6B485] pb-1 mb-3 uppercase">SEATING CONFIGURATION</h4>
                    <div className="flex justify-between gap-4 text-sm">
                        <div className="w-[48%] space-y-1.5">
                            {specs.sections.filter((_: any, i: number) => i % 2 === 0).map((section: any, idx: number) => (
                                <div key={idx} className="flex gap-2">
                                    <strong className="text-[#222] min-w-[100px] capitalize">{section.section}:</strong>
                                    <span>{section.seater}</span>
                                </div>
                            ))}
                        </div>
                        <div className="w-[48%] space-y-1.5">
                            {specs.sections.filter((_: any, i: number) => i % 2 !== 0).map((section: any, idx: number) => (
                                <div key={idx} className="flex gap-2">
                                    <strong className="text-[#222] min-w-[100px] capitalize">{section.section}:</strong>
                                    <span>{section.seater}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* CONSOLES */}
            {specs.console && specs.console.required && (
                <div className="border border-gray-300 rounded-md bg-[#F4F5F0] p-5">
                    <h4 className="text-base font-bold text-[#937867] border-b-2 border-[#D6B485] pb-1 mb-3 uppercase">CONSOLES</h4>
                    <div className="flex justify-between gap-4 text-sm">
                        <div className="w-[48%] space-y-1.5">
                            <div className="flex gap-2"><strong className="text-[#222] min-w-[120px]">No. of Consoles:</strong> <span>{specs.console.count} Nos.</span></div>
                            <div className="flex gap-2"><strong className="text-[#222] min-w-[120px]">Console Size:</strong> <span>{specs.console.size}</span></div>
                        </div>
                        <div className="w-[48%] space-y-1.5">
                            <div className="flex gap-2"><strong className="text-[#222]">Positioning:</strong></div>
                            {specs.console.placements && specs.console.placements.map((p: any, idx: number) => (
                                <div key={idx} className="pl-4">– {p.section} - {p.position}</div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* LOUNGERS */}
            {specs.lounger && specs.lounger.required && (
                <div className="border border-gray-300 rounded-md bg-[#F4F5F0] p-5">
                    <h4 className="text-base font-bold text-[#937867] border-b-2 border-[#D6B485] pb-1 mb-3 uppercase">LOUNGERS</h4>
                    <div className="flex justify-between gap-4 text-sm">
                        <div className="w-[48%] space-y-1.5">
                            <div className="flex gap-2"><strong className="text-[#222] min-w-[120px]">No. of Loungers:</strong> <span>{specs.lounger.count} No.</span></div>
                            <div className="flex gap-2"><strong className="text-[#222] min-w-[120px]">Lounger Size:</strong> <span>{specs.lounger.size}</span></div>
                        </div>
                        <div className="w-[48%] space-y-1.5">
                            <div className="flex gap-2"><strong className="text-[#222] min-w-[100px]">Position:</strong> <span>{specs.lounger.positioning}</span></div>
                        </div>
                    </div>
                </div>
            )}

            {/* FABRIC DESCRIPTION */}
            {specs.fabricPlan && (
                <div className="border border-gray-300 rounded-md bg-[#F4F5F0] p-5">
                    <h4 className="text-base font-bold text-[#937867] border-b-2 border-[#D6B485] pb-1 mb-3 uppercase">FABRIC DESCRIPTION</h4>
                    <div className="flex justify-between gap-4 text-sm">
                        <div className="w-[48%] space-y-2">
                            <div className="flex gap-2"><strong className="text-[#222] min-w-[100px]">Colour Theme:</strong> <span>{specs.fabricPlan.planType}</span></div>
                            {specs.fabricPlan.fabricCodes && Object.entries(specs.fabricPlan.fabricCodes).slice(0, Math.ceil(Object.keys(specs.fabricPlan.fabricCodes).length / 2)).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <strong className="text-[#222] min-w-[100px] capitalize">{key}:</strong>
                                    <span className="font-mono text-xs">{value as string}</span>
                                    <FabricPreview fabricCode={value as string} showDetails={false} compact className="border-0 p-0 h-6 w-6" />
                                </div>
                            ))}
                        </div>
                        <div className="w-[48%] space-y-2">
                            {specs.fabricPlan.fabricCodes && Object.entries(specs.fabricPlan.fabricCodes).slice(Math.ceil(Object.keys(specs.fabricPlan.fabricCodes).length / 2)).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <strong className="text-[#222] min-w-[100px] capitalize">{key}:</strong>
                                    <span className="font-mono text-xs">{value as string}</span>
                                    <FabricPreview fabricCode={value as string} showDetails={false} compact className="border-0 p-0 h-6 w-6" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* FRAME & DIMENSIONS */}
            {specs.dimensions && (
                <div className="border border-gray-300 rounded-md bg-[#F4F5F0] p-5">
                    <h4 className="text-base font-bold text-[#937867] border-b-2 border-[#D6B485] pb-1 mb-3 uppercase">FRAME & DIMENSIONS</h4>
                    <div className="flex justify-between gap-4 text-sm">
                        <div className="w-[48%] space-y-1.5">
                            <div className="flex gap-2"><strong className="text-[#222] min-w-[100px]">Wood Type:</strong> <span>{specs.attributes?.wood_type || "Pine (Default)"}</span></div>
                            <div className="flex gap-2"><strong className="text-[#222] min-w-[100px]">Seat Depth:</strong> <span>{specs.dimensions.seatDepth} in</span></div>
                            <div className="flex gap-2"><strong className="text-[#222] min-w-[100px]">Seat Height:</strong> <span>{specs.dimensions.seatHeight} in</span></div>
                        </div>
                        <div className="w-[48%] space-y-1.5">
                            <div className="flex gap-2"><strong className="text-[#222] min-w-[120px]">Seat Width:</strong> <span>{specs.dimensions.seatWidth} in</span></div>
                            <div className="flex gap-2"><strong className="text-[#222] min-w-[120px]">Total Width:</strong> <span>{specs.dimensions.totalWidth} in</span></div>
                        </div>
                    </div>
                </div>
            )}

            {/* STITCHING & LEG DETAILS */}
            <div className="border border-gray-300 rounded-md bg-[#F4F5F0] p-5">
                <h4 className="text-base font-bold text-[#937867] border-b-2 border-[#D6B485] pb-1 mb-3 uppercase">STITCHING & LEG DETAILS</h4>
                <div className="flex justify-between gap-4 text-sm">
                    <div className="w-[48%] space-y-1.5">
                        <div className="flex gap-2"><strong className="text-[#222] min-w-[100px]">Stitch Type:</strong> <span>{specs.attributes?.stitch_type || "Standard"}</span></div>
                        <div className="flex gap-2"><strong className="text-[#222] min-w-[100px]">Leg Model:</strong> <span>{specs.attributes?.legs || "Standard"}</span></div>
                    </div>
                    <div className="w-[48%] space-y-1.5">
                        <div className="flex gap-2"><strong className="text-[#222] min-w-[100px]">Armrest Type:</strong> <span>{specs.attributes?.armrest_type || "Default"}</span></div>
                    </div>
                </div>
            </div>

            {/* ACCESSORIES */}
            {specs.accessories && specs.accessories.length > 0 && (
                <div className="border border-gray-300 rounded-md bg-[#F4F5F0] p-5">
                    <h4 className="text-base font-bold text-[#937867] border-b-2 border-[#D6B485] pb-1 mb-3 uppercase">ACCESSORIES</h4>
                    <div className="space-y-1.5 text-sm">
                        {specs.accessories.map((acc: any, idx: number) => (
                            <div key={idx} className="flex gap-2">
                                <span>– {acc.name} ({acc.quantity})</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const JobCardDocument = ({ data }: JobCardDocumentProps) => {
    const handlePrint = () => window.print();

    const handleDownload = () => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        // Get the content HTML
        const content = document.getElementById("job-card-content")?.innerHTML || "";

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8" />
            <title>Estre – Job Card</title>
            <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700&family=Montserrat:wght@300;400;600;700&display=swap" rel="stylesheet">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                :root {
                --estre-white: #F4F5F0;
                --estre-gold: #D6B485;
                --estre-brown: #937867;
                --estre-dark: #664331;
                --estre-accent1: #B57454;
                --estre-accent2: #938E6C;
                --font-primary: 'Montserrat', sans-serif; 
                --font-secondary: 'Nunito', sans-serif;
                }
                body {
                font-family: var(--font-primary);
                background: white;
                margin: 0;
                padding: 20px;
                color: #222;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                }
                @media print {
                    body { margin: 0; padding: 20px; }
                    .no-print { display: none !important; }
                }
            </style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `);
        printWindow.document.close();
        // Wait for images to load before printing
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    return (
        <div className="space-y-4 print:p-0 font-['Montserrat']">
            <div className="flex justify-end gap-2 print:hidden">
                <Button variant="outline" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                </Button>
            </div>

            <Card id="job-card-content" className="print:border-0 print:shadow-none border-0 shadow-none">
                <CardContent className="p-0 print:p-0 space-y-6 max-w-[800px] mx-auto bg-white">
                    {/* HEADER */}
                    <div className="flex justify-between items-start mb-8">
                        <div className="logo">
                            <img src="/brand-logo.png" alt="Estre Logo" className="w-[170px]" onError={(e) => e.currentTarget.style.display = 'none'} />
                            <h1 className="text-2xl font-bold text-[#664331] mt-2">ESTRE</h1>
                        </div>
                        <div className="text-right text-[13px] leading-[18px]">
                            <strong>ESTRE GLOBAL PRIVATE LTD</strong><br />
                            Near Dhoni Public School, AECS Layout – A Block<br />
                            Revenue Layout, Singasandra, Bengaluru – 560068<br />
                            Ph: +91 8722200100<br />
                            Email: support@estre.in<br />
                            Website: www.estre.in
                        </div>
                    </div>

                    {/* JOB TITLE */}
                    <div className="text-2xl font-bold text-[#664331] border-b-4 border-[#D6B485] inline-block pb-1.5 mb-5">
                        JOB CARD
                    </div>

                    {/* JOB METADATA */}
                    <div className="border border-gray-300 rounded-md bg-[#F4F5F0] p-5 mb-6">
                        <div className="flex justify-between gap-4 text-sm">
                            <div className="w-[48%] space-y-1.5">
                                <div className="flex gap-2"><strong className="text-[#222] min-w-[100px]">Sale Order No:</strong> <span>{data.so_number || data.order_number}</span></div>
                                <div className="flex gap-2"><strong className="text-[#222] min-w-[100px]">Job Card No:</strong> <span>{data.job_card_number}</span></div>
                                <div className="flex gap-2"><strong className="text-[#222] min-w-[100px]">S.O. Date:</strong> <span>{formatDate(data.created_at)}</span></div>
                            </div>
                            <div className="w-[48%] space-y-1.5">
                                <div className="flex gap-2"><strong className="text-[#222] min-w-[120px]">Job Issue Date:</strong> <span>{formatDate(new Date().toISOString())}</span></div>
                                <div className="flex gap-2"><strong className="text-[#222] min-w-[120px]">Job Given To:</strong> <span>Production Team</span></div>
                                {data.expected_completion_date && (
                                    <div className="flex gap-2"><strong className="text-[#222] min-w-[120px]">Date of Delivery:</strong> <span>{formatDate(data.expected_completion_date)}</span></div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Technical Specifications */}
                    {renderTechnicalSpecs(data.technical_specifications)}

                    {/* Admin Notes */}
                    {data.admin_notes && (
                        <div className="border border-gray-300 rounded-md bg-[#F4F5F0] p-5 mt-6">
                            <h4 className="text-base font-bold text-[#937867] border-b-2 border-[#D6B485] pb-1 mb-3 uppercase">ASSEMBLY INSTRUCTIONS</h4>
                            <p className="text-sm whitespace-pre-wrap">
                                {data.admin_notes}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
