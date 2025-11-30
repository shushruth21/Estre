-- Migration: Create Public Storage Bucket for Images
-- Description: Creates a public storage bucket to store migrated images from CDN
-- Date: 2025-11-25

-- Create public bucket for images if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public',
  'public',
  true,
  52428800, -- 50MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

-- Create storage policy to allow public read access
CREATE POLICY IF NOT EXISTS "Public images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'public');

-- Create storage policy to allow authenticated users to upload
CREATE POLICY IF NOT EXISTS "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'public' 
  AND auth.role() = 'authenticated'
);

-- Create storage policy to allow authenticated users to update their uploads
CREATE POLICY IF NOT EXISTS "Authenticated users can update images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'public' 
  AND auth.role() = 'authenticated'
);

-- Create storage policy to allow authenticated users to delete
CREATE POLICY IF NOT EXISTS "Authenticated users can delete images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'public' 
  AND auth.role() = 'authenticated'
);

-- Add comment for documentation
COMMENT ON TABLE storage.buckets IS 'Storage buckets for file uploads. The public bucket is used for migrated images from CDN.';

