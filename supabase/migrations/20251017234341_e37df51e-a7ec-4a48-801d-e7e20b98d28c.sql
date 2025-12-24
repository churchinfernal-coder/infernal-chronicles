-- Occult Library: E-book system with AI features

-- Published books table (superadmin can publish from book_projects)
CREATE TABLE IF NOT EXISTS public.occult_library_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_project_id UUID REFERENCES public.book_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT DEFAULT 'Infernal Chronicles',
  description TEXT,
  cover_image_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  price_cents INTEGER DEFAULT 999,
  category TEXT DEFAULT 'occult',
  tags TEXT[],
  total_chapters INTEGER DEFAULT 0,
  total_words INTEGER DEFAULT 0,
  excerpt TEXT,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User reading history
CREATE TABLE IF NOT EXISTS public.reading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  book_id UUID REFERENCES public.occult_library_books(id) ON DELETE CASCADE,
  chapter_number INTEGER DEFAULT 1,
  progress_percentage INTEGER DEFAULT 0,
  last_position TEXT,
  reading_time_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- User book subscriptions/purchases
CREATE TABLE IF NOT EXISTS public.occult_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  subscription_type TEXT NOT NULL, -- 'monthly', 'yearly', 'lifetime'
  status TEXT DEFAULT 'active',
  stripe_subscription_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Individual book purchases
CREATE TABLE IF NOT EXISTS public.book_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  book_id UUID REFERENCES public.occult_library_books(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- User highlights and notes
CREATE TABLE IF NOT EXISTS public.book_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  book_id UUID REFERENCES public.occult_library_books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  highlighted_text TEXT NOT NULL,
  note TEXT,
  position_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Quiz questions for interactive learning
CREATE TABLE IF NOT EXISTS public.book_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES public.occult_library_books(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User quiz attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quiz_id UUID REFERENCES public.book_quizzes(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User reading preferences
CREATE TABLE IF NOT EXISTS public.reading_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  font_size INTEGER DEFAULT 16,
  font_family TEXT DEFAULT 'serif',
  theme TEXT DEFAULT 'dark',
  background_color TEXT DEFAULT '#0a0a0a',
  text_color TEXT DEFAULT '#e8e8e8',
  line_height NUMERIC DEFAULT 1.6,
  enable_tts BOOLEAN DEFAULT false,
  tts_voice TEXT DEFAULT 'alloy',
  tts_speed NUMERIC DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.occult_library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occult_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for occult_library_books
CREATE POLICY "Published books viewable by everyone"
  ON public.occult_library_books FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage books"
  ON public.occult_library_books FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for reading_history
CREATE POLICY "Users can view their own reading history"
  ON public.reading_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading history"
  ON public.reading_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their reading progress"
  ON public.reading_history FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.occult_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create subscriptions"
  ON public.occult_subscriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all subscriptions"
  ON public.occult_subscriptions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for book_purchases
CREATE POLICY "Users can view their own purchases"
  ON public.book_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create purchases"
  ON public.book_purchases FOR INSERT
  WITH CHECK (true);

-- RLS Policies for highlights
CREATE POLICY "Users can manage their own highlights"
  ON public.book_highlights FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for quizzes
CREATE POLICY "Everyone can view quizzes"
  ON public.book_quizzes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage quizzes"
  ON public.book_quizzes FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for quiz attempts
CREATE POLICY "Users can view their own attempts"
  ON public.quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for reading preferences
CREATE POLICY "Users can manage their own preferences"
  ON public.reading_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_reading_history_user ON public.reading_history(user_id);
CREATE INDEX idx_reading_history_book ON public.reading_history(book_id);
CREATE INDEX idx_subscriptions_user ON public.occult_subscriptions(user_id);
CREATE INDEX idx_purchases_user ON public.book_purchases(user_id);
CREATE INDEX idx_highlights_user_book ON public.book_highlights(user_id, book_id);
CREATE INDEX idx_occult_books_featured ON public.occult_library_books(featured) WHERE featured = true;