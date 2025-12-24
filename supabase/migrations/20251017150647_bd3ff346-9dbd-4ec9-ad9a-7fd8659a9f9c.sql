-- Create storage bucket for design editor images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'design-editor',
  'design-editor',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for design-editor bucket
CREATE POLICY "Admins can upload design images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'design-editor' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update design images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'design-editor' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete design images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'design-editor' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Public can view design images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'design-editor');

-- Table for storing design projects
CREATE TABLE IF NOT EXISTS public.design_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  canvas_data JSONB NOT NULL, -- Fabric.js canvas JSON
  thumbnail_url TEXT,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.design_projects ENABLE ROW LEVEL SECURITY;

-- RLS policies for design_projects
CREATE POLICY "Admins can view all design projects"
ON public.design_projects
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create design projects"
ON public.design_projects
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND
  auth.uid() = user_id
);

CREATE POLICY "Admins can update design projects"
ON public.design_projects
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete design projects"
ON public.design_projects
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_design_projects_updated_at
BEFORE UPDATE ON public.design_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();