-- Storage Bucket Setup for Coach Uploads
-- Run this in Supabase SQL Editor

-- ============================================
-- TWO-BUCKET ARCHITECTURE
-- ============================================
-- 1. coach-public: Public bucket for logos, profile images
-- 2. coach-content: Private bucket for paid content (audio, video, etc.)

-- ============================================
-- BUCKET 1: PUBLIC BUCKET (coach-public)
-- ============================================
-- Create via Supabase Dashboard > Storage:
-- - Name: coach-public
-- - Public bucket: YES (checked)
-- - File size limit: 5MB

-- Policies for public bucket
CREATE POLICY "Coaches can upload to own folder in public bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'coach-public' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.coaches 
    WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Coaches can update own files in public bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'coach-public'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.coaches 
    WHERE profile_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'coach-public'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Coaches can delete own files in public bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'coach-public'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.coaches 
    WHERE profile_id = auth.uid()
  )
);

-- ============================================
-- BUCKET 2: PRIVATE BUCKET (coach-content)
-- ============================================
-- Create via Supabase Dashboard > Storage:
-- - Name: coach-content
-- - Public bucket: NO (unchecked) ← PRIVATE
-- - File size limit: 100MB (or as needed)

-- Policies for private bucket
CREATE POLICY "Coaches can upload to own folder in content bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'coach-content' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.coaches 
    WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Coaches can update own files in content bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'coach-content'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.coaches 
    WHERE profile_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'coach-content'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Coaches can delete own files in content bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'coach-content'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.coaches 
    WHERE profile_id = auth.uid()
  )
);

-- Coaches can list/view their own files
CREATE POLICY "Coaches can view own files in content bucket"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'coach-content'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.coaches 
    WHERE profile_id = auth.uid()
  )
);

-- ============================================
-- SETUP INSTRUCTIONS
-- ============================================
-- 1. Go to Supabase Dashboard > Storage
-- 
-- 2. Create PUBLIC bucket:
--    - Click "New bucket"
--    - Name: coach-public
--    - Public bucket: YES (checked)
--    - File size limit: 5MB
--    - Click "Create bucket"
--
-- 3. Create PRIVATE bucket:
--    - Click "New bucket"  
--    - Name: coach-content
--    - Public bucket: NO (unchecked)
--    - File size limit: 100MB (or as needed)
--    - Click "Create bucket"
--
-- 4. Run this SQL to create all policies
--
-- 5. Update your code:
--    - Logos → coach-public bucket (public URLs)
--    - Audio/Video/Paid Content → coach-content bucket (signed URLs)

-- ============================================
-- USAGE NOTES
-- ============================================
-- PUBLIC BUCKET (coach-public):
-- - Use getPublicUrl() for logos, profile images
-- - URLs never expire
-- - Anyone can access if they have the URL
-- - Good for: logos, landing page images, profile pics
--
-- PRIVATE BUCKET (coach-content):
-- - Use createSignedUrl() with expiration time
-- - Verify user subscription before generating signed URL
-- - URLs expire after specified time (e.g., 1 hour)
-- - Good for: audio, video, articles, paid content
