-- Create video_followers table (separate from allies/friendships)
CREATE TABLE public.video_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(follower_user_id, following_user_id),
  CHECK (follower_user_id != following_user_id)
);

-- Enable RLS on video_followers
ALTER TABLE public.video_followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_followers
CREATE POLICY "Users can follow video creators"
  ON public.video_followers
  FOR INSERT
  WITH CHECK (auth.uid() = follower_user_id);

CREATE POLICY "Users can unfollow video creators"
  ON public.video_followers
  FOR DELETE
  USING (auth.uid() = follower_user_id);

CREATE POLICY "Video followers are viewable by everyone"
  ON public.video_followers
  FOR SELECT
  USING (true);

-- Create index for performance
CREATE INDEX idx_video_followers_following ON public.video_followers(following_user_id);
CREATE INDEX idx_video_followers_follower ON public.video_followers(follower_user_id);

-- Function to get video follower count
CREATE OR REPLACE FUNCTION public.get_video_follower_count(user_id_param UUID)
RETURNS BIGINT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::BIGINT
  FROM public.video_followers
  WHERE following_user_id = user_id_param
$$;

-- Add video_duration column to posts table to track video length
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS video_duration INTEGER;

COMMENT ON COLUMN public.posts.video_duration IS 'Video duration in seconds';

-- Trigger function to enforce max 666 allies
CREATE OR REPLACE FUNCTION public.enforce_max_allies()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Count current accepted friendships for this user
  SELECT COUNT(*)
  INTO current_count
  FROM public.friendships
  WHERE user_id = NEW.user_id
  AND status = 'accepted';

  -- Check if adding this would exceed 666
  IF current_count >= 666 AND NEW.status = 'accepted' THEN
    RAISE EXCEPTION 'Maximum allies limit of 666 reached';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for max allies enforcement
DROP TRIGGER IF EXISTS enforce_max_allies_trigger ON public.friendships;
CREATE TRIGGER enforce_max_allies_trigger
  BEFORE INSERT OR UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_max_allies();