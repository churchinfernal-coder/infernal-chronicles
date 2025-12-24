-- Drop and recreate get_suggested_contacts with fixed parameter name
DROP FUNCTION IF EXISTS public.get_suggested_contacts(uuid);

CREATE FUNCTION public.get_suggested_contacts(_requesting_user_id uuid)
RETURNS TABLE(user_id uuid, username text, avatar_url text, shared_covens bigint, shared_sigil boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH user_covens AS (
    SELECT coven_id 
    FROM coven_members 
    WHERE coven_members.user_id = _requesting_user_id
  ),
  user_sigil AS (
    SELECT selected_goetia_sigil 
    FROM profiles 
    WHERE profiles.user_id = _requesting_user_id
  )
  SELECT DISTINCT
    p.user_id,
    p.username,
    p.avatar_url,
    COALESCE(COUNT(DISTINCT cm.coven_id), 0)::bigint as shared_covens,
    COALESCE(p.selected_goetia_sigil = (SELECT selected_goetia_sigil FROM user_sigil), false)::boolean as shared_sigil
  FROM profiles p
  LEFT JOIN coven_members cm ON cm.user_id = p.user_id 
    AND cm.coven_id IN (SELECT coven_id FROM user_covens)
  WHERE p.user_id != _requesting_user_id
    AND p.user_id NOT IN (
      SELECT friend_id FROM friendships 
      WHERE friendships.user_id = _requesting_user_id
      UNION
      SELECT friendships.user_id FROM friendships 
      WHERE friendships.friend_id = _requesting_user_id
    )
    AND p.user_id NOT IN (
      SELECT blocked_user_id FROM blocked_users 
      WHERE blocked_users.user_id = _requesting_user_id
    )
  GROUP BY p.user_id, p.username, p.avatar_url, p.selected_goetia_sigil
  ORDER BY shared_covens DESC, shared_sigil DESC
  LIMIT 20;
END;
$$;