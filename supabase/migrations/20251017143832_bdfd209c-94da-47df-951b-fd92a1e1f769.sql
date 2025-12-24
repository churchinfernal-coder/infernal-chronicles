-- Fix all missing foreign key relationships for admin panels

-- Add foreign keys for rituals, covens, ouija, tarot, rune tables to enable joins with profiles

-- Rituals to profiles (already done earlier, but ensuring it exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'rituals_user_id_profiles_fkey' 
    AND table_name = 'rituals'
  ) THEN
    ALTER TABLE public.rituals 
    ADD CONSTRAINT rituals_user_id_profiles_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(user_id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Covens to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'covens_created_by_profiles_fkey' 
    AND table_name = 'covens'
  ) THEN
    ALTER TABLE public.covens 
    ADD CONSTRAINT covens_created_by_profiles_fkey 
    FOREIGN KEY (created_by) 
    REFERENCES public.profiles(user_id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Ouija rooms to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ouija_rooms_host_user_id_profiles_fkey' 
    AND table_name = 'ouija_rooms'
  ) THEN
    ALTER TABLE public.ouija_rooms 
    ADD CONSTRAINT ouija_rooms_host_user_id_profiles_fkey 
    FOREIGN KEY (host_user_id) 
    REFERENCES public.profiles(user_id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Tarot sessions to profiles (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tarot_sessions') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'tarot_sessions_user_id_profiles_fkey' 
      AND table_name = 'tarot_sessions'
    ) THEN
      ALTER TABLE public.tarot_sessions 
      ADD CONSTRAINT tarot_sessions_user_id_profiles_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES public.profiles(user_id) 
      ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Rune castings to profiles (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rune_castings') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'rune_castings_user_id_profiles_fkey' 
      AND table_name = 'rune_castings'
    ) THEN
      ALTER TABLE public.rune_castings 
      ADD CONSTRAINT rune_castings_user_id_profiles_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES public.profiles(user_id) 
      ON DELETE CASCADE;
    END IF;
  END IF;
END $$;