-- ===============================================
-- ADD 'staff' TO app_role ENUM
-- ===============================================
-- This migration adds 'staff' to the app_role enum.
-- It must run BEFORE migrations that use 'staff' in their definitions.
-- PostgreSQL requires new enum values to be committed before they can be used.

-- Add 'staff' to app_role enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'staff' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'staff';
  END IF;
END $$;

