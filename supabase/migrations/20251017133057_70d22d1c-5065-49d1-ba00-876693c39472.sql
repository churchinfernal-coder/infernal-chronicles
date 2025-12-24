-- Drop incorrect storage policies for post-media
DROP POLICY IF EXISTS "Users can upload to post-media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own post-media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own post-media" ON storage.objects;

-- Create corrected storage policies for post-media bucket with coven_id/user_id folder structure
CREATE POLICY "Users can upload to post-media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-media' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can update their own post-media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'post-media' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can delete their own post-media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-media' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);