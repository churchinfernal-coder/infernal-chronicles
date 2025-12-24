-- Drop the old constraint
ALTER TABLE post_reactions DROP CONSTRAINT IF EXISTS post_reactions_reaction_type_check;

-- Add new constraint that includes both old and new reaction types
ALTER TABLE post_reactions ADD CONSTRAINT post_reactions_reaction_type_check 
CHECK (reaction_type IN ('666', '🩸', '🕷️', '🔥', '😈', 'like', 'thought', 'share'));