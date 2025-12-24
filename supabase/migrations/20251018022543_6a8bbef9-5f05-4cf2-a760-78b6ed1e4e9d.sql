-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS public.ouija_feedback CASCADE;
DROP TABLE IF EXISTS public.ouija_sessions CASCADE;
DROP TABLE IF EXISTS public.ouija_responses CASCADE;
DROP TABLE IF EXISTS public.ouija_generation_config CASCADE;

-- Create ouija_responses table for AI-generated mystical responses
CREATE TABLE public.ouija_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_text TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Prophecy', 'Warning', 'Love', 'Death', 'Ritual', 'Past', 'Future', 'Unknown')),
  tone TEXT NOT NULL CHECK (tone IN ('cryptic', 'poetic', 'hostile', 'divine', 'infernal')),
  tags TEXT[] DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'AI' CHECK (source IN ('AI', 'Manual', 'Community')),
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'cursed', 'hidden')),
  spirit_persona TEXT,
  approved BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ouija_sessions table for logging interactions
CREATE TABLE public.ouija_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.ouija_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  question TEXT NOT NULL,
  response_id UUID REFERENCES public.ouija_responses(id),
  response_text TEXT NOT NULL,
  tone TEXT,
  category TEXT,
  spirit_persona TEXT,
  session_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ouija_feedback table for user ratings
CREATE TABLE public.ouija_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.ouija_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  response_id UUID REFERENCES public.ouija_responses(id),
  accuracy_rating INTEGER CHECK (accuracy_rating BETWEEN 1 AND 5),
  mysticism_rating INTEGER CHECK (mysticism_rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ouija_generation_config for AI settings
CREATE TABLE public.ouija_generation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_enabled BOOLEAN DEFAULT true,
  auto_approve BOOLEAN DEFAULT false,
  min_response_length INTEGER DEFAULT 50,
  max_response_length INTEGER DEFAULT 300,
  default_tone TEXT DEFAULT 'cryptic',
  default_category TEXT DEFAULT 'Unknown',
  generation_temperature NUMERIC(3,2) DEFAULT 0.8,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default config
INSERT INTO public.ouija_generation_config (ai_enabled, auto_approve) 
VALUES (true, false);

-- Create indexes
CREATE INDEX idx_ouija_responses_category ON public.ouija_responses(category);
CREATE INDEX idx_ouija_responses_tone ON public.ouija_responses(tone);
CREATE INDEX idx_ouija_responses_approved ON public.ouija_responses(approved);
CREATE INDEX idx_ouija_sessions_user_id ON public.ouija_sessions(user_id);
CREATE INDEX idx_ouija_sessions_room_id ON public.ouija_sessions(room_id);
CREATE INDEX idx_ouija_feedback_response_id ON public.ouija_feedback(response_id);

-- Enable RLS
ALTER TABLE public.ouija_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ouija_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ouija_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ouija_generation_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ouija_responses
CREATE POLICY "Anyone can view approved responses"
  ON public.ouija_responses FOR SELECT
  USING (approved = true);

CREATE POLICY "Admins can manage all responses"
  ON public.ouija_responses FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert AI responses"
  ON public.ouija_responses FOR INSERT
  WITH CHECK (source = 'AI');

-- RLS Policies for ouija_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.ouija_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create sessions"
  ON public.ouija_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
  ON public.ouija_sessions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for ouija_feedback
CREATE POLICY "Users can create feedback"
  ON public.ouija_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
  ON public.ouija_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
  ON public.ouija_feedback FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for ouija_generation_config
CREATE POLICY "Anyone can view config"
  ON public.ouija_generation_config FOR SELECT
  USING (true);

CREATE POLICY "Admins can update config"
  ON public.ouija_generation_config FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updating updated_at
CREATE TRIGGER update_ouija_responses_updated_at
  BEFORE UPDATE ON public.ouija_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ouija_config_updated_at
  BEFORE UPDATE ON public.ouija_generation_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();