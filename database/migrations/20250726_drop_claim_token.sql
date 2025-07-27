-- Drop claim_token column and related infrastructure as part of auth-first migration
-- This migration removes all anonymous user support infrastructure

-- Drop the index first
DROP INDEX IF EXISTS idx_pages_claim_token;

-- Drop the claim_token column
ALTER TABLE pages DROP COLUMN IF EXISTS claim_token;

-- Note: The claim_token was used for anonymous users to claim their pages after authentication
-- Since we've moved to auth-first approach, this is no longer needed
