-- Add foreign key from coven_posts to auth.users if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'coven_posts_user_id_fkey' 
    AND table_name = 'coven_posts'
  ) THEN
    ALTER TABLE public.coven_posts 
    ADD CONSTRAINT coven_posts_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Storage policies for post-media bucket
CREATE POLICY "Users can upload to post-media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view post-media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'post-media');

CREATE POLICY "Users can update their own post-media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own post-media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);