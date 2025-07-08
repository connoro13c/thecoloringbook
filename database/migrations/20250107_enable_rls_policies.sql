-- Create main tables with RLS policies enabled
-- Based on schema in AGENT.md

-- Pages table for authenticated user pages
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    prompt TEXT NOT NULL,
    style TEXT NOT NULL,
    difficulty INTEGER DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5),
    jpg_path TEXT,
    pdf_path TEXT,
    deleted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User credits table
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
    credits INTEGER DEFAULT 0 CHECK (credits >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    stripe_payment_id TEXT UNIQUE NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    credits_granted INTEGER NOT NULL CHECK (credits_granted > 0),
    stripe_status TEXT DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pages table
-- Users can only access their own pages
CREATE POLICY "users_own_pages" ON pages
    FOR ALL 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- RLS Policies for user_credits table  
-- Users can only read their own credits
CREATE POLICY "users_read_own_credits" ON user_credits
    FOR SELECT 
    USING (user_id = auth.uid());

-- Users can insert their own credit record
CREATE POLICY "users_create_own_credits" ON user_credits
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());

-- Only service role can update credits (for payment processing)
CREATE POLICY "service_role_update_credits" ON user_credits
    FOR UPDATE 
    USING (auth.role() = 'service_role');

-- RLS Policies for donations table
-- Users can only read their own donations
CREATE POLICY "users_read_own_donations" ON donations
    FOR SELECT 
    USING (user_id = auth.uid());

-- Only service role can insert/update donations (Stripe webhooks)
CREATE POLICY "service_role_manage_donations" ON donations
    FOR ALL 
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pages_user_id ON pages(user_id);
CREATE INDEX IF NOT EXISTS idx_pages_created_at ON pages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_stripe_payment_id ON donations(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(stripe_status);

-- Add updated_at trigger for pages table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;
DROP TRIGGER IF EXISTS update_user_credits_updated_at ON user_credits;
DROP TRIGGER IF EXISTS update_donations_updated_at ON donations;

-- Create triggers
CREATE TRIGGER update_pages_updated_at 
    BEFORE UPDATE ON pages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at 
    BEFORE UPDATE ON user_credits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at 
    BEFORE UPDATE ON donations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
