-- Create pages table for storing user's coloring pages
-- This supports the unified storage architecture with single 'pages' bucket
CREATE TABLE public.pages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt text NOT NULL,
  style text NOT NULL,
  difficulty integer DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5),
  jpg_path text,
  pdf_path text,
  deleted_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Create policy: users can manage their own pages
CREATE POLICY "Users can manage own pages" ON public.pages
  FOR ALL USING (auth.uid() = user_id);

-- Create policy: users can only read non-deleted pages
CREATE POLICY "Users can read own non-deleted pages" ON public.pages
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Create indexes for performance
CREATE INDEX idx_pages_user_id ON public.pages(user_id);
CREATE INDEX idx_pages_created_at ON public.pages(created_at DESC);
CREATE INDEX idx_pages_user_id_created_at ON public.pages(user_id, created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_pages_updated_at 
  BEFORE UPDATE ON public.pages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.pages IS 'Stores user coloring pages with unified storage paths';
COMMENT ON COLUMN public.pages.jpg_path IS 'Path to JPG file in unified pages bucket';
COMMENT ON COLUMN public.pages.pdf_path IS 'Path to PDF file in unified pages bucket';
COMMENT ON COLUMN public.pages.difficulty IS 'Line complexity level 1-5 (1=thick, 5=thin)';
COMMENT ON COLUMN public.pages.deleted_at IS 'Soft delete timestamp';
