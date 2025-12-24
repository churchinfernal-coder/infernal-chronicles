-- Check if foreign key exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'rituals_user_id_fkey' 
    AND table_name = 'rituals'
  ) THEN
    -- Add foreign key relationship between rituals and profiles
    ALTER TABLE public.rituals 
    ADD CONSTRAINT rituals_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  END IF;
END $$;