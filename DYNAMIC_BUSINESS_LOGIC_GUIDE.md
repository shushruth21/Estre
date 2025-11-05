# Dynamic Business Logic System - Implementation Guide

## Overview

The Dynamic Business Logic System eliminates hardcoded values from the application, making all business logic configurable through the database. This allows admins to update pricing, options, and rules without code changes.

## Key Features

### 1. ✅ Database-Driven Dropdown Options
All dropdown options are fetched from the `dropdown_options` table:
- Product types
- Sizes and dimensions
- Fabric types
- Foam options
- Any configurable option

### 2. ✅ Dynamic Pricing Formulas
All pricing calculations use the `pricing_formulas` table:
- Markup percentages
- Discount rates
- Additional costs (electric mechanism, storage, etc.)
- Wastage and delivery percentages

### 3. ✅ Admin Settings per Category
Each product category has its own settings table:
- `sofa_admin_settings`
- `recliner_admin_settings`
- `bed_admin_settings`
- etc.

Settings include fabric meter calculations, default values, and category-specific rules.

### 4. ✅ Automatic Price Calculation
The `calculateDynamicPrice()` function:
- Fetches current pricing formulas
- Loads admin settings
- Calculates fabric requirements dynamically
- Applies category-specific adjustments
- Returns final price

## Usage

### For Developers

#### 1. Using Dropdown Options Hook

```typescript
import { useDropdownOptions } from "@/hooks/useDropdownOptions";

// Fetch all options for a category and field
const { data: loungerSizes } = useDropdownOptions("sofa", "lounger_size");

// Use in component
<Select>
  <SelectContent>
    {loungerSizes?.map((option) => (
      <SelectItem key={option.id} value={option.option_value}>
        {option.display_label || option.option_value}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### 2. Using Pricing Formulas Hook

```typescript
import { usePricingFormulas, getFormulaValue } from "@/hooks/usePricingFormulas";

// Fetch all pricing formulas for a category
const { data: formulas } = usePricingFormulas("sofa");

// Get specific formula value
const markupPercent = getFormulaValue(formulas, "markup_percent", 270);
```

#### 3. Using Admin Settings Hook

```typescript
import { useAdminSettings, getSettingValue } from "@/hooks/useAdminSettings";

// Fetch all settings for a category
const { data: settings } = useAdminSettings("sofa");

// Get specific setting value
const firstSeatMeters = getSettingValue(settings, "fabric_first_seat_mtrs", 5.0);
```

#### 4. Dynamic Price Calculation

```typescript
import { calculateDynamicPrice } from "@/lib/dynamic-pricing";

// Calculate price for any category
const totalPrice = await calculateDynamicPrice(category, productId, configuration);
```

### For Admins

#### 1. Adding Dropdown Options

Insert into `dropdown_options` table:

```sql
INSERT INTO dropdown_options (
  category, 
  field_name, 
  option_value, 
  display_label, 
  sort_order, 
  is_active
) VALUES 
  ('sofa', 'lounger_size', '6ft', '6 Feet', 1, true),
  ('sofa', 'lounger_size', 'additional_6', 'Additional 6"', 2, true),
  ('sofa', 'console_size', '6', '6 Inch Console', 1, true),
  ('sofa', 'console_size', '10', '10 Inch Console', 2, true);
```

#### 2. Configuring Pricing Formulas

Insert into `pricing_formulas` table:

```sql
INSERT INTO pricing_formulas (
  category,
  formula_name,
  calculation_type,
  value,
  unit,
  description
) VALUES 
  ('sofa', 'markup_percent', 'percentage', 270, 'percent', 'Standard markup'),
  ('sofa', 'discount_percent', 'percentage', 10, 'percent', 'Default discount'),
  ('sofa', 'additional_seat_percent', 'percentage', 70, 'percent', 'Cost per additional seat'),
  ('sofa', 'corner_seat_percent', 'percentage', 80, 'percent', 'Corner seat cost');
