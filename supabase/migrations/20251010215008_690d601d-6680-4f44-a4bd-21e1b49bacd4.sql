-- Create coven_posts table for threaded discussions
CREATE TABLE IF NOT EXISTS public.coven_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coven_id UUID NOT NULL REFERENCES public.covens(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_post_id UUID REFERENCES public.coven_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  visibility TEXT NOT NULL DEFAULT 'coven_only' CHECK (visibility IN ('public', 'private', 'coven_only')),
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coven_posts ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_coven_posts_coven_id ON public.coven_posts(coven_id);
CREATE INDEX idx_coven_posts_parent_id ON public.coven_posts(parent_post_id);
CREATE INDEX idx_coven_posts_created_at ON public.coven_posts(created_at DESC);

-- RLS Policies for coven_posts
CREATE POLICY "Public posts viewable by everyone"
ON public.coven_posts FOR SELECT
USING (visibility = 'public');

CREATE POLICY "Coven posts viewable by members"
ON public.coven_posts FOR SELECT
USING (
  visibility = 'coven_only' AND
  EXISTS (
    SELECT 1 FROM public.coven_members
    WHERE coven_id = coven_posts.coven_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Private posts viewable by author"
ON public.coven_posts FOR SELECT
USING (visibility = 'private' AND user_id = auth.uid());

CREATE POLICY "Coven members can create posts"
ON public.coven_posts FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.coven_members
    WHERE coven_id = coven_posts.coven_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Authors can update own posts"
ON public.coven_posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Coven admins can update posts in their coven"
ON public.coven_posts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.coven_members
    WHERE coven_id = coven_posts.coven_id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "SuperAdmins can update all posts"
ON public.coven_posts FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authors can delete own posts"
ON public.coven_posts FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Coven admins can delete posts in their coven"
ON public.coven_posts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.coven_members
    WHERE coven_id = coven_posts.coven_id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "SuperAdmins can delete all posts"
ON public.coven_posts FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create coven_invite_tokens table
CREATE TABLE IF NOT EXISTS public.coven_invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coven_id UUID NOT NULL REFERENCES public.covens(id) ON DELETE CASCADE,
  token_code TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'member',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  is_valid BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.coven_invite_tokens ENABLE ROW LEVEL SECURITY;

-- Index for token lookup
CREATE INDEX idx_coven_invite_tokens_code ON public.coven_invite_tokens(token_code);
CREATE INDEX idx_coven_invite_tokens_coven ON public.coven_invite_tokens(coven_id);

-- RLS Policies for invite tokens
CREATE POLICY "Coven admins can create tokens"
ON public.coven_invite_tokens FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM public.coven_members
    WHERE coven_id = coven_invite_tokens.coven_id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Anyone can view valid tokens"
ON public.coven_invite_tokens FOR SELECT
USING (is_valid = true AND expires_at > now());

CREATE POLICY "Coven admins can view their tokens"
ON public.coven_invite_tokens FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.coven_members
    WHERE coven_id = coven_invite_tokens.coven_id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Enable realtime for coven_posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.coven_posts;