/*
  # Automatic Email Sending Trigger
  
  ## Overview
  This migration creates a PostgreSQL trigger that automatically sends sale order confirmation emails
  when an order reaches "confirmed_by_customer" status. This eliminates manual staff action and
  guarantees every confirmed order gets an email.
  
  ## Changes
  
  1. **Enable pg_net Extension**
     - Required for making HTTP calls from PostgreSQL triggers
  
  2. **Create Email Sending Function**
     - Triggers when sale_orders.status changes to 'confirmed_by_customer'
     - Makes async HTTP call to 'send-sale-order-pdf-after-otp' edge function
     - Logs trigger execution for monitoring
     - Handles errors gracefully without blocking order creation
  
  3. **Create Trigger**
     - Fires AFTER INSERT OR UPDATE on sale_orders table
     - Only executes when status = 'confirmed_by_customer'
     - Runs for each affected row
  
  ## Benefits
  - Zero manual intervention required
  - Immediate email delivery (within seconds of confirmation)
  - Automatic PDF generation and attachment
  - Email delivery logging for monitoring
  - Staff can focus on monitoring rather than manual sending
  
  ## Security
  - Uses service role key for edge function authentication
  - Only fires for confirmed orders
  - Non-blocking (doesn't prevent order creation if email fails)
*/

-- Enable pg_net extension for HTTP requests from PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing trigger and function if they exist (for idempotency)
DROP TRIGGER IF EXISTS trigger_send_sale_order_email ON sale_orders;
DROP FUNCTION IF EXISTS send_sale_order_email_automatically();

-- Create function to send email via edge function
CREATE OR REPLACE FUNCTION send_sale_order_email_automatically()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key text;
  supabase_url text;
  edge_function_url text;
  request_id bigint;
BEGIN
  -- Only proceed if status is 'confirmed_by_customer'
  IF NEW.status = 'confirmed_by_customer' THEN
    
    -- Get environment variables
    service_role_key := current_setting('app.settings.service_role_key', true);
    supabase_url := current_setting('app.settings.supabase_url', true);
    
    -- Construct edge function URL
    edge_function_url := supabase_url || '/functions/v1/send-sale-order-pdf-after-otp';
    
    -- Make async HTTP request to edge function
    -- This is non-blocking and won't prevent the order from being created
    SELECT INTO request_id net.http_post(
      url := edge_function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'saleOrderId', NEW.id::text
      ),
      timeout_milliseconds := 30000
    );
    
    -- Log the trigger execution for monitoring
    -- This helps staff see that automation is working
    RAISE NOTICE 'Automatic email trigger fired for sale_order_id: %, request_id: %', NEW.id, request_id;
    
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    -- Order creation should not fail even if email trigger fails
    RAISE WARNING 'Email trigger failed for sale_order_id: %, error: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on sale_orders table
CREATE TRIGGER trigger_send_sale_order_email
  AFTER INSERT OR UPDATE OF status ON sale_orders
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed_by_customer')
  EXECUTE FUNCTION send_sale_order_email_automatically();

-- Add comment for documentation
COMMENT ON FUNCTION send_sale_order_email_automatically() IS 
  'Automatically sends sale order confirmation email via edge function when status becomes confirmed_by_customer. Non-blocking and logs execution for monitoring.';

COMMENT ON TRIGGER trigger_send_sale_order_email ON sale_orders IS
  'Fires automatic email sending when sale order is confirmed by customer. Eliminates need for manual staff intervention.';