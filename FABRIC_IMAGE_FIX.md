# Fabric Image Loading Fix

## Problem
Images were not loading in the Fabric Library component (the black circle placeholder was showing instead of fabric images).

## Solution

### **Column to Use for Image URLs: `colour_link`**

Based on your table schema, the **`colour_link`** column is the correct column to store image URLs for fabrics. The code has been updated to prioritize this column.

### Table Schema Reference

```sql
create table public.fabric_coding (
  id uuid not null default extensions.uuid_generate_v4 (),
  description text null,
  collection text null,
  vendor text null,
  brand text null,
  vendor_code text null,
  estre_code text not null,
  colour_link text null,  -- ✅ USE THIS COLUMN FOR IMAGE URLs
  colour text null,        -- Use for color names/values (e.g., "Red", "Blue")
  price numeric(10, 2) null,
  bom_price numeric(10, 2) null,
  upgrade numeric(10, 2) null default 0,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint fabric_coding_pkey primary key (id),
  constraint fabric_coding_estre_code_key unique (estre_code)
);
```

### Column Usage

| Column | Purpose | Example Values |
|--------|---------|----------------|
| **`colour_link`** | **Image URLs** | `https://example.com/fabric.jpg`, `/images/fabric.png`, `//cdn.example.com/image.jpg` |
| `colour` | Color names/text | `"Red"`, `"Blue"`, `"#FF5733"`, `"Navy Blue"` |

### Supported Image URL Formats

The code now supports various image URL formats in the `colour_link` column:

1. **Full HTTPS URLs**: `https://example.com/fabric.jpg`
2. **HTTP URLs**: `http://example.com/fabric.jpg`
3. **Protocol-relative URLs**: `//cdn.example.com/fabric.jpg`
4. **Relative paths**: `/images/fabric.jpg`
5. **Comma-separated URLs**: `url1.jpg, url2.jpg` (uses first one)
6. **JSON array strings**: `["url1.jpg", "url2.jpg"]` (uses first one)
7. **PostgreSQL text arrays**: Array format from database

### How to Add Images to Your Database

**Update the `colour_link` column with image URLs:**

```sql
-- Example: Update a single fabric
UPDATE fabric_coding 
SET colour_link = 'https://example.com/images/fabric-101.jpg'
WHERE estre_code = 'ES:VJ-F-ARTCLUB-101';

-- Example: Update multiple fabrics
UPDATE fabric_coding 
SET colour_link = 'https://example.com/images/fabric-102.jpg'
WHERE estre_code = 'ES:VJ-F-ARTCLUB-102';

-- Example: Using relative path (if images are in your public folder)
UPDATE fabric_coding 
SET colour_link = '/images/fabrics/fabric-103.jpg'
WHERE estre_code = 'ES:VJ-F-ARTCLUB-103';
```

### What Was Fixed

1. **Prioritized `colour_link` column**: The code now checks `colour_link` first (primary source for image URLs)
2. **Improved URL validation**: Better detection of valid image URLs vs. color names
3. **Fixed color fallback**: The `colour` column is now correctly used only for color values, not image URLs
4. **Better error handling**: Images that fail to load will show a colored background fallback

### Testing

After updating the `colour_link` column with image URLs:

1. Open the Fabric Library in your application
2. The images should now display in the circular preview area
3. If an image fails to load, a colored background (generated from the fabric code) will be shown as a fallback

### Image Requirements

- **Supported formats**: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`
- **Recommended size**: 200x200px or larger for best quality
- **File size**: Optimize images for web (recommended: < 100KB per image)
- **CORS**: If using external URLs, ensure CORS headers are properly configured

### Troubleshooting

If images still don't load:

1. **Check the URL format**: Ensure the URL is valid and accessible
2. **Check browser console**: Look for CORS or 404 errors
3. **Verify database**: Confirm the `colour_link` column contains the image URL
4. **Test URL directly**: Try opening the URL directly in a browser to verify it's accessible
5. **Check image format**: Ensure the file extension matches the actual image format

### Example Data

```sql
-- Good example: Full URL
UPDATE fabric_coding 
SET colour_link = 'https://cdn.example.com/fabrics/ES-VJ-F-ARTCLUB-101.jpg'
WHERE estre_code = 'ES:VJ-F-ARTCLUB-101';

-- Good example: Relative path (if hosted on your domain)
UPDATE fabric_coding 
SET colour_link = '/static/images/fabrics/ES-VJ-F-ARTCLUB-102.jpg'
WHERE estre_code = 'ES:VJ-F-ARTCLUB-102';

-- Bad example: Don't put color names here
-- UPDATE fabric_coding SET colour_link = 'Red' WHERE estre_code = '...'; ❌

-- Good: Put color names in colour column
UPDATE fabric_coding 
SET colour = 'Red'
WHERE estre_code = 'ES:VJ-F-ARTCLUB-101';
```

## Summary

✅ **Use `colour_link` column for image URLs**
✅ **Use `colour` column for color names/values**
✅ **Code now prioritizes `colour_link` for images**
✅ **Better validation and error handling**
✅ **Supports multiple URL formats**

The Fabric Library component will now correctly display images from the `colour_link` column in the circular preview area.

