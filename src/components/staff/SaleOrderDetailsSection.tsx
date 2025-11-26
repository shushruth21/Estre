import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface OrderItem {
    id: string;
    quantity: number;
    unit_price_rs: number;
    total_price_rs: number;
    product_title?: string;
    product_category?: string;
    configuration?: any;
}

interface SaleOrderDetailsProps {
    orderItems: OrderItem[];
    basePrice: number;
    finalPrice: number;
    discount: number;
}

const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const safe = (value: any, fallback: string = "—") => value || fallback;

export function SaleOrderDetailsSection({ orderItems, basePrice, finalPrice, discount }: SaleOrderDetailsProps) {
    if (!orderItems || orderItems.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Order Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">No order items found</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>DETAILED PRODUCT SPECIFICATIONS</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Complete breakdown as per Estre standards
                </p>
            </CardHeader>
            <CardContent>
                {orderItems.map((item, index) => {
                    const config = item.configuration || {};

                    return (
                        <div key={item.id} className="mb-8 pb-8 border-b last:border-0">
                            {/* Product Header */}
                            <div className="mb-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <Badge variant="outline" className="text-lg">Sl. {index + 1}</Badge>
                                    <h3 className="text-2xl font-bold">
                                        {safe(item.product_category, "PRODUCT").toUpperCase()}
                                    </h3>
                                </div>
                                <p className="text-lg text-muted-foreground">
                                    <strong>Description:</strong> {safe(item.product_title)}
                                </p>
                            </div>

                            {/* Seating Configuration */}
                            {config.seats && (
                                <div className="mb-6">
                                    <h4 className="font-semibold text-lg mb-3 text-primary">SEATING CONFIGURATION</h4>
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted">
                                                <tr>
                                                    <th className="px-4 py-3 text-left w-1/3">Section</th>
                                                    <th className="px-4 py-3 text-left w-1/3">Type</th>
                                                    <th className="px-4 py-3 text-right w-1/3">Amount (Rs.)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {config.seats.map((seat: any, idx: number) => (
                                                    <tr key={idx} className="border-t">
                                                        <td className="px-4 py-3">{safe(seat.section, `Seat ${idx + 1}`)}</td>
                                                        <td className="px-4 py-3">{safe(seat.type || seat.seater_type)}</td>
                                                        <td className="px-4 py-3 text-right font-semibold">
                                                            {seat.price ? formatCurrency(seat.price) : "—"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {(config.reference_image || config.wireframe_image) && (
                                        <div className="mt-3 text-sm text-muted-foreground italic">
                                            Reference images available (see attachments)
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Additional Customizations */}
                            <div className="mb-6">
                                <h4 className="font-semibold text-lg mb-3 text-primary">ADDITIONAL CUSTOMISATIONS</h4>

                                {/* Consoles */}
                                {config.consoles && (
                                    <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                                        <div className="grid grid-cols-2 gap-4 mb-3">
                                            <div>
                                                <p className="text-sm text-muted-foreground">No. of Consoles</p>
                                                <p className="font-semibold">{config.consoles.count || 0} Nos.</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Console Size</p>
                                                <p className="font-semibold">{safe(config.consoles.size, "Standard")}</p>
                                            </div>
                                        </div>
                                        {config.consoles.positioning && (
                                            <div className="mt-3">
                                                <p className="text-sm font-medium mb-2">Console Positioning:</p>
                                                <ul className="text-sm space-y-1 ml-4">
                                                    {Object.entries(config.consoles.positioning).map(([key, value]) => (
                                                        <li key={key}>• {key}: {String(value)}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {config.consoles.price && (
                                            <div className="mt-3 text-right">
                                                <span className="font-bold">{formatCurrency(config.consoles.price)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Loungers */}
                                {config.loungers && (
                                    <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">No. of Loungers</p>
                                                <p className="font-semibold">{config.loungers.count || 1} No.</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Lounger Size</p>
                                                <p className="font-semibold">{safe(config.loungers.size, "7 ft")}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Positioning</p>
                                                <p className="font-semibold">{safe(config.loungers.position)}</p>
                                            </div>
                                            {config.loungers.price && (
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Amount</p>
                                                    <p className="font-bold">{formatCurrency(config.loungers.price)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Recliners */}
                                {config.recliners && (
                                    <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">No. of Recliners</p>
                                                <p className="font-semibold">{config.recliners.count || 0} Nos.</p>
                                            </div>
                                            {config.recliners.price && (
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Amount</p>
                                                    <p className="font-bold">{formatCurrency(config.recliners.price)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Pillows */}
                                {config.pillows && (
                                    <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Additional Pillows</p>
                                                <p className="font-semibold">{config.pillows.count || 0} Nos.</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Pillow Type</p>
                                                <p className="font-semibold">{safe(config.pillows.type)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Size</p>
                                                <p className="font-semibold">{safe(config.pillows.size)}</p>
                                            </div>
                                            <div className="col-span-3">
                                                <p className="text-sm text-muted-foreground">Colour Option</p>
                                                <p className="font-semibold">{safe(config.pillows.color_option)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Fabric Specifications */}
                            {config.fabric && (
                                <div className="mb-6">
                                    <h4 className="font-semibold text-lg mb-3 text-primary">FABRIC SPECIFICATIONS</h4>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <p className="mb-3"><strong>Fabric Selected:</strong> {safe(config.fabric.type, "Multi Colour")}</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {config.fabric.structure_code && (
                                                <div className="flex justify-between items-center p-2 bg-background rounded">
                                                    <span className="text-sm font-mono text-primary">{config.fabric.structure_code}</span>
                                                    <span className="text-sm">Structure</span>
                                                </div>
                                            )}
                                            {config.fabric.backrest_code && (
                                                <div className="flex justify-between items-center p-2 bg-background rounded">
                                                    <span className="text-sm font-mono text-primary">{config.fabric.backrest_code}</span>
                                                    <span className="text-sm">Back Rest/Cushion</span>
                                                </div>
                                            )}
                                            {config.fabric.seat_code && (
                                                <div className="flex justify-between items-center p-2 bg-background rounded">
                                                    <span className="text-sm font-mono text-primary">{config.fabric.seat_code}</span>
                                                    <span className="text-sm">Seat</span>
                                                </div>
                                            )}
                                            {config.fabric.headrest_code && (
                                                <div className="flex justify-between items-center p-2 bg-background rounded">
                                                    <span className="text-sm font-mono text-primary">{config.fabric.headrest_code}</span>
                                                    <span className="text-sm">Headrest</span>
                                                </div>
                                            )}
                                            {config.fabric.armrest_code && (
                                                <div className="flex justify-between items-center p-2 bg-background rounded">
                                                    <span className="text-sm font-mono text-primary">{config.fabric.armrest_code}</span>
                                                    <span className="text-sm">Armrest</span>
                                                </div>
                                            )}
                                        </div>
                                        {config.fabric.pillow_colors && (
                                            <div className="mt-3">
                                                <p className="text-sm font-medium mb-2">Pillow Colours:</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {Object.entries(config.fabric.pillow_colors).map(([key, value]) => (
                                                        <div key={key} className="text-sm font-mono text-primary">
                                                            {String(value)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-3 italic">
                                            *Colours may vary +/-3% as indicated by supplier
                                        </p>
                                        {config.fabric.upgrade_charges !== undefined && (
                                            <div className="mt-3 text-right">
                                                <span className="text-sm">Fabric Upgrade Charges: </span>
                                                <span className="font-bold">{formatCurrency(config.fabric.upgrade_charges)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Foam & Comfort */}
                            {config.foam && (
                                <div className="mb-6">
                                    <h4 className="font-semibold text-lg mb-3 text-primary">FOAM & COMFORT</h4>
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Foam Type</p>
                                            <p className="font-semibold">{safe(config.foam.type, "Standard Foam")}</p>
                                        </div>
                                        {config.foam.upgrade_charges !== undefined && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">Upgrade Charges</p>
                                                <p className="font-bold">{formatCurrency(config.foam.upgrade_charges)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Dimensions */}
                            {config.dimensions && (
                                <div className="mb-6">
                                    <h4 className="font-semibold text-lg mb-3 text-primary">DIMENSIONS & CUSTOMIZATION</h4>
                                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                                        {config.dimensions.seat_depth && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">Seat Depth</p>
                                                <p className="font-semibold">{config.dimensions.seat_depth} in</p>
                                                {config.dimensions.seat_depth_charge && (
                                                    <p className="text-sm">{formatCurrency(config.dimensions.seat_depth_charge)}</p>
                                                )}
                                            </div>
                                        )}
                                        {config.dimensions.seat_width && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">Seat Width</p>
                                                <p className="font-semibold">{config.dimensions.seat_width} in</p>
                                                {config.dimensions.seat_width_charge && (
                                                    <p className="text-sm">{formatCurrency(config.dimensions.seat_width_charge)}</p>
                                                )}
                                            </div>
                                        )}
                                        {config.dimensions.seat_height && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">Seat Height</p>
                                                <p className="font-semibold">{config.dimensions.seat_height} in</p>
                                            </div>
                                        )}
                                        {config.dimensions.total_width && (
                                            <div className="col-span-3 mt-2 pt-3 border-t">
                                                <p className="text-sm text-muted-foreground">Approximate Total Width (+/- 5%)</p>
                                                <p className="font-bold text-lg">{config.dimensions.total_width} inches</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Armrest & Legs */}
                            <div className="mb-6">
                                <h4 className="font-semibold text-lg mb-3 text-primary">ARMREST & LEGS</h4>
                                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Armrest Type</p>
                                        <p className="font-semibold">{safe(config.armrest?.type, "Default")}</p>
                                        {config.armrest?.charge && (
                                            <p className="text-sm">{formatCurrency(config.armrest.charge)}</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Legs</p>
                                        <p className="font-semibold">{safe(config.legs?.type, "Standard")}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Accessories */}
                            {config.accessories && config.accessories.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-semibold text-lg mb-3 text-primary">ACCESSORIES</h4>
                                    <div className="p-4 bg-muted/50 rounded-lg">
                                        <ul className="space-y-2">
                                            {config.accessories.map((accessory: any, idx: number) => (
                                                <li key={idx} className="flex justify-between items-center">
                                                    <span>{safe(accessory.name || accessory)}</span>
                                                    {accessory.price && (
                                                        <span className="font-semibold">{formatCurrency(accessory.price)}</span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Manufacturing Specifications */}
                            <div className="mb-6">
                                <h4 className="font-semibold text-lg mb-3 text-primary">MANUFACTURING SPECIFICATIONS</h4>
                                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Wood Type</p>
                                        <p className="font-semibold">{safe(config.wood_type, "Pine (Default)")}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Stitch Type</p>
                                        <p className="font-semibold">{safe(config.stitch_type, "Felled Seam / Double Stitched Seam")}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Item Total */}
                            <Separator className="my-6" />
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-semibold">Total Cost (Item {index + 1}):</span>
                                <span className="text-2xl font-bold text-primary">
                                    {formatCurrency(item.total_price_rs)}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {/* Grand Total */}
                <div className="mt-8 pt-6 border-t-2">
                    <div className="space-y-3">
                        <div className="flex justify-between text-lg">
                            <span className="text-muted-foreground">Base Price:</span>
                            <span className="font-semibold">{formatCurrency(basePrice)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-lg text-green-600">
                                <span>Discount Applied:</span>
                                <span className="font-semibold">-{formatCurrency(discount)}</span>
                            </div>
                        )}
                        <Separator />
                        <div className="flex justify-between text-2xl font-bold">
                            <span>GRAND TOTAL:</span>
                            <span className="text-primary">{formatCurrency(finalPrice)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
