# Data Contracts & Schemas

This document defines the strict data contracts used throughout the Estre Configurator application. We use [Zod](https://zod.dev/) for runtime validation and TypeScript type inference to ensure data integrity across the application, especially for critical payloads like product configuration, pricing, and order metadata.

## Overview

Core schemas are located in `src/lib/schemas/`:
- `configuration.ts`: Validates product configuration JSON (e.g., Sofa, Bed, Recliner specs).
- `pricing.ts`: Validates the pricing breakdown calculated by the dynamic pricing engine.
- `order.ts`: Validates order metadata and cart items.

## Usage

### 1. Validating Product Configuration

When processing a configuration object (e.g., from the database or API), validated it using `ConfigurationSchema`.

```typescript
import { ConfigurationSchema, Configuration } from "@/lib/schemas/configuration";

const rawConfig = { ... }; // JSON data

// Parse and validate (throws error if invalid)
const config: Configuration = ConfigurationSchema.parse(rawConfig);

// Safe parse (returns result object)
const result = ConfigurationSchema.safeParse(rawConfig);
if (!result.success) {
  console.error(result.error);
} else {
  const safeConfig = result.data;
}
```

### 2. Pricing Breakdown

The `PricingBreakdown` type is now inferred from the Zod schema, ensuring consistency between the calculation logic and the consuming components.

```typescript
import { PricingBreakdown } from "@/lib/schemas/pricing";

const breakdown: PricingBreakdown = {
  basePrice: 10000,
  fabricCharges: 500,
  // ... all required fields
};
```

### 3. Order Processing

In `Checkout.tsx` and `sale-order-generator.ts`, we explicitly cast and validate configuration data before persisting it or generating PDFs.

```typescript
// Example from Checkout.tsx
const configuration = item.configuration as unknown as Configuration;
// Ideally run .parse() if strict validation is desired at runtime
```

## Schema Definitions

### Configuration Schema (`src/lib/schemas/configuration.ts`)

A comprehensive schema covering all product categories. Key sections include:
- `dimensions`: { width, depth, height, etc. }
- `fabric`: { collectionId, variantId, etc. }
- `sections`: Record<string, Section> (for modular sofas)
- `console`: { required, quantity, size, etc. }
- `legs`, `pillows`, `accessories`

### Order Metadata (`src/lib/schemas/order.ts`)

Defines structure for:
- `OrderMetadata`: { special_instructions, discount_code, etc. }
- `CartItem`: Structure of items in the cart, including nested `configuration`.

## Extending Schemas

When adding new product features or configuration options:
1. Update `src/lib/schemas/configuration.ts` to include the new fields.
2. Mark new fields as `optional()` unless they are mandatory for all products.
3. Update `src/lib/dynamic-pricing.ts` and `sale-order-generator.ts` to utilize the new typed fields.
