-- Create rituals table for calendar events
CREATE TABLE IF NOT EXISTS public.rituals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  ritual_type TEXT NOT NULL CHECK (ritual_type IN ('ritual', 'summoning', 'gathering')),
  scheduled_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  is_public BOOLEAN DEFAULT false,
  coven_id UUID REFERENCES public.covens(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rituals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own rituals"
  ON public.rituals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public rituals"
  ON public.rituals
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can create rituals"
  ON public.rituals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rituals"
  ON public.rituals
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rituals"
  ON public.rituals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_rituals_updated_at
  BEFORE UPDATE ON public.rituals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();