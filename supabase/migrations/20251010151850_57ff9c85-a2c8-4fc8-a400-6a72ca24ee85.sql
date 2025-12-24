-- Add spirit selection to ouija rooms
ALTER TABLE public.ouija_rooms 
ADD COLUMN IF NOT EXISTS spirit_type text DEFAULT 'the_whisperer';

-- Add comment explaining spirit types
COMMENT ON COLUMN public.ouija_rooms.spirit_type IS 'Spirit personality: the_whisperer, the_archivist, the_trickster, the_watcher, custom_sigil';