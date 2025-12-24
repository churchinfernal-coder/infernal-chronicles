-- Add language column to book_projects table
ALTER TABLE public.book_projects 
ADD COLUMN language text NOT NULL DEFAULT 'english';

-- Add constraint to ensure valid language values
ALTER TABLE public.book_projects 
ADD CONSTRAINT book_projects_language_check 
CHECK (language IN ('english', 'spanish'));