-- Create enum for media privacy levels
CREATE TYPE media_privacy AS ENUM ('private', 'public', 'coven_only');

-- Create enum for access types
CREATE TYPE access_type AS ENUM ('free', 'paid');

-- Create enum for chamber types
CREATE TYPE chamber_type AS ENUM ('photo_album', 'video_archive', 'secret_chamber');

-- Photo Albums table
CREATE TABLE public.dungeon_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  privacy_level media_privacy NOT NULL DEFAULT 'private',
  chamber_type chamber_type NOT NULL DEFAULT 'photo_album',
  access_type access_type NOT NULL DEFAULT 'free',
  price_cents INTEGER DEFAULT 0,
  ambient_color TEXT,
  sigil_overlay TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Album media items (photos/videos)
CREATE TABLE public.dungeon_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES public.dungeon_albums(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  duration INTEGER,
  is_secret_chamber BOOLEAN DEFAULT FALSE,
  encrypted_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Access keys for paid/secret content
CREATE TABLE public.dungeon_access_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES public.dungeon_albums(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_valid BOOLEAN DEFAULT TRUE,
  bypass_payment BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE public.dungeon_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES public.dungeon_albums(id) ON DELETE CASCADE,
  buyer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coven access permissions
CREATE TABLE public.dungeon_coven_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES public.dungeon_albums(id) ON DELETE CASCADE,
  coven_id UUID NOT NULL REFERENCES public.covens(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(album_id, coven_id)
);

-- Enable RLS
ALTER TABLE public.dungeon_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dungeon_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dungeon_access_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dungeon_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dungeon_coven_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dungeon_albums
CREATE POLICY "Users can view their own albums"
  ON public.dungeon_albums FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public albums"
  ON public.dungeon_albums FOR SELECT
  USING (privacy_level = 'public');

CREATE POLICY "Coven members can view coven albums"
  ON public.dungeon_albums FOR SELECT
  USING (
    privacy_level = 'coven_only' AND
    EXISTS (
      SELECT 1 FROM public.dungeon_coven_access dca
      JOIN public.coven_members cm ON cm.coven_id = dca.coven_id
      WHERE dca.album_id = dungeon_albums.id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create albums"
  ON public.dungeon_albums FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own albums"
  ON public.dungeon_albums FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own albums"
  ON public.dungeon_albums FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all albums"
  ON public.dungeon_albums FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for dungeon_media
CREATE POLICY "Users can view their own media"
  ON public.dungeon_media FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view media in accessible albums"
  ON public.dungeon_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dungeon_albums da
      WHERE da.id = dungeon_media.album_id
      AND (
        da.user_id = auth.uid() OR
        da.privacy_level = 'public' OR
        (da.privacy_level = 'coven_only' AND EXISTS (
          SELECT 1 FROM public.dungeon_coven_access dca
          JOIN public.coven_members cm ON cm.coven_id = dca.coven_id
          WHERE dca.album_id = da.id AND cm.user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users with valid keys can view secret media"
  ON public.dungeon_media FOR SELECT
  USING (
    is_secret_chamber = TRUE AND
    EXISTS (
      SELECT 1 FROM public.dungeon_access_keys dak
      WHERE dak.album_id = dungeon_media.album_id
      AND dak.user_id = auth.uid()
      AND dak.is_valid = TRUE
      AND dak.expires_at > NOW()
    )
  );

CREATE POLICY "Users can upload media to their albums"
  ON public.dungeon_media FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.dungeon_albums
      WHERE id = album_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own media"
  ON public.dungeon_media FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all media"
  ON public.dungeon_media FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for dungeon_access_keys
CREATE POLICY "Users can view their own access keys"
  ON public.dungeon_access_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Album owners can view keys for their albums"
  ON public.dungeon_access_keys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dungeon_albums
      WHERE id = album_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create access keys"
  ON public.dungeon_access_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for dungeon_transactions
CREATE POLICY "Users can view their transactions"
  ON public.dungeon_transactions FOR SELECT
  USING (auth.uid() = buyer_user_id OR auth.uid() = seller_user_id);

CREATE POLICY "System can create transactions"
  ON public.dungeon_transactions FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admins can view all transactions"
  ON public.dungeon_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for dungeon_coven_access
CREATE POLICY "Album owners can manage coven access"
  ON public.dungeon_coven_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.dungeon_albums
      WHERE id = album_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view coven access for their albums"
  ON public.dungeon_coven_access FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dungeon_albums
      WHERE id = album_id AND user_id = auth.uid()
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_dungeon_albums_updated_at
  BEFORE UPDATE ON public.dungeon_albums
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for dungeon media
INSERT INTO storage.buckets (id, name, public)
VALUES ('dungeon-media', 'dungeon-media', false);

-- Storage policies
CREATE POLICY "Users can upload to their own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'dungeon-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view media they have access to"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dungeon-media');

CREATE POLICY "Users can delete their own media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'dungeon-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'dungeon-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );