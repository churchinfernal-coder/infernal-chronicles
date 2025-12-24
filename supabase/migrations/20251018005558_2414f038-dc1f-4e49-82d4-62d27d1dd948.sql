-- Create response library table
CREATE TABLE IF NOT EXISTS public.ouija_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_text TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('prophecy', 'warning', 'love', 'death', 'ritual', 'past', 'future', 'unknown')),
  tone TEXT NOT NULL CHECK (tone IN ('cryptic', 'poetic', 'direct', 'hostile', 'divine', 'infernal')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  source TEXT,
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'hidden', 'cursed')),
  spirit_persona TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session logging table
CREATE TABLE IF NOT EXISTS public.ouija_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.ouija_rooms(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  response_id UUID REFERENCES public.ouija_responses(id) ON DELETE SET NULL,
  response_text TEXT NOT NULL,
  spirit_type TEXT,
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.ouija_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.ouija_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ouija_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ouija_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ouija_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ouija_responses
CREATE POLICY "Everyone can view responses"
  ON public.ouija_responses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage responses"
  ON public.ouija_responses FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for ouija_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.ouija_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create sessions"
  ON public.ouija_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
  ON public.ouija_sessions FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for ouija_feedback
CREATE POLICY "Users can view their own feedback"
  ON public.ouija_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback"
  ON public.ouija_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
  ON public.ouija_feedback FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_ouija_responses_category ON public.ouija_responses(category);
CREATE INDEX idx_ouija_responses_tone ON public.ouija_responses(tone);
CREATE INDEX idx_ouija_responses_rarity ON public.ouija_responses(rarity);
CREATE INDEX idx_ouija_responses_tags ON public.ouija_responses USING GIN(tags);
CREATE INDEX idx_ouija_sessions_user_id ON public.ouija_sessions(user_id);
CREATE INDEX idx_ouija_sessions_room_id ON public.ouija_sessions(room_id);
CREATE INDEX idx_ouija_feedback_session_id ON public.ouija_feedback(session_id);

-- Add trigger for updated_at
CREATE TRIGGER update_ouija_responses_updated_at
  BEFORE UPDATE ON public.ouija_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert seed responses
INSERT INTO public.ouija_responses (response_text, category, tone, tags, rarity, spirit_persona) VALUES
  ('The veil parts... I see flames dancing in crimson skies', 'prophecy', 'cryptic', ARRAY['fire', 'sky', 'vision'], 'common', 'The Whisperer'),
  ('Beware the thirteenth hour when shadows consume light', 'warning', 'hostile', ARRAY['time', 'danger', 'darkness'], 'rare', 'The Watcher'),
  ('Your heart beats in tandem with another... bound by blood', 'love', 'poetic', ARRAY['connection', 'romance', 'fate'], 'common', 'The Archivist'),
  ('Death walks beside you, patient as stone', 'death', 'direct', ARRAY['mortality', 'ending', 'transition'], 'rare', 'The Watcher'),
  ('Circle of salt... blade of obsidian... speak the words backward', 'ritual', 'divine', ARRAY['ceremony', 'magic', 'instruction'], 'hidden', 'Duke Vassago'),
  ('In your past lives, you served the crimson throne', 'past', 'infernal', ARRAY['history', 'reincarnation', 'service'], 'cursed', 'Lady Astaroth'),
  ('Three moons from now, your path diverges into shadow', 'future', 'cryptic', ARRAY['time', 'choice', 'destiny'], 'rare', 'The Whisperer'),
  ('...', 'unknown', 'hostile', ARRAY['silence', 'mystery'], 'common', 'The Watcher'),
  ('YES', 'prophecy', 'direct', ARRAY['affirmation', 'confirmation'], 'common', NULL),
  ('NO', 'warning', 'direct', ARRAY['negation', 'denial'], 'common', NULL),
  ('GOOD BYE', 'unknown', 'poetic', ARRAY['farewell', 'departure'], 'common', NULL);