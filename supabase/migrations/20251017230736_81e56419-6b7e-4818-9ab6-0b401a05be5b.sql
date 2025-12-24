-- Gaming Creation AI Engine Tables

-- Game projects table (user-created games)
CREATE TABLE public.game_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT NOT NULL, -- platformer, rpg, puzzle, visual_novel, custom
  game_type TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Game configuration
  canvas_data JSONB NOT NULL DEFAULT '{}', -- game logic, objects, rules
  assets JSONB DEFAULT '[]', -- uploaded sprites, audio, backgrounds
  logic JSONB DEFAULT '{}', -- movement, collision, scoring, win/lose
  
  -- Publishing
  is_published BOOLEAN DEFAULT FALSE,
  publish_date TIMESTAMP WITH TIME ZONE,
  play_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.game_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_projects
CREATE POLICY "Users can view their own games"
  ON public.game_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view published games"
  ON public.game_projects FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "Premium users can create games"
  ON public.game_projects FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can update their own games"
  ON public.game_projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own games"
  ON public.game_projects FOR DELETE
  USING (auth.uid() = user_id);

-- Game downloads audit log
CREATE TABLE public.game_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.game_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  download_type TEXT NOT NULL, -- 'html5', 'zip', 'full_package'
  file_size_bytes BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.game_downloads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_downloads
CREATE POLICY "Users can view their own downloads"
  ON public.game_downloads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create download logs"
  ON public.game_downloads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Game publish audit log
CREATE TABLE public.game_publishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.game_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'publish', 'unpublish', 'update'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.game_publishes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_publishes
CREATE POLICY "Users can view their own publish history"
  ON public.game_publishes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all publish history"
  ON public.game_publishes FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create publish logs"
  ON public.game_publishes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- AI suggestions cache table
CREATE TABLE public.game_ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.game_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL, -- 'mechanics', 'assets', 'optimization', 'logic'
  prompt TEXT NOT NULL,
  suggestion JSONB NOT NULL,
  applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.game_ai_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI suggestions
CREATE POLICY "Users can view their own AI suggestions"
  ON public.game_ai_suggestions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create AI suggestions"
  ON public.game_ai_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI suggestions"
  ON public.game_ai_suggestions FOR UPDATE
  USING (auth.uid() = user_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_game_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_projects_timestamp
  BEFORE UPDATE ON public.game_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_game_projects_updated_at();

-- Indexes for performance
CREATE INDEX idx_game_projects_user_id ON public.game_projects(user_id);
CREATE INDEX idx_game_projects_published ON public.game_projects(is_published) WHERE is_published = TRUE;
CREATE INDEX idx_game_projects_genre ON public.game_projects(genre);
CREATE INDEX idx_game_downloads_game_id ON public.game_downloads(game_id);
CREATE INDEX idx_game_publishes_game_id ON public.game_publishes(game_id);