-- 
-- INFERNAL CHURCH OF SATAN (I.C.O.S) - WORLDWIDE LANDING PAGES
-- Enterprise-Grade with Anti-Duplication Strategy
-- 

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- 
-- TABLE: COUNTRIES
-- 
CREATE TABLE IF NOT EXISTS public.countries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  iso_code CHAR(2) UNIQUE NOT NULL,
  continent TEXT,
  languages TEXT[] DEFAULT ARRAY['en'],
  timezone TEXT,
  currency TEXT,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 
-- TABLE: STATES/REGIONS
-- 
CREATE TABLE IF NOT EXISTS public.states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_id UUID REFERENCES public.countries(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  state_code TEXT,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country_id, slug)
);

-- 
-- TABLE: CITIES
-- 
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_id UUID REFERENCES public.states(id) ON DELETE CASCADE NOT NULL,
  country_id UUID REFERENCES public.countries(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  population INTEGER,
  timezone TEXT,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(state_id, slug)
);

-- 
-- TABLE: LANDING PAGE CONTENT (Anti-Duplication)
-- Unique content per location + language
-- 
CREATE TABLE IF NOT EXISTS public.landing_page_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_type TEXT NOT NULL CHECK (location_type IN ('country', 'state', 'city')),
  location_id UUID NOT NULL,
  language_code TEXT NOT NULL,
  
  -- Unique content per level (NO DUPLICATION)
  h1_title TEXT NOT NULL, -- Country: "I.C.O.S {Country}", State: "I.C.O.S {State}", City: "I.C.O.S {City}"
  h2_subtitle TEXT NOT NULL,
  hero_description TEXT NOT NULL,
  about_title TEXT NOT NULL,
  about_content TEXT NOT NULL,
  
  -- CTAs
  cta_primary_text TEXT DEFAULT 'Join infernalsocial.com',
  cta_secondary_text TEXT,
  
  -- Features (3 unique per level)
  feature_1_title TEXT,
  feature_1_description TEXT,
  feature_2_title TEXT,
  feature_2_description TEXT,
  feature_3_title TEXT,
  feature_3_description TEXT,
  
  -- Additional sections
  additional_sections JSONB DEFAULT '{}',
  featured_image TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(location_type, location_id, language_code)
);

-- 
-- TABLE: SEO METADATA (Unique per location + language)
-- 
CREATE TABLE IF NOT EXISTS public.landing_seo_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('country', 'state', 'city')),
  entity_id UUID NOT NULL,
  language_code TEXT NOT NULL,
  
  -- Meta tags (unique per location)
  meta_title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  meta_keywords TEXT[],
  
  -- Open Graph
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  og_type TEXT DEFAULT 'website',
  
  -- Twitter Card
  twitter_card TEXT DEFAULT 'summary_large_image',
  twitter_title TEXT,
  twitter_description TEXT,
  twitter_image TEXT,
  
  -- Canonical & Alternate
  canonical_url TEXT NOT NULL,
  hreflang_alternates JSONB DEFAULT '[]', -- [{lang: 'es', url: '...'}, ...]
  
  -- Structured Data
  structured_data JSONB,
  
  -- Robots
  robots TEXT DEFAULT 'index, follow',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(entity_type, entity_id, language_code)
);

-- 
-- TABLE: PAGE VIEWS & ANALYTICS
-- 
CREATE TABLE IF NOT EXISTS public.landing_page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('country', 'state', 'city')),
  entity_id UUID NOT NULL,
  
  -- Visitor info
  session_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash TEXT, -- Hashed for privacy
  user_agent TEXT,
  referrer TEXT,
  language TEXT,
  
  -- Device info
  device_type TEXT, -- mobile, tablet, desktop
  browser TEXT,
  os TEXT,
  screen_resolution TEXT,
  
  -- Behavior
  time_on_page INTEGER, -- seconds
  scroll_depth INTEGER, -- percentage
  clicked_cta BOOLEAN DEFAULT false,
  cta_name TEXT,
  
  -- Location
  visitor_country TEXT,
  visitor_city TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 
-- TABLE: TRANSLATIONS (For dynamic content)
-- 
CREATE TABLE IF NOT EXISTS public.landing_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('country', 'state', 'city')),
  entity_id UUID NOT NULL,
  language_code TEXT NOT NULL,
  field_name TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_id, language_code, field_name)
);

-- 
-- INDEXES FOR PERFORMANCE
-- 

