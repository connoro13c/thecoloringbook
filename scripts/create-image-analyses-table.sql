-- Create image_analyses table for caching vision analysis results
CREATE TABLE IF NOT EXISTS image_analyses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  hash varchar(64) NOT NULL UNIQUE, -- SHA256 hash of image URL
  attributes jsonb NOT NULL, -- Cached vision analysis attributes
  created_at timestamp with time zone DEFAULT now()
);

-- Add index for fast hash lookups
CREATE INDEX IF NOT EXISTS idx_image_analyses_hash ON image_analyses (hash);

-- Add RLS policy to allow reads/writes for authenticated users and service role
ALTER TABLE image_analyses ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "image_analyses_service_role_policy" ON image_analyses
  FOR ALL TO service_role USING (true);

-- Allow authenticated users to read their own cached analyses
CREATE POLICY "image_analyses_authenticated_read" ON image_analyses
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert new analyses
CREATE POLICY "image_analyses_authenticated_insert" ON image_analyses
  FOR INSERT TO authenticated WITH CHECK (true);