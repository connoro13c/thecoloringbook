-- Add analysis_output column to pages table for storing photo analysis results
ALTER TABLE pages 
ADD COLUMN IF NOT EXISTS analysis_output JSONB;

-- Add comment explaining the column
COMMENT ON COLUMN pages.analysis_output IS 'Stores photo analysis results from GPT-4o Vision for debugging and optimization';
