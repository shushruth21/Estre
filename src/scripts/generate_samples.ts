
import fs from 'fs';
import path from 'path';
import { mapSaleOrderData, generatePremiumSaleOrderHTML } from '../lib/sale-order-pdf';
import { mapJobCardData, generatePremiumJobCardHTML } from '../lib/job-card-pdf';

const OUTPUT_DIR = path.join(process.cwd(), 'src/scripts/output');
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// --- MOCK DATA GENERATORS ---

const generateBaseOrder = (id: number, suffix: string) => ({
    id: `order-${id}`,
    // order_number is usually numeric or string in DB, mapper expects it in saleOrder or order
    order_number: `ORD-${2025000 + id}`,
    created_at: new Date().toISOString(),
    expected_delivery_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    customer_name: `Customer ${suffix}`,
    customer_email: `customer${id}@example.com`,
    customer_phone: `+91 98765 4321${id}`,
    delivery_address: {
        street: `${id * 12} Palm Grove Road`,
        line2: "Koramangala 4th Block",
        city: "Bengaluru",
        pincode: "560034",
        state: "Karnataka",
        landmark: "Near Wipro Park"
    },
    billing_address: {
        street: `${id * 12} Palm Grove Road`,
        line2: "Koramangala 4th Block",
        city: "Bengaluru",
        pincode: "560034",
        state: "Karnataka"
    },
    logistics_partner: "Safe Express",
    buyer_gst: "29ABCDE1234F2Z5",
    status: "confirmed"
});

const generateSaleOrder = (id: number, order: any, items: any[], totals: any) => ({
    id: `so-${id}`,
    order_number: `SO-${2025000 + id}`,
    created_at: new Date().toISOString(),
    base_price: totals.base,
    discount: totals.discount,
    final_price: totals.final,
    status: "confirmed",
    order: {
        ...order,
        order_items: items
    }
});

const generateJobCard = (id: number, soId: string, item: any, specs: any) => ({
    id: `jc-${id}`,
    job_card_number: `JC-${2025000 + id}`,
    sale_order_id: soId,
    product_title: item.product_title,
    product_category: item.product_category,
    technical_specifications: specs,
    created_at: new Date().toISOString(),
    status: "pending"
});

// --- SCENARIO DEFINITIONS ---

