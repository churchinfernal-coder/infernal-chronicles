-- Create runes table with Elder Futhark set
CREATE TABLE public.runes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text,
  meaning_upright text NOT NULL,
  meaning_reversed text NOT NULL,
  rune_order integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.runes ENABLE ROW LEVEL SECURITY;

-- Runes viewable by everyone
CREATE POLICY "Runes viewable by everyone"
  ON public.runes FOR SELECT
  USING (true);

-- Create rune casting keys table
CREATE TABLE public.rune_casting_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  key_code text NOT NULL UNIQUE,
  is_used boolean DEFAULT false,
  used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.rune_casting_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own keys"
  ON public.rune_casting_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own keys"
  ON public.rune_casting_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create rune casting sessions table
CREATE TABLE public.rune_castings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  spread_type text NOT NULL,
  spirit_tone text NOT NULL,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  transcript text
);

ALTER TABLE public.rune_castings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own castings"
  ON public.rune_castings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own castings"
  ON public.rune_castings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own castings"
  ON public.rune_castings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create rune readings table
CREATE TABLE public.rune_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  casting_id uuid NOT NULL,
  rune_id uuid NOT NULL,
  position integer NOT NULL,
  is_reversed boolean DEFAULT false,
  interpretation text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.rune_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their casting readings"
  ON public.rune_readings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rune_castings
      WHERE rune_castings.id = rune_readings.casting_id
      AND rune_castings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create readings in their castings"
  ON public.rune_readings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rune_castings
      WHERE rune_castings.id = rune_readings.casting_id
      AND rune_castings.user_id = auth.uid()
    )
  );

-- Create tracking table for drawn runes per session
CREATE TABLE public.rune_casting_runes (
  casting_id uuid NOT NULL,
  rune_id uuid NOT NULL,
  drawn_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (casting_id, rune_id)
);

ALTER TABLE public.rune_casting_runes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their casting runes"
  ON public.rune_casting_runes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rune_castings
      WHERE rune_castings.id = rune_casting_runes.casting_id
      AND rune_castings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can track runes in their castings"
  ON public.rune_casting_runes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rune_castings
      WHERE rune_castings.id = rune_casting_runes.casting_id
      AND rune_castings.user_id = auth.uid()
    )
  );

-- Insert Elder Futhark runes
INSERT INTO public.runes (name, meaning_upright, meaning_reversed, rune_order) VALUES
('Fehu', 'Wealth, prosperity, abundance, success, fertility', 'Greed, loss, financial troubles, stagnation', 1),
('Uruz', 'Strength, vitality, raw power, primal energy, health', 'Weakness, missed opportunity, poor health, brutality', 2),
('Thurisaz', 'Protection, gateway, threshold, defense, catalyst', 'Danger, betrayal, enemies, recklessness, blocked path', 3),
('Ansuz', 'Divine wisdom, communication, inspiration, knowledge', 'Miscommunication, manipulation, lies, ignorance', 4),
('Raidho', 'Journey, travel, movement, rhythm, progress', 'Delays, disruption, stagnation, wrong direction', 5),
('Kenaz', 'Knowledge, illumination, creativity, passion, revelation', 'Ignorance, darkness, false knowledge, creative block', 6),
('Gebo', 'Gift, partnership, balance, generosity, union', 'Imbalance, loneliness, dependency, separation', 7),
('Wunjo', 'Joy, harmony, success, fellowship, well-being', 'Sorrow, alienation, disappointment, loss of joy', 8),
('Hagalaz', 'Disruption, chaos, natural forces, transformation', 'Controlled chaos, delayed disaster, stagnation', 9),
('Nauthiz', 'Need, necessity, constraint, endurance, survival', 'Deprivation, poverty, suffering, restriction', 10),
('Isa', 'Ice, stillness, clarity, focus, pause', 'Frozen emotions, stagnation, coldness, blockage', 11),
('Jera', 'Harvest, cycles, reward, natural timing, completion', 'Poor timing, setback, failed harvest, impatience', 12),
('Eihwaz', 'Endurance, protection, yew tree, transformation', 'Weakness, confusion, lack of protection, stagnation', 13),
('Perthro', 'Mystery, fate, hidden things, secrets, divination', 'Revealed secrets, addiction, stagnation, fate denied', 14),
('Algiz', 'Protection, shield, divine connection, sanctuary', 'Vulnerability, danger, disconnection, exposure', 15),
('Sowilo', 'Sun, success, vitality, life force, wholeness', 'False goals, burnout, destruction, defeat', 16),
('Tiwaz', 'Victory, honor, justice, leadership, courage', 'Defeat, dishonor, injustice, failed leadership', 17),
('Berkana', 'Growth, birth, renewal, fertility, nurturing', 'Stagnation, carelessness, abandonment, infertility', 18),
('Ehwaz', 'Movement, partnership, trust, progress, harmony', 'Restlessness, betrayal, distrust, blocked progress', 19),
('Mannaz', 'Humanity, self, intelligence, community, awareness', 'Isolation, manipulation, enemy, delusion', 20),
('Laguz', 'Water, flow, intuition, dreams, emotions', 'Confusion, lack of clarity, fear, deception', 21),
('Ingwaz', 'Fertility, new beginnings, potential, gestation', 'Impotence, stagnation, lack of growth, failure', 22),
('Dagaz', 'Breakthrough, awakening, clarity, transformation', 'Completion, ending, hopelessness, blindness', 23),
('Othala', 'Inheritance, heritage, home, ancestry, tradition', 'Homelessness, poverty, prejudice, clinging to past', 24);