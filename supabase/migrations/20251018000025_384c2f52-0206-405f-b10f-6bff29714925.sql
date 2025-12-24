-- Update book cover URLs to use the newly generated images
UPDATE public.occult_library_books 
SET cover_image_url = '/book-covers/infernal-grimoire.jpg'
WHERE title = 'The Infernal Grimoire: Advanced Demonology';

UPDATE public.occult_library_books 
SET cover_image_url = '/book-covers/blood-moon.jpg'
WHERE title = 'Blood Moon Rituals: Lunar Magick Unleashed';

UPDATE public.occult_library_books 
SET cover_image_url = '/book-covers/sigils-power.jpg'
WHERE title = 'Sigils of Power: Modern Chaos Magick';

UPDATE public.occult_library_books 
SET cover_image_url = '/book-covers/left-hand-path.jpg'
WHERE title = 'The Left Hand Path: A Journey Into Darkness';

UPDATE public.occult_library_books 
SET cover_image_url = '/book-covers/necromantic-arts.jpg'
WHERE title = 'Necromantic Arts: Communion with the Dead';