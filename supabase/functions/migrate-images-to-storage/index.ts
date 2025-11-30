/**
 * Supabase Edge Function: Migrate Images from CDN to Supabase Storage
 * 
 * This function:
 * 1. Scans all tables with image columns (products, fabrics, accessories, etc.)
 * 2. Downloads images from external CDN URLs
 * 3. Uploads them to Supabase Storage
 * 4. Updates database records with new Supabase Storage URLs
 * 
 * Parameters:
 * - table: Optional - specific table to migrate (default: all)
 * - dryRun: Optional - if true, only logs what would be migrated (default: false)
 * - batchSize: Optional - number of records to process per batch (default: 10)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Tables and their image columns to migrate
const IMAGE_TABLES = [
  { table: "products", column: "images", type: "array" },
  { table: "fabrics", column: "images", type: "array" },
  { table: "accessories", column: "images", type: "array" },
  { table: "fabric_coding", column: "colour_link", type: "string" },
  { table: "order_items", column: "wireframe_image_url", type: "string" },
  { table: "job_cards", column: "wireframe_image_url", type: "string" },
];

// Check if URL is external (not Supabase Storage)
function isExternalUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  
  // Already in Supabase Storage (public URLs - don't migrate)
  if (url.includes("supabase.co/storage") && url.includes("/storage/v1/object/public/")) {
    return false;
  }
  
  // Signed URLs should be converted to public, but we'll handle that separately
  // For now, treat signed URLs as external so they get converted
  
  // Relative paths (already local)
  if (url.startsWith("/")) {
    return false;
  }
  
  // Data URIs (already embedded)
  if (url.startsWith("data:")) {
    return false;
  }
  
  // External URLs (http/https)
  return url.match(/^https?:\/\//i) !== null;
}

// Extract file extension from URL
function getFileExtension(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const ext = pathname.substring(pathname.lastIndexOf("."));
    return ext || ".jpg"; // Default to .jpg if no extension
  } catch {
    return ".jpg";
  }
}

// Generate unique filename
function generateFileName(originalUrl: string, prefix: string = "migrated"): string {
  const ext = getFileExtension(originalUrl);
  const hash = btoa(originalUrl).replace(/[^a-zA-Z0-9]/g, "").substring(0, 16);
  return `${prefix}-${hash}${ext}`;
}

// Download image from external URL
async function downloadImage(url: string): Promise<Uint8Array | null> {
  try {
    console.log(`📥 Downloading: ${url}`);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; EstreImageMigrator/1.0)",
      },
    });
    
    if (!response.ok) {
      console.error(`❌ Failed to download ${url}: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error(`❌ Error downloading ${url}:`, error);
    return null;
  }
}

// Upload image to Supabase Storage
async function uploadToStorage(
  supabase: any,
  bucket: string,
  path: string,
  imageBytes: Uint8Array,
  contentType: string = "image/jpeg"
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, imageBytes, {
        contentType,
        upsert: true,
      });
    
    if (error) {
      console.error(`❌ Upload error:`, error);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error(`❌ Upload exception:`, error);
    return null;
  }
}

// Migrate images for a single record
async function migrateRecordImages(
  supabase: any,
  table: string,
  column: string,
  type: "array" | "string",
  record: any,
  dryRun: boolean
): Promise<{ migrated: number; failed: number; skipped: number }> {
  const stats = { migrated: 0, failed: 0, skipped: 0 };
  const recordId = record.id;
  
  if (type === "array") {
    const images = record[column] || [];
    if (!Array.isArray(images) || images.length === 0) {
      return stats;
    }
    
    const newImages: string[] = [];
    let needsUpdate = false;
    
    for (const imageUrl of images) {
      if (!isExternalUrl(imageUrl)) {
        newImages.push(imageUrl);
        stats.skipped++;
        continue;
      }
      
      if (dryRun) {
        console.log(`  [DRY RUN] Would migrate: ${imageUrl}`);
        newImages.push(imageUrl); // Keep original in dry run
        stats.migrated++;
        continue;
      }
      
      // Download image
      const imageBytes = await downloadImage(imageUrl);
      if (!imageBytes) {
        newImages.push(imageUrl); // Keep original on failure
        stats.failed++;
        continue;
      }
      
      // Determine content type
      const contentType = imageUrl.match(/\.(jpg|jpeg)$/i) ? "image/jpeg" :
                         imageUrl.match(/\.png$/i) ? "image/png" :
                         imageUrl.match(/\.gif$/i) ? "image/gif" :
                         imageUrl.match(/\.webp$/i) ? "image/webp" :
                         imageUrl.match(/\.svg$/i) ? "image/svg+xml" :
                         "image/jpeg";
      
      // Upload to storage
      // For fabric_coding, preserve collection/brand structure if available
      let storagePath: string;
      if (table === "fabric_coding" && record.collection && record.brand) {
        // Preserve folder structure: images/fabric_coding/collection/brand/filename
        const collection = record.collection.replace(/[^a-zA-Z0-9]/g, "_");
        const brand = record.brand.replace(/[^a-zA-Z0-9]/g, "_");
        const fileName = generateFileName(imageUrl, record.estre_code || recordId.slice(0, 8));
        storagePath = `images/fabric_coding/${collection}/${brand}/${fileName}`;
      } else {
        const fileName = generateFileName(imageUrl, `${table}-${recordId.slice(0, 8)}`);
        storagePath = `images/${table}/${fileName}`;
      }
      const newUrl = await uploadToStorage(supabase, "public", storagePath, imageBytes, contentType);
      
      if (newUrl) {
        newImages.push(newUrl);
        needsUpdate = true;
        stats.migrated++;
        console.log(`  ✅ Migrated: ${imageUrl} → ${newUrl}`);
      } else {
        newImages.push(imageUrl); // Keep original on failure
        stats.failed++;
      }
    }
    
    // Update record if any images were migrated
    if (needsUpdate && !dryRun) {
      const { error } = await supabase
        .from(table)
        .update({ [column]: newImages })
        .eq("id", recordId);
      
      if (error) {
        console.error(`  ❌ Failed to update ${table} record ${recordId}:`, error);
      } else {
        console.log(`  ✅ Updated ${table} record ${recordId}`);
      }
    }
  } else {
    // String type (single image URL)
    const imageUrl = record[column];
    if (!imageUrl || !isExternalUrl(imageUrl)) {
      return stats;
    }
    
    if (dryRun) {
      console.log(`  [DRY RUN] Would migrate: ${imageUrl}`);
      stats.migrated++;
      return stats;
    }
    
    // Download image
    const imageBytes = await downloadImage(imageUrl);
    if (!imageBytes) {
      stats.failed++;
      return stats;
    }
    
    // Determine content type
    const contentType = imageUrl.match(/\.(jpg|jpeg)$/i) ? "image/jpeg" :
                       imageUrl.match(/\.png$/i) ? "image/png" :
                       imageUrl.match(/\.gif$/i) ? "image/gif" :
                       imageUrl.match(/\.webp$/i) ? "image/webp" :
                       imageUrl.match(/\.svg$/i) ? "image/svg+xml" :
                       "image/jpeg";
    
    // Upload to storage
    // For fabric_coding, preserve collection/brand structure if available
    let storagePath: string;
    if (table === "fabric_coding" && record.collection && record.brand) {
      // Preserve folder structure: images/fabric_coding/collection/brand/filename
      const collection = record.collection.replace(/[^a-zA-Z0-9]/g, "_");
      const brand = record.brand.replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = generateFileName(imageUrl, record.estre_code || recordId.slice(0, 8));
      storagePath = `images/fabric_coding/${collection}/${brand}/${fileName}`;
    } else {
      const fileName = generateFileName(imageUrl, `${table}-${recordId.slice(0, 8)}`);
      storagePath = `images/${table}/${fileName}`;
    }
    const newUrl = await uploadToStorage(supabase, "public", storagePath, imageBytes, contentType);
    
    if (newUrl) {
      // Update record
      const { error } = await supabase
        .from(table)
        .update({ [column]: newUrl })
        .eq("id", recordId);
      
      if (error) {
        console.error(`  ❌ Failed to update ${table} record ${recordId}:`, error);
        stats.failed++;
      } else {
        console.log(`  ✅ Migrated and updated: ${imageUrl} → ${newUrl}`);
        stats.migrated++;
      }
    } else {
      stats.failed++;
    }
  }
  
  return stats;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { table, dryRun = false, batchSize = 10 } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if public bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const publicBucket = buckets?.find((b) => b.name === "public");
    
    if (!publicBucket) {
      return new Response(
        JSON.stringify({
          error: "Public storage bucket does not exist. Please run the migration SQL first.",
          hint: "Run: supabase/migrations/20251125000001_create_public_storage_bucket.sql",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const tablesToProcess = table 
      ? IMAGE_TABLES.filter((t) => t.table === table)
      : IMAGE_TABLES;

    const totalStats = {
      migrated: 0,
      failed: 0,
      skipped: 0,
      processed: 0,
    };

    for (const { table: tableName, column, type } of tablesToProcess) {
      console.log(`\n📊 Processing table: ${tableName}.${column}`);
      
      // Build query - special handling for fabric_coding (filter is_active and get extra fields)
      let query = supabase.from(tableName);
      
      // For fabric_coding, get collection and brand for folder structure
      if (tableName === "fabric_coding") {
        query = query
          .select(`id, ${column}, collection, brand, estre_code`)
          .eq("is_active", true);
      } else {
        query = query.select(`id, ${column}`);
      }
      
      // Filter out null, empty strings, and error values
      query = query
        .not(column, "is", null)
        .neq(column, "")
        .neq(column, "NULL")
        .neq(column, "#VALUE!");
      
      const { data: records, error } = await query;
      
      if (error) {
        console.error(`❌ Error fetching ${tableName}:`, error);
        continue;
      }
      
      if (!records || records.length === 0) {
        console.log(`  ℹ️  No records found in ${tableName}`);
        continue;
      }
      
      // Filter records to only process those with external URLs (Google Drive, etc.)
      const recordsToProcess = records.filter((record: any) => {
        const url = record[column];
        if (!url || typeof url !== "string") return false;
        // Skip already migrated Supabase Storage public URLs
        if (url.includes("/storage/v1/object/public/")) return false;
        // Process Google Drive and other external URLs
        return isExternalUrl(url);
      });
      
      console.log(`  Found ${records.length} total records, ${recordsToProcess.length} with external URLs to migrate`);
      
      if (recordsToProcess.length === 0) {
        console.log(`  ✅ All images already migrated or no external URLs found`);
        continue;
      }
      
      // Process in batches
      for (let i = 0; i < recordsToProcess.length; i += batchSize) {
        const batch = recordsToProcess.slice(i, i + batchSize);
        console.log(`  Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)}`);
        
        for (const record of batch) {
          const stats = await migrateRecordImages(
            supabase,
            tableName,
            column,
            type,
            record,
            dryRun
          );
          
          totalStats.migrated += stats.migrated;
          totalStats.failed += stats.failed;
          totalStats.skipped += stats.skipped;
          totalStats.processed++;
        }
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < recordsToProcess.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: dryRun ? "Dry run completed" : "Image migration completed",
        stats: totalStats,
        dryRun,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to migrate images",
        details: error.toString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

