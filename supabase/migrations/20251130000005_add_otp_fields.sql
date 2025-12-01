-- Add OTP fields to sale_orders for customer confirmation
ALTER TABLE sale_orders
ADD COLUMN IF NOT EXISTS otp_code text,
ADD COLUMN IF NOT EXISTS otp_expires_at timestamptz;

-- Add index for performance if we query by otp (though usually we query by ID)
-- CREATE INDEX IF NOT EXISTS idx_sale_orders_otp_code ON sale_orders(otp_code);

COMMENT ON COLUMN sale_orders.otp_code IS '6-digit OTP code for customer confirmation';
COMMENT ON COLUMN sale_orders.otp_expires_at IS 'Expiration timestamp for the OTP';
