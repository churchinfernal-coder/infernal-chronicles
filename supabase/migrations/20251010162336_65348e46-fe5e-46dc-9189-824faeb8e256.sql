-- Add admin fields to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS flagged_for_review boolean DEFAULT false;

-- Create admin post edits logging table
CREATE TABLE IF NOT EXISTS public.admin_post_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  admin_user_id uuid NOT NULL,
  edit_type text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create admin annotations table
CREATE TABLE IF NOT EXISTS public.admin_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  admin_user_id uuid NOT NULL,
  annotation text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.admin_post_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_annotations ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_post_edits
CREATE POLICY "Admins can view all edit logs"
ON public.admin_post_edits FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create edit logs"
ON public.admin_post_edits FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') AND auth.uid() = admin_user_id);

-- RLS policies for admin_annotations
CREATE POLICY "Admins can view all annotations"
ON public.admin_annotations FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create annotations"
ON public.admin_annotations FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') AND auth.uid() = admin_user_id);

CREATE POLICY "Admins can delete their own annotations"
ON public.admin_annotations FOR DELETE
USING (has_role(auth.uid(), 'admin') AND auth.uid() = admin_user_id);

-- Enhanced RLS for posts - allow admins to update and delete
CREATE POLICY "Admins can update all posts"
ON public.posts FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all posts"
ON public.posts FOR DELETE
USING (has_role(auth.uid(), 'admin'));