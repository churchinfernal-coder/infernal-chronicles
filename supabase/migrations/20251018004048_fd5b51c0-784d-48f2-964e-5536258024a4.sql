-- Create tables for header and footer management

-- Site headers table
CREATE TABLE IF NOT EXISTS public.site_headers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  layout_type text NOT NULL DEFAULT 'standard',
  logo_url text,
  background_color text,
  background_image text,
  text_color text,
  font_family text,
  height integer DEFAULT 80,
  sticky boolean DEFAULT false,
  content_data jsonb DEFAULT '{}',
  is_active boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Site footers table
CREATE TABLE IF NOT EXISTS public.site_footers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  layout_type text NOT NULL DEFAULT 'standard',
  background_color text,
  background_image text,
  text_color text,
  font_family text,
  content_data jsonb DEFAULT '{}',
  is_active boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Navigation menus table
CREATE TABLE IF NOT EXISTS public.navigation_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL DEFAULT 'header',
  is_active boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Navigation menu items table
CREATE TABLE IF NOT EXISTS public.navigation_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id uuid REFERENCES public.navigation_menus(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.navigation_menu_items(id) ON DELETE CASCADE,
  label text NOT NULL,
  url text NOT NULL,
  icon text,
  sort_order integer DEFAULT 0,
  is_external boolean DEFAULT false,
  target text DEFAULT '_self',
  css_classes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Site social links table
CREATE TABLE IF NOT EXISTS public.site_social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  url text NOT NULL,
  icon text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_footers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_social_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_headers
CREATE POLICY "Everyone can view active headers"
  ON public.site_headers FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage all headers"
  ON public.site_headers FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for site_footers
CREATE POLICY "Everyone can view active footers"
  ON public.site_footers FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage all footers"
  ON public.site_footers FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for navigation_menus
CREATE POLICY "Everyone can view active menus"
  ON public.navigation_menus FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage all menus"
  ON public.navigation_menus FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for navigation_menu_items
CREATE POLICY "Everyone can view menu items"
  ON public.navigation_menu_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.navigation_menus
      WHERE id = menu_id AND is_active = true
    )
  );

CREATE POLICY "Admins can manage all menu items"
  ON public.navigation_menu_items FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for site_social_links
CREATE POLICY "Everyone can view active social links"
  ON public.site_social_links FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage all social links"
  ON public.site_social_links FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_site_headers_active ON public.site_headers(is_active);
CREATE INDEX idx_site_footers_active ON public.site_footers(is_active);
CREATE INDEX idx_navigation_menus_active ON public.navigation_menus(is_active);
CREATE INDEX idx_navigation_menu_items_menu ON public.navigation_menu_items(menu_id);
CREATE INDEX idx_navigation_menu_items_parent ON public.navigation_menu_items(parent_id);
CREATE INDEX idx_site_social_links_active ON public.site_social_links(is_active);

-- Create triggers for updated_at
CREATE TRIGGER update_site_headers_updated_at
  BEFORE UPDATE ON public.site_headers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_footers_updated_at
  BEFORE UPDATE ON public.site_footers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_navigation_menus_updated_at
  BEFORE UPDATE ON public.navigation_menus
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_navigation_menu_items_updated_at
  BEFORE UPDATE ON public.navigation_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_social_links_updated_at
  BEFORE UPDATE ON public.site_social_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();