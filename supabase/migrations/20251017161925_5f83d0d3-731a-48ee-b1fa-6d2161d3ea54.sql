-- Create table for AI generated images
CREATE TABLE IF NOT EXISTS public.ai_generated_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  enhanced_prompt TEXT,
  style TEXT,
  color_scheme TEXT,
  composition TEXT,
  effects TEXT[],
  detail_level TEXT,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  width INTEGER DEFAULT 1024,
  height INTEGER DEFAULT 1024,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_generated_images ENABLE ROW LEVEL SECURITY;

-- Users can view their own generated images
CREATE POLICY "Users can view their own AI images"
  ON public.ai_generated_images
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own AI images
CREATE POLICY "Users can create AI images"
  ON public.ai_generated_images
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own AI images
CREATE POLICY "Users can delete their own AI images"
  ON public.ai_generated_images
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all AI images
CREATE POLICY "Admins can view all AI images"
  ON public.ai_generated_images
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_ai_generated_images_updated_at
  BEFORE UPDATE ON public.ai_generated_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_ai_generated_images_user_id ON public.ai_generated_images(user_id);
CREATE INDEX idx_ai_generated_images_created_at ON public.ai_generated_images(created_at DESC);