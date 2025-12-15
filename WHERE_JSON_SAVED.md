# 📁 Where Customer Orders are Saved in JSON Format

## 🎯 Current Implementation

### 1. **In Database (JSONB Format)** ✅

**Location:** `customer_orders` table → `configuration` column

**Table:** `customer_orders`
- **Column:** `configuration` (type: `Json` / `JSONB`)
- **Format:** JSON object stored directly in database
- **Access:** Query the database to get JSON

**Code Location:**
```typescript
// src/pages/Configure.tsx - Line 107-116
const { error } = await supabase.from("customer_orders").insert({
  customer_name: user.user_metadata?.full_name || user.email,
  customer_email: user.email,
  product_id: productId,
  product_type: category,
  configuration,  // ← JSON saved here as JSONB
  calculated_price: pricing?.total || 0,
  status: "draft",
  order_number: `DRAFT-${Date.now()}`,
});
```

**How to Access:**
```sql
-- Get configuration JSON from database
SELECT 
  order_number,
  configuration  -- This is the JSON object
FROM customer_orders
WHERE order_number = 'DRAFT-1703123456789';
```

**Or via Supabase Client:**
```typescript
const { data } = await supabase
  .from('customer_orders')
  .select('configuration')
  .eq('order_number', 'DRAFT-1703123456789')
  .single();

const jsonConfig = data.configuration; // This is the JSON object
```

---

### 2. **After Checkout - In Multiple Tables** ✅

When customer checks out, the configuration JSON is also saved in:

#### A. `order_items` table
- **Column:** `configuration` (type: `Json` / `JSONB`)
- **Location:** Each order item has its own configuration JSON

```sql
SELECT configuration FROM order_items WHERE order_id = 'order-id';
```

#### B. `job_cards` table
- **Column:** `configuration` (type: `Json` / `JSONB`)
- **Location:** Each job card has the configuration JSON for production

```sql
SELECT configuration FROM job_cards WHERE order_id = 'order-id';
```

---

## 📊 JSON Storage Locations Summary

| Location | Table | Column | When Saved | Format |
|----------|-------|--------|------------|--------|
| **Draft Order** | `customer_orders` | `configuration` | When "Add to Cart" clicked | JSONB |
| **Confirmed Order** | `order_items` | `configuration` | When checkout completed | JSONB |
| **Production** | `job_cards` | `configuration` | When job card created | JSONB |

---

## 🔍 How to View/Export JSON

### Method 1: Query Database Directly

```sql
-- Get configuration as JSON
SELECT 
  order_number,
  configuration::text as json_text
FROM customer_orders
WHERE order_number = 'DRAFT-1703123456789';
```

### Method 2: Use Supabase Dashboard

1. Go to Supabase Dashboard
2. Navigate to **Table Editor** → `customer_orders`
3. Find your order
4. Click on `configuration` column
5. View/edit JSON directly

### Method 3: Export via Code

```typescript
// Get configuration and convert to JSON string
const { data } = await supabase
  .from('customer_orders')
  .select('configuration, order_number')
  .eq('order_number', 'DRAFT-1703123456789')
  .single();

// Convert to JSON string
const jsonString = JSON.stringify(data.configuration, null, 2);

// Download as file
const blob = new Blob([jsonString], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `order-${data.order_number}.json`;
a.click();
```

---

## 💾 JSON Format Example

The configuration JSON stored in the database looks like:

```json
{
  "productId": "123",
  "shape": "U Shape",
  "frontSeatCount": "4-Seater",
  "console": {
    "required": true,
    "quantity": 12,
    "size": "Console-10 In",
    "placements": [...]
  },
  "fabric": {
    "plan": "Multi Colour",
    "structureCode": "ES:NV-EF-Glamour-001",
    "backrestCode": "ES:VJ-F-Dolly-K-107",
    "seatCode": "ES:VJ-F-Litchi-208",
    "headrestCode": "ES:VJ-F-Dolphin-304"
  },
  "foam": {
    "type": "Memory Foam"
  },
  ...
}
```

---

## ⚠️ Note: Separate JSON Files Not Currently Implemented

**Current Status:** The configuration is saved **only in the database** as JSONB, **not as separate JSON files** in Supabase Storage.

If you want separate JSON files uploaded to Supabase Storage (like we discussed earlier), you would need to:

1. **Add JSON file upload** in `Configure.tsx` `handleAddToCart` function
2. **Create Storage bucket** `order-summaries` in Supabase
3. **Upload JSON file** to Storage before saving to database
4. **Store file URL** in `notes` or `configuration._fileUrls`

---

## 📍 Summary

**Where JSON is Currently Saved:**
- ✅ **Database:** `customer_orders.configuration` (JSONB)
- ✅ **Database:** `order_items.configuration` (JSONB) - after checkout
- ✅ **Database:** `job_cards.configuration` (JSONB) - for production
- ❌ **Storage:** Not currently saved as separate files

**To Access:**
- Query database directly
- Use Supabase Dashboard Table Editor
- Export via code/API

**To Get Separate JSON Files:**
- Would need to implement Storage upload functionality
- Files would be at: `order-summaries/{userId}/{orderNumber}.json`

