-- Add new profile fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS infernal_nickname TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT[],
ADD COLUMN IF NOT EXISTS infernal_identity TEXT,
ADD COLUMN IF NOT EXISTS header_image_url TEXT;

-- Create storage buckets for profile and header images
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('profile-images', 'profile-images', true),
  ('header-images', 'header-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for profile images
CREATE POLICY "Profile images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload their own profile image"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile image"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile image"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policies for header images
CREATE POLICY "Header images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'header-images');

CREATE POLICY "Users can upload their own header image"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'header-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own header image"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'header-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own header image"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'header-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);