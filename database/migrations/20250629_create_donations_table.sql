-- Create donations table for tracking Stripe payments and credit grants
CREATE TABLE public.donations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_id text UNIQUE NOT NULL,
  amount_cents integer NOT NULL,
  credits_granted integer NOT NULL,
  stripe_status text DEFAULT 'pending' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Create policy: users can read their own donations
CREATE POLICY "Users can read own donations" ON public.donations
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy: service role can insert/update donations (for webhook processing)
CREATE POLICY "Service role can manage donations" ON public.donations
  FOR ALL WITH CHECK (true);

-- Create indexes for faster lookups
CREATE INDEX idx_donations_user_id ON public.donations(user_id);
CREATE INDEX idx_donations_stripe_payment_id ON public.donations(stripe_payment_id);
CREATE INDEX idx_donations_stripe_status ON public.donations(stripe_status);

-- Create updated_at trigger
CREATE TRIGGER update_donations_updated_at 
  BEFORE UPDATE ON public.donations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
