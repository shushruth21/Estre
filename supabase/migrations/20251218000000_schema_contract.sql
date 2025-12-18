-- Create schema_meta table to track database version
CREATE TABLE IF NOT EXISTS public.schema_meta (
    id INT PRIMARY KEY DEFAULT 1,
    version INT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insert the initial version (1)
INSERT INTO public.schema_meta (id, version)
VALUES (1, 1)
ON CONFLICT (id) DO UPDATE SET version = 1;

-- Grant access
ALTER TABLE public.schema_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to schema_meta" ON public.schema_meta FOR SELECT USING (true);
