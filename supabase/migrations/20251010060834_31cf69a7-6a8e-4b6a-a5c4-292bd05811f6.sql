-- Create enum for item types
CREATE TYPE public.store_item_type AS ENUM ('badge', 'skin');

-- Create enum for rarity levels
CREATE TYPE public.rarity_level AS ENUM ('common', 'rare', 'epic', 'legendary', 'mythic');

-- Add prime_level to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS prime_level integer DEFAULT 0;

-- Create store_items table
CREATE TABLE public.store_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  item_type store_item_type NOT NULL,
  rarity rarity_level NOT NULL DEFAULT 'common',
  price_cents integer, -- null means free/earned
  stripe_price_id text, -- null for free items
  image_url text,
  preview_data jsonb, -- for skin preview data
  is_active boolean DEFAULT true,
  required_prime_level integer DEFAULT 7,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create user_inventory table
CREATE TABLE public.user_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES public.store_items(id) ON DELETE CASCADE,
  purchased_at timestamp with time zone DEFAULT now(),
  stripe_payment_intent_id text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create user_equipped_items table
CREATE TABLE public.user_equipped_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id uuid NOT NULL REFERENCES public.store_items(id) ON DELETE CASCADE,
  item_type store_item_type NOT NULL,
  equipped_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, item_type)
);

-- Create activity_badges table for free earned badges
CREATE TABLE public.activity_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  criteria jsonb NOT NULL, -- {type: 'posts_count', threshold: 10}
  image_url text,
  rarity rarity_level NOT NULL DEFAULT 'common',
  created_at timestamp with time zone DEFAULT now()
);

-- Create user_activity_badges table
CREATE TABLE public.user_activity_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.activity_badges(id) ON DELETE CASCADE,
  earned_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_equipped_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for store_items
CREATE POLICY "Store items viewable by everyone"
  ON public.store_items FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage store items"
  ON public.store_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_inventory
CREATE POLICY "Users can view their own inventory"
  ON public.user_inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their inventory"
  ON public.user_inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_equipped_items
CREATE POLICY "Users can view their equipped items"
  ON public.user_equipped_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their equipped items"
  ON public.user_equipped_items FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for activity_badges
CREATE POLICY "Activity badges viewable by everyone"
  ON public.activity_badges FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage activity badges"
  ON public.activity_badges FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_activity_badges
CREATE POLICY "Users can view their earned badges"
  ON public.user_activity_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can grant badges"
  ON public.user_activity_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_store_items_updated_at
  BEFORE UPDATE ON public.store_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial store items (unique Infernal Social themed)
INSERT INTO public.store_items (name, description, item_type, rarity, price_cents, image_url, preview_data, required_prime_level) VALUES
  -- Skins
  ('Ancient Stone Castle', 'Profile skin forged from the ruins of forgotten kingdoms', 'skin', 'legendary', 2999, null, '{"background": "linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)", "texture": "stone", "border": "4px solid #8b7355"}', 7),
  ('Snake Skin', 'Sleek serpentine profile skin that shifts with shadows', 'skin', 'epic', 1999, null, '{"background": "linear-gradient(135deg, #1a4d2e 0%, #0d2818 100%)", "texture": "scales", "border": "3px solid #4a7c59"}', 7),
  ('Gargoyle Armor', 'Hardened stone armor profile skin from the cathedral guardians', 'skin', 'mythic', 4999, null, '{"background": "linear-gradient(135deg, #3d3d3d 0%, #1f1f1f 100%)", "texture": "armor", "border": "5px solid #666"}', 10),
  ('Obsidian Throne', 'Profile skin carved from volcanic glass, seat of dark power', 'skin', 'legendary', 3499, null, '{"background": "linear-gradient(135deg, #1a1a1a 0%, #000000 100%)", "texture": "obsidian", "border": "4px solid #2d2d2d"}', 9),
  
  -- Paid Badges
  ('Infernal Crown', 'Crown of the underworld elite', 'badge', 'mythic', 1499, null, null, 7),
  ('Shadow Keeper', 'Guardian of the eternal darkness', 'badge', 'legendary', 999, null, null, 7),
  ('Crimson Seal', 'Mark of blood pacts and forbidden contracts', 'badge', 'epic', 699, null, null, 7),
  ('Void Walker', 'One who treads between realms', 'badge', 'rare', 499, null, null, 7);

-- Insert activity badges (free, earned through activity)
INSERT INTO public.activity_badges (name, description, criteria, rarity) VALUES
  ('First Whisper', 'Created your first post', '{"type": "posts_count", "threshold": 1}', 'common'),
  ('Dark Herald', 'Created 10 posts', '{"type": "posts_count", "threshold": 10}', 'rare'),
  ('Shadow Scribe', 'Created 50 posts', '{"type": "posts_count", "threshold": 50}', 'epic'),
  ('Coven Founder', 'Created a coven', '{"type": "covens_created", "threshold": 1}', 'rare'),
  ('Social Demon', 'Made 5 friends', '{"type": "friends_count", "threshold": 5}', 'rare'),
  ('Infernal Influencer', 'Received 100 reactions', '{"type": "reactions_received", "threshold": 100}', 'epic');