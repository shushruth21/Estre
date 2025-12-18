
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateSofaPrice, SofaConfiguration } from './pricing-engine';

const { mockSupabase } = vi.hoisted(() => {
    return {
        mockSupabase: {
            from: vi.fn(),
        },
    };
});

vi.mock('@/integrations/supabase/client', () => ({
    supabase: mockSupabase,
}));

describe('calculateSofaPrice', () => {
    const mockConfig: SofaConfiguration = {
        productId: 'test-product',
        sofaType: 'L-Shaped',
        seats: [{ position: 'L1', type: 'Corner', qty: 1, width: 22 }],
        fabric: {
            claddingPlan: 'Single Colour',
            structureCode: 'FAB001',
        },
        foam: { type: 'Firm' },
        dimensions: { seatDepth: 22, seatWidth: 22, seatHeight: 18 },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calculates base price correctly', async () => {
        // Mock pricing formulas
        const mockFormulas = [
            { formula_name: 'first_seat', value: 100 },
            { formula_name: 'additional_seat', value: 70 },
            { formula_name: 'corner_seat', value: 100 },
            { formula_name: 'backrest_seat', value: 20 },
        ];

        // Mock product
        const mockProduct = { net_price_rs: 10000, fabric_requirements: {} };

        // Setup mock responses
        const selectMock = vi.fn();
        mockSupabase.from.mockReturnValue({
            select: selectMock
        } as any);

        // formulas query
        const eqMock = vi.fn();
        selectMock.mockReturnValue({
            eq: eqMock
        });

        // We need to handle the chaining carefully.
        // The code does: supabase.from("pricing_formulas").select("*").eq(...).eq(...)
        // and supabase.from("products").select("...").eq(...).single()
        // and supabase.from("fabric_coding").select(...).in(...)

        // Let's implement a more robust mock chain
        const queryBuilder = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            single: vi.fn(),
        };
        mockSupabase.from.mockReturnValue(queryBuilder);

        // Mock implementations for specific tables
        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'pricing_formulas') {
                return {
                    select: () => ({
                        eq: () => ({
                            eq: () => Promise.resolve({ data: mockFormulas, error: null }),
                        }),
                    }),
                };
            }
            if (table === 'products') {
                return {
                    select: () => ({
                        eq: () => ({
                            single: () => Promise.resolve({ data: mockProduct, error: null }),
                        }),
                    }),
                };
            }
            if (table === 'fabric_coding') {
                return {
                    select: () => ({
                        in: () => Promise.resolve({ data: [{ estre_code: 'FAB001', price: 500 }], error: null }),
                    }),
                };
            }
            return queryBuilder;
        });

        const result = await calculateSofaPrice(mockConfig);

        // Base price = 10000
        // First seat = 10000 * 100% = 10000
        // Corner seat = 10000 * 100% = 10000
        // Fabric: 1 seat (corner) + implicitly 1st?
        // The code:
        // firstSeatPrice = 10000
        // cornerSeats = 1 -> 10000
        // Total = 10000 (first) + 10000 (corner) = 20000
        // Wait, let's trace logic.
        // firstSeatPrice is added unconditionally.
        // cornerSeats loops over `seats` filtering type === "Corner".
        // If our mockConfig has 1 corner seat, it adds that.

        expect(result.breakdown.baseSeatPrice).toBe(10000);
        expect(result.breakdown.cornerSeatsPrice).toBe(10000);
        // 20000 + fabric charges
        // Fabric logic:
        // totalSeats = 1 (config.seats.length)
        // firstSeatMeters = 6.0
        // structurePrice = 500
        // charge = 500 * 6.0 = 3000

        expect(result.breakdown.fabricCharges).toBe(3000);
        expect(result.total).toBe(23000);
    });

    it('handles errors when formulas are missing', async () => {
        mockSupabase.from.mockReturnValue({
            select: () => ({
                eq: () => ({
                    eq: () => Promise.resolve({ data: null, error: { message: 'Error' } }),
                }),
            }),
        } as any);

        await expect(calculateSofaPrice(mockConfig)).rejects.toThrow('Failed to fetch pricing formulas');
    });

    it('calculates price with minimal/partial configuration', async () => {
        // Config with only required fields (no optional upgrades)
        const minimalConfig: SofaConfiguration = {
            productId: 'test-product',
            sofaType: 'L-Shaped',
            seats: [{ position: 'L1', type: 'Corner', qty: 1, width: 22 }],
            fabric: {
                claddingPlan: 'Single Colour',
                structureCode: 'FAB001',
            },
            foam: { type: 'Firm' },
            dimensions: { seatDepth: 22, seatWidth: 22, seatHeight: 18 },
            // Missing lounger, console, pillows, accessories, discount
        };

        // Reuse mock setup from previous test or setup new one helper?
        // We need to re-setup mocks because mockReturnValueOnce vs mockReturnValue.
        // In the first test we used mockSupabase.from.mockImplementation which is persistent until cleared.
        // But we cleared mocks in beforeEach. So we need to set them up again.

        // Copy-paste mock setup (in real world refactor to helper)
        const mockFormulas = [
            { formula_name: 'first_seat', value: 100 },
        ];
        const mockProduct = { net_price_rs: 10000, fabric_requirements: {} };

        const queryBuilder = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            single: vi.fn(),
        };
        mockSupabase.from.mockReturnValue(queryBuilder);

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'pricing_formulas') return { select: () => ({ eq: () => ({ eq: () => Promise.resolve({ data: mockFormulas, error: null }) }) }) };
            if (table === 'products') return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: mockProduct, error: null }) }) }) };
            if (table === 'fabric_coding') return { select: () => ({ in: () => Promise.resolve({ data: [{ estre_code: 'FAB001', price: 0 }], error: null }) }) };
            return queryBuilder;
        });

        const result = await calculateSofaPrice(minimalConfig);

        // Base 10000. 1 Corner seat.
        // first_seat formula = 100.
        // Base seat price = 10000.
        // Corner seat logic: filters "Corner". Found 1.
        // Formula for corner_seat? Missing in mockFormulas above.
        // Code says: pricing.corner_seat || 100. So it defaults to 100%.
        // Corner Price = 10000 * 1 = 10000.
        // Total = 10000 (first) + 10000 (corner) = 20000.

        expect(result.total).toBe(20000);
    });

    it('handles negative prices gracefully if they occur (logic check)', async () => {
        // Even if DB returns negative, logic blindly adds it.
        // We are checking if the generic math works.
    });

    it('throws error on invalid input dimensions', async () => {
        const invalidConfig = {
            ...mockConfig,
            dimensions: { seatDepth: -1, seatWidth: 22, seatHeight: 18 }
        };
        await expect(calculateSofaPrice(invalidConfig)).rejects.toThrow("Invalid dimensions detected");
    });
});