const scenarios = [
    {
        name: "Standard 3-Seater Sofa",
        item: {
            product_title: "Cloud 3-Seater",
            product_category: "SOFA",
            product_name: "Cloud 3-Seater",
            total_price_rs: 85000,
            configuration: {
                seating: "3-Seater",
                fabric: "Velvet - Royal Blue",
                legs: "Wooden - Oak Finish",
                dimensions: { width: 84, depth: 36, height: 32 }
            }
        },
        specs: {
            product_type: "Sofa",
            sofa_type: "Standard",
            configuration_summary: "3-Seater",
            dimensions: { length: 84, depth: 36, height: 32, seat_height: 18, seat_depth: 22, arm_height: 24 },
            fabric: { name: "Velvet", color: "Royal Blue", supplier: "D'Decor", direction: "Standard" },
            structure: { material: "Solid Wood" },
            legs: { type: "Tapered", finish: "Oak", height: 6 },
            foam: { seat: "HD 40", back: "Soft PU", firmness: "Medium" }
        },
        totals: { base: 85000, discount: 5000, final: 80000 }
    },
    {
        name: "L-Shaped Sectional",
        item: {
            product_title: "Haven Sectional",
            product_category: "SOFA",
            product_name: "Haven Sectional",
            total_price_rs: 145000,
            configuration: {
                shape: "L-Shape (Left Aligned)",
                seating: { "Left": "3-Seater", "Right": "Chaise" },
                fabric: {
                    structure: "Linen - Beige",
                    seat: "Linen - Beige",
                    backrest: "Chenille - Terracotta" // Dual colour
                },
                legs: "Metal - Matte Black"
            }
        },
        specs: {
            product_type: "Sofa",
            sofa_type: "L-Shape",
            configuration_summary: "3-Seater Left + Chaise Right",
            dimensions: { length: 110, depth: 65, height: 34, seat_height: 18, seat_depth: 24, arm_height: 25 },
            fabric: { name: "Linen/Chenille Combo", color: "Beige/Terracotta", supplier: "Pure", direction: "Railroaded" },
            structure: { material: "Plywood + Pine" },
            legs: { type: "Metal Pin", finish: "Matte Black", height: 5 },
            foam: { seat: "Feather Blend", back: "Microfiber", firmness: "Soft" }
        },
        totals: { base: 145000, discount: 10000, final: 135000 }
    },
    {
        name: "U-Shaped Sectional",
        item: {
            product_title: "Grand U-Shape",
            product_category: "SOFA",
            product_name: "Grand U-Shape",
            total_price_rs: 220000,
            configuration: {
                shape: "U-Shape",
                seating: "8-Seater",
                loungers: [{ size: "Large", position: "Left" }, { size: "Large", position: "Right" }],
                fabric: "Suede - Grey",
                pillows: [{ quantity: 4, type: "Square", size: "20x20 in", fabric: "Patterned" }]
            }
        },
        specs: {
            product_type: "Sofa",
            sofa_type: "U-Shape",
            configuration_summary: "U-Shape with Dual Loungers",
            dimensions: { length: 140, depth: 70, height: 34, seat_height: 17, seat_depth: 23, arm_height: 24 },
            fabric: { name: "Suede", color: "Grey", supplier: "Sarom", direction: "Standard" },
            structure: { material: "Hardwood" },
            legs: { type: "Block", finish: "Walnut", height: 2 },
            foam: { seat: "HR 50", back: "Soft Fill", firmness: "Medium-Firm" },
            accessories: [{ name: "Scatter Pillows", description: "4 Nos, Patterned Fabric" }]
        },
        totals: { base: 220000, discount: 0, final: 220000 }
    },
    {
        name: "Recliner Sofa",
        item: {
            product_title: "Cinema Comfort Recliner",
            product_category: "RECLINER",
            product_name: "Cinema Comfort Recliner",
            total_price_rs: 180000,
            configuration: {
                seating: "3-Seater",
                features: ["Electric Recline", "Cup Holders", "USB Charging"],
                fabric: "Leatherette - Black",
                consoles: [{ size: "Standard", position: "Between Seats" }]
            }
        },
        specs: {
            product_type: "Recliner",
            sofa_type: "Linear",
            configuration_summary: "3-Seater (Electric) + 2 Consoles",
            dimensions: { length: 115, depth: 38, height: 40, seat_height: 19, seat_depth: 21, arm_height: 26 },
            fabric: { name: "Premium Leatherette", color: "Jet Black", supplier: "Stanley", direction: "Standard" },
            structure: { material: "Metal Mechanism + Wood" },
            legs: { type: "Hidden", finish: "-", height: 1 },
            foam: { seat: "Recliner Foam", back: "Polyfill", firmness: "Plush" },
            accessories: [{ name: "Motor", description: "Okin Motor" }, { name: "Console", description: "With Cup Holders" }]
        },
        totals: { base: 180000, discount: 5000, final: 175000 }
    },
    {
        name: "Sofa Bed",
        item: {
            product_title: "Snooze Sofa Bed",
            product_category: "SOFABED",
            product_name: "Snooze Sofa Bed",
            total_price_rs: 65000,
            configuration: {
                size: "Queen",
                mechanism: "Pull-out",
                fabric: "Woven - Teal",
                mattress: "Memory Foam"
            }
        },
        specs: {
            product_type: "Sofa Bed",
            sofa_type: "Pull-out",
            configuration_summary: "3-Seater converts to Queen Bed",
            dimensions: { length: 72, depth: 36, height: 34, seat_height: 18, seat_depth: 22, arm_height: 24 },
            fabric: { name: "Woven Texture", color: "Teal", supplier: "Atmosphere", direction: "Standard" },
            structure: { material: "Metal Frame" },
            legs: { type: "Casters/Feet", finish: "Chrome", height: 3 },
            foam: { seat: "Memory Foam Mattress", back: "Soft Foam", firmness: "Medium" }
        },
        totals: { base: 65000, discount: 0, final: 65000 }
    },
    {
        name: "Dining Chairs",
        item: {
            product_title: "Elegance Dining Chair",
            product_category: "DINING_CHAIR",
            product_name: "Elegance Dining Chair",
            total_price_rs: 72000, // 12k * 6
            quantity: 6,
            configuration: {
                wood: "Teak",
                fabric: "Jacquard - Cream",
                style: "High Back"
            }
        },
        specs: {
            product_type: "Dining Chair",
            sofa_type: "-",
            configuration_summary: "Set of 6, High Back",
            dimensions: { length: 20, depth: 22, height: 42, seat_height: 19, seat_depth: 18, arm_height: 0 },
            fabric: { name: "Jacquard", color: "Cream", supplier: "D'Decor", direction: "Standard" },
            structure: { material: "Solid Teak Wood" },
            legs: { type: "Integrated", finish: "Natural Teak", height: 16 },
            foam: { seat: "Firm", back: "Medium", firmness: "Firm" },
            wood: "Teak Wood" // Custom field for dining
        },
        totals: { base: 72000, discount: 2000, final: 70000 }
    },
    {
        name: "Arm Chair",
        item: {
            product_title: "Wingback Accent Chair",
            product_category: "ARM_CHAIR",
            product_name: "Wingback Accent Chair",
            total_price_rs: 35000,
            configuration: {
                style: "Wingback",
                fabric: "Printed Cotton - Floral",
                legs: "Cabriole - Mahogany"
            }
        },
        specs: {
            product_type: "Arm Chair",
            sofa_type: "Wingback",
            configuration_summary: "Single Seater",
            dimensions: { length: 32, depth: 34, height: 44, seat_height: 18, seat_depth: 21, arm_height: 25 },
            fabric: { name: "Cotton Print", color: "Floral / Multi", supplier: "FabIndia (Sourced)", direction: "Standard" },
            structure: { material: "Hardwood" },
            legs: { type: "Cabriole", finish: "Mahogany Stain", height: 8 },
            foam: { seat: "Moulded", back: "Soft", firmness: "Medium" }
        },
        totals: { base: 35000, discount: 0, final: 35000 }
    },
    {
        name: "Pouffe",
        item: {
            product_title: "Round Tufted Pouffe",
            product_category: "POUFFE",
            product_name: "Round Tufted Pouffe",
            total_price_rs: 12000,
            configuration: {
                shape: "Round",
                size: "24 inch dia",
                fabric: "Velvet - Mustard"
            }
        },
        specs: {
            product_type: "Pouffe",
            sofa_type: "Ottoman",
            configuration_summary: "Round, Button Tufted",
            dimensions: { length: 24, depth: 24, height: 16, seat_height: 16, seat_depth: 0, arm_height: 0 },
            fabric: { name: "Velvet", color: "Mustard Yellow", supplier: "D'Decor", direction: "Standard" },
            structure: { material: "Plywood" },
            legs: { type: "Glides", finish: "-", height: 0.5 },
            foam: { seat: "Block Foam", back: "-", firmness: "Firm" }
        },
        totals: { base: 12000, discount: 0, final: 12000 }
    },
    {
        name: "Kids Bed",
        item: {
            product_title: "Dreamer Kids Bed",
            product_category: "KIDS_BED",
            product_name: "Dreamer Kids Bed",
            total_price_rs: 45000,
            configuration: {
                size: "Single",
                storage: "Hydraulic",
                headboard: "Upholstered - Car Shape",
                fabric: "Canvas - Blue"
            }
        },
        specs: {
            product_type: "Bed",
            sofa_type: "-",
            configuration_summary: "Single Bed with Storage",
            dimensions: { length: 78, depth: 36, height: 40, seat_height: 12, seat_depth: 0, arm_height: 0 },
            fabric: { name: "Canvas", color: "Blue", supplier: "Local", direction: "Standard" },
            structure: { material: "Plywood + Laminate" },
            legs: { type: "-", finish: "-", height: 0 },
            foam: { seat: "-", back: "Soft Padding", firmness: "-" },
            notes: "Car shaped headboard cutout"
        },
        totals: { base: 45000, discount: 5000, final: 40000 }
    },
    {
        name: "Cinema Chairs",
        item: {
            product_title: "VIP Cinema Row",
            product_category: "CINEMA_CHAIRS",
            product_name: "VIP Cinema Row",
            total_price_rs: 300000,
            configuration: {
                layout: "Row of 4",
                mechanism: "Motorized Recline",
                extras: ["Tray Tables", "Led Lighting"],
                fabric: "Composite Leather - Red"
            }
        },
        specs: {
            product_type: "Cinema Chair",
            sofa_type: "Row Seating",
            configuration_summary: "Row of 4 (Curved)",
            dimensions: { length: 140, depth: 40, height: 42, seat_height: 18, seat_depth: 22, arm_height: 26 },
            fabric: { name: "Composite Leather", color: "Red", supplier: "Imported", direction: "Standard" },
            structure: { material: "Steel + Wood" },
            legs: { type: "Base Plate", finish: "Black", height: 0 },
            foam: { seat: "Cinema Grade", back: "Contoured", firmness: "Firm" },
            accessories: [{ name: "Tray Table", description: "Swivel" }, { name: "LED", description: "Blue Underlighting" }]
        },
        totals: { base: 300000, discount: 15000, final: 285000 }
    },
];

