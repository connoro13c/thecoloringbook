-- Create downloads table for tracking paid coloring page downloads
CREATE TABLE IF NOT EXISTS downloads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id uuid NOT NULL,
  stripe_session_id text NOT NULL UNIQUE,
  pdf_path text NOT NULL,
  png_path text NOT NULL,
  storage_tier text DEFAULT 'hot' CHECK (storage_tier IN ('hot', 'cold')),
  created_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz,
  expires_at timestamptz,
  CONSTRAINT unique_user_page UNIQUE (user_id, page_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_downloads_user_id ON downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_page_id ON downloads(page_id);
CREATE INDEX IF NOT EXISTS idx_downloads_stripe_session ON downloads(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_downloads_storage_tier ON downloads(storage_tier);
CREATE INDEX IF NOT EXISTS idx_downloads_last_accessed ON downloads(last_accessed_at);

-- Enable RLS (Row Level Security)
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own downloads" ON downloads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own downloads" ON downloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own downloads" ON downloads
  FOR UPDATE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON downloads TO authenticated;
GRANT SELECT, INSERT, UPDATE ON downloads TO service_role;
