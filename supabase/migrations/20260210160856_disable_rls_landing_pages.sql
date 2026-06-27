-- 
-- DISABLE RLS FOR LANDING PAGE TABLES (Public Read Access)
-- 

-- These tables are public-facing landing pages, no auth required

ALTER TABLE public.countries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.states DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_seo_metadata DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_views DISABLE ROW LEVEL SECURITY;

-- Grant public read access
GRANT SELECT ON public.countries TO anon;
GRANT SELECT ON public.states TO anon;
GRANT SELECT ON public.cities TO anon;
GRANT SELECT ON public.landing_page_content TO anon;
GRANT SELECT ON public.landing_seo_metadata TO anon;

-- Grant public insert for analytics
GRANT INSERT ON public.landing_page_views TO anon;
GRANT UPDATE ON public.landing_page_views TO anon;

-- Grant authenticated users full access for seeding
GRANT ALL ON public.countries TO authenticated;
GRANT ALL ON public.states TO authenticated;
GRANT ALL ON public.cities TO authenticated;
GRANT ALL ON public.landing_page_content TO authenticated;
GRANT ALL ON public.landing_seo_metadata TO authenticated;
GRANT ALL ON public.landing_page_views TO authenticated;

COMMENT ON TABLE public.landing_page_content IS 'Public landing page content - RLS disabled for public access';
COMMENT ON TABLE public.landing_seo_metadata IS 'Public SEO metadata - RLS disabled for public access';
