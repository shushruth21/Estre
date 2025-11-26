import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface JobCard {
    id: string;
    job_card_number?: string;
    product_title?: string;
    product_category?: string;
    status?: string;
    configuration?: any;
    order_item_id?: string;
}

interface JobCardsDisplayProps {
    jobCards: JobCard[];
    saleOrderNumber?: string;
    saleOrderDate?: string;
}

const safe = (value: any, fallback: string = "—") => value || fallback;

export function JobCardsDisplay({ jobCards, saleOrderNumber, saleOrderDate }: JobCardsDisplayProps) {
    if (!jobCards || jobCards.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Job Cards (0)</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                        No job cards found for this sale order.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Job Cards ({jobCards.length})</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Manufacturing specifications for production team
                </p>
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" className="w-full">
                    {jobCards.map((jc, index) => {
                        const config = jc.configuration || {};
                        const jcNumber = jc.job_card_number || `JC-${String(index + 1).padStart(2, '0')}`;

                        return (
                            <AccordionItem key={jc.id} value={jc.id}>
                                <AccordionTrigger className="hover:no-underline">
                                    <div className="flex items-center gap-3 flex-1">
                                        <Badge variant="secondary" className="font-mono">
                                            {jcNumber}
                                        </Badge>
                                        <span className="font-semibold">
                                            {safe(jc.product_title || jc.product_category, "Product")}
                                        </span>
                                        <Badge className="ml-auto" variant={
                                            jc.status === "completed" ? "default" :
                                                jc.status === "in_progress" ? "secondary" :
                                                    "outline"
                                        }>
                                            {jc.status?.replace(/_/g, " ").toUpperCase() || "PENDING"}
                                        </Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-6 pl-4 pt-4 border-l-4 border-primary/20">
                                        {/* Header Info */}
                                        <div className="bg-muted/50 p-4 rounded-lg">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">S.O. No.</p>
                                                    <p className="font-semibold font-mono">{saleOrderNumber || "—"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">J.C. No.</p>
                                                    <p className="font-semibold font-mono">{jcNumber}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">S.O. Date</p>
                                                    <p className="font-semibold">{saleOrderDate || "—"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">J.C. Issue Date</p>
                                                    <p className="font-semibold">{config.issue_date || "—"}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-muted-foreground">Job Given To Team</p>
                                                    <p className="font-semibold">{config.assigned_team || "Production Team A"}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-muted-foreground">Date of Delivery</p>
                                                    <p className="font-semibold">{config.delivery_date || "—"}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Product Description */}
                                        <div>
                                            <h4 className="font-semibold text-lg mb-3 text-primary">PRODUCT DESCRIPTION</h4>
                                            <div className="grid grid-cols-2 gap-3 p-4 bg-muted/50 rounded-lg">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Product</p>
                                                    <p className="font-semibold">{safe(jc.product_category, "Sofa")}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Model</p>
                                                    <p className="font-semibold">{safe(jc.product_title)}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-sm text-muted-foreground">Type</p>
                                                    <p className="font-semibold">{safe(config.sofa_type, "Standard")}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Seating Configuration */}
                                        {config.seats && (
                                            <div>
                                                <h4 className="font-semibold text-lg mb-3 text-primary">NO. OF SEATS</h4>
                                                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                                                    {config.seats.map((seat: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between items-center">
                                                            <span className="text-sm">{safe(seat.section, `Seat ${idx + 1}`)}</span>
                                                            <span className="font-semibold">{safe(seat.type || seat.seater_type)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Consoles */}
                                        {config.consoles && (
                                            <div>
                                                <h4 className="font-semibold text-lg mb-3 text-primary">CONSOLES</h4>
                                                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">No. of Consoles</p>
                                                            <p className="font-semibold">{config.consoles.count || 0} Nos.</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Console Size</p>
                                                            <p className="font-semibold">{safe(config.consoles.size)}</p>
                                                        </div>
                                                    </div>
                                                    {config.consoles.positioning && (
                                                        <div>
                                                            <p className="text-sm font-medium mb-2">Console Positioning:</p>
                                                            <div className="space-y-1 text-sm">
                                                                {Object.entries(config.consoles.positioning).map(([key, value]) => (
                                                                    <div key={key} className="flex justify-between">
                                                                        <span className="text-muted-foreground">{key}:</span>
                                                                        <span className="font-mono">{String(value)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Loungers */}
                                        {config.loungers && (
                                            <div>
                                                <h4 className="font-semibold text-lg mb-3 text-primary">LOUNGERS</h4>
                                                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">No. of Loungers</p>
                                                        <p className="font-semibold">{config.loungers.count || 1} No.</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Lounger Size</p>
                                                        <p className="font-semibold">{safe(config.loungers.size)}</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-sm text-muted-foreground">Positioning</p>
                                                        <p className="font-semibold">{safe(config.loungers.position)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Frame */}
                                        <div>
                                            <h4 className="font-semibold text-lg mb-3 text-primary">FRAME</h4>
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Wood Type</p>
                                                    <p className="font-semibold">{safe(config.wood_type, "Pine (Default)")}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Seat Dimensions */}
                                        {config.dimensions && (
                                            <div>
                                                <h4 className="font-semibold text-lg mb-3 text-primary">SEAT DIMENSIONS</h4>
                                                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Seat Depth</p>
                                                        <p className="font-semibold">{config.dimensions.seat_depth || "—"} in</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Seat Width</p>
                                                        <p className="font-semibold">{config.dimensions.seat_width || "—"} in</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Seat Height</p>
                                                        <p className="font-semibold">{config.dimensions.seat_height || "—"} in</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Sofa Dimensions */}
                                        {config.dimensions && (
                                            <div>
                                                <h4 className="font-semibold text-lg mb-3 text-primary">SOFA DIMENSIONS</h4>
                                                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Front Width</p>
                                                        <p className="font-semibold">{config.dimensions.front_width || config.dimensions.total_width || "—"} in</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Left Width</p>
                                                        <p className="font-semibold">{config.dimensions.left_width || "0"} in</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Right Width</p>
                                                        <p className="font-semibold">{config.dimensions.right_width || "0"} in</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Armrest Description */}
                                        <div>
                                            <h4 className="font-semibold text-lg mb-3 text-primary">ARMREST DESCRIPTION</h4>
                                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Armrest Type</p>
                                                    <p className="font-semibold">{safe(config.armrest?.type, "Default")}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Armrest Width</p>
                                                    <p className="font-semibold">{config.armrest?.width || "—"} in each</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Cutting & Stitching */}
                                        <div>
                                            <h4 className="font-semibold text-lg mb-3 text-primary">CUTTING & STITCHING SPECIFICATIONS</h4>
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Stitching Type</p>
                                                    <p className="font-semibold">{safe(config.stitch_type, "Felled Seam / Double Stitched Seam")}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Fabric Description */}
                                        {config.fabric && (
                                            <div>
                                                <h4 className="font-semibold text-lg mb-3 text-primary">FABRIC DESCRIPTION</h4>
                                                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Colour Details</p>
                                                        <p className="font-semibold">{safe(config.fabric.type, "Multi Colour")}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium mb-2">Colour Breakup:</p>
                                                        <div className="space-y-2">
                                                            {config.fabric.structure_code && (
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-sm">Structure:</span>
                                                                    <span className="font-mono text-primary">{config.fabric.structure_code}</span>
                                                                </div>
                                                            )}
                                                            {config.fabric.backrest_code && (
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-sm">Back Rest/Cushion:</span>
                                                                    <span className="font-mono text-primary">{config.fabric.backrest_code}</span>
                                                                </div>
                                                            )}
                                                            {config.fabric.seat_code && (
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-sm">Seat:</span>
                                                                    <span className="font-mono text-primary">{config.fabric.seat_code}</span>
                                                                </div>
                                                            )}
                                                            {config.fabric.headrest_code && (
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-sm">Headrest:</span>
                                                                    <span className="font-mono text-primary">{config.fabric.headrest_code}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Legs */}
                                        <div>
                                            <h4 className="font-semibold text-lg mb-3 text-primary">LEGS</h4>
                                            <div className="p-4 bg-muted/50 rounded-lg">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Leg Model</p>
                                                    <p className="font-semibold">{safe(config.legs?.type)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Accessories */}
                                        {config.accessories && config.accessories.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-lg mb-3 text-primary">ACCESSORIES</h4>
                                                <div className="p-4 bg-muted/50 rounded-lg">
                                                    <ul className="space-y-2">
                                                        {config.accessories.map((accessory: any, idx: number) => (
                                                            <li key={idx} className="text-sm">
                                                                • {safe(accessory.name || accessory)}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}

                                        {/* Wireframe Note */}
                                        {config.wireframe_image && (
                                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                <p className="text-sm text-blue-800">
                                                    <strong>Note:</strong> Wireframe diagram available for reference
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </CardContent>
        </Card>
    );
}
