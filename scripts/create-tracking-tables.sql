-- Create tracking tables for analytics

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Upload sessions table
CREATE TABLE IF NOT EXISTS public.upload_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    user_id UUID,
    client_ip INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- 2. Image uploads table
CREATE TABLE IF NOT EXISTS public.image_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_session_id UUID,
    original_filename TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type TEXT,
    storage_path TEXT,
    storage_bucket TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Image analyses table
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

-- 4. Page generations table
CREATE TABLE IF NOT EXISTS public.page_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_session_id UUID,
    user_prompt TEXT,
    style TEXT NOT NULL,
    difficulty INTEGER NOT NULL,
    generated_prompt TEXT,
    dalle_response_url TEXT,
    storage_path TEXT,
    model_used TEXT DEFAULT 'dall-e-3',
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_image_uploads_session ON public.image_uploads(upload_session_id);
CREATE INDEX IF NOT EXISTS idx_image_analyses_upload ON public.image_analyses(image_upload_id);
CREATE INDEX IF NOT EXISTS idx_page_generations_session ON public.page_generations(upload_session_id);

-- Enable RLS
ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_generations ENABLE ROW LEVEL SECURITY;

-- Create policies (permissive for now)
DROP POLICY IF EXISTS "Allow all operations" ON public.upload_sessions;
CREATE POLICY "Allow all operations" ON public.upload_sessions FOR ALL USING (TRUE);

DROP POLICY IF EXISTS "Allow all operations" ON public.image_uploads;
CREATE POLICY "Allow all operations" ON public.image_uploads FOR ALL USING (TRUE);

DROP POLICY IF EXISTS "Allow all operations" ON public.image_analyses;
CREATE POLICY "Allow all operations" ON public.image_analyses FOR ALL USING (TRUE);

DROP POLICY IF EXISTS "Allow all operations" ON public.page_generations;
CREATE POLICY "Allow all operations" ON public.page_generations FOR ALL USING (TRUE);