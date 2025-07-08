-- Add claim_token column to pages table for anonymous-to-authenticated user flow
-- This allows anonymous users to claim their pages after signing up

ALTER TABLE pages ADD COLUMN claim_token UUID DEFAULT gen_random_uuid();

-- Add index for efficient lookups during claiming
CREATE INDEX idx_pages_claim_token ON pages(claim_token) WHERE claim_token IS NOT NULL;

-- Optional: Add cleanup for old anonymous pages (can be run via cron)
-- DELETE FROM pages WHERE user_id IS NULL AND created_at < NOW() - INTERVAL '24 hours';
