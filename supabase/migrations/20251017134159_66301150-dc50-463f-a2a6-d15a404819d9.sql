-- Create role enum for coven hierarchy
DO $$ BEGIN
  CREATE TYPE coven_role AS ENUM (
    'infernal_priest',
    'infernal_priestess', 
    'knight',
    'duke',
    'duchess',
    'admin',
    'member'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create coven_post_reactions table
CREATE TABLE IF NOT EXISTS public.coven_post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.coven_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  reaction_emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_emoji)
);

-- Create coven_post_comments table
CREATE TABLE IF NOT EXISTS public.coven_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.coven_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add header_image column to covens if not exists
DO $$ BEGIN
  ALTER TABLE public.covens ADD COLUMN IF NOT EXISTS header_image TEXT;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.coven_post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coven_post_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for reactions
CREATE POLICY "Coven members can view reactions" ON public.coven_post_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.coven_posts cp
      JOIN public.coven_members cm ON cm.coven_id = cp.coven_id
      WHERE cp.id = coven_post_reactions.post_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add reactions" ON public.coven_post_reactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.coven_posts cp
      JOIN public.coven_members cm ON cm.coven_id = cp.coven_id
      WHERE cp.id = coven_post_reactions.post_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove their reactions" ON public.coven_post_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for comments
CREATE POLICY "Coven members can view comments" ON public.coven_post_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.coven_posts cp
      JOIN public.coven_members cm ON cm.coven_id = cp.coven_id
      WHERE cp.id = coven_post_comments.post_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments" ON public.coven_post_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.coven_posts cp
      JOIN public.coven_members cm ON cm.coven_id = cp.coven_id
      WHERE cp.id = coven_post_comments.post_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their comments" ON public.coven_post_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their comments" ON public.coven_post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Add realtime support
ALTER PUBLICATION supabase_realtime ADD TABLE public.coven_post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coven_post_comments;