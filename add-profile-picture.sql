-- Add profile picture functionality to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN profile_picture_url TEXT;

-- Create avatar_pictures bucket in Supabase Storage (run this in Supabase dashboard SQL editor)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatar-pictures', 'avatar-pictures', true);

-- Set up RLS policies for avatar-pictures bucket
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects
FOR SELECT USING (bucket_id = 'avatar-pictures');

CREATE POLICY "Anyone can upload an avatar." ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatar-pictures');

CREATE POLICY "Anyone can update their own avatar." ON storage.objects
FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can delete their own avatar." ON storage.objects
FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);