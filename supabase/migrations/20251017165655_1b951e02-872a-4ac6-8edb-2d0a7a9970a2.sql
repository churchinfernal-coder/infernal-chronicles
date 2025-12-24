-- Create book_projects table
CREATE TABLE book_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  genre TEXT NOT NULL,
  prompt TEXT NOT NULL,
  characters JSONB DEFAULT '[]'::jsonb,
  setting TEXT,
  style TEXT DEFAULT 'formal',
  target_length INTEGER DEFAULT 50000,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create book_chapters table
CREATE TABLE book_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES book_projects(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, chapter_number)
);

-- Enable RLS
ALTER TABLE book_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_chapters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for book_projects
CREATE POLICY "Admins can manage all book projects"
  ON book_projects
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own book projects"
  ON book_projects
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own book projects"
  ON book_projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own book projects"
  ON book_projects
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own book projects"
  ON book_projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for book_chapters
CREATE POLICY "Admins can manage all book chapters"
  ON book_chapters
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view chapters of their projects"
  ON book_chapters
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM book_projects
      WHERE book_projects.id = book_chapters.project_id
      AND book_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chapters for their projects"
  ON book_chapters
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM book_projects
      WHERE book_projects.id = book_chapters.project_id
      AND book_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update chapters of their projects"
  ON book_chapters
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM book_projects
      WHERE book_projects.id = book_chapters.project_id
      AND book_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete chapters of their projects"
  ON book_chapters
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM book_projects
      WHERE book_projects.id = book_chapters.project_id
      AND book_projects.user_id = auth.uid()
    )
  );

-- Create update trigger for book_projects
CREATE TRIGGER update_book_projects_updated_at
  BEFORE UPDATE ON book_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create update trigger for book_chapters
CREATE TRIGGER update_book_chapters_updated_at
  BEFORE UPDATE ON book_chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();