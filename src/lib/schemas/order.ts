import { z } from "zod";
import { ConfigurationSchema } from "./configuration";

export const OrderMetadataSchema = z.object({
    discount_code: z.string().optional().nullable(),
    auto_generated: z.boolean().optional(),
});

export const CartItemSchema = z.object({
    id: z.string(),
    order_number: z.string(),
    product_id: z.string(),
    product_type: z.string(),
    configuration: ConfigurationSchema,
    quantity: z.number().optional().default(1),
    calculated_price: z.number(),
});

export type OrderMetadata = z.infer<typeof OrderMetadataSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
