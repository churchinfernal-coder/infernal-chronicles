-- Create animation_sessions table
CREATE TABLE public.animation_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  frame_count INTEGER NOT NULL DEFAULT 12,
  frames JSONB NOT NULL DEFAULT '[]'::jsonb,
  asset_paths TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  generation_params JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.animation_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view their own animation sessions"
  ON public.animation_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own sessions
CREATE POLICY "Users can create animation sessions"
  ON public.animation_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all sessions
CREATE POLICY "Admins can view all animation sessions"
  ON public.animation_sessions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete sessions
CREATE POLICY "Admins can delete animation sessions"
  ON public.animation_sessions
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for user queries
CREATE INDEX idx_animation_sessions_user_id ON public.animation_sessions(user_id);
CREATE INDEX idx_animation_sessions_created_at ON public.animation_sessions(created_at DESC);