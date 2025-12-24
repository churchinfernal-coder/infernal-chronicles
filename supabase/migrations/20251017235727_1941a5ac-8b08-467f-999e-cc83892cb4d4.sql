INSERT INTO public.occult_library_books 
  (title, author, description, category, tags, price_cents, total_chapters, total_words, excerpt, featured, cover_image_url, pdf_url, amazon_url)
VALUES 
  (
    'The Infernal Grimoire: Advanced Demonology',
    'Velador the Wise',
    'A comprehensive guide to understanding and working with infernal entities. This tome contains centuries of accumulated knowledge about the 72 demons of the Goetia and their practical applications in modern occultism.',
    'Demonology',
    ARRAY['demons', 'goetia', 'ritual magic', 'summoning'],
    2999,
    15,
    75000,
    'In the shadows between worlds, there exists a realm where ancient powers await those brave enough to seek them. This grimoire serves as your guide through the darkest mysteries...',
    true,
    'https://khugyibzsujjgtddwzpa.supabase.co/storage/v1/object/public/book-covers/infernal-grimoire.jpg',
    'books/infernal-grimoire.pdf',
    'https://amazon.com/infernal-grimoire'
  ),
  (
    'Blood Moon Rituals: Lunar Magick Unleashed',
    'Morgana Nightshade',
    'Harness the raw power of the blood moon with this essential guide to lunar magick. Learn to align your rituals with celestial events for maximum potency.',
    'Ritual Practice',
    ARRAY['moon magic', 'rituals', 'astrology', 'spellwork'],
    1999,
    12,
    60000,
    'When the moon bleeds red in the night sky, the veil between worlds grows thin. Those who know the ancient ways can tap into this cosmic power...',
    true,
    'https://khugyibzsujjgtddwzpa.supabase.co/storage/v1/object/public/book-covers/blood-moon.jpg',
    'books/blood-moon-rituals.pdf',
    'https://amazon.com/blood-moon-rituals'
  ),
  (
    'Sigils of Power: Modern Chaos Magick',
    'Azrael Storm',
    'Master the art of sigil creation and activation using cutting-edge chaos magick techniques. This practical guide bridges ancient symbolism with contemporary practice.',
    'Chaos Magick',
    ARRAY['sigils', 'chaos magic', 'symbolism', 'manifestation'],
    2499,
    10,
    50000,
    'Reality is malleable for those who know how to bend it. Through the focused will and sacred geometry of sigil magick, you can reshape your destiny...',
    false,
    'https://khugyibzsujjgtddwzpa.supabase.co/storage/v1/object/public/book-covers/sigils-power.jpg',
    'books/sigils-of-power.pdf',
    'https://amazon.com/sigils-of-power'
  ),
  (
    'The Left Hand Path: A Journey Into Darkness',
    'Lucien Blackwood',
    'An unapologetic exploration of left-hand path philosophy and practice. Discover the transformative power of embracing your shadow self and walking the path less traveled.',
    'Philosophy',
    ARRAY['left hand path', 'self-deification', 'shadow work', 'antinomianism'],
    3499,
    20,
    100000,
    'The right-hand path promises salvation through submission. The left-hand path offers something far more precious: true self-mastery and apotheosis...',
    true,
    'https://khugyibzsujjgtddwzpa.supabase.co/storage/v1/object/public/book-covers/left-hand-path.jpg',
    'books/left-hand-path.pdf',
    'https://amazon.com/left-hand-path'
  ),
  (
    'Necromantic Arts: Communion with the Dead',
    'Dr. Raven Mortem',
    'A scholarly yet practical approach to necromancy and spirit communication. Learn to safely navigate the realm of the dead and establish meaningful connections with departed souls.',
    'Necromancy',
    ARRAY['necromancy', 'spirit work', 'mediumship', 'ancestor veneration'],
    2799,
    14,
    70000,
    'Death is not the end, but a threshold. For those initiated in the necromantic arts, it is a doorway to vast knowledge and ancient wisdom...',
    false,
    'https://khugyibzsujjgtddwzpa.supabase.co/storage/v1/object/public/book-covers/necromantic-arts.jpg',
    'books/necromantic-arts.pdf',
    'https://amazon.com/necromantic-arts'
  )
  (
    'Sovereign Codex: Rituals of the Main',
    'Aurelius Sovereign',
    'A definitive guide to the rituals, history, and philosophy of the Sovereign Infernal Chronicles. Includes verified rites and practices for advanced practitioners.',
    'Rituals',
    ARRAY['sovereign', 'ritual', 'philosophy', 'practice'],
    4999,
    20,
    90000,
    'This codex unveils the true rites of the Sovereign, with step-by-step instructions and historical context.',
    true,
    'https://real-production-url.com/covers/sovereign-codex.png',
    'https://real-production-url.com/books/sovereign-codex.pdf',
    'https://amazon.com/sovereign-codex'
  )
ON CONFLICT DO NOTHING;