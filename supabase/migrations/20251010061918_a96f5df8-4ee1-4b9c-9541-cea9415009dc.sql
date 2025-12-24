-- Update paid badge images
UPDATE public.store_items SET image_url = '/src/assets/badges/infernal-crown.png' WHERE name = 'Infernal Crown';
UPDATE public.store_items SET image_url = '/src/assets/badges/shadow-keeper.png' WHERE name = 'Shadow Keeper';
UPDATE public.store_items SET image_url = '/src/assets/badges/crimson-seal.png' WHERE name = 'Crimson Seal';
UPDATE public.store_items SET image_url = '/src/assets/badges/void-walker.png' WHERE name = 'Void Walker';

-- Update earned badge images
UPDATE public.activity_badges SET image_url = '/src/assets/badges/first-whisper.png' WHERE name = 'First Whisper';
UPDATE public.activity_badges SET image_url = '/src/assets/badges/dark-herald.png' WHERE name = 'Dark Herald';
UPDATE public.activity_badges SET image_url = '/src/assets/badges/shadow-scribe.png' WHERE name = 'Shadow Scribe';
UPDATE public.activity_badges SET image_url = '/src/assets/badges/coven-founder.png' WHERE name = 'Coven Founder';
UPDATE public.activity_badges SET image_url = '/src/assets/badges/social-demon.png' WHERE name = 'Social Demon';
UPDATE public.activity_badges SET image_url = '/src/assets/badges/infernal-influencer.png' WHERE name = 'Infernal Influencer';