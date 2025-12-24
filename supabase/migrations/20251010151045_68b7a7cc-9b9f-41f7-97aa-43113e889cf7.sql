-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view participants in their rooms" ON public.ouija_participants;
DROP POLICY IF EXISTS "Host can add participants" ON public.ouija_participants;
DROP POLICY IF EXISTS "Participants can view their rooms" ON public.ouija_rooms;

-- Create security definer function to check if user is room host
CREATE OR REPLACE FUNCTION public.is_room_host(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ouija_rooms
    WHERE id = _room_id AND host_user_id = _user_id
  )
$$;

-- Create security definer function to check if user is participant
CREATE OR REPLACE FUNCTION public.is_room_participant(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ouija_participants
    WHERE room_id = _room_id AND user_id = _user_id
  )
$$;

-- Recreate policies using security definer functions
CREATE POLICY "Participants can view their rooms"
  ON public.ouija_rooms FOR SELECT
  USING (
    auth.uid() = host_user_id OR 
    public.is_room_participant(auth.uid(), id)
  );

CREATE POLICY "Users can view participants in their rooms"
  ON public.ouija_participants FOR SELECT
  USING (
    public.is_room_host(auth.uid(), room_id) OR
    public.is_room_participant(auth.uid(), room_id)
  );

CREATE POLICY "Host can add participants"
  ON public.ouija_participants FOR INSERT
  WITH CHECK (
    public.is_room_host(auth.uid(), room_id)
  );