-- STEP 1: Create upload_sessions table ONLY
-- Run this first, then proceed to step 2

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.upload_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    user_id UUID,
    client_ip INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON public.upload_sessions FOR ALL USING (TRUE);