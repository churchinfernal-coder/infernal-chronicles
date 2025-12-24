-- Add personalization fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS zodiac_sign text,
ADD COLUMN IF NOT EXISTS relationship_status text,
ADD COLUMN IF NOT EXISTS career_focus text,
ADD COLUMN IF NOT EXISTS spirit_tone_preference text,
ADD COLUMN IF NOT EXISTS background text;

-- Add index for faster zodiac lookups
CREATE INDEX IF NOT EXISTS idx_profiles_zodiac ON public.profiles(zodiac_sign);