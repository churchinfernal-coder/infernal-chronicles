-- Add missing column if navigation_menus table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'navigation_menus') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_menus' AND column_name = 'display_order') THEN
      ALTER TABLE public.navigation_menus ADD COLUMN display_order integer DEFAULT 0;
    END IF;
  END IF;
END $$;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS public.site_header (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  logo_alt text DEFAULT 'Site Logo',
  tagline text,
  background_color text DEFAULT '#000000',
  text_color text DEFAULT '#ffffff',
  height integer DEFAULT 80,
  sticky boolean DEFAULT true,
  show_search boolean DEFAULT true,
  show_notifications boolean DEFAULT true,
  custom_css text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.site_footer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  copyright_text text DEFAULT '© 2025 All Rights Reserved',
  social_links jsonb DEFAULT '[]'::jsonb,
  contact_email text,
  contact_phone text,
  address text,
  background_color text DEFAULT '#111111',
  text_color text DEFAULT '#cccccc',
  show_social boolean DEFAULT true,
  show_contact boolean DEFAULT true,
  custom_html text,
  custom_css text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.navigation_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  max_depth integer DEFAULT 3,
  show_icons boolean DEFAULT true,
  mobile_breakpoint integer DEFAULT 768,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_footer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_menus ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage site header" ON public.site_header;
DROP POLICY IF EXISTS "Everyone can view active header" ON public.site_header;
DROP POLICY IF EXISTS "Admins can manage site footer" ON public.site_footer;
DROP POLICY IF EXISTS "Everyone can view active footer" ON public.site_footer;
DROP POLICY IF EXISTS "Admins can manage navigation menus" ON public.navigation_menus;
DROP POLICY IF EXISTS "Everyone can view active navigation menus" ON public.navigation_menus;

-- Create RLS Policies
CREATE POLICY "Admins can manage site header"
  ON public.site_header FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active header"
  ON public.site_header FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage site footer"
  ON public.site_footer FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active footer"
  ON public.site_footer FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage navigation menus"
  ON public.navigation_menus FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active navigation menus"
  ON public.navigation_menus FOR SELECT
  USING (is_active = true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_site_header_active ON public.site_header(is_active);
CREATE INDEX IF NOT EXISTS idx_site_footer_active ON public.site_footer(is_active);
CREATE INDEX IF NOT EXISTS idx_navigation_menus_location ON public.navigation_menus(location);
CREATE INDEX IF NOT EXISTS idx_navigation_menus_display ON public.navigation_menus(display_order);