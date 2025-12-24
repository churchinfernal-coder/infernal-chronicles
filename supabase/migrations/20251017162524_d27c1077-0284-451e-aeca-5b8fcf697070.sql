-- Drop existing policies and recreate with correct syntax
DROP POLICY IF EXISTS "Admins can insert AI images for any user" ON public.ai_generated_images;
DROP POLICY IF EXISTS "Admins can update all AI images" ON public.ai_generated_images;
DROP POLICY IF EXISTS "Admins can delete all AI images" ON public.ai_generated_images;

-- Admins can insert AI images for any user
CREATE POLICY "Admins can insert AI images for any user"
  ON public.ai_generated_images
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can update all AI images
CREATE POLICY "Admins can update all AI images"
  ON public.ai_generated_images
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Admins can delete all AI images  
CREATE POLICY "Admins can delete all AI images"
  ON public.ai_generated_images
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));