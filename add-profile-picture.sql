-- COMPREHENSIVE PROFILE PICTURE SETUP SCRIPT
-- Run this entire script in your Supabase SQL Editor

-- 1. First, add the profile_picture_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'profile_picture_url'
    ) THEN
        ALTER TABLE public.user_profiles ADD COLUMN profile_picture_url TEXT;
    END IF;
END $$;

-- 2. Create the avatar-pictures bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
    'avatar-pictures', 
    'avatar-pictures', 
    true,
    false,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 3. Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update their own avatar." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete their own avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- 4. Create comprehensive storage policies
CREATE POLICY "Users can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatar-pictures');

CREATE POLICY "Users can upload their own avatars" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'avatar-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'avatar-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
    bucket_id = 'avatar-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Ensure user_profiles RLS policies allow profile_picture_url updates
-- Drop and recreate the user profiles update policy to ensure it covers all columns
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6. Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- 7. Verify the setup (these should return rows, not errors)
SELECT 'Bucket exists:' as check_type, count(*) as result 
FROM storage.buckets WHERE id = 'avatar-pictures';

SELECT 'Column exists:' as check_type, count(*) as result 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles' 
AND column_name = 'profile_picture_url';

SELECT 'Storage policies:' as check_type, count(*) as result 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage' 
AND policyname LIKE '%avatar%';

SELECT 'User profile policies:' as check_type, count(*) as result 
FROM pg_policies 
WHERE tablename = 'user_profiles' 
AND schemaname = 'public';