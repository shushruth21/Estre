import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

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
        <div className="space-y-4">
            {/* Sections */}
            {specs.sections && specs.sections.length > 0 && (
                <div>
                    <h4 className="font-semibold mb-2">Sections</h4>
                    <table className="w-full text-sm border border-gray-800">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-800 p-2 text-left">Section</th>
                                <th className="border border-gray-800 p-2 text-left">Seater</th>
                                <th className="border border-gray-800 p-2 text-left">Quantity</th>
                                <th className="border border-gray-800 p-2 text-left">Fabric (m)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {specs.sections.map((section: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="border border-gray-800 p-2">{section.section}</td>
                                    <td className="border border-gray-800 p-2">{section.seater}</td>
                                    <td className="border border-gray-800 p-2">{section.quantity}</td>
                                    <td className="border border-gray-800 p-2">
                                        {section.fabricMeters?.toFixed(2) || "0.00"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Console Summary */}
            {specs.console && specs.console.required && (
                <div>
                    <h4 className="font-semibold mb-2">Console Details</h4>
                    <table className="w-full text-sm border border-gray-800">
                        <tbody>
                            <tr>
                                <td className="border border-gray-800 p-2 font-medium">Count</td>
                                <td className="border border-gray-800 p-2">{specs.console.count}</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-800 p-2 font-medium">Size</td>
                                <td className="border border-gray-800 p-2">{specs.console.size}</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-800 p-2 font-medium">Fabric (m)</td>
                                <td className="border border-gray-800 p-2">
                                    {specs.console.fabricMeters?.toFixed(2) || "0.00"}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    {specs.console.placements && specs.console.placements.length > 0 && (
                        <div className="mt-2">
                            <p className="text-sm font-medium">Placements:</p>
                            <ul className="list-disc pl-5 text-sm">
                                {specs.console.placements.map((p: any, idx: number) => (
                                    <li key={idx}>
                                        {p.section} - {p.position}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Dummy Seat Summary */}
            {specs.dummySeat && specs.dummySeat.total > 0 && (
                <div>
                    <h4 className="font-semibold mb-2">Dummy Seats</h4>
                    <table className="w-full text-sm border border-gray-800">
                        <tbody>
                            <tr>
                                <td className="border border-gray-800 p-2 font-medium">Total</td>
                                <td className="border border-gray-800 p-2">{specs.dummySeat.total}</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-800 p-2 font-medium">Fabric (m)</td>
                                <td className="border border-gray-800 p-2">
                                    {specs.dummySeat.fabricMeters?.toFixed(2) || "0.00"}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {/* Fabric Plan */}
            {specs.fabricPlan && (
                <div>
                    <h4 className="font-semibold mb-2">Fabric Plan</h4>
                    <table className="w-full text-sm border border-gray-800">
                        <tbody>
                            <tr>
                                <td className="border border-gray-800 p-2 font-medium">Plan Type</td>
                                <td className="border border-gray-800 p-2">{specs.fabricPlan.planType}</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-800 p-2 font-medium">Base Meters</td>
                                <td className="border border-gray-800 p-2">
                                    {specs.fabricPlan.baseMeters?.toFixed(2) || "0.00"}
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-800 p-2 font-medium">Structure Meters</td>
                                <td className="border border-gray-800 p-2">
                                    {specs.fabricPlan.structureMeters?.toFixed(2) || "0.00"}
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-800 p-2 font-medium">Armrest Meters</td>
                                <td className="border border-gray-800 p-2">
                                    {specs.fabricPlan.armrestMeters?.toFixed(2) || "0.00"}
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-800 p-2 font-medium">Total Meters</td>
                                <td className="border border-gray-800 p-2 font-bold">
                                    {specs.fabricPlan.totalMeters?.toFixed(2) || "0.00"}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    {specs.fabricPlan.fabricCodes && (
                        <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Fabric Selection:</p>
                            <div className="grid grid-cols-2 gap-4">
                                {Object.entries(specs.fabricPlan.fabricCodes).map(([key, value]) => (
                                    <div key={key} className="border p-3 rounded flex items-center gap-3">
                                        {/* Fabric Image Placeholder - In production this should be the actual fabric image URL */}
                                        <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center overflow-hidden">
                                            <img
                                                src={`https://placehold.co/100x100/e2e8f0/64748b?text=${String(value).substring(0, 3)}`}
                                                alt="Fabric"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="text-sm">
                                            <span className="font-medium block capitalize">{key}</span>
                                            <span className="text-muted-foreground">{value as string}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Dimensions */}
            {specs.dimensions && (
                <div>
                    <h4 className="font-semibold mb-2">Dimensions</h4>
                    <table className="w-full text-sm border border-gray-800">
                        <tbody>
                            {specs.dimensions.seatDepth && (
                                <tr>
                                    <td className="border border-gray-800 p-2 font-medium">Seat Depth</td>
                                    <td className="border border-gray-800 p-2">{specs.dimensions.seatDepth}"</td>
                                </tr>
                            )}
                            {specs.dimensions.seatWidth && (
                                <tr>
                                    <td className="border border-gray-800 p-2 font-medium">Seat Width</td>
                                    <td className="border border-gray-800 p-2">{specs.dimensions.seatWidth}"</td>
                                </tr>
                            )}
                            {specs.dimensions.seatHeight && (
                                <tr>
                                    <td className="border border-gray-800 p-2 font-medium">Seat Height</td>
                                    <td className="border border-gray-800 p-2">{specs.dimensions.seatHeight}"</td>
                                </tr>
                            )}
                            {specs.dimensions.totalWidth && (
                                <tr>
                                    <td className="border border-gray-800 p-2 font-medium">Total Width</td>
                                    <td className="border border-gray-800 p-2">{specs.dimensions.totalWidth}"</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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
        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Job Card - ${data.job_card_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .section-title { font-weight: bold; font-size: 16px; margin-top: 20px; }
          </style>
        </head>
        <body>
          ${document.getElementById("job-card-content")?.innerHTML || ""}
        </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="space-y-4 print:p-0">
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

            <Card id="job-card-content" className="print:border-0 print:shadow-none">
                <CardContent className="p-8 print:p-4 space-y-6">
                    {/* Header */}
                    <div className="text-center border-2 border-gray-800 p-6">
                        <h1 className="text-3xl font-bold mb-2">JOB CARD</h1>
                        <p className="text-xl font-semibold">ESTRE GLOBAL PRIVATE LTD</p>
                    </div>

                    {/* Job Card Info */}
                    <div className="grid grid-cols-2 gap-6 text-sm">
                        <div>
                            <h3 className="font-semibold text-base mb-2">Job Card Information</h3>
                            <p><span className="font-medium">Job Card No.:</span> {data.job_card_number}</p>
                            <p><span className="font-medium">Sale Order No.:</span> {data.so_number || data.order_number || "N/A"}</p>
                            <p><span className="font-medium">Issue Date:</span> {formatDate(data.created_at)}</p>
                            {data.expected_completion_date && (
                                <p><span className="font-medium">Expected Completion:</span> {formatDate(data.expected_completion_date)}</p>
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-base mb-2">Product Information</h3>
                            <p><span className="font-medium">Product:</span> {data.product_title}</p>
                            <p><span className="font-medium">Category:</span> {data.product_category}</p>
                            {data.quantity && (
                                <p><span className="font-medium">Quantity:</span> {data.quantity}</p>
                            )}
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div>
                        <h3 className="font-semibold text-base mb-2">Customer Information</h3>
                        <div className="text-sm">
                            <p><span className="font-medium">Name:</span> {data.customer_name}</p>
                            {data.customer_phone && (
                                <p><span className="font-medium">Phone:</span> {data.customer_phone}</p>
                            )}
                            {data.customer_email && (
                                <p><span className="font-medium">Email:</span> {data.customer_email}</p>
                            )}
                        </div>
                    </div>

                    {/* Technical Specifications */}
                    <div>
                        <h3 className="font-semibold text-base mb-4">Technical Specifications</h3>
                        {renderTechnicalSpecs(data.technical_specifications)}
                    </div>

                    {/* Admin Notes */}
                    {data.admin_notes && (
                        <div>
                            <h3 className="font-semibold text-base mb-2">Assembly Instructions</h3>
                            <p className="text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded">
                                {data.admin_notes}
                            </p>
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground text-center mt-8">
                        This is a computer-generated job card. Please verify all specifications before production.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};
