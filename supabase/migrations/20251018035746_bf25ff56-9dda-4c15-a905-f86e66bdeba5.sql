-- Add missing columns to navigation_menus if they don't exist
DO $$ 
BEGIN
  -- Add items column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_menus' AND column_name = 'items') THEN
    ALTER TABLE public.navigation_menus ADD COLUMN items jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
  
  -- Add max_depth column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_menus' AND column_name = 'max_depth') THEN
    ALTER TABLE public.navigation_menus ADD COLUMN max_depth integer DEFAULT 3;
  END IF;
  
  -- Add show_icons column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_menus' AND column_name = 'show_icons') THEN
    ALTER TABLE public.navigation_menus ADD COLUMN show_icons boolean DEFAULT true;
  END IF;
  
  -- Add mobile_breakpoint column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_menus' AND column_name = 'mobile_breakpoint') THEN
    ALTER TABLE public.navigation_menus ADD COLUMN mobile_breakpoint integer DEFAULT 768;
  END IF;
  
  -- Add updated_by column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_menus' AND column_name = 'updated_by') THEN
    ALTER TABLE public.navigation_menus ADD COLUMN updated_by uuid REFERENCES auth.users(id);
  END IF;
END $$;