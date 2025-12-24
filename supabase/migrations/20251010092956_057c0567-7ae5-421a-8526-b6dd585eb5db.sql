-- Add foreign key constraints to friendships table
-- This links friendships to profiles table properly

-- Drop table if we need to recreate with proper constraints
-- (Commenting out since we have RLS policies already)

-- Add foreign keys to link friendships to profiles
ALTER TABLE public.friendships
  DROP CONSTRAINT IF EXISTS friendships_user_id_fkey,
  DROP CONSTRAINT IF EXISTS friendships_friend_id_fkey;

-- Add proper foreign keys referencing profiles.user_id
ALTER TABLE public.friendships
  ADD CONSTRAINT friendships_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(user_id) 
    ON DELETE CASCADE;

ALTER TABLE public.friendships
  ADD CONSTRAINT friendships_friend_id_fkey 
    FOREIGN KEY (friend_id) 
    REFERENCES public.profiles(user_id) 
    ON DELETE CASCADE;

-- Add foreign keys to blocked_users table as well
ALTER TABLE public.blocked_users
  DROP CONSTRAINT IF EXISTS blocked_users_user_id_fkey,
  DROP CONSTRAINT IF EXISTS blocked_users_blocked_user_id_fkey;

ALTER TABLE public.blocked_users
  ADD CONSTRAINT blocked_users_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(user_id) 
    ON DELETE CASCADE;

ALTER TABLE public.blocked_users
  ADD CONSTRAINT blocked_users_blocked_user_id_fkey 
    FOREIGN KEY (blocked_user_id) 
    REFERENCES public.profiles(user_id) 
    ON DELETE CASCADE;