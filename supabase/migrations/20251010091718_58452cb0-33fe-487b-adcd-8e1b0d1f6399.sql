-- Add blocked users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, blocked_user_id),
  CHECK (user_id != blocked_user_id)
);

-- Enable RLS
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Policies for blocked users
CREATE POLICY "Users can view their own blocks"
  ON blocked_users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create blocks"
  ON blocked_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blocks"
  ON blocked_users FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_blocked_users_user_id ON blocked_users(user_id);
CREATE INDEX idx_blocked_users_blocked_user_id ON blocked_users(blocked_user_id);

-- Add notification preferences to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS allow_contact_requests boolean DEFAULT true;

-- Create function to get suggested contacts based on shared covens
CREATE OR REPLACE FUNCTION get_suggested_contacts(requesting_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  username text,
  avatar_url text,
  shared_covens bigint,
  shared_sigil boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_covens AS (
    SELECT coven_id 
    FROM coven_members 
    WHERE coven_members.user_id = requesting_user_id
  ),
  user_sigil AS (
    SELECT selected_goetia_sigil 
    FROM profiles 
    WHERE profiles.user_id = requesting_user_id
  )
  SELECT DISTINCT
    p.user_id,
    p.username,
    p.avatar_url,
    COUNT(DISTINCT cm.coven_id)::bigint as shared_covens,
    (p.selected_goetia_sigil = (SELECT selected_goetia_sigil FROM user_sigil))::boolean as shared_sigil
  FROM profiles p
  LEFT JOIN coven_members cm ON cm.user_id = p.user_id 
    AND cm.coven_id IN (SELECT coven_id FROM user_covens)
  WHERE p.user_id != requesting_user_id
    AND p.user_id NOT IN (
      SELECT friend_id FROM friendships 
      WHERE friendships.user_id = requesting_user_id
    )
    AND p.user_id NOT IN (
      SELECT blocked_user_id FROM blocked_users 
      WHERE blocked_users.user_id = requesting_user_id
    )
    AND (
      cm.coven_id IS NOT NULL 
      OR p.selected_goetia_sigil = (SELECT selected_goetia_sigil FROM user_sigil)
    )
  GROUP BY p.user_id, p.username, p.avatar_url, p.selected_goetia_sigil
  ORDER BY shared_covens DESC, shared_sigil DESC
  LIMIT 20;
END;
$$;