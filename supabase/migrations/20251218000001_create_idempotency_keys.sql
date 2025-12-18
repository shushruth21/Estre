-- Create idempotency_keys table
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key text NOT NULL,
  function_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  response_body jsonb, -- Cache the successful response
  status text DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  PRIMARY KEY (key, function_name)
);

-- Enable RLS
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Block all access by default (only service role should access this via edge functions)
CREATE POLICY "Deny all public access"
  ON idempotency_keys
  FOR ALL
  TO public
  USING (false);

-- Allow service role full access
CREATE POLICY "Service role full access"
  ON idempotency_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for cleanup (optional, good practice to expire keys eventually)
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at ON idempotency_keys(created_at);

-- Add comment
COMMENT ON TABLE idempotency_keys IS 'Tracks idempotency keys for edge function execution deduplication';

-- Migration to update schema version not strictly needed here as this is a utility table, 
-- but good practice if following the strict contract.
-- Assuming the previous migration set version to X, we won't bump it here unless requested 
-- by the strict schema contract rules shown earlier. 
-- The user didn't explicitly ask for version bump in this specific task request (ID 0), 
-- but the Schema Contract doc says "Inside your migration file, you MUST include an update to the schema_meta table".
-- So I will include it.

UPDATE schema_meta SET version = version + 1 WHERE id = 1;
