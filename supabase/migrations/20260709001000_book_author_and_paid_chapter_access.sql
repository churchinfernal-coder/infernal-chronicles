-- Add author metadata to AI book projects so publish flow can carry the
-- admin-selected author into occult_library_books.
ALTER TABLE public.book_projects
ADD COLUMN IF NOT EXISTS author text DEFAULT 'Infernal Chronicles';

UPDATE public.book_projects
SET author = COALESCE(NULLIF(author, ''), 'Infernal Chronicles')
WHERE author IS NULL OR trim(author) = '';

-- Paid access policy for chapter content tied to published books.
-- This keeps chapter SELECT aligned with library entitlement:
--   active subscription OR purchased specific book OR admin.
DROP POLICY IF EXISTS "Paid users can read published book chapters" ON public.book_chapters;

CREATE POLICY "Paid users can read published book chapters"
ON public.book_chapters FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.occult_library_books b
    WHERE b.book_project_id = book_chapters.project_id
      AND (
        has_role(auth.uid(), 'admin'::app_role)
        OR EXISTS (
          SELECT 1 FROM public.occult_subscriptions s
          WHERE s.user_id = auth.uid() AND s.status = 'active'
        )
        OR EXISTS (
          SELECT 1 FROM public.book_purchases p
          WHERE p.user_id = auth.uid() AND p.book_id = b.id
        )
      )
  )
);
