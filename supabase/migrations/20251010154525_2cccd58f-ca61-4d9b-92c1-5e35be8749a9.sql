-- Create tarot cards table with all 78 cards
CREATE TABLE public.tarot_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  suit TEXT, -- 'major', 'cups', 'wands', 'swords', 'pentacles'
  card_number INTEGER,
  upright_meaning TEXT NOT NULL,
  reversed_meaning TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create tarot reading keys table for access control
CREATE TABLE public.tarot_reading_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  key_code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create tarot sessions table
CREATE TABLE public.tarot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  spread_type TEXT NOT NULL, -- '1-card', '3-card', 'celtic-cross'
  spirit_tone TEXT NOT NULL, -- 'poetic', 'factual', 'chaotic', 'silent'
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  transcript TEXT
);

-- Create tarot readings table (individual card draws)
CREATE TABLE public.tarot_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.tarot_sessions(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES public.tarot_cards(id) NOT NULL,
  position INTEGER NOT NULL, -- position in spread
  is_reversed BOOLEAN DEFAULT false,
  interpretation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create session cards junction to prevent duplicates
CREATE TABLE public.tarot_session_cards (
  session_id UUID REFERENCES public.tarot_sessions(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES public.tarot_cards(id) NOT NULL,
  drawn_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (session_id, card_id)
);

-- Enable RLS
ALTER TABLE public.tarot_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarot_reading_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarot_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarot_session_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tarot_cards (public read)
CREATE POLICY "Tarot cards viewable by everyone"
ON public.tarot_cards FOR SELECT USING (true);

-- RLS Policies for tarot_reading_keys
CREATE POLICY "Users can view their own keys"
ON public.tarot_reading_keys FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own keys"
ON public.tarot_reading_keys FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for tarot_sessions
CREATE POLICY "Users can view their own sessions"
ON public.tarot_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
ON public.tarot_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.tarot_sessions FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for tarot_readings
CREATE POLICY "Users can view their session readings"
ON public.tarot_readings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tarot_sessions
    WHERE id = tarot_readings.session_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create readings in their sessions"
ON public.tarot_readings FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tarot_sessions
    WHERE id = session_id AND user_id = auth.uid()
  )
);

-- RLS Policies for tarot_session_cards
CREATE POLICY "Users can view their session cards"
ON public.tarot_session_cards FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tarot_sessions
    WHERE id = tarot_session_cards.session_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can track cards in their sessions"
ON public.tarot_session_cards FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tarot_sessions
    WHERE id = session_id AND user_id = auth.uid()
  )
);

