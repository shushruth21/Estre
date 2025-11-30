/**
 * Image URL parsing and normalization utilities
 * Handles various formats from database: string, array, comma-separated, JSON array
 */

/**
 * Convert Google Drive sharing URL to direct image URL
 * Handles various Google Drive URL formats and converts them to direct image URLs
 */
export const extractGoogleDriveFileId = (url: string): string | null => {
  if (!url || typeof url !== "string") return null;

  if (!url.includes("drive.google.com")) return null;

  const patterns = [
    /[?&]id=([a-zA-Z0-9_-]{10,})/,
    /\/file\/d\/([a-zA-Z0-9_-]{10,})/,
    /\/d\/([a-zA-Z0-9_-]{10,})/,
    /uc\?export=[^&]+&id=([a-zA-Z0-9_-]{10,})/,
    /thumbnail\?[^=]*id=([a-zA-Z0-9_-]{10,})/,
    /\/folders\/([a-zA-Z0-9_-]{10,})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

type GoogleDriveMode = "view" | "download" | "thumbnail" | "content";

export const convertGoogleDriveUrl = (
  url: string,
  options?: { mode?: GoogleDriveMode; size?: number }
): string | null => {
  if (!url || typeof url !== 'string') return null;
  
  // Only process Google Drive URLs
  if (!url.includes('drive.google.com')) return null;
  
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) {
    if (import.meta.env.DEV) {
      console.warn('[ImageUtils] Could not extract file ID from Google Drive URL:', url);
    }
    return null;
  }

  const mode: GoogleDriveMode = options?.mode ?? "view";
  const size = options?.size ?? 800;

  switch (mode) {
    case "download":
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    case "thumbnail":
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}-h${size}`;
    case "content":
      return `https://lh3.googleusercontent.com/d/${fileId}=w${size}-h${size}`;
    case "view":
    default:
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
};

/**
 * Convert Supabase Storage signed URL to public URL
 * Removes token and changes /sign/ to /public/
 */
export const convertSignedUrlToPublic = (url: string | null | undefined): string | null => {
  if (!url || typeof url !== 'string') return null;
  
  // Check if it's a Supabase Storage signed URL
  if (url.includes('/storage/v1/object/sign/')) {
    // Extract the path after /sign/
    const match = url.match(/\/storage\/v1\/object\/sign\/([^?]+)/);
    if (match && match[1]) {
      const filePath = match[1];
      // Get Supabase URL from environment or extract from current URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                         url.match(/https:\/\/[^/]+/)?.[0] || 
                         'https://ljgmqwnamffvvrwgprsd.supabase.co';
      
      // Construct public URL (no token needed)
      return `${supabaseUrl}/storage/v1/object/public/${filePath}`;
    }
  }
  
  // If already public URL or not Supabase Storage, return as is
  return url;
};

/**
 * Normalize a single image URL - ensure it has proper protocol
 * Also converts Google Drive sharing URLs to direct image URLs
 * AND converts Supabase signed URLs to public URLs
 */
export const normalizeImageUrl = (url: string | null | undefined): string | null => {
  if (!url || url.trim() === '' || url === '/placeholder.svg') {
    return null;
  }
  
  // Handle error values from database
  const urlStr = String(url).trim();
  if (urlStr === 'NULL' || urlStr === '#VALUE!' || urlStr.toLowerCase() === 'null') {
    return null;
  }
  
  url = urlStr;
  
  // Convert Supabase signed URLs to public URLs FIRST (before other processing)
  if (url.includes('/storage/v1/object/sign/')) {
    const publicUrl = convertSignedUrlToPublic(url);
    if (publicUrl) {
      return publicUrl;
    }
  }
  
  // Check if it's a Google Drive URL and convert it first
  if (url.includes('drive.google.com')) {
    const convertedUrl = convertGoogleDriveUrl(url, { mode: 'view' });
    if (convertedUrl) {
      return convertedUrl;
    }
  }
  
  // If already a valid URL with protocol, return as is
  if (url.match(/^https?:\/\//i)) {
    return url;
  }
  
  // Handle protocol-relative URLs (//example.com/image.jpg)
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  
  // Relative paths starting with / are kept as is
  if (url.startsWith('/')) {
    return url;
  }
  
  // Otherwise, assume it needs https://
  return 'https://' + url;
};

/**
 * Parse image data from database column
 * Handles: string, array, comma-separated, JSON array string
 */
export const parseImageUrls = (images: any): string[] => {
  // Handle null/undefined
  if (!images) {
    return [];
  }
  
  // Handle array (PostgreSQL text[] or JavaScript array)
  if (Array.isArray(images)) {
    const urls = images
      .filter(Boolean)
      .map(url => normalizeImageUrl(url))
      .filter((url): url is string => url !== null);
    
    if (import.meta.env.DEV && images.length > 0 && urls.length === 0) {
      console.warn('⚠️ Array image parsing filtered out all URLs:', images);
    }
    
    return urls;
  }
  
  // Handle string
  if (typeof images === 'string') {
    const trimmed = images.trim();
    
    // Empty string
    if (!trimmed) {
      return [];
    }
    
    // Try parsing as JSON array first
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter(Boolean)
          .map((url: any) => normalizeImageUrl(String(url)))
          .filter((url): url is string => url !== null);
      }
    } catch {
      // Not JSON, continue with string parsing
    }
    
    // Handle comma-separated URLs
    if (trimmed.includes(',')) {
      return trimmed
        .split(',')
        .map(url => normalizeImageUrl(url.trim()))
        .filter((url): url is string => url !== null);
    }
    
    // Single URL - check if it's already a valid URL
    const normalized = normalizeImageUrl(trimmed);
    
    if (import.meta.env.DEV && trimmed && !normalized) {
      console.warn('⚠️ Single URL normalization failed:', trimmed);
    }
    
    return normalized ? [normalized] : [];
  }
  
  if (import.meta.env.DEV && images) {
    console.warn('⚠️ Unexpected image data type:', typeof images, images);
  }
  
  return [];
};

/**
 * Get the first image URL (for thumbnail/preview)
 */
export const getFirstImageUrl = (images: any): string | null => {
  const urls = parseImageUrls(images);
  return urls.length > 0 ? urls[0] : null;
};

/**
 * Get all image URLs (for gallery)
 */
export const getAllImageUrls = (images: any): string[] => {
  const urls = parseImageUrls(images);
  return urls.length > 0 ? urls : ['/placeholder.svg'];
};

/**
 * Check if image URL is valid
 */
export const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url || url === '/placeholder.svg') return false;
  
  // Check if it's a valid URL format
  try {
    const urlObj = new URL(url.startsWith('/') ? `https://example.com${url}` : url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    // If URL parsing fails, check if it's a relative path
    return url.startsWith('/') && url.length > 1;
  }
};

