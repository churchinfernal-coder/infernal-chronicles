-- Add header image positioning columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS header_position_x TEXT DEFAULT 'center',
ADD COLUMN IF NOT EXISTS header_position_y TEXT DEFAULT 'center';

COMMENT ON COLUMN public.profiles.header_position_x IS 'Horizontal position: left, center, right';
COMMENT ON COLUMN public.profiles.header_position_y IS 'Vertical position: top, center, bottom';