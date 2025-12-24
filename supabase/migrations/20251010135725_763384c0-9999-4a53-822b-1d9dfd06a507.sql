-- Add visibility column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'coven-only'));

-- Create index for faster public post queries
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility, created_at DESC);