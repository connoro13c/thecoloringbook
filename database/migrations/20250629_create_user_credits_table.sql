-- Create user_credits table for tracking user credit balances
CREATE TABLE public.user_credits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  credits integer DEFAULT 0 CHECK (credits >= 0) NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Create policy: users can only read their own credits
CREATE POLICY "Users can read own credits" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy: users can update their own credits (for admin operations)
CREATE POLICY "Users can update own credits" ON public.user_credits
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy: service role can insert credits for new users
CREATE POLICY "Service role can insert credits" ON public.user_credits
  FOR INSERT WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_user_credits_user_id ON public.user_credits(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_credits_updated_at 
  BEFORE UPDATE ON public.user_credits 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
