-- Create master keys table with encryption
CREATE TABLE IF NOT EXISTS public.superadmin_master_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_code TEXT NOT NULL UNIQUE,
  key_hash TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.superadmin_master_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can manage master keys
CREATE POLICY "Only admins can view master keys"
  ON public.superadmin_master_keys
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can create master keys"
  ON public.superadmin_master_keys
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = created_by);

CREATE POLICY "Only admins can update master keys"
  ON public.superadmin_master_keys
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete master keys"
  ON public.superadmin_master_keys
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_master_keys_active ON public.superadmin_master_keys(is_active) WHERE is_active = true;
CREATE INDEX idx_master_keys_hash ON public.superadmin_master_keys(key_hash);