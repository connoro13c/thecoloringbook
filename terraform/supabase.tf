# Supabase Storage Bucket for uploads
resource "supabase_bucket" "uploads" {
  project_ref = supabase_project.main.id
  name        = "uploads"
  public      = false
  file_size_limit = 10485760  # 10MB
  allowed_mime_types = [
    "image/jpeg",
    "image/png",
    "application/pdf"
  ]
}

# Storage policy for authenticated users
resource "supabase_storage_policy" "uploads_policy" {
  project_ref = supabase_project.main.id
  bucket_name = supabase_bucket.uploads.name
  name        = "Users can upload their own files"
  definition  = "bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]"
  command     = "INSERT"
  roles       = ["authenticated"]
}

# Storage policy for users to read their own files
resource "supabase_storage_policy" "uploads_read_policy" {
  project_ref = supabase_project.main.id
  bucket_name = supabase_bucket.uploads.name
  name        = "Users can read their own files"
  definition  = "bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]"
  command     = "SELECT"
  roles       = ["authenticated"]
}

# RLS Policies (to be created via SQL)
resource "supabase_sql" "create_tables" {
  project_ref = supabase_project.main.id
  sql = <<-EOF
    -- Enable RLS
    ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
    
    -- Users table
    CREATE TABLE public.users (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Enable RLS on users
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    
    -- Users can only see their own data
    CREATE POLICY "Users can view own profile" ON public.users
      FOR SELECT USING (auth.uid() = id);
    
    CREATE POLICY "Users can insert own profile" ON public.users
      FOR INSERT WITH CHECK (auth.uid() = id);
    
    -- Job status enum
    CREATE TYPE public.style AS ENUM ('CLASSIC', 'MANGA', 'BOLD');
    CREATE TYPE public.job_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PAID');
    
    -- Jobs table
    CREATE TABLE public.jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      prompt TEXT NOT NULL,
      style public.style NOT NULL,
      difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5),
      status public.job_status DEFAULT 'PENDING',
      input_url TEXT,
      output_url TEXT,
      pdf_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Enable RLS on jobs
    ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
    
    -- Users can only see their own jobs
    CREATE POLICY "Users can view own jobs" ON public.jobs
      FOR SELECT USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own jobs" ON public.jobs
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    
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
    CREATE TRIGGER update_jobs_updated_at
      BEFORE UPDATE ON public.jobs
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  EOF
}

output "uploads_bucket_name" {
  value = supabase_bucket.uploads.name
}