-- Insert the 78 tarot cards
INSERT INTO public.tarot_cards (name, suit, card_number, upright_meaning, reversed_meaning) VALUES
-- Major Arcana
('The Fool', 'major', 0, 'New beginnings, innocence, spontaneity, free spirit', 'Recklessness, taken advantage of, inconsideration'),
('The Magician', 'major', 1, 'Manifestation, resourcefulness, power, inspired action', 'Manipulation, poor planning, untapped talents'),
('The High Priestess', 'major', 2, 'Intuition, sacred knowledge, divine feminine, subconscious', 'Secrets, disconnected from intuition, withdrawal'),
('The Empress', 'major', 3, 'Femininity, beauty, nature, nurturing, abundance', 'Creative block, dependence on others'),
('The Emperor', 'major', 4, 'Authority, establishment, structure, father figure', 'Domination, excessive control, lack of discipline'),
('The Hierophant', 'major', 5, 'Spiritual wisdom, religious beliefs, tradition, conformity', 'Personal beliefs, freedom, challenging the status quo'),
('The Lovers', 'major', 6, 'Love, harmony, relationships, values alignment', 'Self-love, disharmony, imbalance, misalignment'),
('The Chariot', 'major', 7, 'Control, willpower, success, determination', 'Lack of control, lack of direction, aggression'),
('Strength', 'major', 8, 'Strength, courage, persuasion, influence, compassion', 'Inner strength, self-doubt, low energy, raw emotion'),
('The Hermit', 'major', 9, 'Soul searching, introspection, inner guidance', 'Isolation, loneliness, withdrawal'),
('Wheel of Fortune', 'major', 10, 'Good luck, karma, life cycles, destiny, turning point', 'Bad luck, resistance to change, breaking cycles'),
('Justice', 'major', 11, 'Justice, fairness, truth, cause and effect, law', 'Unfairness, lack of accountability, dishonesty'),
('The Hanged Man', 'major', 12, 'Pause, surrender, letting go, new perspectives', 'Delays, resistance, stalling, indecision'),
('Death', 'major', 13, 'Endings, change, transformation, transition', 'Resistance to change, inability to move on'),
('Temperance', 'major', 14, 'Balance, moderation, patience, purpose', 'Imbalance, excess, self-healing, re-alignment'),
('The Devil', 'major', 15, 'Shadow self, attachment, addiction, restriction', 'Releasing limiting beliefs, exploring dark thoughts'),
('The Tower', 'major', 16, 'Sudden change, upheaval, chaos, revelation, awakening', 'Personal transformation, fear of change, averting disaster'),
('The Star', 'major', 17, 'Hope, faith, purpose, renewal, spirituality', 'Lack of faith, despair, self-trust, disconnection'),
('The Moon', 'major', 18, 'Illusion, fear, anxiety, subconscious, intuition', 'Release of fear, repressed emotion, inner confusion'),
('The Sun', 'major', 19, 'Positivity, fun, warmth, success, vitality', 'Inner child, feeling down, overly optimistic'),
('Judgement', 'major', 20, 'Judgement, rebirth, inner calling, absolution', 'Self-doubt, inner critic, ignoring the call'),
('The World', 'major', 21, 'Completion, integration, accomplishment, travel', 'Seeking personal closure, short-cuts, delays'),
-- Cups
('Ace of Cups', 'cups', 1, 'Love, new relationships, compassion, creativity', 'Self-love, intuition, repressed emotions'),
('Two of Cups', 'cups', 2, 'Unified love, partnership, mutual attraction', 'Self-love, break-ups, disharmony, distrust'),
('Three of Cups', 'cups', 3, 'Celebration, friendship, creativity, community', 'Independence, alone time, hardcore partying'),
('Four of Cups', 'cups', 4, 'Meditation, contemplation, apathy, reevaluation', 'Retreat, withdrawal, checking in for alignment'),
('Five of Cups', 'cups', 5, 'Regret, failure, disappointment, pessimism', 'Personal setbacks, self-forgiveness, moving on'),
('Six of Cups', 'cups', 6, 'Revisiting the past, childhood memories, innocence', 'Living in the past, forgiveness, lacking playfulness'),
('Seven of Cups', 'cups', 7, 'Opportunities, choices, wishful thinking, illusion', 'Alignment, personal values, overwhelmed by choices'),
('Eight of Cups', 'cups', 8, 'Disappointment, abandonment, withdrawal, escapism', 'Trying one more time, indecision, aimless drifting'),
('Nine of Cups', 'cups', 9, 'Contentment, satisfaction, gratitude, wish come true', 'Inner happiness, materialism, dissatisfaction'),
('Ten of Cups', 'cups', 10, 'Divine love, blissful relationships, harmony, alignment', 'Disconnection, misaligned values, struggling relationships'),
('Page of Cups', 'cups', 11, 'Creative opportunities, intuitive messages, curiosity', 'New ideas, doubting intuition, creative blocks'),
('Knight of Cups', 'cups', 12, 'Creativity, romance, charm, imagination, beauty', 'Overactive imagination, unrealistic, jealous'),
('Queen of Cups', 'cups', 13, 'Compassionate, caring, emotionally stable, intuitive', 'Inner feelings, self-care, self-love, co-dependency'),
('King of Cups', 'cups', 14, 'Emotionally balanced, compassionate, diplomatic', 'Self-compassion, inner feelings, moodiness'),
-- Wands
('Ace of Wands', 'wands', 1, 'Inspiration, new opportunities, growth, potential', 'Emerging ideas, lack of direction, distractions'),
('Two of Wands', 'wands', 2, 'Future planning, progress, decisions, discovery', 'Personal goals, inner alignment, fear of unknown'),
('Three of Wands', 'wands', 3, 'Progress, expansion, foresight, overseas opportunities', 'Playing small, lack of foresight, unexpected delays'),
('Four of Wands', 'wands', 4, 'Celebration, joy, harmony, relaxation, homecoming', 'Personal celebration, inner harmony, conflict with others'),
('Five of Wands', 'wands', 5, 'Conflict, disagreements, competition, tension', 'Inner conflict, conflict avoidance, tension release'),
('Six of Wands', 'wands', 6, 'Success, public recognition, progress, self-confidence', 'Private achievement, personal definition of success'),
('Seven of Wands', 'wands', 7, 'Challenge, competition, protection, perseverance', 'Exhaustion, giving up, overwhelmed'),
('Eight of Wands', 'wands', 8, 'Movement, fast paced change, action, alignment', 'Delays, frustration, resisting change, internal alignment'),
('Nine of Wands', 'wands', 9, 'Resilience, courage, persistence, test of faith', 'Inner resources, struggle, overwhelm, defensive'),
('Ten of Wands', 'wands', 10, 'Burden, extra responsibility, hard work, completion', 'Doing it all, carrying the burden, delegation'),
('Page of Wands', 'wands', 11, 'Inspiration, ideas, discovery, limitless potential', 'Newly-formed ideas, redirecting energy, self-limiting beliefs'),
('Knight of Wands', 'wands', 12, 'Energy, passion, inspired action, adventure', 'Passion project, haste, scattered energy, delays'),
('Queen of Wands', 'wands', 13, 'Courage, confidence, independence, social butterfly', 'Self-respect, self-confidence, introverted, re-establish sense of self'),
('King of Wands', 'wands', 14, 'Natural-born leader, vision, entrepreneur, honour', 'Impulsiveness, haste, ruthless, high expectations'),
-- Swords
('Ace of Swords', 'swords', 1, 'Breakthroughs, new ideas, mental clarity, success', 'Inner clarity, re-thinking an idea, clouded judgement'),
('Two of Swords', 'swords', 2, 'Difficult decisions, weighing options, stalemate', 'Indecision, confusion, information overload, stalemate'),
('Three of Swords', 'swords', 3, 'Heartbreak, emotional pain, sorrow, grief, hurt', 'Negative self-talk, releasing pain, optimism, forgiveness'),
('Four of Swords', 'swords', 4, 'Rest, relaxation, meditation, contemplation, recuperation', 'Exhaustion, burn-out, deep contemplation, stagnation'),
('Five of Swords', 'swords', 5, 'Conflict, disagreements, competition, defeat, win at all costs', 'Reconciliation, making amends, past resentment'),
('Six of Swords', 'swords', 6, 'Transition, change, rite of passage, releasing baggage', 'Personal transition, resistance to change, unfinished business'),
('Seven of Swords', 'swords', 7, 'Betrayal, deception, getting away with something, stealth', 'Imposter syndrome, self-deceit, keeping secrets'),
('Eight of Swords', 'swords', 8, 'Negative thoughts, self-imposed restriction, imprisonment', 'Self-limiting beliefs, inner critic, releasing negative thoughts'),
('Nine of Swords', 'swords', 9, 'Anxiety, worry, fear, depression, nightmares', 'Inner turmoil, deep-seated fears, secrets, releasing worry'),
('Ten of Swords', 'swords', 10, 'Painful endings, deep wounds, betrayal, loss, crisis', 'Recovery, regeneration, resisting an inevitable end'),
('Page of Swords', 'swords', 11, 'New ideas, curiosity, thirst for knowledge, new ways of communicating', 'Self-expression, all talk and no action, haphazard action'),
('Knight of Swords', 'swords', 12, 'Ambitious, action-oriented, driven to succeed, fast-thinking', 'Restless, unfocused, impulsive, burn-out'),
('Queen of Swords', 'swords', 13, 'Independent, unbiased judgement, clear boundaries, direct communication', 'Overly-emotional, easily influenced, bitty, cold-hearted'),
('King of Swords', 'swords', 14, 'Mental clarity, intellectual power, authority, truth', 'Quiet power, inner truth, misuse of power, manipulation'),
-- Pentacles
('Ace of Pentacles', 'pentacles', 1, 'New financial opportunity, prosperity, security', 'Lost opportunity, missed chance, bad investment'),
('Two of Pentacles', 'pentacles', 2, 'Multiple priorities, time management, prioritization', 'Over-committed, disorganization, reprioritization'),
('Three of Pentacles', 'pentacles', 3, 'Teamwork, collaboration, learning, implementation', 'Disharmony, misalignment, working alone'),
('Four of Pentacles', 'pentacles', 4, 'Saving money, security, conservatism, scarcity, control', 'Over-spending, greed, self-protection'),
('Five of Pentacles', 'pentacles', 5, 'Financial loss, poverty, lack mindset, isolation, worry', 'Recovery from financial loss, spiritual poverty'),
('Six of Pentacles', 'pentacles', 6, 'Giving, receiving, sharing wealth, generosity, charity', 'Self-care, unpaid debts, one-sided charity'),
('Seven of Pentacles', 'pentacles', 7, 'Long-term view, sustainable results, perseverance, investment', 'Lack of long-term vision, limited success, question whether worth it'),
('Eight of Pentacles', 'pentacles', 8, 'Apprenticeship, repetitive tasks, mastery, skill development', 'Self-development, perfectionism, misdirected activity'),
('Nine of Pentacles', 'pentacles', 9, 'Abundance, luxury, self-sufficiency, financial independence', 'Self-worth, over-investment in work, hustling'),
('Ten of Pentacles', 'pentacles', 10, 'Wealth, financial security, family, long-term success, contribution', 'The dark side of wealth, financial failure, loneliness'),
('Page of Pentacles', 'pentacles', 11, 'Manifestation, financial opportunity, skill development', 'Lack of progress, procrastination, learn from failure'),
('Knight of Pentacles', 'pentacles', 12, 'Hard work, productivity, routine, conservatism, service', 'Self-discipline, boredom, feeling stuck, perfectionism'),
('Queen of Pentacles', 'pentacles', 13, 'Nurturing, practical, providing financially, grounded in nature', 'Financial independence, self-care, work-home conflict'),
('King of Pentacles', 'pentacles', 14, 'Wealth, business, leadership, security, discipline, abundance', 'Financially inept, obsessed with wealth and status');