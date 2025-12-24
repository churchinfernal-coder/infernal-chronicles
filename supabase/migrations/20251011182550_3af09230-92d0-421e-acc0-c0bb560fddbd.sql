-- Drop the existing check constraint
ALTER TABLE post_reactions DROP CONSTRAINT IF EXISTS post_reactions_reaction_type_check;

-- Add updated constraint with new reaction types
ALTER TABLE post_reactions ADD CONSTRAINT post_reactions_reaction_type_check 
CHECK (reaction_type IN (
  'like', 
  'love', 
  'haha', 
  'wow', 
  'sad', 
  'angry',
  'pitchfork',
  'knife',
  'sword',
  '666',
  'skull',
  'crossbones',
  'casket',
  'spider',
  'cross'
));