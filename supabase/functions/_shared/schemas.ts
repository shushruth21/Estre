
import { z } from "https://esm.sh/zod@3.22.4";

// ==========================================
// CONFIGURATION SCHEMAS (Duplicated from src/lib/schemas/configuration.ts)
// ==========================================

export const DimensionsSchema = z.object({
    seatDepth: z.number().or(z.string()).optional(),
    seatWidth: z.number().or(z.string()).optional(),
    seatHeight: z.number().or(z.string()).optional(),
    width: z.number().or(z.string()).optional(), // Bed width
    length: z.number().or(z.string()).optional(), // Bed length
});

export const SectionSchema = z.object({
    seater: z.string().optional(),
    qty: z.number().optional(),
    type: z.string().optional(), // Recliner section type
});

export const ConsolePlacementSchema = z.object({
    section: z.string().optional(),
    position: z.string().optional(),
    accessoryId: z.number().or(z.string()).optional().nullable(),
});

export const ConsoleSchema = z.object({
    required: z.boolean().or(z.string()).optional(), // "Yes" or true
    size: z.string().optional(),
    quantity: z.number().optional(),
    placements: z.array(ConsolePlacementSchema).optional(),
});

export const LoungerSchema = z.object({
    required: z.boolean().or(z.string()).optional(),
    size: z.string().optional(),
    placement: z.string().optional(),
    position: z.string().optional(), // Alias for placement
    storage: z.string().optional(),
    quantity: z.number().or(z.string()).optional(), // Sometimes "2 Nos."
    numberOfLoungers: z.string().or(z.number()).optional(), // Alias
});

export const PillowSchema = z.object({
    required: z.boolean().or(z.string()).optional(),
    type: z.string().optional(),
    size: z.string().optional(),
    quantity: z.number().optional(),
    fabricPlan: z.string().optional(),
    fabricColour: z.string().optional(),
    fabricColour1: z.string().optional(),
    fabricColour2: z.string().optional(),
});

export const FabricSchema = z.object({
    claddingPlan: z.string().optional(),
    structureCode: z.string().optional(),
    backrestCode: z.string().optional(),
    seatCode: z.string().optional(),
    headrestCode: z.string().optional(),
    extraFabricCharges: z.number().or(z.string()).optional(),
});

export const ConfigurationSchema = z.object({
    productTitle: z.string().optional(),
    model: z.string().optional(),
    shape: z.string().optional(),
    baseShape: z.string().optional(), // Alias

    // Dimensions
    dimensions: DimensionsSchema.optional(),

    // Sections (Dynamic Record)
    sections: z.record(SectionSchema).optional(),

    // Modules
    console: ConsoleSchema.optional(),
    lounger: LoungerSchema.optional(),
    additionalPillows: PillowSchema.optional(),
    pillows: PillowSchema.optional(), // Alias

    // Fabric
    fabric: FabricSchema.optional(),
    fabricPlan: z.any().optional(), // Armchain/Dining might have different structure

    // Options
    foam: z.object({ type: z.string().optional() }).optional(),
    legs: z.object({ type: z.string().optional() }).optional(),
    armrest: z.object({ type: z.string().optional() }).optional(),
    wood: z.object({ type: z.string().optional() }).optional(),
    stitch: z.object({ type: z.string().optional() }).optional(),

    // Images
    previewImage: z.string().optional(),
    wireframeImage: z.string().optional(),

    // Bed Specifics
    bedSize: z.string().optional(),

    // Misc
    seatingCapacity: z.number().or(z.string()).optional(),
    qty: z.number().optional(),

    // Recliner
    basic_recliner: z.object({
        sections: z.record(SectionSchema).optional()
    }).optional(),

    // Specific Options
    l1Option: z.string().optional(),
    r1Option: z.string().optional(),
    c1Option: z.string().optional(),
    l1: z.string().optional(),
    r1: z.string().optional(),
    c1: z.string().optional(),
    frontSeatCount: z.number().or(z.string()).optional(),
    frontSeats: z.number().or(z.string()).optional(),
    l2SeatCount: z.number().or(z.string()).optional(),
    l2: z.number().or(z.string()).optional(),
    r2SeatCount: z.number().or(z.string()).optional(),
    r2: z.number().or(z.string()).optional(),
    c2SeatCount: z.number().or(z.string()).optional(),
    c2: z.number().or(z.string()).optional(),

    // Cinema
    seats: z.array(z.any()).optional(),
    seaterType: z.number().or(z.string()).optional(),
    numberOfSeats: z.number().optional(),
    consoleSize: z.string().optional(),

    // Base Model (Armchair/Dining)
    baseModel: z.any().optional(),
});

// ==========================================
// PRICING SCHEMAS (Duplicated from src/lib/schemas/pricing.ts)
// ==========================================

export const PricingBreakdownSchema = z.object({
    basePrice: z.number().default(0),
    baseSeatPrice: z.number().default(0),
    additionalSeatsPrice: z.number().default(0),
    cornerSeatsPrice: z.number().default(0),
    backrestSeatsPrice: z.number().default(0),
    loungerPrice: z.number().default(0),
    consolePrice: z.number().default(0),
    pillowsPrice: z.number().default(0),
    fabricCharges: z.number().default(0),
    fabricMeters: z.number().optional().default(0),
    foamUpgrade: z.number().default(0),
    dimensionUpgrade: z.number().default(0),
    accessoriesPrice: z.number().default(0),
    mechanismUpgrade: z.number().default(0),
    storagePrice: z.number().default(0),
    armrestUpgrade: z.number().default(0),
    stitchTypePrice: z.number().default(0),
    discountAmount: z.number().default(0),
    subtotal: z.number().default(0),
    total: z.number().default(0),
});

// ==========================================
// ORDER SCHEMA (Duplicated from src/lib/schemas/order.ts)
// ==========================================

export const OrderMetadataSchema = z.object({
    discount_code: z.string().optional().nullable(),
    auto_generated: z.boolean().optional(),
});
