-- Storage buckets setup
-- Run this in the Supabase SQL editor after creating your project

-- Create storage buckets
insert into storage.buckets (id, name, public) 
values 
  ('temp-pages', 'temp-pages', true),
  ('user-pages', 'user-pages', false);

-- Storage policies for temp-pages (public bucket)
create policy "Public bucket - anyone can upload" on storage.objects
  for insert with check (bucket_id = 'temp-pages');

create policy "Public bucket - anyone can view" on storage.objects
  for select using (bucket_id = 'temp-pages');

create policy "Public bucket - anyone can delete" on storage.objects
  for delete using (bucket_id = 'temp-pages');

-- Storage policies for user-pages (private bucket)
create policy "Users can upload to their folder" on storage.objects
  for insert with check (
    bucket_id = 'user-pages' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view their own files" on storage.objects
  for select using (
    bucket_id = 'user-pages' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own files" on storage.objects
  for update using (
    bucket_id = 'user-pages' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own files" on storage.objects
  for delete using (
    bucket_id = 'user-pages' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
