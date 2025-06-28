-- Migration 004: Enable Row Level Security on pages table
-- Ensures users can only access their own pages

-- Enable RLS
alter table pages enable row level security;

-- Policy: Users can only see/modify their own pages
create policy "Users can only access their own pages"
  on pages for all
  using (auth.uid() = user_id);

-- Policy: Authenticated users can insert pages for themselves
create policy "Users can insert their own pages"
  on pages for insert
  with check (auth.uid() = user_id);

-- Storage policies for user-pages bucket
-- These need to be applied via Supabase dashboard or CLI

-- insert into storage.buckets (id, name, public) 
-- values ('user-pages', 'user-pages', false);

-- create policy "Users can upload their own pages"
-- on storage.objects for insert
-- with check (
--   bucket_id = 'user-pages' and
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- create policy "Users can view their own pages"
-- on storage.objects for select
-- using (
--   bucket_id = 'user-pages' and
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- create policy "Users can update their own pages"
-- on storage.objects for update
-- using (
--   bucket_id = 'user-pages' and
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- create policy "Users can delete their own pages"
-- on storage.objects for delete
-- using (
--   bucket_id = 'user-pages' and
--   auth.uid()::text = (storage.foldername(name))[1]
-- );
