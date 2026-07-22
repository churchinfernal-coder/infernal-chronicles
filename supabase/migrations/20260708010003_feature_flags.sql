-- Phase 5: DB-backed feature flags so admins can enable/disable ("overlay")
-- any feature at runtime instead of code changes. Read by everyone (so the UI
-- can gate), managed by admins only. Enforcement of paid/gated behaviour still
-- lives in RLS/edge functions — flags control visibility/availability.
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key text PRIMARY KEY,
  label text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  coming_soon boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read feature flags" ON public.feature_flags;
CREATE POLICY "Anyone can read feature flags"
  ON public.feature_flags FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins manage feature flags" ON public.feature_flags;
CREATE POLICY "Admins manage feature flags"
  ON public.feature_flags FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Seed one flag per major feature (enabled by default; admins can overlay-off).
INSERT INTO public.feature_flags (key, label, description, enabled, coming_soon) VALUES
  ('occult-library', 'Occult Library', 'AI books, e-books and PDF reading', true, false),
  ('wicked-works',   'Wicked Works',   'Design & AI image tools', true, false),
  ('ouija-chamber',  'Ouija Chamber',  'Spirit board sessions', true, false),
  ('tarot-reading',  'Tarot Reading',  'Tarot divination', true, false),
  ('rune-casting',   'Rune Casting',   'Rune divination', true, false),
  ('gaming-hub',     'Gaming Hub',      'Games and interactive content', true, false),
  ('solomons-chamber','Solomon''s Chamber','Gated premium content', true, false),
  ('my-dungeon',     'My Dungeon',     'Paid photo/video albums', true, false),
  ('coven',          'Covens',         'Community groups', true, false),
  ('chat',           'Infernal Chat',  'Realtime messaging', true, false)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.touch_feature_flag_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_feature_flags_updated_at ON public.feature_flags;
CREATE TRIGGER trg_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.touch_feature_flag_updated_at();
