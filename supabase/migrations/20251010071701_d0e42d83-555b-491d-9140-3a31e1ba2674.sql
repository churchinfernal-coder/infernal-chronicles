-- Add selected sigil to profiles
ALTER TABLE profiles ADD COLUMN selected_goetia_sigil TEXT;

-- Create Goetia-themed badges for demon ranks
INSERT INTO activity_badges (name, description, rarity, image_url, criteria) VALUES
('Infernal King', 'Commanded a King of the Goetia', 'legendary', '/badges/infernal-crown.png', '{"type": "goetia_rank", "rank": "King"}'),
('Dark Duke', 'Bound a Duke of Hell', 'epic', '/badges/dark-herald.png', '{"type": "goetia_rank", "rank": "Duke"}'),
('Shadow Marquis', 'Summoned a Marquis of Shadows', 'rare', '/badges/shadow-keeper.png', '{"type": "goetia_rank", "rank": "Marquis"}'),
('Void President', 'Invoked a President of the Void', 'rare', '/badges/void-walker.png', '{"type": "goetia_rank", "rank": "President"}'),
('Crimson Earl', 'Aligned with an Earl of Crimson', 'rare', '/badges/crimson-seal.png', '{"type": "goetia_rank", "rank": "Earl"}'),
('First Summoner', 'Completed first ritual in Solomon''s Chamber', 'common', '/badges/first-whisper.png', '{"type": "goetia_first", "completed": true}');