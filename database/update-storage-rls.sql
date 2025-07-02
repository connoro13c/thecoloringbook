-- Migration: Update Storage RLS Policies for Single Bucket System
-- Created: 2025-01-07
-- Phase 1: Simplify Storage Layer - Single 'pages' bucket with RLS policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read for public pages" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to manage their own folder" ON storage.objects;

-- Allow public read access for files in the 'public' folder
CREATE POLICY "Allow public read for public pages"
ON storage.objects FOR SELECT
USING ( bucket_id = 'pages' AND (storage.foldername(name))[1] = 'public' );

-- Allow authenticated users to manage their own files in their user folder
CREATE POLICY "Allow authenticated users to manage their own folder"
ON storage.objects FOR ALL
USING ( bucket_id = 'pages' AND auth.uid()::text = (storage.foldername(name))[1] )
WITH CHECK ( bucket_id = 'pages' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Allow service role to manage files in public folder (for anonymous uploads)
CREATE POLICY "Allow service role to manage public folder"
ON storage.objects FOR ALL
USING ( bucket_id = 'pages' AND (storage.foldername(name))[1] = 'public' );
