-- Fix image_analyses table schema mismatch
-- The existing table is for caching, but we need detailed tracking

-- Option 1: Drop and recreate (if you don't mind losing existing data)
DROP TABLE IF EXISTS public.image_analyses CASCADE;

-- Create the new tracking table structure
CREATE TABLE IF NOT EXISTS public.image_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_upload_id UUID,
    analysis_prompt TEXT NOT NULL,
    raw_response TEXT,
    parsed_analysis JSONB,
    model_used TEXT DEFAULT 'gpt-4o-mini',
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_image_analyses_upload ON public.image_analyses(image_upload_id);

-- Enable RLS with permissive policy
ALTER TABLE public.image_analyses ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies and create permissive ones
DROP POLICY IF EXISTS "image_analyses_service_role_policy" ON public.image_analyses;
DROP POLICY IF EXISTS "image_analyses_authenticated_read" ON public.image_analyses;
DROP POLICY IF EXISTS "image_analyses_authenticated_insert" ON public.image_analyses;
DROP POLICY IF EXISTS "Allow all operations" ON public.image_analyses;

-- Create permissive policy for all operations
CREATE POLICY "Allow all operations" ON public.image_analyses FOR ALL USING (TRUE);