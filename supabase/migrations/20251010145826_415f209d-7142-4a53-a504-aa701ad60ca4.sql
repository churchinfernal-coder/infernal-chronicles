-- Update the check constraint on post_reactions to allow 'pitchfork' reaction type
ALTER TABLE public.post_reactions 
DROP CONSTRAINT IF EXISTS post_reactions_reaction_type_check;

-- Add new constraint that includes pitchfork and the existing reaction types
ALTER TABLE public.post_reactions 
ADD CONSTRAINT post_reactions_reaction_type_check 
CHECK (reaction_type IN ('blood', 'spider', 'fire', 'demon', 'grave', 'pitchfork'));