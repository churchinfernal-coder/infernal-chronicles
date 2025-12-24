-- Add missing columns to covens table
ALTER TABLE public.covens 
ADD COLUMN IF NOT EXISTS header_image_url text,
ADD COLUMN IF NOT EXISTS sigil text,
ADD COLUMN IF NOT EXISTS invite_code text UNIQUE;

-- Create coven_media table for photo/video uploads
CREATE TABLE IF NOT EXISTS public.coven_media (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coven_id uuid NOT NULL REFERENCES public.covens(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL,
  caption text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coven_media ENABLE ROW LEVEL SECURITY;

-- Coven members can view media
CREATE POLICY "Coven members can view media"
ON public.coven_media
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.coven_members cm
    WHERE cm.coven_id = coven_media.coven_id AND cm.user_id = auth.uid()
  )
);

-- Coven members can upload media
CREATE POLICY "Coven members can upload media"
ON public.coven_media
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.coven_members cm
    WHERE cm.coven_id = coven_media.coven_id AND cm.user_id = auth.uid()
  )
);

-- Users can delete their own media
CREATE POLICY "Users can delete their own media"
ON public.coven_media
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coven_media_coven_id ON public.coven_media(coven_id);
CREATE INDEX IF NOT EXISTS idx_coven_media_user_id ON public.coven_media(user_id);

-- Generate unique invite codes for existing covens
UPDATE public.covens 
SET invite_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
WHERE invite_code IS NULL;