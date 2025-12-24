-- Add PDF storage and Amazon link to occult_library_books
ALTER TABLE public.occult_library_books
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS amazon_url TEXT;