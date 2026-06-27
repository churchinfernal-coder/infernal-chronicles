-- ═══════════════════════════════════════════════════════════════════════════
-- Enterprise Grade Schema with Full Foreign Key Enforcement
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════
-- Storage Bucket Configuration
-- ═══════════════════════════════════════════════════════════════════════════

-- Create storage bucket for coven media (run this in Supabase Dashboard or via API)
INSERT INTO storage.buckets (id, name, public)
VALUES ('coven-media', 'coven-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for coven-media bucket
CREATE POLICY "Authenticated users can upload coven media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'coven-media');

CREATE POLICY "Public can view coven media"
ON storage. objects FOR SELECT
TO public
USING (bucket_id = 'coven-media');

CREATE POLICY "Users can delete their own coven media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'coven-media' AND
  auth.uid():: text = (storage.foldername(name))[2]
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Ensure All Foreign Keys Are Properly Set
-- ═══════════════════════════════════════════════════════════════════════════

-- Coven Members -> Profiles (ensure cascade)
ALTER TABLE coven_members
DROP CONSTRAINT IF EXISTS coven_members_user_id_fkey,
ADD CONSTRAINT coven_members_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- Coven Members -> Covens
ALTER TABLE coven_members
DROP CONSTRAINT IF EXISTS coven_members_coven_id_fkey,
ADD CONSTRAINT coven_members_coven_id_fkey 
  FOREIGN KEY (coven_id) 
  REFERENCES covens(id) 
  ON DELETE CASCADE;

-- Coven Posts -> Profiles
ALTER TABLE coven_posts
DROP CONSTRAINT IF EXISTS coven_posts_user_id_fkey,
ADD CONSTRAINT coven_posts_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- Coven Posts -> Covens
ALTER TABLE coven_posts
DROP CONSTRAINT IF EXISTS coven_posts_coven_id_fkey,
ADD CONSTRAINT coven_posts_coven_id_fkey 
  FOREIGN KEY (coven_id) 
  REFERENCES covens(id) 
  ON DELETE CASCADE;

-- Coven Post Reactions -> Posts
ALTER TABLE coven_post_reactions
DROP CONSTRAINT IF EXISTS coven_post_reactions_post_id_fkey,
ADD CONSTRAINT coven_post_reactions_post_id_fkey 
  FOREIGN KEY (post_id) 
  REFERENCES coven_posts(id) 
  ON DELETE CASCADE;

-- Coven Post Reactions -> Profiles
ALTER TABLE coven_post_reactions
DROP CONSTRAINT IF EXISTS coven_post_reactions_user_id_fkey,
ADD CONSTRAINT coven_post_reactions_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- Coven Post Comments -> Posts
ALTER TABLE coven_post_comments
DROP CONSTRAINT IF EXISTS coven_post_comments_post_id_fkey,
ADD CONSTRAINT coven_post_comments_post_id_fkey 
  FOREIGN KEY (post_id) 
  REFERENCES coven_posts(id) 
  ON DELETE CASCADE;

-- Coven Post Comments -> Profiles
ALTER TABLE coven_post_comments
DROP CONSTRAINT IF EXISTS coven_post_comments_user_id_fkey,
ADD CONSTRAINT coven_post_comments_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- Coven Media -> Covens
ALTER TABLE coven_media
DROP CONSTRAINT IF EXISTS coven_media_coven_id_fkey,
ADD CONSTRAINT coven_media_coven_id_fkey 
  FOREIGN KEY (coven_id) 
  REFERENCES covens(id) 
  ON DELETE CASCADE;

-- Coven Media -> Profiles
ALTER TABLE coven_media
DROP CONSTRAINT IF EXISTS coven_media_user_id_fkey,
ADD CONSTRAINT coven_media_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- Coven Donations -> Covens
ALTER TABLE coven_donations
DROP CONSTRAINT IF EXISTS coven_donations_coven_id_fkey,
ADD CONSTRAINT coven_donations_coven_id_fkey 
  FOREIGN KEY (coven_id) 
  REFERENCES covens(id) 
  ON DELETE CASCADE;

-- Coven Donations -> Profiles (donor)
ALTER TABLE coven_donations
DROP CONSTRAINT IF EXISTS coven_donations_donor_id_fkey,
ADD CONSTRAINT coven_donations_donor_id_fkey 
  FOREIGN KEY (donor_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- ═══════════════════════════════════════════════════════════════════════════
-- Indexes for Performance
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_coven_members_coven_id ON coven_members(coven_id);
CREATE INDEX IF NOT EXISTS idx_coven_members_user_id ON coven_members(user_id);
CREATE INDEX IF NOT EXISTS idx_coven_posts_coven_id ON coven_posts(coven_id);
CREATE INDEX IF NOT EXISTS idx_coven_posts_user_id ON coven_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_coven_posts_created_at ON coven_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coven_posts_pinned ON coven_posts(is_pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coven_post_reactions_post_id ON coven_post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_coven_post_reactions_user_id ON coven_post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coven_post_comments_post_id ON coven_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_coven_media_coven_id ON coven_media(coven_id);
CREATE INDEX IF NOT EXISTS idx_coven_donations_coven_id ON coven_donations(coven_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Ensure NOT NULL Constraints on Critical Fields
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE coven_posts ALTER COLUMN content SET NOT NULL;
ALTER TABLE coven_posts ALTER COLUMN visibility SET DEFAULT 'members';
ALTER TABLE coven_posts ALTER COLUMN featured SET DEFAULT false;
ALTER TABLE coven_posts ALTER COLUMN is_pinned SET DEFAULT false;

ALTER TABLE coven_members ALTER COLUMN role SET DEFAULT 'member';

ALTER TABLE coven_media ALTER COLUMN media_url SET NOT NULL;
ALTER TABLE coven_media ALTER COLUMN media_type SET NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- Unique Constraints
-- ═══════════════════════════════════════════════════════════════════════════

-- One reaction per user per post
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_reaction_per_user_post 
ON coven_post_reactions(post_id, user_id);

-- One membership per user per coven
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_membership_per_user_coven 
ON coven_members(coven_id, user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS Policies (ensure they exist)
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE covens ENABLE ROW LEVEL SECURITY;
ALTER TABLE coven_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE coven_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE coven_post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coven_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coven_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE coven_donations ENABLE ROW LEVEL SECURITY;

-- Coven policies
CREATE POLICY "Public covens visible to all" ON covens
FOR SELECT USING (NOT is_private OR auth.uid() IN (
  SELECT user_id FROM coven_members WHERE coven_id = covens.id
));

-- Member policies
CREATE POLICY "Members visible to coven members" ON coven_members
FOR SELECT USING (auth. uid() IN (
  SELECT user_id FROM coven_members cm WHERE cm.coven_id = coven_members.coven_id
));

-- Post policies
CREATE POLICY "Posts visible to coven members" ON coven_posts
FOR SELECT USING (auth.uid() IN (
  SELECT user_id FROM coven_members WHERE coven_id = coven_posts.coven_id
));

CREATE POLICY "Members can create posts" ON coven_posts
FOR INSERT WITH CHECK (auth.uid() IN (
  SELECT user_id FROM coven_members WHERE coven_id = coven_posts.coven_id
));

CREATE POLICY "Users can delete own posts or admins can delete" ON coven_posts
FOR DELETE USING (
  auth.uid() = user_id OR
  auth.uid() IN (
    SELECT user_id FROM coven_members 
    WHERE coven_id = coven_posts.coven_id AND role = 'admin'
  )
);

-- Reaction policies
CREATE POLICY "Reactions visible to coven members" ON coven_post_reactions
FOR SELECT USING (auth.uid() IN (
  SELECT cm.user_id FROM coven_members cm
  JOIN coven_posts cp ON cp.coven_id = cm.coven_id
  WHERE cp.id = coven_post_reactions. post_id
));

CREATE POLICY "Members can react" ON coven_post_reactions
FOR INSERT WITH CHECK (auth.uid() IN (
  SELECT cm.user_id FROM coven_members cm
  JOIN coven_posts cp ON cp.coven_id = cm.coven_id
  WHERE cp.id = coven_post_reactions.post_id
));

CREATE POLICY "Users can remove own reactions" ON coven_post_reactions
FOR DELETE USING (auth.uid() = user_id);

-- Comment policies
CREATE POLICY "Comments visible to coven members" ON coven_post_comments
FOR SELECT USING (auth.uid() IN (
  SELECT cm.user_id FROM coven_members cm
  JOIN coven_posts cp ON cp.coven_id = cm.coven_id
  WHERE cp.id = coven_post_comments.post_id
));

CREATE POLICY "Members can comment" ON coven_post_comments
FOR INSERT WITH CHECK (auth.uid() IN (
  SELECT cm.user_id FROM coven_members cm
  JOIN coven_posts cp ON cp.coven_id = cm.coven_id
  WHERE cp.id = coven_post_comments. post_id
));

-- Media policies
CREATE POLICY "Media visible to coven members" ON coven_media
FOR SELECT USING (auth.uid() IN (
  SELECT user_id FROM coven_members WHERE coven_id = coven_media.coven_id
));

CREATE POLICY "Members can upload media" ON coven_media
FOR INSERT WITH CHECK (auth.uid() IN (
  SELECT user_id FROM coven_members WHERE coven_id = coven_media.coven_id
));

-- Donation policies
CREATE POLICY "Donations visible to coven admins and donor" ON coven_donations
FOR SELECT USING (
  auth.uid() = donor_id OR
  auth.uid() IN (
    SELECT user_id FROM coven_members 
    WHERE coven_id = coven_donations.coven_id AND role = 'admin'
  )
);

CREATE POLICY "Members can donate" ON coven_donations
FOR INSERT WITH CHECK (auth.uid() IN (
  SELECT user_id FROM coven_members WHERE coven_id = coven_donations.coven_id
));

-- ═══════════════════════════════════════════════════════════════════════════
-- Triggers for updated_at timestamps
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_coven_posts_updated_at ON coven_posts;
CREATE TRIGGER update_coven_posts_updated_at
    BEFORE UPDATE ON coven_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coven_post_comments_updated_at ON coven_post_comments;
CREATE TRIGGER update_coven_post_comments_updated_at
    BEFORE UPDATE ON coven_post_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();