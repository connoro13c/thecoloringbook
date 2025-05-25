-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Anonymous sessions (temporary tracking for cleanup and rate limiting)
CREATE TABLE IF NOT EXISTS public.page_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_ip INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Authenticated user pages (permanent storage)
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt TEXT,
    style TEXT,
    jpg_path TEXT,
    pdf_path TEXT,
    paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for pages: users can only see their own pages
DROP POLICY IF EXISTS "Users can view own pages" ON public.pages;
CREATE POLICY "Users can view own pages" ON public.pages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own pages" ON public.pages;
CREATE POLICY "Users can insert own pages" ON public.pages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pages" ON public.pages;
CREATE POLICY "Users can update own pages" ON public.pages
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own pages" ON public.pages;
CREATE POLICY "Users can delete own pages" ON public.pages
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for page_sessions: allow all operations (anonymous sessions)
DROP POLICY IF EXISTS "Allow all operations on page_sessions" ON public.page_sessions;
CREATE POLICY "Allow all operations on page_sessions" ON public.page_sessions
  FOR ALL USING (TRUE);

-- Indexes for performance and rate limiting
CREATE INDEX IF NOT EXISTS idx_pages_user_id ON public.pages(user_id);
CREATE INDEX IF NOT EXISTS idx_pages_created_at ON public.pages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_sessions_created_at ON public.page_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_page_sessions_client_ip_created_at ON public.page_sessions(client_ip, created_at);

-- Function to get user page history
CREATE OR REPLACE FUNCTION get_user_pages(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  prompt TEXT,
  style TEXT,
  jpg_path TEXT,
  pdf_path TEXT,
  paid BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.prompt,
    p.style,
    p.jpg_path,
    p.pdf_path,
    p.paid,
    p.created_at
  FROM public.pages p
  WHERE p.user_id = user_uuid
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_pages(UUID) TO authenticated;

-- GDPR Compliance: Function to delete all user data
CREATE OR REPLACE FUNCTION delete_user_data(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Delete all user pages (cascades to related data)
  DELETE FROM public.pages WHERE user_id = user_uuid;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users for their own data
GRANT EXECUTE ON FUNCTION delete_user_data(UUID) TO authenticated;
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Anonymous sessions (temporary tracking for cleanup)
CREATE TABLE IF NOT EXISTS public.page_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Authenticated user pages (permanent storage)
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt TEXT,
    style TEXT,
    jpg_path TEXT,
    pdf_path TEXT,
    paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for pages: users can only see their own pages
DROP POLICY IF EXISTS "Users can view own pages" ON public.pages;
CREATE POLICY "Users can view own pages" ON public.pages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own pages" ON public.pages;
CREATE POLICY "Users can insert own pages" ON public.pages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pages" ON public.pages;
CREATE POLICY "Users can update own pages" ON public.pages
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own pages" ON public.pages;
CREATE POLICY "Users can delete own pages" ON public.pages
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for page_sessions: allow all operations (anonymous sessions)
DROP POLICY IF EXISTS "Allow all operations on page_sessions" ON public.page_sessions;
CREATE POLICY "Allow all operations on page_sessions" ON public.page_sessions
  FOR ALL USING (TRUE);

-- Auto-cleanup functionality removed

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pages_user_id ON public.pages(user_id);
CREATE INDEX IF NOT EXISTS idx_pages_created_at ON public.pages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_sessions_created_at ON public.page_sessions(created_at);

-- Function to get user page history
CREATE OR REPLACE FUNCTION get_user_pages(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  prompt TEXT,
  style TEXT,
  jpg_path TEXT,
  pdf_path TEXT,
  paid BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.prompt,
    p.style,
    p.jpg_path,
    p.pdf_path,
    p.paid,
    p.created_at
  FROM public.pages p
  WHERE p.user_id = user_uuid
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_pages(UUID) TO authenticated;

-- GDPR Compliance: Function to delete all user data
CREATE OR REPLACE FUNCTION delete_user_data(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Delete all user pages (cascades to related data)
  DELETE FROM public.pages WHERE user_id = user_uuid;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users for their own data
GRANT EXECUTE ON FUNCTION delete_user_data(UUID) TO authenticated;