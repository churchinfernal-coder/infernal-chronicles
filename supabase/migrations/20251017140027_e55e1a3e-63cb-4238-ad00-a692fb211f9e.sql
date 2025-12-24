-- Create storage bucket for coven sigils
INSERT INTO storage.buckets (id, name, public)
VALUES ('coven-sigils', 'coven-sigils', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for coven sigils
CREATE POLICY "Anyone can view coven sigils"
ON storage.objects FOR SELECT
USING (bucket_id = 'coven-sigils');

CREATE POLICY "Authenticated users can upload coven sigils"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'coven-sigils' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their coven sigils"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'coven-sigils' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their coven sigils"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'coven-sigils' 
  AND auth.uid() IS NOT NULL
);