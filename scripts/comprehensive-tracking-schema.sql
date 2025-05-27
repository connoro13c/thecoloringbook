-- Comprehensive tracking schema for all photo uploads, analysis, and prompts
-- Supports both anonymous (30-day retention) and authenticated users (permanent)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- COMPREHENSIVE TRACKING TABLES
-- ================================================================

-- 1. Upload sessions (tracks all users - anonymous and authenticated)
CREATE TABLE IF NOT EXISTS public.upload_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL, -- Generated session ID for anonymous users
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous
    client_ip INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- 2. Image uploads (all uploaded images with metadata)
CREATE TABLE IF NOT EXISTS public.image_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_session_id UUID REFERENCES public.upload_sessions(id) ON DELETE CASCADE,
    original_filename TEXT,
    file_size_bytes INTEGER,
    mime_type TEXT,
    storage_path TEXT NOT NULL, -- Supabase storage path
    storage_bucket TEXT NOT NULL, -- temp-pages or user-pages
    upload_order INTEGER, -- For multiple images in one upload
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Image analysis results (GPT vision output)
CREATE TABLE IF NOT EXISTS public.image_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_upload_id UUID REFERENCES public.image_uploads(id) ON DELETE CASCADE,
    analysis_prompt TEXT NOT NULL, -- The prompt sent to GPT
    raw_response TEXT, -- Raw GPT response for debugging
    parsed_analysis JSONB, -- Structured analysis result
    model_used TEXT DEFAULT 'gpt-4o-mini',
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Coloring page generations (DALL-E outputs)
CREATE TABLE IF NOT EXISTS public.page_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_session_id UUID REFERENCES public.upload_sessions(id) ON DELETE CASCADE,
    user_prompt TEXT, -- User's scene description
    style TEXT NOT NULL, -- classic, ghibli, bold
    difficulty INTEGER NOT NULL, -- 1-5 difficulty level
    generated_prompt TEXT NOT NULL, -- Final prompt sent to DALL-E
    dalle_response_url TEXT, -- DALL-E image URL
    storage_path TEXT, -- Our stored JPG path
    model_used TEXT DEFAULT 'dall-e-3',
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PDF exports (premium feature tracking)
CREATE TABLE IF NOT EXISTS public.pdf_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_generation_id UUID REFERENCES public.page_generations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Only auth users
    stripe_payment_intent_id TEXT,
    pdf_storage_path TEXT,
    export_settings JSONB, -- PDF generation settings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================

-- Upload sessions
CREATE INDEX IF NOT EXISTS idx_upload_sessions_session_id ON public.upload_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_user_id ON public.upload_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_created_at ON public.upload_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_expires_at ON public.upload_sessions(expires_at);

-- Image uploads
CREATE INDEX IF NOT EXISTS idx_image_uploads_session_id ON public.image_uploads(upload_session_id);
CREATE INDEX IF NOT EXISTS idx_image_uploads_created_at ON public.image_uploads(created_at DESC);

-- Image analyses
CREATE INDEX IF NOT EXISTS idx_image_analyses_image_id ON public.image_analyses(image_upload_id);
CREATE INDEX IF NOT EXISTS idx_image_analyses_created_at ON public.image_analyses(created_at DESC);

-- Page generations
CREATE INDEX IF NOT EXISTS idx_page_generations_session_id ON public.page_generations(upload_session_id);
CREATE INDEX IF NOT EXISTS idx_page_generations_style ON public.page_generations(style);
CREATE INDEX IF NOT EXISTS idx_page_generations_difficulty ON public.page_generations(difficulty);
CREATE INDEX IF NOT EXISTS idx_page_generations_created_at ON public.page_generations(created_at DESC);

-- PDF exports
CREATE INDEX IF NOT EXISTS idx_pdf_exports_user_id ON public.pdf_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_exports_created_at ON public.pdf_exports(created_at DESC);

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_exports ENABLE ROW LEVEL SECURITY;

-- Upload sessions: Users can see their own sessions + anonymous sessions they created
DROP POLICY IF EXISTS "Users can access their sessions" ON public.upload_sessions;
CREATE POLICY "Users can access their sessions" ON public.upload_sessions
  FOR ALL USING (
    user_id = auth.uid() OR 
    (user_id IS NULL AND session_id IN (
      SELECT session_id FROM public.upload_sessions WHERE user_id = auth.uid()
    ))
  );

-- Allow anonymous access for insert operations
DROP POLICY IF EXISTS "Allow anonymous session creation" ON public.upload_sessions;
CREATE POLICY "Allow anonymous session creation" ON public.upload_sessions
  FOR INSERT WITH CHECK (TRUE);

-- Image uploads: Access based on session ownership
DROP POLICY IF EXISTS "Users can access their uploads" ON public.image_uploads;
CREATE POLICY "Users can access their uploads" ON public.image_uploads
  FOR ALL USING (
    upload_session_id IN (
      SELECT id FROM public.upload_sessions 
      WHERE user_id = auth.uid() OR (user_id IS NULL)
    )
  );

