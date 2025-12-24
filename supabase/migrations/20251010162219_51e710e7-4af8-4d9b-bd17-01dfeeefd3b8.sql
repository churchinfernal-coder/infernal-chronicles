-- Add "666" to allowed post reaction types
ALTER TABLE public.post_reactions 
DROP CONSTRAINT IF EXISTS post_reactions_reaction_type_check;

ALTER TABLE public.post_reactions 
ADD CONSTRAINT post_reactions_reaction_type_check 
CHECK (reaction_type IN ('blood', 'spider', 'fire', 'demon', 'grave', 'pitchfork', '666'));