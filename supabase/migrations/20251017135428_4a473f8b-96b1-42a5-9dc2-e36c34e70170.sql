-- Add belief_system to covens table
DO $$ BEGIN
  ALTER TABLE public.covens ADD COLUMN IF NOT EXISTS belief_system TEXT DEFAULT 'satanist';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Create belief system enum for reference
DO $$ BEGIN
  CREATE TYPE belief_system AS ENUM (
    'satanist',
    'luciferian',
    'infernalist',
    'thelemite',
    'chaos_magic',
    'left_hand_path',
    'demonolater',
    'dark_pagan'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;