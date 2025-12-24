-- Drop problematic policies
DROP POLICY IF EXISTS "Coven members can view coven albums" ON public.dungeon_albums;
DROP POLICY IF EXISTS "Users can view media in accessible albums" ON public.dungeon_media;
DROP POLICY IF EXISTS "Users with valid keys can view secret media" ON public.dungeon_media;

-- Create security definer functions to prevent recursion
CREATE OR REPLACE FUNCTION public.user_has_coven_access_to_album(_user_id uuid, _album_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dungeon_coven_access dca
    JOIN public.coven_members cm ON cm.coven_id = dca.coven_id
    WHERE dca.album_id = _album_id AND cm.user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.user_has_valid_access_key(_user_id uuid, _album_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dungeon_access_keys
    WHERE album_id = _album_id
    AND user_id = _user_id
    AND is_valid = TRUE
    AND expires_at > NOW()
  )
$$;

CREATE OR REPLACE FUNCTION public.album_is_accessible(_user_id uuid, _album_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dungeon_albums
    WHERE id = _album_id
    AND (
      user_id = _user_id OR
      privacy_level = 'public' OR
      (privacy_level = 'coven_only' AND public.user_has_coven_access_to_album(_user_id, _album_id))
    )
  )
$$;

-- Recreate policies using security definer functions
CREATE POLICY "Coven members can view coven albums"
  ON public.dungeon_albums FOR SELECT
  USING (
    privacy_level = 'coven_only' AND
    public.user_has_coven_access_to_album(auth.uid(), id)
  );

CREATE POLICY "Users can view media in accessible albums"
  ON public.dungeon_media FOR SELECT
  USING (public.album_is_accessible(auth.uid(), album_id));

CREATE POLICY "Users with valid keys can view secret media"
  ON public.dungeon_media FOR SELECT
  USING (
    is_secret_chamber = TRUE AND
    public.user_has_valid_access_key(auth.uid(), album_id)
  );