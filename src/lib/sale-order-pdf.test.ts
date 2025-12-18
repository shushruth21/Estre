import { describe, it, expect } from 'vitest';
import { generatePremiumSaleOrderHTML, mapSaleOrderData, SaleOrderTemplateData } from './sale-order-pdf';

describe('Sale Order PDF Generation', () => {
    it('generates correct HTML snapshot', () => {
        const mockData: SaleOrderTemplateData = {
            orderNumber: "SO-20231218-001",
            orderDate: "18-Dec-2023",
            deliveryDate: "18-Jan-2024",
            customerName: "John Doe",
            customerEmail: "john@example.com",
            customerPhone: "1234567890",
            customerAddress: "123 Main St, Bangalore",
            shippingName: "John Doe",
            shippingAddress: "123 Main St, Bangalore",
            shippingPhone: "1234567890",
            shippingEmail: "john@example.com",
            finalPrice: 50000,
            basePrice: 50000,
            discount: 0,
            productsTableHTML: "<tr><td>1</td><td>Sofa</td><td>50000</td><td>50000</td></tr>",
            paymentTermsHTML: "50% Advance",
            dispatchThrough: "Safe Express",
            estreGst: "29AAMCE...",
            buyerGst: "29ABCDE...",
        };

        const html = generatePremiumSaleOrderHTML(mockData);
        expect(html).toMatchSnapshot();
    });

    it('maps sale order data correctly', () => {
        const mockSupabaseResponse = {
            id: "uuid-123",
            order_number: "SO-123",
            created_at: "2023-12-18T10:00:00Z",
            final_price: 50000,
            base_price: 50000,
            discount: 0,
            order: {
                customer_name: "John Doe",
                customer_email: "john@example.com",
                customer_phone: "123",
                expected_delivery_date: "2024-01-18T10:00:00Z",
                logistics_partner: "FedEx",
                buyer_gst: "GST123",
                delivery_address: {
                    street: "Street 1",
                    city: "Bangalore",
                    state: "KA",
                    pincode: "560001",
                },
                order_items: [
                    {
                        product_title: "Test Sofa",
                        product_category: "sofa",
                        total_price_rs: 50000,
                        configuration: JSON.stringify({ shape: "L-Shaped", seating: { L1: "Corner" } })
                    }
                ]
            }
        };

        const result = mapSaleOrderData(mockSupabaseResponse);

        expect(result.orderNumber).toBe("SO-123");
        expect(result.customerName).toBe("John Doe");
        expect(result.productsTableHTML).toContain("Test Sofa");
        expect(result.productsTableHTML).toContain("L-Shaped");
    });
});
