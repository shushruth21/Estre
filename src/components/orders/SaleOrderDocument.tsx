import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { SaleOrderGeneratedData, SaleOrderLineItem } from "@/lib/sale-order-generator";

interface SaleOrderDocumentProps {
  data: SaleOrderGeneratedData;
}

const formatCurrency = (value: number) =>
  `₹${Math.round(Number(value || 0)).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const renderAddressLines = (lines: string[]) =>
  lines.filter(Boolean).map((line, idx) => (
    <p key={`${line}-${idx}`} className="text-sm">
      {line}
    </p>
  ));

const renderSectionsTable = (item: SaleOrderLineItem) => {
  if (!item.sections || item.sections.length === 0) return null;

  return (
    <table className="w-full text-sm border border-gray-800 mb-4">
      <thead>
        <tr className="bg-gray-100">
          <th className="border border-gray-800 p-2 text-left">Section</th>
          <th className="border border-gray-800 p-2 text-left">Seater Type</th>
          <th className="border border-gray-800 p-2 text-left">Quantity</th>
        </tr>
      </thead>
      <tbody>
        {item.sections.map((section) => (
          <tr key={`${item.line_item_id}-${section.section}`}>
            <td className="border border-gray-800 p-2">{section.section_label}</td>
            <td className="border border-gray-800 p-2">{section.seater_type}</td>
            <td className="border border-gray-800 p-2">{section.quantity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const renderConsoleDetails = (item: SaleOrderLineItem) => {
  if (!item.consoles) return null;

  return (
    <div className="mb-4">
      <h4 className="font-semibold mb-2">Consoles</h4>
      <table className="w-full text-sm border border-gray-800">
        <tbody>
          <tr>
            <td className="border border-gray-800 p-2 font-medium">Total Consoles</td>
            <td className="border border-gray-800 p-2">{item.consoles.total_count}</td>
          </tr>
          <tr>
            <td className="border border-gray-800 p-2 font-medium">Console Size</td>
            <td className="border border-gray-800 p-2">{item.consoles.console_size}</td>
          </tr>
          <tr>
            <td className="border border-gray-800 p-2 font-medium">Total Price</td>
            <td className="border border-gray-800 p-2">{formatCurrency(item.consoles.total_price)}</td>
          </tr>
        </tbody>
      </table>
      {item.consoles.positions?.length ? (
        <div className="mt-2">
          <p className="text-sm font-medium">Positions:</p>
          <ul className="list-disc pl-5 text-sm">
            {item.consoles.positions.map((pos, index) => (
              <li key={`${pos.section}-${index}`}>
                {pos.section} - {pos.position_label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

const renderLoungerDetails = (item: SaleOrderLineItem) => {
  if (!item.loungers) return null;
  return (
    <div className="mb-4">
      <h4 className="font-semibold mb-2">Loungers</h4>
      <table className="w-full text-sm border border-gray-800">
        <tbody>
          <tr>
            <td className="border border-gray-800 p-2 font-medium">Count</td>
            <td className="border border-gray-800 p-2">{item.loungers.count}</td>
          </tr>
          <tr>
            <td className="border border-gray-800 p-2 font-medium">Size</td>
            <td className="border border-gray-800 p-2">{item.loungers.size}</td>
          </tr>
          <tr>
            <td className="border border-gray-800 p-2 font-medium">Positioning</td>
            <td className="border border-gray-800 p-2">{item.loungers.positioning}</td>
          </tr>
          <tr>
            <td className="border border-gray-800 p-2 font-medium">Storage</td>
            <td className="border border-gray-800 p-2">{item.loungers.storage}</td>
          </tr>
          <tr>
            <td className="border border-gray-800 p-2 font-medium">Price</td>
            <td className="border border-gray-800 p-2">{formatCurrency(item.loungers.total_price)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const renderPillowDetails = (item: SaleOrderLineItem) => {
  if (!item.pillows) return null;
  return (
    <div className="mb-4">
      <h4 className="font-semibold mb-2">Additional Pillows</h4>
      <table className="w-full text-sm border border-gray-800">
        <tbody>
          <tr>
            <td className="border border-gray-800 p-2 font-medium">Quantity</td>
            <td className="border border-gray-800 p-2">{item.pillows.count}</td>
          </tr>
          <tr>
            <td className="border border-gray-800 p-2 font-medium">Type</td>
            <td className="border border-gray-800 p-2">{item.pillows.type}</td>
          </tr>
          <tr>
            <td className="border border-gray-800 p-2 font-medium">Size</td>
            <td className="border border-gray-800 p-2">{item.pillows.size}</td>
          </tr>
          <tr>
            <td className="border border-gray-800 p-2 font-medium">Colour Option</td>
            <td className="border border-gray-800 p-2">{item.pillows.colour_option}</td>
          </tr>
          {item.pillows.colours.length ? (
            <tr>
              <td className="border border-gray-800 p-2 font-medium">Fabric Codes</td>
              <td className="border border-gray-800 p-2">{item.pillows.colours.join(", ")}</td>
            </tr>
          ) : null}
          <tr>
            <td className="border border-gray-800 p-2 font-medium">Total Charge</td>
            <td className="border border-gray-800 p-2">{formatCurrency(item.pillows.total_price)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const renderFabricDetails = (item: SaleOrderLineItem) => {
  const { fabric } = item;
  return (
    <div className="mb-4">
      <h4 className="font-semibold mb-2">Fabric Plan</h4>
      <table className="w-full text-sm border border-gray-800">
        <tbody>
          <tr>
            <td className="border border-gray-800 p-2 font-medium">Plan</td>
            <td className="border border-gray-800 p-2">{fabric.plan}</td>
          </tr>
          <tr>
            <td className="border border-gray-800 p-2 font-medium">Upgrade Charge</td>
            <td className="border border-gray-800 p-2">{formatCurrency(fabric.upgrade_charge)}</td>
          </tr>
          <tr>
            <td className="border border-gray-800 p-2 font-medium">Note</td>
            <td className="border border-gray-800 p-2">{fabric.colour_variance_note}</td>
          </tr>
        </tbody>
      </table>
      {fabric.single_colour ? (
        <p className="text-sm mt-2">
          <span className="font-medium">Fabric Code:</span> {fabric.single_colour.fabric_code} &mdash; {fabric.single_colour.fabric_name}
        </p>
      ) : null}
      {fabric.multi_colour ? (
        <div className="text-sm mt-2 space-y-1">
          {fabric.multi_colour.structure && (
            <p>
              <span className="font-medium">Structure:</span> {fabric.multi_colour.structure.code} &mdash; {fabric.multi_colour.structure.name}
            </p>
          )}
          {fabric.multi_colour.backrest && (
            <p>
              <span className="font-medium">Backrest:</span> {fabric.multi_colour.backrest.code} &mdash; {fabric.multi_colour.backrest.name}
            </p>
          )}
          {fabric.multi_colour.seat && (
            <p>
              <span className="font-medium">Seat:</span> {fabric.multi_colour.seat.code} &mdash; {fabric.multi_colour.seat.name}
            </p>
          )}
          {fabric.multi_colour.headrest && (
            <p>
              <span className="font-medium">Headrest:</span> {fabric.multi_colour.headrest.code} &mdash; {fabric.multi_colour.headrest.name}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
};

const renderAccessories = (item: SaleOrderLineItem) => {
  if (!item.accessories.length) return null;
  return (
    <div className="mb-4">
      <h4 className="font-semibold mb-2">Accessories</h4>
      <table className="w-full text-sm border border-gray-800">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-800 p-2 text-left">Accessory</th>
            <th className="border border-gray-800 p-2 text-left">Quantity</th>
            <th className="border border-gray-800 p-2 text-left">Price</th>
          </tr>
        </thead>
        <tbody>
          {item.accessories.map((accessory, idx) => (
            <tr key={`${item.line_item_id}-acc-${idx}`}>
              <td className="border border-gray-800 p-2">{accessory.name}</td>
              <td className="border border-gray-800 p-2">{accessory.quantity}</td>
              <td className="border border-gray-800 p-2">{formatCurrency(accessory.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const SaleOrderDocument = ({ data }: SaleOrderDocumentProps) => {
  const { header, lineItems, totals, payments } = data;

  const handlePrint = () => window.print();

  const handleDownload = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sale Order - ${header.so_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .section-title { font-weight: bold; font-size: 16px; margin-top: 20px; }
          </style>
        </head>
        <body>
          ${document.getElementById("sale-order-content")?.innerHTML || ""}
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

      <Card id="sale-order-content" className="print:border-0 print:shadow-none">
        <CardContent className="p-8 print:p-4 space-y-6">
          <div className="text-center border-2 border-gray-800 p-6">
            <h1 className="text-3xl font-bold mb-2">SALE ORDER</h1>
            <p className="text-xl font-semibold">{header.company.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-base mb-2">Company Information</h3>
              {renderAddressLines(header.company.addressLines)}
              <p className="mt-2"><span className="font-medium">Phone:</span> {header.company.phone}</p>
              <p><span className="font-medium">Email:</span> {header.company.email}</p>
              <p><span className="font-medium">GSTIN:</span> {header.company.gst}</p>
            </div>
            <div className="space-y-1">
              <p><span className="font-medium">Sale Order No.:</span> {header.so_number}</p>
              <p><span className="font-medium">Order Date:</span> {header.order_date}</p>
              <p><span className="font-medium">Status:</span> {header.status}</p>
              <p><span className="font-medium">Delivery Date:</span> {header.delivery_terms.delivery_date}</p>
              {header.buyer_gst && (
                <p><span className="font-medium">Buyer GST:</span> {header.buyer_gst}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-base mb-2">Invoice To</h3>
              <p className="font-medium">{header.invoice_to.customer_name}</p>
              {renderAddressLines(header.invoice_to.addressLines)}
              <p>{header.invoice_to.city} - {header.invoice_to.pincode}</p>
              <p><span className="font-medium">Mobile:</span> {header.invoice_to.mobile}</p>
              <p><span className="font-medium">Email:</span> {header.invoice_to.email}</p>
            </div>
            <div>
              <h3 className="font-semibold text-base mb-2">Dispatch To</h3>
              <p className="font-medium">{header.dispatch_to.customer_name}</p>
              {renderAddressLines(header.dispatch_to.addressLines)}
              <p>{header.dispatch_to.city} - {header.dispatch_to.pincode}</p>
              <p><span className="font-medium">Mobile:</span> {header.dispatch_to.mobile}</p>
              <p><span className="font-medium">Email:</span> {header.dispatch_to.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-base mb-2">Payment Terms</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Advance Payment: {header.payment_terms.advance_percent}% ({header.payment_terms.advance_condition})</li>
                <li>Balance Payment: {header.payment_terms.balance_condition}</li>
                {header.payment_terms.additional_terms && <li>{header.payment_terms.additional_terms}</li>}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-base mb-2">Delivery Terms</h3>
              <p><span className="font-medium">Delivery Timeline:</span> {header.delivery_terms.delivery_days} days</p>
              <p><span className="font-medium">Expected Date:</span> {header.delivery_terms.delivery_date}</p>
              <p><span className="font-medium">Dispatch Through:</span> {header.delivery_terms.dispatch_through}</p>
            </div>
          </div>

          {lineItems.map((item, index) => (
            <div key={item.line_item_id} className="space-y-4 border border-gray-300 p-4 rounded-lg">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Line Item {index + 1}: {item.model_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Category: {item.category} • Shape: {item.shape || "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">Line Total</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(item.line_total)}</p>
                </div>
              </div>

              {renderSectionsTable(item)}
              {renderConsoleDetails(item)}
              {renderLoungerDetails(item)}
              {renderPillowDetails(item)}
              {renderFabricDetails(item)}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Seat Dimensions</h4>
                  <table className="w-full text-sm border border-gray-800">
                    <tbody>
                      <tr>
                        <td className="border border-gray-800 p-2 font-medium">Depth</td>
                        <td className="border border-gray-800 p-2">{item.seat_dimensions.depth_in}"</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-800 p-2 font-medium">Width</td>
                        <td className="border border-gray-800 p-2">{item.seat_dimensions.width_in}"</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-800 p-2 font-medium">Height</td>
                        <td className="border border-gray-800 p-2">{item.seat_dimensions.height_in}"</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Materials & Upgrades</h4>
                  <table className="w-full text-sm border border-gray-800">
                    <tbody>
                      <tr>
                        <td className="border border-gray-800 p-2 font-medium">Foam</td>
                        <td className="border border-gray-800 p-2">
                          {item.foam_type} ({formatCurrency(item.foam_upgrade_charge)})
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-800 p-2 font-medium">Armrest</td>
                        <td className="border border-gray-800 p-2">
                          {item.armrest_type} ({formatCurrency(item.armrest_charge)})
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-800 p-2 font-medium">Legs</td>
                        <td className="border border-gray-800 p-2">
                          {item.legs} ({formatCurrency(item.legs_charge)})
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-800 p-2 font-medium">Wood</td>
                        <td className="border border-gray-800 p-2">{item.wood_type}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-800 p-2 font-medium">Stitch</td>
                        <td className="border border-gray-800 p-2">{item.stitch_type}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {renderAccessories(item)}

              <div className="text-sm text-muted-foreground">
                Approximate Overall Width: {item.approximate_widths.overall_inches || item.approximate_widths.front_inches || 0}".
              </div>
            </div>
          ))}

          <div className="border-t border-gray-300 pt-4">
            <h3 className="text-lg font-semibold mb-2">Financial Summary</h3>
            <table className="w-full text-sm border border-gray-800">
              <tbody>
                <tr>
                  <td className="border border-gray-800 p-2 font-medium">Subtotal</td>
                  <td className="border border-gray-800 p-2">{formatCurrency(totals.subtotal)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-800 p-2 font-medium">Discount</td>
                  <td className="border border-gray-800 p-2">
                    {formatCurrency(totals.discount_amount)}
                    {totals.discount_percent ? ` (${totals.discount_percent}%)` : ""}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-800 p-2 font-medium">Total Amount</td>
                  <td className="border border-gray-800 p-2 font-semibold text-primary">{formatCurrency(totals.total_amount)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-800 p-2 font-medium">Advance Amount</td>
                  <td className="border border-gray-800 p-2">{formatCurrency(totals.advance_amount)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-800 p-2 font-medium">Balance Amount</td>
                  <td className="border border-gray-800 p-2">{formatCurrency(totals.balance_amount)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-800 p-2 font-medium">Paid Amount</td>
                  <td className="border border-gray-800 p-2">{formatCurrency(totals.paid_amount)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-800 p-2 font-medium">Outstanding Amount</td>
                  <td className="border border-gray-800 p-2 font-semibold text-destructive">{formatCurrency(totals.outstanding_amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {payments.length ? (
            <div>
              <h3 className="text-lg font-semibold mb-2">Payment Tracking</h3>
              <table className="w-full text-sm border border-gray-800">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-800 p-2">Date</th>
                    <th className="border border-gray-800 p-2">Type</th>
                    <th className="border border-gray-800 p-2">Method</th>
                    <th className="border border-gray-800 p-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.payment_id}>
                      <td className="border border-gray-800 p-2">{payment.payment_date}</td>
                      <td className="border border-gray-800 p-2">{payment.payment_type}</td>
                      <td className="border border-gray-800 p-2">{payment.payment_method}</td>
                      <td className="border border-gray-800 p-2">{formatCurrency(payment.payment_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground text-center mt-8">
            This is a computer-generated document. Prices are inclusive of applicable charges unless specified.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

