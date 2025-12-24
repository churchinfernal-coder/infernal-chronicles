-- Create storage bucket for game assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('game-assets', 'game-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for game-assets bucket
CREATE POLICY "Users can upload game assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'game-assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their game assets"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'game-assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their game assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'game-assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their game assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'game-assets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Published games are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'game-assets');