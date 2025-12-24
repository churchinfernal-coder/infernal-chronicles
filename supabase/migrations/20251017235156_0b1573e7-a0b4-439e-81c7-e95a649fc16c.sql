-- Add PDF storage and Amazon link to occult_library_books
ALTER TABLE public.occult_library_books
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS amazon_url TEXT;

-- Create storage bucket for book PDFs if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-pdfs', 'book-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for book covers if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for book-pdfs bucket
CREATE POLICY "Admins can upload book PDFs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'book-pdfs' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update book PDFs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'book-pdfs' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete book PDFs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'book-pdfs' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Subscribers can download book PDFs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'book-pdfs' AND (
    EXISTS (
      SELECT 1 FROM public.occult_subscriptions
      WHERE user_id = auth.uid() AND status = 'active'
    ) OR
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- RLS policies for book-covers bucket
CREATE POLICY "Anyone can view book covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-covers');

CREATE POLICY "Admins can upload book covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'book-covers' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update book covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'book-covers' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete book covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'book-covers' AND
  has_role(auth.uid(), 'admin'::app_role)
);