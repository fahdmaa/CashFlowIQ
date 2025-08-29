-- PROFILE PICTURE DIAGNOSTICS SCRIPT
-- Run this to check the current state of your setup

-- 1. Check if user_profiles table exists and has profile_picture_url column
SELECT 
    'user_profiles table structure' as check_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 2. Check storage buckets
SELECT 
    'storage buckets' as check_name,
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets;

-- 3. Check storage policies
SELECT 
    'storage policies' as check_name,
    policyname,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
ORDER BY policyname;

-- 4. Check user_profiles policies
SELECT 
    'user_profiles policies' as check_name,
    policyname,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'user_profiles'
ORDER BY policyname;

-- 5. Check current user (if running as authenticated user)
SELECT 
    'current user info' as check_name,
    auth.uid() as user_id,
    (auth.jwt() ->> 'email') as email;

-- 6. Check if current user has a profile
SELECT 
    'user profile check' as check_name,
    up.*
FROM public.user_profiles up
WHERE up.id = auth.uid();

-- 7. Test storage bucket access (this should not error)
SELECT 
    'storage test' as check_name,
    'bucket accessible' as result
FROM storage.buckets 
WHERE id = 'avatar-pictures';