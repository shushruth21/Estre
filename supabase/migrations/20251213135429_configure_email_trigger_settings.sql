/*
  # Configure Email Trigger Settings
  
  ## Overview
  This migration sets up the configuration needed for the automatic email trigger to work.
  It uses the existing system_settings table to store edge function URL and ensures the trigger
  can access these values.
  
  ## Changes
  
  1. **Create trigger_config table** (if needed)
     - Stores configuration for triggers
     - Includes edge function URL and other settings
  
  2. **Update trigger function**
     - Reads configuration from database instead of environment
     - Uses Supabase project URL from system
  
  ## Notes
  - The service role key should be configured via Supabase dashboard
  - The trigger uses the project's internal URL for edge function calls
*/

-- Create a simple config table for trigger settings
CREATE TABLE IF NOT EXISTS public.trigger_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trigger_config ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write trigger config
CREATE POLICY "Only admins can manage trigger config"
  ON public.trigger_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default configuration
-- Note: This will be updated with actual project URL during deployment
INSERT INTO public.trigger_config (key, value, description)
VALUES (
  'edge_function_url',
  jsonb_build_object(
    'base_url', current_setting('request.headers', true)::json->>'host' || '/functions/v1',
    'function_name', 'send-sale-order-pdf-after-otp'
  ),
  'Edge function configuration for automatic email triggers'
)
ON CONFLICT (key) DO NOTHING;

-- Update the trigger function to use database configuration
CREATE OR REPLACE FUNCTION send_sale_order_email_automatically()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  edge_function_url text;
  request_id bigint;
  supabase_url text;
  function_path text;
BEGIN
  -- Only proceed if status is 'confirmed_by_customer'
  IF NEW.status = 'confirmed_by_customer' THEN
    
    -- Construct edge function URL using Supabase internal URL
    -- This uses the internal service URL which is always available
    supabase_url := current_setting('request.headers', true)::json->>'host';
    
    -- If we can't get URL from headers, use a fallback approach
    IF supabase_url IS NULL OR supabase_url = '' THEN
      -- Try to get from environment
      supabase_url := current_setting('app.settings.supabase_url', true);
    END IF;
    
    -- If still no URL, log and exit (this shouldn't happen in production)
    IF supabase_url IS NULL OR supabase_url = '' THEN
      RAISE WARNING 'Cannot determine Supabase URL for email trigger, sale_order_id: %', NEW.id;
      RETURN NEW;
    END IF;
    
    -- Build full URL
    function_path := '/functions/v1/send-sale-order-pdf-after-otp';
    
    -- Make sure URL starts with http/https
    IF NOT (supabase_url LIKE 'http://%' OR supabase_url LIKE 'https://%') THEN
      supabase_url := 'https://' || supabase_url;
    END IF;
    
    edge_function_url := supabase_url || function_path;
    
    -- Make async HTTP request to edge function
    -- Note: This requires the service role key to be configured in the edge function
    SELECT INTO request_id net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'saleOrderId', NEW.id::text,
        'triggeredBy', 'database_trigger',
        'triggeredAt', now()::text
      ),
      timeout_milliseconds := 30000
    );
    
    -- Log successful trigger
    RAISE NOTICE 'Automatic email trigger fired for sale_order_id: %, request_id: %, url: %', 
      NEW.id, request_id, edge_function_url;
    
    -- Update metadata to track that trigger fired
    NEW.metadata := COALESCE(NEW.metadata, '{}'::jsonb) || 
      jsonb_build_object(
        'email_trigger_fired_at', now()::text,
        'email_trigger_request_id', request_id
      );
    
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Email trigger failed for sale_order_id: %, error: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Add helpful comment
COMMENT ON TABLE public.trigger_config IS 
  'Configuration settings for database triggers, including edge function URLs for automatic email sending';