-- Image analyses: Access based on image ownership
DROP POLICY IF EXISTS "Users can access their analyses" ON public.image_analyses;
CREATE POLICY "Users can access their analyses" ON public.image_analyses
  FOR ALL USING (
    image_upload_id IN (
      SELECT iu.id FROM public.image_uploads iu
      JOIN public.upload_sessions us ON iu.upload_session_id = us.id
      WHERE us.user_id = auth.uid() OR (us.user_id IS NULL)
    )
  );

-- Page generations: Access based on session ownership
DROP POLICY IF EXISTS "Users can access their generations" ON public.page_generations;
CREATE POLICY "Users can access their generations" ON public.page_generations
  FOR ALL USING (
    upload_session_id IN (
      SELECT id FROM public.upload_sessions 
      WHERE user_id = auth.uid() OR (user_id IS NULL)
    )
  );

-- PDF exports: Only authenticated users can access their own exports
DROP POLICY IF EXISTS "Users can access their pdf exports" ON public.pdf_exports;
CREATE POLICY "Users can access their pdf exports" ON public.pdf_exports
  FOR ALL USING (user_id = auth.uid());

-- ================================================================
-- CLEANUP FUNCTIONS
-- ================================================================

-- Function to clean up expired anonymous data (30+ days old)
CREATE OR REPLACE FUNCTION cleanup_expired_anonymous_data()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Delete expired anonymous upload sessions (cascades to related data)
  DELETE FROM public.upload_sessions 
  WHERE user_id IS NULL 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to extend session expiry (for active anonymous users)
CREATE OR REPLACE FUNCTION extend_session_expiry(session_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.upload_sessions 
  SET expires_at = NOW() + INTERVAL '30 days'
  WHERE session_id = session_uuid AND user_id IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- ANALYTICS FUNCTIONS
-- ================================================================

-- Function to get comprehensive analytics
CREATE OR REPLACE FUNCTION get_analytics_summary(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() - INTERVAL '30 days'),
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_sessions', (
      SELECT COUNT(*) FROM public.upload_sessions 
      WHERE created_at BETWEEN start_date AND end_date
    ),
    'anonymous_sessions', (
      SELECT COUNT(*) FROM public.upload_sessions 
      WHERE user_id IS NULL AND created_at BETWEEN start_date AND end_date
    ),
    'authenticated_sessions', (
      SELECT COUNT(*) FROM public.upload_sessions 
      WHERE user_id IS NOT NULL AND created_at BETWEEN start_date AND end_date
    ),
    'total_images_uploaded', (
      SELECT COUNT(*) FROM public.image_uploads iu
      JOIN public.upload_sessions us ON iu.upload_session_id = us.id
      WHERE us.created_at BETWEEN start_date AND end_date
    ),
    'total_pages_generated', (
      SELECT COUNT(*) FROM public.page_generations pg
      JOIN public.upload_sessions us ON pg.upload_session_id = us.id
      WHERE us.created_at BETWEEN start_date AND end_date
    ),
    'style_breakdown', (
      SELECT json_object_agg(style, count)
      FROM (
        SELECT pg.style, COUNT(*) as count
        FROM public.page_generations pg
        JOIN public.upload_sessions us ON pg.upload_session_id = us.id
        WHERE us.created_at BETWEEN start_date AND end_date
        GROUP BY pg.style
      ) styles
    ),
    'difficulty_breakdown', (
      SELECT json_object_agg(difficulty, count)
      FROM (
        SELECT pg.difficulty, COUNT(*) as count
        FROM public.page_generations pg
        JOIN public.upload_sessions us ON pg.upload_session_id = us.id
        WHERE us.created_at BETWEEN start_date AND end_date
        GROUP BY pg.difficulty
      ) difficulties
    ),
    'pdf_exports', (
      SELECT COUNT(*) FROM public.pdf_exports 
      WHERE created_at BETWEEN start_date AND end_date
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_anonymous_data() TO service_role;
GRANT EXECUTE ON FUNCTION extend_session_expiry(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_analytics_summary(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO service_role;

-- ================================================================
-- MIGRATION FROM OLD SCHEMA
-- ================================================================

-- Migrate existing data if tables exist
DO $$
BEGIN
  -- Check if old pages table exists and migrate data
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pages' AND table_schema = 'public') THEN
    -- Insert existing authenticated user data
    INSERT INTO public.upload_sessions (session_id, user_id, created_at, expires_at)
    SELECT gen_random_uuid(), user_id, created_at, NULL
    FROM public.pages
    WHERE user_id IS NOT NULL
    ON CONFLICT DO NOTHING;
    
    -- Note: This is a simplified migration. 
    -- Full migration would need to reconstruct the relationships
    RAISE NOTICE 'Migration placeholder: Existing pages table found. Manual migration may be needed.';
  END IF;
END $$;