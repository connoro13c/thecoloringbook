-- Cleanup script - run this first if you get "already exists" errors

-- Drop existing tables and policies
drop table if exists public.pages cascade;
drop table if exists public.page_sessions cascade;

-- Drop existing functions
drop function if exists public.handle_updated_at() cascade;

-- Drop existing storage policies (if any)
drop policy if exists "Public bucket - anyone can upload" on storage.objects;
drop policy if exists "Public bucket - anyone can view" on storage.objects;
drop policy if exists "Public bucket - anyone can delete" on storage.objects;
drop policy if exists "Users can upload to their folder" on storage.objects;
drop policy if exists "Users can view their own files" on storage.objects;
drop policy if exists "Users can update their own files" on storage.objects;
drop policy if exists "Users can delete their own files" on storage.objects;

-- Remove all objects from buckets first
delete from storage.objects where bucket_id in ('temp-pages', 'user-pages');

-- Now remove existing buckets
delete from storage.buckets where id in ('temp-pages', 'user-pages');
