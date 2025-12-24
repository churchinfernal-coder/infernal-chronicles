-- Create cinematic_projects table for managing animation projects
CREATE TABLE IF NOT EXISTS public.cinematic_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  description text,
  fps integer DEFAULT 24 NOT NULL,
  duration_seconds numeric DEFAULT 1.0,
  resolution_width integer DEFAULT 1920,
  resolution_height integer DEFAULT 1080,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'rendering', 'completed', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create cinematic_frames table for individual frames
CREATE TABLE IF NOT EXISTS public.cinematic_frames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.cinematic_projects(id) ON DELETE CASCADE NOT NULL,
  frame_number integer NOT NULL,
  image_url text,
  is_keyframe boolean DEFAULT false,
  duration_frames integer DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, frame_number)
);

-- Create cinematic_assets table for media library
CREATE TABLE IF NOT EXISTS public.cinematic_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  project_id uuid REFERENCES public.cinematic_projects(id) ON DELETE SET NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('image', 'video', 'audio')),
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size_bytes bigint,
  mime_type text,
  thumbnail_url text,
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create cinematic_layers table for layer management
CREATE TABLE IF NOT EXISTS public.cinematic_layers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.cinematic_projects(id) ON DELETE CASCADE NOT NULL,
  layer_name text NOT NULL,
  layer_order integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  is_locked boolean DEFAULT false,
  opacity numeric DEFAULT 1.0 CHECK (opacity >= 0 AND opacity <= 1),
  blend_mode text DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create cinematic_render_queue table for render management
CREATE TABLE IF NOT EXISTS public.cinematic_render_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.cinematic_projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  status text DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  output_format text DEFAULT 'mp4',
  output_url text,
  render_settings jsonb DEFAULT '{}'::jsonb,
  progress integer DEFAULT 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create cinematic_versions table for version control
CREATE TABLE IF NOT EXISTS public.cinematic_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.cinematic_projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  version_number integer NOT NULL,
  description text,
  snapshot_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, version_number)
);

-- Enable RLS on all tables
ALTER TABLE public.cinematic_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinematic_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinematic_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinematic_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinematic_render_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinematic_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cinematic_projects
CREATE POLICY "Admins can manage all projects"
  ON public.cinematic_projects FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create their own projects"
  ON public.cinematic_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own projects"
  ON public.cinematic_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.cinematic_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.cinematic_projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for cinematic_frames
CREATE POLICY "Admins can manage all frames"
  ON public.cinematic_frames FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage frames in their projects"
  ON public.cinematic_frames FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.cinematic_projects
    WHERE id = cinematic_frames.project_id
    AND user_id = auth.uid()
  ));

-- RLS Policies for cinematic_assets
CREATE POLICY "Admins can manage all assets"
  ON public.cinematic_assets FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage their own assets"
  ON public.cinematic_assets FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for cinematic_layers
CREATE POLICY "Admins can manage all layers"
  ON public.cinematic_layers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage layers in their projects"
  ON public.cinematic_layers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.cinematic_projects
    WHERE id = cinematic_layers.project_id
    AND user_id = auth.uid()
  ));

-- RLS Policies for cinematic_render_queue
CREATE POLICY "Admins can view all renders"
  ON public.cinematic_render_queue FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own renders"
  ON public.cinematic_render_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create render jobs"
  ON public.cinematic_render_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for cinematic_versions
CREATE POLICY "Admins can manage all versions"
  ON public.cinematic_versions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage versions in their projects"
  ON public.cinematic_versions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.cinematic_projects
    WHERE id = cinematic_versions.project_id
    AND user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cinematic_projects_user ON public.cinematic_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_cinematic_frames_project ON public.cinematic_frames(project_id, frame_number);
CREATE INDEX IF NOT EXISTS idx_cinematic_assets_user ON public.cinematic_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_cinematic_assets_project ON public.cinematic_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_cinematic_layers_project ON public.cinematic_layers(project_id, layer_order);
CREATE INDEX IF NOT EXISTS idx_cinematic_render_status ON public.cinematic_render_queue(status);
CREATE INDEX IF NOT EXISTS idx_cinematic_versions_project ON public.cinematic_versions(project_id, version_number);

-- Trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_cinematic_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cinematic_projects_updated_at
  BEFORE UPDATE ON public.cinematic_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_cinematic_updated_at();

CREATE TRIGGER update_cinematic_frames_updated_at
  BEFORE UPDATE ON public.cinematic_frames
  FOR EACH ROW
  EXECUTE FUNCTION update_cinematic_updated_at();

CREATE TRIGGER update_cinematic_layers_updated_at
  BEFORE UPDATE ON public.cinematic_layers
  FOR EACH ROW
  EXECUTE FUNCTION update_cinematic_updated_at();