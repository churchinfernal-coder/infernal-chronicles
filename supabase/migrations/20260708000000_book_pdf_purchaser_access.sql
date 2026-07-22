-- Allow individual book purchasers (not only active subscribers) to read the
-- private book PDF objects. Access is granted when the storage object's path
-- matches a book the user has purchased, OR they hold an active subscription,
-- OR they are an admin. Keeps RLS aligned with the app entitlement rule:
--   hasAccess = active subscription OR book purchased.
DROP POLICY IF EXISTS "Subscribers can download book PDFs" ON storage.objects;

CREATE POLICY "Entitled users can read book PDFs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'book-pdfs' AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.occult_subscriptions
      WHERE user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (
      SELECT 1
      FROM public.book_purchases bp
      JOIN public.occult_library_books b ON b.id = bp.book_id
      WHERE bp.user_id = auth.uid()
        AND b.pdf_url = storage.objects.name
    )
  )
);
