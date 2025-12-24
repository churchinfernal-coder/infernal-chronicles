-- Create ouija tokens table (consumable tokens)
CREATE TABLE public.ouija_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_code TEXT NOT NULL UNIQUE,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ouija rooms table
CREATE TABLE public.ouija_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  token_id UUID NOT NULL REFERENCES public.ouija_tokens(id) ON DELETE CASCADE,
  questions_asked INTEGER DEFAULT 0,
  max_questions INTEGER DEFAULT 6,
  current_turn_user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '2 hours')
);

-- Create ouija participants table
CREATE TABLE public.ouija_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.ouija_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  turn_order INTEGER NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(room_id, user_id),
  UNIQUE(room_id, turn_order)
);

-- Create ouija questions table
CREATE TABLE public.ouija_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.ouija_rooms(id) ON DELETE CASCADE,
  asker_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  spirit_response TEXT,
  question_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ouija_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ouija_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ouija_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ouija_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tokens
CREATE POLICY "Users can view their own tokens"
  ON public.ouija_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tokens"
  ON public.ouija_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for rooms
CREATE POLICY "Host can create rooms"
  ON public.ouija_rooms FOR INSERT
  WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Participants can view their rooms"
  ON public.ouija_rooms FOR SELECT
  USING (
    auth.uid() = host_user_id OR 
    EXISTS (
      SELECT 1 FROM public.ouija_participants 
      WHERE room_id = ouija_rooms.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Host can update their rooms"
  ON public.ouija_rooms FOR UPDATE
  USING (auth.uid() = host_user_id);

-- RLS Policies for participants
CREATE POLICY "Users can view participants in their rooms"
  ON public.ouija_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ouija_rooms 
      WHERE id = ouija_participants.room_id 
      AND (host_user_id = auth.uid() OR id IN (
        SELECT room_id FROM public.ouija_participants WHERE user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Host can add participants"
  ON public.ouija_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ouija_rooms 
      WHERE id = room_id AND host_user_id = auth.uid()
    )
  );

-- RLS Policies for questions
CREATE POLICY "Participants can view questions in their rooms"
  ON public.ouija_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ouija_participants 
      WHERE room_id = ouija_questions.room_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can create questions"
  ON public.ouija_questions FOR INSERT
  WITH CHECK (
    auth.uid() = asker_user_id AND
    EXISTS (
      SELECT 1 FROM public.ouija_participants 
      WHERE room_id = ouija_questions.room_id AND user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_ouija_tokens_user ON public.ouija_tokens(user_id);
CREATE INDEX idx_ouija_rooms_host ON public.ouija_rooms(host_user_id);
CREATE INDEX idx_ouija_rooms_status ON public.ouija_rooms(status);
CREATE INDEX idx_ouija_participants_room ON public.ouija_participants(room_id);
CREATE INDEX idx_ouija_participants_user ON public.ouija_participants(user_id);
CREATE INDEX idx_ouija_questions_room ON public.ouija_questions(room_id);