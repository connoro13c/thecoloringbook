-- Create storage buckets for the new anonymous/auth architecture

-- Create temp-pages bucket (public, for anonymous users)
INSERT INTO storage.buckets (id, name, public)
VALUES ('temp-pages', 'temp-pages', true)
ON CONFLICT (id) DO NOTHING;

-- Create user-pages bucket (private, for authenticated users)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-pages', 'user-pages', false)
ON CONFLICT (id) DO NOTHING;

-- Set cache control headers for temp-pages bucket
-- Note: cache_control_max_age column may not exist in all Supabase versions
-- UPDATE storage.buckets 
-- SET cache_control_max_age = 120, 
--     cache_control = 'max-age=120, public' 
-- WHERE id = 'temp-pages';

-- RLS policies for temp-pages bucket (public access)
CREATE POLICY "Allow anonymous uploads to temp-pages" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'temp-pages');

CREATE POLICY "Allow public downloads from temp-pages" ON storage.objects
FOR SELECT USING (bucket_id = 'temp-pages');

CREATE POLICY "Allow public deletion from temp-pages" ON storage.objects
FOR DELETE USING (bucket_id = 'temp-pages');

-- RLS policies for user-pages bucket (authenticated only)
CREATE POLICY "Allow authenticated uploads to user-pages" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-pages' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to view their own pages" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-pages' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to delete their own pages" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-pages' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Function to auto-cleanup temp files older than 2 minutes
CREATE OR REPLACE FUNCTION cleanup_temp_files()
RETURNS void AS $$
BEGIN
  DELETE FROM storage.objects 
  WHERE bucket_id = 'temp-pages' 
  AND created_at < NOW() - INTERVAL '2 minutes';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup to run every minute (commented for local dev)
-- SELECT cron.schedule('cleanup-temp-files', '* * * * *', 'SELECT cleanup_temp_files();');