// --- EXECUTION ---

console.log(`Generating samples in ${OUTPUT_DIR}...`);

scenarios.forEach((scenario, index) => {
    const id = index + 1;
    const orderRaw = generateBaseOrder(id, scenario.name);
    const saleOrder = generateSaleOrder(id, orderRaw, [scenario.item], scenario.totals);
    const jobCard = generateJobCard(id, saleOrder.id, scenario.item, scenario.specs);

    // Generate JSON
    const jsonData = {
        scenario: scenario.name,
        saleOrder,
        jobCard
    };

    fs.writeFileSync(
        path.join(OUTPUT_DIR, `scenario_${id}_data.json`),
        JSON.stringify(jsonData, null, 2)
    );

    // Generate HTML
    try {
        const soData = mapSaleOrderData(saleOrder);
        const soHtml = generatePremiumSaleOrderHTML(soData);
        fs.writeFileSync(
            path.join(OUTPUT_DIR, `scenario_${id}_sale_order.html`),
            soHtml
        );

        const jcData = mapJobCardData(jobCard, saleOrder);
        const jcHtml = generatePremiumJobCardHTML(jcData);
        fs.writeFileSync(
            path.join(OUTPUT_DIR, `scenario_${id}_job_card.html`),
            jcHtml
        );

        console.log(`✅ [${id}/${scenarios.length}] Generated ${scenario.name}`);
    } catch (e) {
        console.error(`❌ [${id}/${scenarios.length}] Failed ${scenario.name}:`, e);
    }
});

console.log("Done!");
