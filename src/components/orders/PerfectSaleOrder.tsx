import React from "react";
import { SaleOrderGeneratedData, SaleOrderLineItem } from "@/lib/sale-order-generator";
import { format } from "date-fns";

interface PerfectSaleOrderProps {
    data: SaleOrderGeneratedData;
}

const formatCurrency = (value: number) =>
    `₹${Math.round(Number(value || 0)).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
    })}`;

export const PerfectSaleOrder: React.FC<PerfectSaleOrderProps> = ({ data }) => {
    const { header, lineItems, totals, payments } = data;

    // Helper to render sections table
    const renderSections = (item: SaleOrderLineItem) => {
        if (!item.sections || item.sections.length === 0) return null;
        return (
            <div className="mt-2">
                <div className="font-bold text-[15px] text-estre-brown mb-1">Seating & Layout</div>
                <ul className="list-disc list-inside ml-2 text-gray-700 space-y-1 text-sm">
                    {item.sections.map((section, idx) => (
                        <li key={idx}>
                            {section.section_label}: {section.seater_type} (Qty: {section.quantity})
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    // Helper to render consoles
    const renderConsoles = (item: SaleOrderLineItem) => {
        if (!item.consoles) return null;
        return (
            <div className="mt-2">
                <div className="font-bold text-[15px] text-estre-brown mb-1">
                    Consoles ({item.consoles.total_count} Nos.)
                </div>
                <ul className="list-disc list-inside ml-2 text-gray-700 space-y-1 text-sm">
                    <li>Console Size: {item.consoles.console_size}</li>
                    <li>
                        Positioning:{" "}
                        {item.consoles.positions.map((p) => `${p.section} (${p.position_label})`).join(", ")}
                    </li>
                </ul>
            </div>
        );
    };

    // Helper to render loungers
    const renderLoungers = (item: SaleOrderLineItem) => {
        if (!item.loungers) return null;
        return (
            <div className="mt-2">
                <div className="font-bold text-[15px] text-estre-brown mb-1">Loungers</div>
                <ul className="list-disc list-inside ml-2 text-gray-700 space-y-1 text-sm">
                    <li>Count: {item.loungers.count}</li>
                    <li>Size: {item.loungers.size}</li>
                    <li>Position: {item.loungers.positioning}</li>
                    <li>Storage: {item.loungers.storage}</li>
                </ul>
            </div>
        );
    };

    // Helper to render fabric
    const renderFabric = (item: SaleOrderLineItem) => {
        const { fabric } = item;
        return (
            <div className="mt-2">
                <div className="font-bold text-[15px] text-estre-brown mb-1">
                    Fabric Selection ({fabric.plan})
                </div>
                <ul className="list-disc list-inside ml-2 text-gray-700 space-y-1 text-sm">
                    {fabric.single_colour && (
                        <li>
                            Full Body: {fabric.single_colour.fabric_code} - {fabric.single_colour.fabric_name}
                        </li>
                    )}
                    {fabric.multi_colour && (
                        <>
                            {fabric.multi_colour.structure && (
                                <li>Structure: {fabric.multi_colour.structure.code}</li>
                            )}
                            {fabric.multi_colour.backrest && (
                                <li>Backrest: {fabric.multi_colour.backrest.code}</li>
                            )}
                            {fabric.multi_colour.seat && <li>Seat: {fabric.multi_colour.seat.code}</li>}
                            {fabric.multi_colour.headrest && (
                                <li>Headrest: {fabric.multi_colour.headrest.code}</li>
                            )}
                        </>
                    )}
                </ul>
            </div>
        );
    };

    // Helper to render dimensions & upgrades
    const renderSpecs = (item: SaleOrderLineItem) => {
        return (
            <div className="mt-2">
                <div className="font-bold text-[15px] text-estre-brown mb-1">Specifications & Upgrades</div>
                <ul className="list-disc list-inside ml-2 text-gray-700 space-y-1 text-sm">
                    <li>Wood: {item.wood_type}</li>
                    <li>Stitch: {item.stitch_type}</li>
                    <li>
                        Foam: {item.foam_type}{" "}
                        {item.foam_upgrade_charge > 0 && (
                            <span className="font-bold text-estre-accent1">(Upgrade Applied)</span>
                        )}
                    </li>
                    <li>
                        Seat Depth: {item.seat_dimensions.depth_in}"{" "}
                        {item.seat_dimensions.depth_upgrade_charge > 0 &&
                            `(${formatCurrency(item.seat_dimensions.depth_upgrade_charge)})`}
                    </li>
                    <li>
                        Seat Width: {item.seat_dimensions.width_in}"{" "}
                        {item.seat_dimensions.width_upgrade_charge > 0 &&
                            `(${formatCurrency(item.seat_dimensions.width_upgrade_charge)})`}
                    </li>
                    <li>Seat Height: {item.seat_dimensions.height_in}"</li>
                    <li>Legs: {item.legs}</li>
                </ul>
            </div>
        );
    };

    return (
        <div className="bg-white text-sm font-sans max-w-[8.5in] mx-auto p-10 shadow-none print:shadow-none print:p-0">
            {/* HEADER */}
            <div className="flex justify-between items-start mb-8 border-b-2 border-estre-dark pb-4">
                {/* Logo */}
                <div className="logo w-40">
                    <img src="/estre-logo.jpg" alt="Estre Logo" className="w-full h-auto object-contain" />
                    <p className="text-estre-brown text-xs font-secondary -mt-1 ml-1">GLOBAL PRIVATE LTD</p>
                </div>

                {/* Company Info */}
                <div className="text-right text-xs leading-tight font-secondary">
                    <strong className="text-sm">{header.company.name}</strong>
                    <br />
                    {header.company.addressLines.map((line, i) => (
                        <React.Fragment key={i}>
                            {line}
                            <br />
                        </React.Fragment>
                    ))}
                    Ph: <span className="text-estre-accent1 font-bold">{header.company.phone}</span>
                    <br />
                    Email: {header.company.email} | Website: www.estre.in
                </div>
            </div>

            <h1 className="text-xl font-bold text-center text-estre-dark mb-6">SALE ORDER</h1>

            {/* METADATA */}
            <div className="bg-estre-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-y-1 text-sm">
                    <div className="col-span-2 md:col-span-1">
                        <strong>S.O. No:</strong>
                    </div>
                    <div className="col-span-3 md:col-span-1 text-estre-accent1 font-bold">
                        {header.so_number}
                    </div>

                    <div className="col-span-2 md:col-span-1">
                        <strong>Date:</strong>
                    </div>
                    <div className="col-span-3 md:col-span-2">{header.order_date}</div>

                    <div className="col-span-2 md:col-span-1">
                        <strong>Payment Terms:</strong>
                    </div>
                    <div className="col-span-3 md:col-span-4">
                        {header.payment_terms.advance_percent}% advance; {header.payment_terms.balance_condition}
                    </div>

                    <div className="col-span-2 md:col-span-1">
                        <strong>Delivery:</strong>
                    </div>
                    <div className="col-span-3 md:col-span-2">
                        {header.delivery_terms.delivery_date} ({header.delivery_terms.delivery_days} days)
                    </div>

                    <div className="col-span-2 md:col-span-1">
                        <strong>Dispatch:</strong>
                    </div>
                    <div className="col-span-3 md:col-span-1">{header.delivery_terms.dispatch_through}</div>
                </div>
            </div>

            {/* ADDRESSES */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
                <div className="w-full md:w-1/2 bg-gray-50 p-4 border border-gray-200 rounded-lg shadow-sm">
                    <strong className="text-estre-dark block mb-2">Invoice To:</strong>
                    <div className="text-sm leading-relaxed">
                        {header.invoice_to.customer_name}
                        <br />
                        {header.invoice_to.addressLines.map((line, i) => (
                            <React.Fragment key={i}>
                                {line}
                                <br />
                            </React.Fragment>
                        ))}
                        {header.invoice_to.city} – {header.invoice_to.pincode}
                        <br />
                        Mobile: {header.invoice_to.mobile}
                        <br />
                        Email: {header.invoice_to.email}
                        {header.buyer_gst && (
                            <>
                                <br />
                                GST: {header.buyer_gst}
                            </>
                        )}
                    </div>
                </div>

                <div className="w-full md:w-1/2 bg-gray-50 p-4 border border-gray-200 rounded-lg shadow-sm">
                    <strong className="text-estre-dark block mb-2">To be Dispatched To:</strong>
                    <div className="text-sm leading-relaxed">
                        {header.dispatch_to.customer_name}
                        <br />
                        {header.dispatch_to.addressLines.map((line, i) => (
                            <React.Fragment key={i}>
                                {line}
                                <br />
                            </React.Fragment>
                        ))}
                        {header.dispatch_to.city} – {header.dispatch_to.pincode}
                        <br />
                        Mobile: {header.dispatch_to.mobile}
                    </div>
                </div>
            </div>

            {/* PRODUCT TABLE */}
            <div className="section-title font-bold text-lg text-estre-dark border-b-2 border-estre-gold pb-1 mb-4">
                ORDER DETAILS
            </div>

            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-estre-gold text-white">
                        <th className="p-2 text-left w-12 rounded-tl-lg">Sl</th>
                        <th className="p-2 text-left">Description of the Product</th>
                        <th className="p-2 text-right w-32">Amount (Rs.)</th>
                        <th className="p-2 text-right w-32 rounded-tr-lg">Total (Rs.)</th>
                    </tr>
                </thead>
                <tbody>
                    {lineItems.map((item, idx) => (
                        <React.Fragment key={item.line_item_id}>
                            <tr className="border-b border-gray-100">
                                <td className="p-2 align-top">{idx + 1}</td>
                                <td className="p-2 align-top">
                                    <strong className="text-base text-estre-dark block mb-1">
                                        {item.model_name} ({item.category})
                                    </strong>
                                    <span className="text-xs italic text-gray-500 block mb-2">
                                        Approx. Width: {item.approximate_widths.overall_inches}"
                                    </span>

                                    {renderSections(item)}
                                    {renderConsoles(item)}
                                    {renderLoungers(item)}
                                    {renderFabric(item)}
                                    {renderSpecs(item)}
                                </td>
                                <td className="p-2 text-right align-top">{formatCurrency(item.line_total)}</td>
                                <td className="p-2 text-right align-top">{formatCurrency(item.line_total)}</td>
                            </tr>
                        </React.Fragment>
                    ))}

                    {/* SUMMARY ROWS */}
                    {totals.discount_amount > 0 && (
                        <tr>
                            <td></td>
                            <td className="p-2 text-right font-medium">Discount</td>
                            <td className="p-2 text-right text-green-600">
                                -{formatCurrency(totals.discount_amount)}
                            </td>
                            <td className="p-2 text-right text-green-600">
                                -{formatCurrency(totals.discount_amount)}
                            </td>
                        </tr>
                    )}

                    <tr className="bg-estre-accent2 text-white font-bold text-lg">
                        <td colSpan={3} className="p-3 text-right rounded-bl-lg">
                            TOTAL COST:
                        </td>
                        <td className="p-3 text-right rounded-br-lg">{formatCurrency(totals.total_amount)}</td>
                    </tr>
                </tbody>
            </table>

            {/* FOOTER */}
            <div className="mt-10 pt-4 border-t border-gray-300 text-xs text-gray-600">
                <p className="font-bold text-estre-dark mb-1">Terms and Conditions:</p>
                <p>
                    1. {header.payment_terms.advance_percent}% advance payment is required to confirm the Sale
                    Order. The balance amount is due upon intimation of product readiness and before dispatch.
                </p>
                <p>
                    2. Date of Delivery is approximate and subject to change based on production schedule and
                    transit time.
                </p>
                <p>
                    3. Product colors may vary by +/-3% due to monitor differences or supplier batch
                    variations.
                </p>
                <p className="mt-8">Authorized Signature: _________________________</p>
            </div>
        </div>
    );
};
