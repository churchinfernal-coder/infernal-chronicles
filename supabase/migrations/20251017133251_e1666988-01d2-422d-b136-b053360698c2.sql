-- Add foreign key from coven_posts to profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'coven_posts_user_id_profiles_fkey' 
    AND table_name = 'coven_posts'
  ) THEN
    ALTER TABLE public.coven_posts 
    ADD CONSTRAINT coven_posts_user_id_profiles_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(user_id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key from coven_members to profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'coven_members_user_id_profiles_fkey' 
    AND table_name = 'coven_members'
  ) THEN
    ALTER TABLE public.coven_members 
    ADD CONSTRAINT coven_members_user_id_profiles_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(user_id) 
    ON DELETE CASCADE;
  END IF;
END $$;