-- Location lookups
CREATE INDEX IF NOT EXISTS idx_countries_slug ON public.countries(slug) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_countries_iso_code ON public.countries(iso_code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_states_slug ON public.states(slug) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_states_country_id ON public.states(country_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cities_slug ON public.cities(slug) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cities_state_id ON public.cities(state_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cities_country_id ON public.cities(country_id) WHERE is_active = true;

-- Content lookups
CREATE INDEX IF NOT EXISTS idx_landing_content_location ON public.landing_page_content(location_type, location_id, language_code);
CREATE INDEX IF NOT EXISTS idx_landing_seo_entity ON public.landing_seo_metadata(entity_type, entity_id, language_code);

-- Analytics
CREATE INDEX IF NOT EXISTS idx_landing_views_entity ON public.landing_page_views(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_landing_views_created ON public.landing_page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_landing_views_session ON public.landing_page_views(session_id);

-- Translations
CREATE INDEX IF NOT EXISTS idx_translations_entity ON public.landing_translations(entity_type, entity_id, language_code);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_countries_name_trgm ON public.countries USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_states_name_trgm ON public.states USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cities_name_trgm ON public.cities USING gin(name gin_trgm_ops);

-- 
-- ROW LEVEL SECURITY (RLS)
-- 

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_seo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_translations ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Countries viewable by everyone" ON public.countries FOR SELECT USING (is_active = true);
CREATE POLICY "States viewable by everyone" ON public.states FOR SELECT USING (is_active = true);
CREATE POLICY "Cities viewable by everyone" ON public.cities FOR SELECT USING (is_active = true);
CREATE POLICY "Landing content viewable by everyone" ON public.landing_page_content FOR SELECT USING (true);
CREATE POLICY "SEO metadata viewable by everyone" ON public.landing_seo_metadata FOR SELECT USING (true);
CREATE POLICY "Translations viewable by everyone" ON public.landing_translations FOR SELECT USING (true);

-- Analytics: anyone can insert views
CREATE POLICY "Anyone can track page views" ON public.landing_page_views FOR INSERT WITH CHECK (true);

-- 
-- FUNCTIONS
-- 

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_landing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_countries_timestamp BEFORE UPDATE ON public.countries FOR EACH ROW EXECUTE FUNCTION update_landing_timestamp();
CREATE TRIGGER update_states_timestamp BEFORE UPDATE ON public.states FOR EACH ROW EXECUTE FUNCTION update_landing_timestamp();
CREATE TRIGGER update_cities_timestamp BEFORE UPDATE ON public.cities FOR EACH ROW EXECUTE FUNCTION update_landing_timestamp();
CREATE TRIGGER update_landing_content_timestamp BEFORE UPDATE ON public.landing_page_content FOR EACH ROW EXECUTE FUNCTION update_landing_timestamp();
CREATE TRIGGER update_landing_seo_timestamp BEFORE UPDATE ON public.landing_seo_metadata FOR EACH ROW EXECUTE FUNCTION update_landing_timestamp();
CREATE TRIGGER update_translations_timestamp BEFORE UPDATE ON public.landing_translations FOR EACH ROW EXECUTE FUNCTION update_landing_timestamp();

-- Increment view count
CREATE OR REPLACE FUNCTION increment_landing_view_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.entity_type = 'country' THEN
    UPDATE public.countries 
    SET view_count = view_count + 1, last_viewed_at = NOW() 
    WHERE id = NEW.entity_id;
  ELSIF NEW.entity_type = 'state' THEN
    UPDATE public.states 
    SET view_count = view_count + 1, last_viewed_at = NOW() 
    WHERE id = NEW.entity_id;
  ELSIF NEW.entity_type = 'city' THEN
    UPDATE public.cities 
    SET view_count = view_count + 1, last_viewed_at = NOW() 
    WHERE id = NEW.entity_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_view_count_trigger 
AFTER INSERT ON public.landing_page_views 
FOR EACH ROW EXECUTE FUNCTION increment_landing_view_count();

-- 
-- SEED DATA: COUNTRIES
-- 

INSERT INTO public.countries (name, slug, iso_code, continent, languages, timezone, currency) VALUES
  ('United States', 'united-states', 'US', 'North America', ARRAY['en', 'es'], 'America/New_York', 'USD'),
  ('United Kingdom', 'united-kingdom', 'GB', 'Europe', ARRAY['en'], 'Europe/London', 'GBP'),
  ('Canada', 'canada', 'CA', 'North America', ARRAY['en', 'fr'], 'America/Toronto', 'CAD'),
  ('Mexico', 'mexico', 'MX', 'North America', ARRAY['es', 'en'], 'America/Mexico_City', 'MXN'),
  ('Germany', 'germany', 'DE', 'Europe', ARRAY['de', 'en'], 'Europe/Berlin', 'EUR'),
  ('France', 'france', 'FR', 'Europe', ARRAY['fr', 'en'], 'Europe/Paris', 'EUR'),
  ('Spain', 'spain', 'ES', 'Europe', ARRAY['es', 'en'], 'Europe/Madrid', 'EUR'),
  ('Italy', 'italy', 'IT', 'Europe', ARRAY['it', 'en'], 'Europe/Rome', 'EUR'),
  ('Brazil', 'brazil', 'BR', 'South America', ARRAY['pt', 'en'], 'America/Sao_Paulo', 'BRL'),
  ('Australia', 'australia', 'AU', 'Oceania', ARRAY['en'], 'Australia/Sydney', 'AUD')
ON CONFLICT (iso_code) DO NOTHING;

-- 
-- SEED CONTENT: USA (English) - UNIQUE CONTENT
-- 

INSERT INTO public.landing_page_content (
  location_type, location_id, language_code,
  h1_title, h2_subtitle, hero_description,
  about_title, about_content,
  feature_1_title, feature_1_description,
  feature_2_title, feature_2_description,
  feature_3_title, feature_3_description
)
SELECT 
  'country',
  id,
  'en',
  'Infernal Church of Satan - United States',
  'Join the Nationwide Infernalist Movement',
  'Connect with thousands of infernalists across all 50 states. The I.C.O.S community in the United States welcomes seekers of infernal wisdom from coast to coast.',
  'I.C.O.S Across America',
  'The Infernal Church of Satan (I.C.O.S) has established a strong presence throughout the United States. From major metropolitan areas to rural communities, infernalists gather to study the infernal bible, practice infernalism, and walk the path of Satan. Our nationwide network provides support, education, and fellowship for all who seek the infernal way.',
  'National Community',
  'Connect with infernalists in all 50 states through our nationwide network',
  'Infernal Bible Study',
  'Access comprehensive teachings and sacred texts of infernalism',
  'Regular Gatherings',
  'Attend events, rituals, and meetings across the country'
FROM public.countries WHERE iso_code = 'US'
ON CONFLICT (location_type, location_id, language_code) DO NOTHING;

-- 
-- SEED SEO: USA (English) - UNIQUE META
-- 

INSERT INTO public.landing_seo_metadata (
  entity_type, entity_id, language_code,
  meta_title, meta_description, meta_keywords,
  canonical_url, structured_data
)
SELECT 
  'country',
  id,
  'en',
  'Infernal Church of Satan (I.C.O.S) United States | Join the Infernalist Community',
  'Join the Infernal Church of Satan (I.C.O.S) in the United States. Connect with infernalists nationwide, explore the infernal bible, and discover the path of Satan. Active chapters in all 50 states.',
  ARRAY[
    'infernal church of satan',
    'infernalism',
    'infernal bible',
    'infernalist',
    'satan',
    'ICOS',
    'I.C.O.S',
    'satanism usa',
    'infernal church america',
    'satanic community united states'
  ],
  'https://infernalsocial.com/landing/united-states',
  jsonb_build_object(
    '@context', 'https://schema.org',
    '@type', 'Organization',
    'name', 'Infernal Church of Satan - United States',
    'alternateName', ARRAY['I.C.O.S', 'ICOS', 'Infernal Church'],
    'url', 'https://infernalsocial.com/landing/united-states',
    'description', 'The Infernal Church of Satan (I.C.O.S) welcomes seekers of infernal wisdom across the United States',
    'areaServed', jsonb_build_object(
      '@type', 'Country',
      'name', 'United States'
    )
  )
FROM public.countries WHERE iso_code = 'US'
ON CONFLICT (entity_type, entity_id, language_code) DO NOTHING;

-- 
-- COMMENTS
-- 

COMMENT ON TABLE public.countries IS 'Worldwide countries for I.C.O.S presence';
COMMENT ON TABLE public.states IS 'States/regions with unique content per level';
COMMENT ON TABLE public.cities IS 'Cities with hyperlocal I.C.O.S chapters';
COMMENT ON TABLE public.landing_page_content IS 'Unique content per location level - NO DUPLICATION';
COMMENT ON TABLE public.landing_seo_metadata IS 'Unique SEO metadata per location + language';
COMMENT ON TABLE public.landing_page_views IS 'Analytics tracking for performance monitoring';
COMMENT ON TABLE public.landing_translations IS 'Multilingual support for dynamic content';

COMMENT ON COLUMN public.landing_page_content.h1_title IS 'Unique H1 per location type: Country="I.C.O.S {Country}", State="I.C.O.S {State}", City="I.C.O.S {City}"';
COMMENT ON COLUMN public.landing_seo_metadata.canonical_url IS 'Unique canonical URL prevents duplicate content penalties';
