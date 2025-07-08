-- Create table to track file ownership during anonymous creation
CREATE TABLE IF NOT EXISTS file_ownership (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_path TEXT NOT NULL UNIQUE,
    creation_nonce TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    claimed_at TIMESTAMPTZ NULL,
    claimed_by UUID REFERENCES auth.users(id) NULL
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_file_ownership_nonce ON file_ownership(creation_nonce);
CREATE INDEX IF NOT EXISTS idx_file_ownership_path ON file_ownership(file_path);

-- Enable RLS
ALTER TABLE file_ownership ENABLE ROW LEVEL SECURITY;

-- Allow anonymous to insert ownership records
CREATE POLICY "anon_can_create_ownership" ON file_ownership
    FOR INSERT 
    WITH CHECK (true);

-- Allow users to read their own claimed files
CREATE POLICY "users_read_own_files" ON file_ownership
    FOR SELECT 
    USING (claimed_by = auth.uid());

-- Only allow service role to update claimed_by and claimed_at
CREATE POLICY "service_role_can_claim" ON file_ownership
    FOR UPDATE 
    USING (auth.role() = 'service_role');
