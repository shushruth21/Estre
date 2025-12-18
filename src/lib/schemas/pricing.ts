import { z } from "zod";

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

export type PricingBreakdown = z.infer<typeof PricingBreakdownSchema>;
