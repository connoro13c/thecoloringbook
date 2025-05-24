-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  credits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Job status enums
DO $$ BEGIN
    CREATE TYPE public.style AS ENUM ('CLASSIC', 'MANGA', 'BOLD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.job_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PAID');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  style public.style NOT NULL,
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5),
  status public.job_status DEFAULT 'PENDING',
  input_url TEXT,
  output_url TEXT,
  pdf_url TEXT,
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own jobs
DROP POLICY IF EXISTS "Users can view own jobs" ON public.jobs;
CREATE POLICY "Users can view own jobs" ON public.jobs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own jobs" ON public.jobs;
CREATE POLICY "Users can insert own jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own jobs" ON public.jobs;
CREATE POLICY "Users can update own jobs" ON public.jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);

-- Function to get user job history
CREATE OR REPLACE FUNCTION get_user_job_history(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  prompt TEXT,
  style public.style,
  difficulty INTEGER,
  status public.job_status,
  output_url TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    j.prompt,
    j.style,
    j.difficulty,
    j.status,
    j.output_url,
    j.pdf_url,
    j.created_at
  FROM public.jobs j
  WHERE j.user_id = user_uuid
  ORDER BY j.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_job_history(UUID) TO authenticated;

-- GDPR Compliance: Function to delete all user data
CREATE OR REPLACE FUNCTION delete_user_data(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Delete all user jobs (cascades to related data)
  DELETE FROM public.jobs WHERE user_id = user_uuid;
  
  -- Delete user profile
  DELETE FROM public.users WHERE id = user_uuid;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users for their own data
GRANT EXECUTE ON FUNCTION delete_user_data(UUID) TO authenticated;