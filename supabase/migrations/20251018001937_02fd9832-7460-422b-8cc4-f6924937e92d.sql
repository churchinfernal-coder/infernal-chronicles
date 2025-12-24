-- SEO Metadata table for pages, posts, and custom content
CREATE TABLE IF NOT EXISTS public.seo_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL, -- 'page', 'post', 'product', 'category', etc.
  content_id UUID, -- Reference to the actual content
  slug TEXT NOT NULL UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  focus_keyword TEXT,
  secondary_keywords TEXT[],
  canonical_url TEXT,
  robots_meta TEXT DEFAULT 'index, follow',
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  twitter_card_type TEXT DEFAULT 'summary_large_image',
  twitter_title TEXT,
  twitter_description TEXT,
  twitter_image TEXT,
  breadcrumb_title TEXT,
  schema_type TEXT, -- 'Article', 'Product', 'Event', etc.
  schema_data JSONB,
  seo_score INTEGER DEFAULT 0,
  readability_score INTEGER DEFAULT 0,
  keyword_density NUMERIC(5,2),
  content_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- SEO Keywords tracking
CREATE TABLE IF NOT EXISTS public.seo_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  competition_level TEXT, -- 'low', 'medium', 'high'
  current_ranking INTEGER,
  target_ranking INTEGER,
  tracked_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(keyword, tracked_url)
);

-- SEO Redirects
CREATE TABLE IF NOT EXISTS public.seo_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_path TEXT NOT NULL UNIQUE,
  target_path TEXT NOT NULL,
  redirect_type INTEGER DEFAULT 301, -- 301, 302, 307, 308
  is_active BOOLEAN DEFAULT true,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- SEO Site Settings (global)
CREATE TABLE IF NOT EXISTS public.seo_site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- SEO Image Optimization
CREATE TABLE IF NOT EXISTS public.seo_image_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL UNIQUE,
  alt_text TEXT,
  title TEXT,
  caption TEXT,
  description TEXT,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  format TEXT,
  is_optimized BOOLEAN DEFAULT false,
  associated_content_type TEXT,
  associated_content_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEO Performance Tracking
CREATE TABLE IF NOT EXISTS public.seo_performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL, -- 'ranking', 'traffic', 'ctr', 'impressions'
  content_slug TEXT,
  keyword TEXT,
  value NUMERIC,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_image_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_performance_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Admins
CREATE POLICY "Admins can manage all SEO metadata"
  ON public.seo_metadata
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage keywords"
  ON public.seo_keywords
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage redirects"
  ON public.seo_redirects
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage site settings"
  ON public.seo_site_settings
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage image metadata"
  ON public.seo_image_metadata
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view performance logs"
  ON public.seo_performance_logs
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert performance logs"
  ON public.seo_performance_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_seo_metadata_slug ON public.seo_metadata(slug);
CREATE INDEX idx_seo_metadata_content ON public.seo_metadata(content_type, content_id);
CREATE INDEX idx_seo_keywords_keyword ON public.seo_keywords(keyword);
CREATE INDEX idx_seo_redirects_source ON public.seo_redirects(source_path);
CREATE INDEX idx_seo_image_url ON public.seo_image_metadata(image_url);
CREATE INDEX idx_seo_performance_metric ON public.seo_performance_logs(metric_type, recorded_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_seo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_seo_metadata_updated_at
  BEFORE UPDATE ON public.seo_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_updated_at();

CREATE TRIGGER update_seo_keywords_updated_at
  BEFORE UPDATE ON public.seo_keywords
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_updated_at();

CREATE TRIGGER update_seo_redirects_updated_at
  BEFORE UPDATE ON public.seo_redirects
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_updated_at();