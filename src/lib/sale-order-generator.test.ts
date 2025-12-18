
import { describe, it, expect, vi } from 'vitest';
import { generateSaleOrderData } from './sale-order-generator';
import { Configuration } from './schemas/configuration';
import { PricingBreakdown } from './schemas/pricing';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

vi.mock('@/lib/job-card-generator', () => ({
    generateJobCardData: vi.fn().mockResolvedValue({}),
}));

describe('generateSaleOrderData Validation', () => {
    const validOrder = { id: 'order-123', order_number: '123' };
    const validOrderItem = { product_id: 'prod-1', product_category: 'sofa' };

    // Minimal valid objects based on schemas
    const validConfig: Configuration = {
        dimensions: { seatDepth: 22, seatWidth: 22, seatHeight: 18 },
    };

    const validPricing: PricingBreakdown = {
        basePrice: 1000,
        baseSeatPrice: 0,
        additionalSeatsPrice: 0,
        cornerSeatsPrice: 0,
        backrestSeatsPrice: 0,
        loungerPrice: 0,
        consolePrice: 0,
        pillowsPrice: 0,
        fabricCharges: 0,
        fabricMeters: 0,
        foamUpgrade: 0,
        dimensionUpgrade: 0,
        accessoriesPrice: 0,
        mechanismUpgrade: 0,
        storagePrice: 0,
        armrestUpgrade: 0,
        stitchTypePrice: 0,
        discountAmount: 0,
        subtotal: 1000,
        total: 1000,
    };

    it('should throw error if configuration is invalid', async () => {
        // Pass null which violates z.object
        const invalidConfig = null as unknown as Configuration;

        await expect(generateSaleOrderData(validOrder, validOrderItem, invalidConfig, validPricing))
            .rejects.toThrow("Invalid configuration or pricing data");
    });

    it('should throw error if pricing breakdown is invalid', async () => {
        // Pass a string instead of object
        const invalidPricing = "invalid" as unknown as PricingBreakdown;

        await expect(generateSaleOrderData(validOrder, validOrderItem, validConfig, invalidPricing))
            .rejects.toThrow("Invalid configuration or pricing data");
    });
});
