-- PROFILE PICTURE DIAGNOSTICS SCRIPT (ENHANCED VERSION)
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

-- 3. Check storage policies (focus on avatar-pictures)
SELECT 
    'storage policies (avatar-pictures)' as check_name,
    policyname,
    cmd,
    permissive,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND (policyname LIKE '%avatar%' OR qual LIKE '%avatar-pictures%')
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
    (auth.jwt() ->> 'email') as email,
    CASE WHEN auth.uid() IS NULL THEN 'NOT AUTHENTICATED' ELSE 'AUTHENTICATED' END as auth_status;

-- 6. Check if current user has a profile
SELECT 
    'user profile check' as check_name,
    up.id,
    up.username,
    up.profile_picture_url,
    up.created_at,
    up.updated_at
FROM public.user_profiles up
WHERE up.id = auth.uid();

-- 7. Test storage bucket access (this should not error)
SELECT 
    'storage test' as check_name,
    'bucket accessible' as result,
    id,
    public,
    file_size_limit
FROM storage.buckets 
WHERE id = 'avatar-pictures';

-- 8. Test path parsing logic (this is what the RLS policy uses)
SELECT 
    'path parsing test' as check_name,
    'test-user-id/profile-123456.jpg' as test_path,
    (string_to_array('test-user-id/profile-123456.jpg', '/'))[1] as extracted_user_id,
    CASE 
        WHEN (string_to_array('test-user-id/profile-123456.jpg', '/'))[1] = 'test-user-id' 
        THEN 'PATH PARSING WORKS' 
        ELSE 'PATH PARSING FAILED' 
    END as parsing_result;

-- 9. Check if there are any existing objects in the bucket
SELECT 
    'existing objects' as check_name,
    name,
    bucket_id,
    created_at
FROM storage.objects 
WHERE bucket_id = 'avatar-pictures'
ORDER BY created_at DESC
LIMIT 10;

-- 10. Test authentication context
SELECT 
    'auth context test' as check_name,
    auth.role() as current_role,
    auth.uid()::text as user_id_text,
    length(auth.uid()::text) as user_id_length;