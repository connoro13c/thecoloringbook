-- Simple step-by-step migration for comprehensive tracking
-- Run this in Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Create upload_sessions table (no foreign keys)
CREATE TABLE IF NOT EXISTS public.upload_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    user_id UUID,
    client_ip INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Step 2: Create image_uploads table (no foreign keys yet)
CREATE TABLE IF NOT EXISTS public.image_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_session_id UUID,
    original_filename TEXT,
    file_size_bytes INTEGER,
    mime_type TEXT,
    storage_path TEXT NOT NULL,
    storage_bucket TEXT NOT NULL,
    upload_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create image_analyses table (no foreign keys yet)
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

-- Step 4: Create page_generations table (no foreign keys yet)
CREATE TABLE IF NOT EXISTS public.page_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_session_id UUID,
    user_prompt TEXT,
    style TEXT NOT NULL,
    difficulty INTEGER NOT NULL,
    generated_prompt TEXT NOT NULL,
    dalle_response_url TEXT,
    storage_path TEXT,
    model_used TEXT DEFAULT 'dall-e-3',
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create pdf_exports table (no foreign keys yet)
CREATE TABLE IF NOT EXISTS public.pdf_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_generation_id UUID,
    user_id UUID NOT NULL,
    stripe_payment_intent_id TEXT,
    pdf_storage_path TEXT,
    export_settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Enable RLS on all tables
ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_exports ENABLE ROW LEVEL SECURITY;

-- Step 7: Create basic indexes
CREATE INDEX IF NOT EXISTS idx_upload_sessions_session_id ON public.upload_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_user_id ON public.upload_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_image_uploads_session_id ON public.image_uploads(upload_session_id);
CREATE INDEX IF NOT EXISTS idx_image_analyses_image_id ON public.image_analyses(image_upload_id);
CREATE INDEX IF NOT EXISTS idx_page_generations_session_id ON public.page_generations(upload_session_id);
CREATE INDEX IF NOT EXISTS idx_pdf_exports_user_id ON public.pdf_exports(user_id);

-- Step 8: Create simple RLS policies (allow all for now - we can tighten later)
CREATE POLICY "Allow all operations" ON public.upload_sessions FOR ALL USING (TRUE);
CREATE POLICY "Allow all operations" ON public.image_uploads FOR ALL USING (TRUE);
CREATE POLICY "Allow all operations" ON public.image_analyses FOR ALL USING (TRUE);
CREATE POLICY "Allow all operations" ON public.page_generations FOR ALL USING (TRUE);
CREATE POLICY "Allow all operations" ON public.pdf_exports FOR ALL USING (TRUE);

-- Step 9: Create helper functions
CREATE OR REPLACE FUNCTION cleanup_expired_anonymous_data()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  DELETE FROM public.upload_sessions 
  WHERE user_id IS NULL 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION extend_session_expiry(session_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.upload_sessions 
  SET expires_at = NOW() + INTERVAL '30 days'
  WHERE session_id = session_uuid AND user_id IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;