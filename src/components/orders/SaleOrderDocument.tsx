import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { SaleOrderData } from "@/lib/sale-order-generator";

interface SaleOrderDocumentProps {
  data: SaleOrderData;
  orderNumber?: string;
}

export const SaleOrderDocument = ({ data, orderNumber }: SaleOrderDocumentProps) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Sale Order - ${data.soNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; border: 2px solid #000; padding: 20px; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th, td { border: 1px solid #000; padding: 8px; text-align: left; }
              th { background-color: #f0f0f0; font-weight: bold; }
              .section { margin: 20px 0; }
              .section-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; }
            </style>
          </head>
          <body>
            ${document.getElementById('sale-order-content')?.innerHTML || ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
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

      <Card id="sale-order-content" className="print:border-0 print:shadow-none">
        <CardContent className="p-8 print:p-4">
          {/* Header */}
          <div className="border-2 border-gray-800 p-6 mb-6 text-center">
            <h1 className="text-3xl font-bold mb-2">SALE ORDER</h1>
            <p className="text-xl font-semibold">ESTRE GLOBAL PRIVATE LTD</p>
          </div>

          {/* Company & Order Details */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="font-bold">ESTRE GLOBAL PRIVATE LTD</p>
              <p>Near Dhoni Public School</p>
              <p>AECS Layout-A Block, Revenue Layout</p>
              <p>Near Kudlu Gate, Singhasandra</p>
              <p>Bengaluru - 560 068</p>
              <p className="mt-2"><strong>Ph:</strong> +91 87 22 200 100</p>
              <p><strong>Email:</strong> support@estre.in</p>
              <p><strong>GSTIN:</strong> 29AAMCE9846D1ZU</p>
            </div>
            <div>
              <p><strong>S.O. No.:</strong> {data.soNumber}</p>
              <p><strong>Date:</strong> {data.date}</p>
              <p><strong>Valid Until:</strong> {data.validUntil}</p>
              <p><strong>Category:</strong> {data.category}</p>
            </div>
          </div>

          <div className="border-t-2 border-gray-800 my-6"></div>

          {/* Billing & Shipping */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-bold text-lg mb-2">Invoice To:</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr><td className="font-semibold">Customer Name</td><td>{data.customerName}</td></tr>
                  <tr><td className="font-semibold">Address</td><td>{data.billingAddress.line1}</td></tr>
                  {data.billingAddress.line2 && <tr><td></td><td>{data.billingAddress.line2}</td></tr>}
                  <tr><td></td><td>{data.billingAddress.city} - {data.billingAddress.pincode}</td></tr>
                  <tr><td className="font-semibold">State</td><td>{data.billingAddress.state}</td></tr>
                  <tr><td className="font-semibold">Mobile</td><td>{data.customerPhone}</td></tr>
                  <tr><td className="font-semibold">Email</td><td>{data.customerEmail}</td></tr>
                  {data.customerGstin && <tr><td className="font-semibold">GSTIN</td><td>{data.customerGstin}</td></tr>}
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Dispatch To:</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr><td className="font-semibold">Customer Name</td><td>{data.shippingAddress.name}</td></tr>
                  <tr><td className="font-semibold">Address</td><td>{data.shippingAddress.line1}</td></tr>
                  {data.shippingAddress.line2 && <tr><td></td><td>{data.shippingAddress.line2}</td></tr>}
                  <tr><td></td><td>{data.shippingAddress.city} - {data.shippingAddress.pincode}</td></tr>
                  <tr><td className="font-semibold">State</td><td>{data.shippingAddress.state}</td></tr>
                  {data.shippingAddress.mobile && <tr><td className="font-semibold">Mobile</td><td>{data.shippingAddress.mobile}</td></tr>}
                  {data.shippingAddress.email && <tr><td className="font-semibold">Email</td><td>{data.shippingAddress.email}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment & Delivery Terms */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-bold mb-2">Payment Terms</h3>
              <p className="text-sm whitespace-pre-line">{data.paymentTerms}</p>
            </div>
            <div>
              <h3 className="font-bold mb-2">Delivery Terms</h3>
              <p className="text-sm"><strong>Date of Delivery:</strong> {data.deliveryDays} days from order date</p>
              <p className="text-sm"><strong>Expected Delivery:</strong> {data.expectedDeliveryDate}</p>
              {data.logisticsPartner && <p className="text-sm"><strong>Dispatch Through:</strong> {data.logisticsPartner}</p>}
            </div>
          </div>

          <div className="border-t-2 border-gray-800 my-6"></div>

          {/* Product Configuration */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">CATEGORY: {data.category}</h2>
            
            <h3 className="font-bold text-lg mb-2">📋 PRIMARY CONFIGURATION</h3>
            <table className="w-full text-sm border-collapse border border-gray-800">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-800 p-2">Sl. No.</th>
                  <th className="border border-gray-800 p-2">Description</th>
                  <th className="border border-gray-800 p-2">Specification</th>
                  <th className="border border-gray-800 p-2">Unit Price (₹)</th>
                  <th className="border border-gray-800 p-2">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-800 p-2">1</td>
                  <td className="border border-gray-800 p-2">
                    <strong>Product Name</strong><br />
                    {data.productName}<br />
                    <strong>Shape Type</strong><br />
                    {data.shapeType}<br />
                    <strong>Total Seats</strong><br />
                    {data.totalSeats}
                  </td>
                  <td className="border border-gray-800 p-2">
                    <strong>Section Breakdown:</strong><br />
                    {data.sections.front && (
                      <>- Front: {data.sections.front.type}<br /></>
                    )}
                    {data.sections.flCorner && (
                      <>- Front-Left Corner: {data.sections.flCorner.type}<br /></>
                    )}
                    {data.sections.frCorner && (
                      <>- Front-Right Corner: {data.sections.frCorner.type}<br /></>
                    )}
                    {data.sections.left && (
                      <>- Left: {data.sections.left.type}<br /></>
                    )}
                    {data.sections.right && (
                      <>- Right: {data.sections.right.type}<br /></>
                    )}
                    {data.sections.center1 && (
                      <>- Center-1: {data.sections.center1.type}<br /></>
                    )}
                    {data.sections.center2 && (
                      <>- Center-2: {data.sections.center2.type}<br /></>
                    )}
                  </td>
                  <td className="border border-gray-800 p-2"></td>
                  <td className="border border-gray-800 p-2 font-bold">₹{data.baseSofaTotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="border border-gray-800 p-2 text-right font-bold">Subtotal:</td>
                  <td className="border border-gray-800 p-2 font-bold">₹{data.baseSofaTotal.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Consoles */}
          {data.console.required === "Yes" && (
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-2">1. CONSOLES</h3>
              <table className="w-full text-sm border-collapse border border-gray-800">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-800 p-2">Detail</th>
                    <th className="border border-gray-800 p-2">Specification</th>
                    <th className="border border-gray-800 p-2">Qty</th>
                    <th className="border border-gray-800 p-2">Unit Price (₹)</th>
                    <th className="border border-gray-800 p-2">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-800 p-2"><strong>Console Required</strong></td>
                    <td className="border border-gray-800 p-2">{data.console.required}</td>
                    <td className="border border-gray-800 p-2">{data.console.qty}</td>
                    <td className="border border-gray-800 p-2">₹{data.console.unitPrice.toLocaleString()}</td>
                    <td className="border border-gray-800 p-2">₹{data.console.total.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-800 p-2"><strong>Console Size</strong></td>
                    <td className="border border-gray-800 p-2">{data.console.size}</td>
                    <td className="border border-gray-800 p-2"></td>
                    <td className="border border-gray-800 p-2"></td>
                    <td className="border border-gray-800 p-2"></td>
                  </tr>
                  <tr>
                    <td className="border border-gray-800 p-2"><strong>Console Type</strong></td>
                    <td className="border border-gray-800 p-2">{data.console.type}</td>
                    <td className="border border-gray-800 p-2"></td>
                    <td className="border border-gray-800 p-2"></td>
                    <td className="border border-gray-800 p-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Loungers */}
          {data.lounger.required === "Yes" && (
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-2">2. LOUNGERS</h3>
              <table className="w-full text-sm border-collapse border border-gray-800">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-800 p-2">Detail</th>
                    <th className="border border-gray-800 p-2">Specification</th>
                    <th className="border border-gray-800 p-2">Qty</th>
                    <th className="border border-gray-800 p-2">Unit Price (₹)</th>
                    <th className="border border-gray-800 p-2">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-800 p-2"><strong>Lounger Required</strong></td>
                    <td className="border border-gray-800 p-2">{data.lounger.required}</td>
                    <td className="border border-gray-800 p-2">{data.lounger.qty}</td>
                    <td className="border border-gray-800 p-2">₹{data.lounger.unitPrice.toLocaleString()}</td>
                    <td className="border border-gray-800 p-2">₹{data.lounger.total.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-800 p-2"><strong>Lounger Size</strong></td>
                    <td className="border border-gray-800 p-2">{data.lounger.size}</td>
                    <td className="border border-gray-800 p-2"></td>
                    <td className="border border-gray-800 p-2"></td>
                    <td className="border border-gray-800 p-2"></td>
                  </tr>
                  <tr>
                    <td className="border border-gray-800 p-2"><strong>Lounger Positioning</strong></td>
                    <td className="border border-gray-800 p-2">{data.lounger.position}</td>
                    <td className="border border-gray-800 p-2"></td>
                    <td className="border border-gray-800 p-2"></td>
                    <td className="border border-gray-800 p-2"></td>
                  </tr>
                  <tr>
                    <td className="border border-gray-800 p-2"><strong>Lounger Storage</strong></td>
                    <td className="border border-gray-800 p-2">{data.lounger.storage}</td>
                    <td className="border border-gray-800 p-2"></td>
                    <td className="border border-gray-800 p-2"></td>
                    <td className="border border-gray-800 p-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Pillows */}
          {data.pillows.required === "Yes" && (
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-2">4. PILLOWS</h3>
              <table className="w-full text-sm border-collapse border border-gray-800">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-800 p-2">Detail</th>
                    <th className="border border-gray-800 p-2">Specification</th>
                    <th className="border border-gray-800 p-2">Qty</th>
                    <th className="border border-gray-800 p-2">Unit Price (₹)</th>
                    <th className="border border-gray-800 p-2">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-800 p-2"><strong>Additional Pillows</strong></td>
                    <td className="border border-gray-800 p-2">{data.pillows.required}</td>
                    <td className="border border-gray-800 p-2">{data.pillows.qty}</td>
                    <td className="border border-gray-800 p-2">₹{data.pillows.unitPrice.toLocaleString()}</td>
                    <td className="border border-gray-800 p-2">₹{data.pillows.total.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-800 p-2"><strong>Pillow Type</strong></td>
                    <td className="border border-gray-800 p-2">{data.pillows.type}</td>
                    <td className="border border-gray-800 p-2"></td>
                    <td className="border border-gray-800 p-2"></td>
                    <td className="border border-gray-800 p-2"></td>
                  </tr>
                  <tr>
                    <td className="border border-gray-800 p-2"><strong>Pillow Size</strong></td>
                    <td className="border border-gray-800 p-2">{data.pillows.size}</td>
                    <td className="border border-gray-800 p-2"></td>
                    <td className="border border-gray-800 p-2"></td>
                    <td className="border border-gray-800 p-2"></td>
                  </tr>
                  <tr>
                    <td className="border border-gray-800 p-2"><strong>Pillow Color Option</strong></td>
                    <td className="border border-gray-800 p-2">{data.pillows.colorOption}</td>
                    <td className="border border-gray-800 p-2"></td>
                    <td className="border border-gray-800 p-2"></td>
                    <td className="border border-gray-800 p-2"></td>
                  </tr>
                </tbody>
              </table>
              
              {data.pillows.fabrics.length > 0 && (
                <div className="mt-4">
                  <p className="font-bold mb-2">Pillow Fabric Selection:</p>
                  <table className="w-full text-sm border-collapse border border-gray-800">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-800 p-2">Pillow</th>
                        <th className="border border-gray-800 p-2">Fabric Code</th>
                        <th className="border border-gray-800 p-2">Fabric Name</th>
                        <th className="border border-gray-800 p-2">Color</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.pillows.fabrics.map((fabric, idx) => (
                        <tr key={idx}>
                          <td className="border border-gray-800 p-2">
                            Pillow {fabric.pillowNumber} - Color {fabric.colorNumber}
                          </td>
                          <td className="border border-gray-800 p-2">{fabric.fabricCode}</td>
                          <td className="border border-gray-800 p-2">{fabric.fabricName}</td>
                          <td className="border border-gray-800 p-2">{fabric.color}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs mt-2 italic">Note: Colors may vary +/- 3% as indicated by supplier</p>
                </div>
              )}
            </div>
          )}

          {/* Fabric Selection */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2">🎨 FABRIC SELECTION</h3>
            <table className="w-full text-sm border-collapse border border-gray-800 mb-4">
              <tbody>
                <tr>
                  <td className="border border-gray-800 p-2 font-semibold">Cladding Plan</td>
                  <td className="border border-gray-800 p-2">{data.fabric.claddingPlan}</td>
                </tr>
              </tbody>
            </table>

            {data.fabric.singleColor && (
              <div>
                <p className="font-bold mb-2">For Single Color:</p>
                <table className="w-full text-sm border-collapse border border-gray-800">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-800 p-2">Component</th>
                      <th className="border border-gray-800 p-2">Fabric Code</th>
                      <th className="border border-gray-800 p-2">Fabric Name</th>
                      <th className="border border-gray-800 p-2">SR No.</th>
                      <th className="border border-gray-800 p-2">Price/Meter</th>
                      <th className="border border-gray-800 p-2">Meters</th>
                      <th className="border border-gray-800 p-2">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-800 p-2">Full Sofa</td>
                      <td className="border border-gray-800 p-2">{data.fabric.singleColor.fabricCode}</td>
                      <td className="border border-gray-800 p-2">{data.fabric.singleColor.fabricName}</td>
                      <td className="border border-gray-800 p-2">{data.fabric.singleColor.srNo}</td>
                      <td className="border border-gray-800 p-2">₹{data.fabric.singleColor.pricePerMeter.toLocaleString()}</td>
                      <td className="border border-gray-800 p-2">{data.fabric.singleColor.meters.toFixed(2)}</td>
                      <td className="border border-gray-800 p-2">₹{data.fabric.singleColor.total.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {data.fabric.multiColor && (
              <div className="mt-4">
                <p className="font-bold mb-2">For Multi Color:</p>
                <table className="w-full text-sm border-collapse border border-gray-800">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-800 p-2">Component</th>
                      <th className="border border-gray-800 p-2">Allocation</th>
                      <th className="border border-gray-800 p-2">Fabric Code</th>
                      <th className="border border-gray-800 p-2">Fabric Name</th>
                      <th className="border border-gray-800 p-2">SR No.</th>
                      <th className="border border-gray-800 p-2">Price/Meter</th>
                      <th className="border border-gray-800 p-2">Meters</th>
                      <th className="border border-gray-800 p-2">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.fabric.multiColor.structure && (
                      <tr>
                        <td className="border border-gray-800 p-2">Structure</td>
                        <td className="border border-gray-800 p-2">70%</td>
                        <td className="border border-gray-800 p-2">{data.fabric.multiColor.structure.code}</td>
                        <td className="border border-gray-800 p-2">{data.fabric.multiColor.structure.name}</td>
                        <td className="border border-gray-800 p-2">{data.fabric.multiColor.structure.srNo}</td>
                        <td className="border border-gray-800 p-2">₹{data.fabric.multiColor.structure.price.toLocaleString()}</td>
                        <td className="border border-gray-800 p-2">{data.fabric.multiColor.structure.meters.toFixed(2)}</td>
                        <td className="border border-gray-800 p-2">₹{data.fabric.multiColor.structure.total.toLocaleString()}</td>
                      </tr>
                    )}
                    {data.fabric.multiColor.backrest && (
                      <tr>
                        <td className="border border-gray-800 p-2">BackRest/Cushion</td>
                        <td className="border border-gray-800 p-2">12%</td>
                        <td className="border border-gray-800 p-2">{data.fabric.multiColor.backrest.code}</td>
                        <td className="border border-gray-800 p-2">{data.fabric.multiColor.backrest.name}</td>
                        <td className="border border-gray-800 p-2">{data.fabric.multiColor.backrest.srNo}</td>
                        <td className="border border-gray-800 p-2">₹{data.fabric.multiColor.backrest.price.toLocaleString()}</td>
                        <td className="border border-gray-800 p-2">{data.fabric.multiColor.backrest.meters.toFixed(2)}</td>
                        <td className="border border-gray-800 p-2">₹{data.fabric.multiColor.backrest.total.toLocaleString()}</td>
                      </tr>
                    )}
                    {data.fabric.multiColor.seat && (
                      <tr>
                        <td className="border border-gray-800 p-2">Seat</td>
                        <td className="border border-gray-800 p-2">21%</td>
                        <td className="border border-gray-800 p-2">{data.fabric.multiColor.seat.code}</td>
                        <td className="border border-gray-800 p-2">{data.fabric.multiColor.seat.name}</td>
                        <td className="border border-gray-800 p-2">{data.fabric.multiColor.seat.srNo}</td>
                        <td className="border border-gray-800 p-2">₹{data.fabric.multiColor.seat.price.toLocaleString()}</td>
                        <td className="border border-gray-800 p-2">{data.fabric.multiColor.seat.meters.toFixed(2)}</td>
                        <td className="border border-gray-800 p-2">₹{data.fabric.multiColor.seat.total.toLocaleString()}</td>
                      </tr>
                    )}
                    {data.fabric.multiColor.headrest && (
                      <tr>
                        <td className="border border-gray-800 p-2">Headrest</td>
                        <td className="border border-gray-800 p-2">12%</td>
                        <td className="border border-gray-800 p-2">{data.fabric.multiColor.headrest.code}</td>
                        <td className="border border-gray-800 p-2">{data.fabric.multiColor.headrest.name}</td>
                        <td className="border border-gray-800 p-2">{data.fabric.multiColor.headrest.srNo}</td>
                        <td className="border border-gray-800 p-2">₹{data.fabric.multiColor.headrest.price.toLocaleString()}</td>
                        <td className="border border-gray-800 p-2">{data.fabric.multiColor.headrest.meters.toFixed(2)}</td>
                        <td className="border border-gray-800 p-2">₹{data.fabric.multiColor.headrest.total.toLocaleString()}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {data.fabric.upgradeCharges > 0 && (
              <p className="mt-2 font-semibold">Fabric Upgrade Charges: ₹{data.fabric.upgradeCharges.toLocaleString()}</p>
            )}
            <p className="text-xs mt-2 italic">Note: Colors may vary +/- 3% as indicated by supplier</p>
          </div>

          {/* Dimensions */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2">⚙️ DIMENSION CUSTOMIZATIONS</h3>
            <table className="w-full text-sm border-collapse border border-gray-800">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-800 p-2">Dimension</th>
                  <th className="border border-gray-800 p-2">Standard</th>
                  <th className="border border-gray-800 p-2">Selected</th>
                  <th className="border border-gray-800 p-2">Upgrade Charge (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-800 p-2 font-semibold">Seat Depth</td>
                  <td className="border border-gray-800 p-2">{data.dimensions.seatDepth.standard}</td>
                  <td className="border border-gray-800 p-2">{data.dimensions.seatDepth.selected}</td>
                  <td className="border border-gray-800 p-2">₹{data.dimensions.seatDepth.upgrade.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="border border-gray-800 p-2 font-semibold">Seat Width</td>
                  <td className="border border-gray-800 p-2">{data.dimensions.seatWidth.standard}</td>
                  <td className="border border-gray-800 p-2">{data.dimensions.seatWidth.selected}</td>
                  <td className="border border-gray-800 p-2">₹{data.dimensions.seatWidth.upgrade.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="border border-gray-800 p-2 font-semibold">Seat Height</td>
                  <td className="border border-gray-800 p-2">{data.dimensions.seatHeight.standard}</td>
                  <td className="border border-gray-800 p-2">{data.dimensions.seatHeight.selected}</td>
                  <td className="border border-gray-800 p-2">₹{data.dimensions.seatHeight.upgrade.toLocaleString()}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="border border-gray-800 p-2 text-right font-bold">Total Dimension Upgrade Charges:</td>
                  <td className="border border-gray-800 p-2 font-bold">₹{data.dimensions.totalUpgrade.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Materials */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2">🛋️ MATERIAL & FINISHING</h3>
            <table className="w-full text-sm border-collapse border border-gray-800">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-800 p-2">Detail</th>
                  <th className="border border-gray-800 p-2">Specification</th>
                  <th className="border border-gray-800 p-2">Upgrade Charge (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-800 p-2 font-semibold">Foam Type</td>
                  <td className="border border-gray-800 p-2">{data.materials.foamType}</td>
                  <td className="border border-gray-800 p-2">₹{data.materials.foamUpgrade.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="border border-gray-800 p-2 font-semibold">Wood Type</td>
                  <td className="border border-gray-800 p-2">{data.materials.woodType}</td>
                  <td className="border border-gray-800 p-2">₹{data.materials.woodUpgrade.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="border border-gray-800 p-2 font-semibold">Armrest Type</td>
                  <td className="border border-gray-800 p-2">{data.materials.armrestType}</td>
                  <td className="border border-gray-800 p-2">₹{data.materials.armrestUpgrade.toLocaleString()}</td>
                </tr>
                {data.materials.armrestWidth && (
                  <tr>
                    <td className="border border-gray-800 p-2 font-semibold">Armrest Width</td>
                    <td className="border border-gray-800 p-2">{data.materials.armrestWidth} in</td>
                    <td className="border border-gray-800 p-2"></td>
                  </tr>
                )}
                <tr>
                  <td className="border border-gray-800 p-2 font-semibold">Legs Type</td>
                  <td className="border border-gray-800 p-2">{data.materials.legsType}</td>
                  <td className="border border-gray-800 p-2">₹{data.materials.legsUpgrade.toLocaleString()}</td>
                </tr>
                {data.materials.legsHeight && (
                  <tr>
                    <td className="border border-gray-800 p-2 font-semibold">Legs Height</td>
                    <td className="border border-gray-800 p-2">{data.materials.legsHeight} in</td>
                    <td className="border border-gray-800 p-2"></td>
                  </tr>
                )}
                {data.materials.legsColor && (
                  <tr>
                    <td className="border border-gray-800 p-2 font-semibold">Legs Color</td>
                    <td className="border border-gray-800 p-2">{data.materials.legsColor}</td>
                    <td className="border border-gray-800 p-2"></td>
                  </tr>
                )}
                <tr>
                  <td className="border border-gray-800 p-2 font-semibold">Stitch Type</td>
                  <td className="border border-gray-800 p-2">{data.materials.stitchType}</td>
                  <td className="border border-gray-800 p-2">₹{data.materials.stitchUpgrade.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Accessories */}
          {data.accessories.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-2">🔌 ACCESSORIES</h3>
              <table className="w-full text-sm border-collapse border border-gray-800">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-800 p-2">Accessory</th>
                    <th className="border border-gray-800 p-2">Specification</th>
                    <th className="border border-gray-800 p-2">Qty</th>
                    <th className="border border-gray-800 p-2">Unit Price (₹)</th>
                    <th className="border border-gray-800 p-2">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.accessories.map((acc, idx) => (
                    <tr key={idx}>
                      <td className="border border-gray-800 p-2">{acc.name}</td>
                      <td className="border border-gray-800 p-2">{acc.spec}</td>
                      <td className="border border-gray-800 p-2">{acc.qty}</td>
                      <td className="border border-gray-800 p-2">₹{acc.unitPrice.toLocaleString()}</td>
                      <td className="border border-gray-800 p-2">₹{acc.total.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={4} className="border border-gray-800 p-2 text-right font-bold">Total Accessories Charge:</td>
                    <td className="border border-gray-800 p-2 font-bold">₹{data.accessoriesTotal.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Price Breakdown */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2">💰 PRICE BREAKDOWN</h3>
            <table className="w-full text-sm border-collapse border border-gray-800">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-800 p-2">Description</th>
                  <th className="border border-gray-800 p-2">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-800 p-2 font-semibold">Base Product Cost</td>
                  <td className="border border-gray-800 p-2">₹{data.priceBreakdown.baseProductCost.toLocaleString()}</td>
                </tr>
                {data.priceBreakdown.consoleTotal > 0 && (
                  <tr>
                    <td className="border border-gray-800 p-2 font-semibold">Consoles</td>
                    <td className="border border-gray-800 p-2">₹{data.priceBreakdown.consoleTotal.toLocaleString()}</td>
                  </tr>
                )}
                {data.priceBreakdown.loungerTotal > 0 && (
                  <tr>
                    <td className="border border-gray-800 p-2 font-semibold">Loungers</td>
                    <td className="border border-gray-800 p-2">₹{data.priceBreakdown.loungerTotal.toLocaleString()}</td>
                  </tr>
                )}
                {data.priceBreakdown.reclinerTotal > 0 && (
                  <tr>
                    <td className="border border-gray-800 p-2 font-semibold">Recliners</td>
                    <td className="border border-gray-800 p-2">₹{data.priceBreakdown.reclinerTotal.toLocaleString()}</td>
                  </tr>
                )}
                {data.priceBreakdown.pillowTotal > 0 && (
                  <tr>
                    <td className="border border-gray-800 p-2 font-semibold">Pillows</td>
                    <td className="border border-gray-800 p-2">₹{data.priceBreakdown.pillowTotal.toLocaleString()}</td>
                  </tr>
                )}
                {data.priceBreakdown.fabricUpgradeTotal > 0 && (
                  <tr>
                    <td className="border border-gray-800 p-2 font-semibold">Fabric Upgrade</td>
                    <td className="border border-gray-800 p-2">₹{data.priceBreakdown.fabricUpgradeTotal.toLocaleString()}</td>
                  </tr>
                )}
                {data.priceBreakdown.dimensionUpgradeTotal > 0 && (
                  <tr>
                    <td className="border border-gray-800 p-2 font-semibold">Dimension Upgrade</td>
                    <td className="border border-gray-800 p-2">₹{data.priceBreakdown.dimensionUpgradeTotal.toLocaleString()}</td>
                  </tr>
                )}
                {data.priceBreakdown.foamUpgradeTotal > 0 && (
                  <tr>
                    <td className="border border-gray-800 p-2 font-semibold">Foam Upgrade</td>
                    <td className="border border-gray-800 p-2">₹{data.priceBreakdown.foamUpgradeTotal.toLocaleString()}</td>
                  </tr>
                )}
                {data.priceBreakdown.armrestUpgradeTotal > 0 && (
                  <tr>
                    <td className="border border-gray-800 p-2 font-semibold">Armrest Upgrade</td>
                    <td className="border border-gray-800 p-2">₹{data.priceBreakdown.armrestUpgradeTotal.toLocaleString()}</td>
                  </tr>
                )}
                {data.priceBreakdown.stitchTypePrice > 0 && (
                  <tr>
                    <td className="border border-gray-800 p-2 font-semibold">Stitch Type</td>
                    <td className="border border-gray-800 p-2">₹{data.priceBreakdown.stitchTypePrice.toLocaleString()}</td>
                  </tr>
                )}
                <tr>
                  <td className="border border-gray-800 p-2 font-bold">Subtotal</td>
                  <td className="border border-gray-800 p-2 font-bold">₹{data.priceBreakdown.subtotal.toLocaleString()}</td>
                </tr>
                {data.priceBreakdown.discount > 0 && (
                  <tr>
                    <td className="border border-gray-800 p-2 font-semibold">Discount</td>
                    <td className="border border-gray-800 p-2">-₹{data.priceBreakdown.discount.toLocaleString()}</td>
                  </tr>
                )}
                <tr className="bg-gray-100">
                  <td className="border border-gray-800 p-2 font-bold text-lg">Total</td>
                  <td className="border border-gray-800 p-2 font-bold text-lg">₹{data.priceBreakdown.total.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t-2 border-gray-800">
            <p className="text-sm text-center text-gray-600">
              This is a computer-generated document. No signature required.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

