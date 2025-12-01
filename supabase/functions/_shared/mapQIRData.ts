/**
 * Map Job Card Data to QIR Template Format
 * 
 * Converts job card and technical specifications into the format required by the QIR template
 */

import type { QIRTemplateData } from './premiumQIRTemplate.ts';

export function mapJobCardToQIR(
    jobCard: any,
    saleOrder: any,
    qirNumber: string
): QIRTemplateData {
    const specs = jobCard.technical_specifications || {};
    const config = jobCard.configuration || {};

    // Format dates
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const soDate = formatDate(saleOrder.created_at);
    const jcDate = formatDate(jobCard.created_at);
    const qirDate = formatDate(new Date().toISOString());

    // Calculate delivery date (30 days from SO date)
    const deliveryDateObj = new Date(saleOrder.created_at);
    deliveryDateObj.setDate(deliveryDateObj.getDate() + 30);
    const deliveryDate = formatDate(deliveryDateObj.toISOString());

    // Extract seating configuration
    const sections = specs.sections || [];

    // Extract console info
    const console = specs.console || { required: false };

    // Extract lounger info
    const lounger = specs.lounger || { required: false };

    // Extract dimensions
    const dimensions = {
        seatDepth: specs.dimensions?.seatDepth || config.depth || 26,
        seatWidth: specs.dimensions?.seatWidth || config.seatWidth || 30,
        seatHeight: specs.dimensions?.seatHeight || config.seatHeight || 18,
        frontWidth: specs.dimensions?.totalWidth || config.approximateWidth || 0,
        leftWidth: specs.dimensions?.leftWidth || 0,
        rightWidth: specs.dimensions?.rightWidth || 0
    };

    // Extract fabric plan
    const fabricPlan = specs.fabricPlan || {
        planType: config.fabric?.planType || 'Single Colour',
        fabricCodes: config.fabric?.fabricCodes || {}
    };

    // Extract accessories
    const accessories = (specs.accessories || config.accessories || []).map((acc: any) => ({
        name: acc.name || acc.code || 'Unknown Accessory',
        quantity: acc.quantity || 1
    }));

    return {
        qir_number: qirNumber,
        so_number: saleOrder.order_number || `SO-${saleOrder.id.slice(0, 8)}`,
        jc_number: jobCard.job_card_number || `JC-${jobCard.id.slice(0, 8)}`,
        so_date: soDate,
        jc_date: jcDate,
        qir_date: qirDate,
        job_given_to: 'Production Team',
        delivery_date: deliveryDate,

        // Product Description
        product_type: specs.product_type || jobCard.product_category || 'Sofa',
        model_name: specs.model_name || jobCard.product_title || 'Unknown Model',
        sofa_type: specs.sofa_type || config.type || 'Standard',

        // Seating
        sections: sections,

        // Consoles
        console: console.required ? console : undefined,

        // Loungers
        lounger: lounger.required ? lounger : undefined,

        // Frame
        wood_type: specs.attributes?.wood_type || config.wood_type || 'Pine (Default)',

        // Dimensions
        dimensions: dimensions,

        // Armrest
        armrest_type: specs.attributes?.armrest_type || config.armrest_type || 'Default',
        armrest_width: specs.attributes?.armrest_width || config.armrest_width,

        // Stitching
        stitch_type: specs.attributes?.stitch_type || config.stitch_type || 'Felled Seam / Double Stitched Seam',

        // Fabric
        fabric_plan: fabricPlan,

        // Legs
        legs: specs.attributes?.legs || config.legs || 'Standard',

        // Accessories
        accessories: accessories
    };
}