```

#### 3. Setting Admin Configuration

Insert into category-specific settings tables:

```sql
-- Example for sofa_admin_settings
INSERT INTO sofa_admin_settings (
  category,
  setting_key,
  setting_value,
  description
) VALUES 
  ('fabric_calculations', 'fabric_first_seat_mtrs', '5.0', 'Fabric required for first seat'),
  ('fabric_calculations', 'fabric_additional_seat_mtrs', '3.0', 'Fabric for each additional seat'),
  ('fabric_calculations', 'fabric_corner_seat_mtrs', '4.0', 'Fabric for corner seat'),
  ('fabric_calculations', 'fabric_console_6_mtrs', '1.5', 'Fabric for 6" console'),
  ('fabric_calculations', 'fabric_console_10_mtrs', '2.0', 'Fabric for 10" console');
```

## Benefits

### ✅ Zero Code Changes for Business Rules
Change pricing, options, or calculations from the database without deploying code.

### ✅ Instant Updates
Changes reflect immediately across the application due to React Query caching (5-minute stale time).

### ✅ Category-Specific Logic
Each product category can have its own rules and formulas.

### ✅ Audit Trail
All changes are in the database with timestamps for tracking.

### ✅ Easy Testing
Test different pricing strategies by updating formulas without code deployment.

## Examples

### Example 1: Change Additional Seat Cost

**Before:** Hardcoded 70%
```typescript
// Old code
const additionalCost = basePrice * 0.70;
```

**After:** Database-driven
```sql
-- Just update the value in database
UPDATE pricing_formulas 
SET value = 80 
WHERE category = 'sofa' 
AND formula_name = 'additional_seat_percent';
```

No code change needed! Price updates instantly.

### Example 2: Add New Lounger Size

**Before:** Add to code, deploy
```typescript
// Old code - hardcoded options
<SelectItem value="6ft">6 Feet</SelectItem>
<SelectItem value="additional_6">Additional 6"</SelectItem>
```

**After:** Just add to database
```sql
INSERT INTO dropdown_options (
  category, field_name, option_value, display_label, sort_order
) VALUES 
  ('sofa', 'lounger_size', '8ft', '8 Feet Lounger', 3);
```

Option appears immediately in the UI!

### Example 3: Update Fabric Calculation

**Before:** Change code constant
```typescript
// Old code
const FIRST_SEAT_METERS = 5.0;
```

**After:** Update database
```sql
UPDATE sofa_admin_settings 
SET setting_value = '5.5' 
WHERE setting_key = 'fabric_first_seat_mtrs';
```

Calculations update immediately!

## Database Schema Reference

### dropdown_options
- `category`: Product category (sofa, recliner, bed, etc.)
- `field_name`: Field identifier (lounger_size, console_size, etc.)
- `option_value`: Actual value stored
- `display_label`: Human-readable label
- `sort_order`: Display order
- `is_active`: Enable/disable option

### pricing_formulas
- `category`: Product category
- `formula_name`: Formula identifier
- `calculation_type`: flat_rate, percentage, multiplier
- `value`: Numeric value
- `unit`: percent, rupees, multiplier
- `applies_to`: JSON field for specific conditions

### {category}_admin_settings
- `category`: Sub-category grouping
- `setting_key`: Setting identifier
- `setting_value`: JSON value (flexible type)
- `description`: Human-readable description

## Migration Path

To migrate existing configurators:

1. **Identify hardcoded values** in configurator components
2. **Create dropdown options** for any hardcoded select options
3. **Create pricing formulas** for any percentage/multiplier calculations
4. **Add admin settings** for fabric calculations and defaults
5. **Replace hardcoded values** with hook calls
6. **Test thoroughly** with real data
7. **Update documentation** for admins

## Maintenance

### Regular Tasks

1. **Review pricing formulas** quarterly
2. **Update dropdown options** as products evolve
3. **Monitor query performance** (uses 5-min cache)
4. **Audit admin settings** for accuracy

### Performance

- All hooks use TanStack Query with 5-minute cache
- Minimal database queries due to caching
- Real-time updates when cache expires
- Can adjust `staleTime` in hooks if needed

## Support

For questions or issues:
1. Check this guide first
2. Review hook implementations in `src/hooks/`
3. Check dynamic pricing logic in `src/lib/dynamic-pricing.ts`
4. Test with sample data in development

---

**Last Updated:** November 5, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
