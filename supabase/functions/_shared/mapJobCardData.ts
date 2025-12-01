
import { JobCardTemplateData } from "./premiumJobCardTemplate.ts";
import { format } from "https://esm.sh/date-fns@2.30.0";

export function mapJobCardData(jobCard: any, saleOrder: any): JobCardTemplateData {
    const specs = jobCard.technical_specifications || {};

    // Helper to format dimensions
    const formatDim = (val: any) => val ? `${val}"` : "-";

    const mappedSpecs = [];

    // 1. General Info
    mappedSpecs.push({
        category: "General Information",
        items: [
            { label: "Product Type", value: specs.product_type || jobCard.product_category || "-" },
            { label: "Sofa Type", value: specs.sofa_type || "-" },
            { label: "Configuration", value: specs.configuration_summary || "-" },
        ]
    });

    // 2. Dimensions
    if (specs.dimensions) {
        mappedSpecs.push({
            category: "Dimensions (Inches)",
            items: [
                { label: "Overall Length", value: formatDim(specs.dimensions.length) },
                { label: "Overall Depth", value: formatDim(specs.dimensions.depth) },
                { label: "Overall Height", value: formatDim(specs.dimensions.height) },
                { label: "Seat Height", value: formatDim(specs.dimensions.seat_height) },
                { label: "Seat Depth", value: formatDim(specs.dimensions.seat_depth) },
                { label: "Arm Height", value: formatDim(specs.dimensions.arm_height) },
            ]
        });
    }

    // 3. Fabric & Upholstery
    if (specs.fabric) {
        mappedSpecs.push({
            category: "Fabric & Upholstery",
            items: [
                { label: "Fabric Name", value: specs.fabric.name || "-" },
                { label: "Color/Code", value: specs.fabric.color || "-" },
                { label: "Supplier", value: specs.fabric.supplier || "-" },
                { label: "Direction", value: specs.fabric.direction || "Standard" },
                { label: "Piping/Welting", value: specs.fabric.piping || "None" },
            ]
        });
    }

    // 4. Structure & Legs
    const structureItems = [];
    if (specs.structure) {
        structureItems.push({ label: "Frame Material", value: specs.structure.material || "Solid Wood + Plywood" });
    }
    if (specs.legs) {
        structureItems.push({ label: "Leg Type", value: specs.legs.type || "-" });
        structureItems.push({ label: "Leg Finish", value: specs.legs.finish || "-" });
        structureItems.push({ label: "Leg Height", value: formatDim(specs.legs.height) });
    }
    if (structureItems.length > 0) {
        mappedSpecs.push({
            category: "Structure & Legs",
            items: structureItems
        });
    }

    // 5. Foam & Comfort
    if (specs.foam) {
        mappedSpecs.push({
            category: "Foam & Comfort",
            items: [
                { label: "Seat Foam", value: specs.foam.seat || "Standard High Density" },
                { label: "Back Foam", value: specs.foam.back || "Soft PU Foam" },
                { label: "Firmness", value: specs.foam.firmness || "Medium" },
            ]
        });
    }

    // 6. Accessories & Features
    if (specs.accessories && specs.accessories.length > 0) {
        mappedSpecs.push({
            category: "Accessories & Features",
            items: specs.accessories.map((acc: any) => ({
                label: acc.name || "Accessory",
                value: acc.description || "Included"
            }))
        });
    }

    // 7. Special Instructions / Notes
    if (specs.notes) {
        mappedSpecs.push({
            category: "Special Instructions",
            items: [
                { label: "Notes", value: specs.notes }
            ]
        });
    }

    return {
        jobCardNumber: jobCard.job_card_number,
        soNumber: saleOrder.order_number || saleOrder.so_number || "-",
        soDate: saleOrder.created_at ? format(new Date(saleOrder.created_at), "dd-MMM-yyyy") : "-",
        jcIssueDate: format(new Date(), "dd-MMM-yyyy"),
        deliveryDate: saleOrder.order?.expected_delivery_date ? format(new Date(saleOrder.order.expected_delivery_date), "dd-MMM-yyyy") : "-",
        productTitle: jobCard.product_title,
        productCategory: jobCard.product_category,
        model: jobCard.product_title,
        specs: mappedSpecs
    };
}
