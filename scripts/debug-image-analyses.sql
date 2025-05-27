-- Check if image_analyses table exists and its structure
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'image_analyses'
) as table_exists;

-- If it exists, show its structure
\d+ public.image_analyses;

-- Show recent errors if any
SELECT * FROM pg_stat_user_tables WHERE relname = 'image_analyses';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'image_analyses';