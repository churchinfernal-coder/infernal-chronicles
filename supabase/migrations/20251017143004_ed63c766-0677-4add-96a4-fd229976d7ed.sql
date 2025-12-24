-- Create module audit logs table for forensic tracking
CREATE TABLE IF NOT EXISTS public.module_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.module_audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view all module logs"
  ON public.module_audit_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Admins can create logs
CREATE POLICY "Admins can create module logs"
  ON public.module_audit_logs
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') AND auth.uid() = admin_user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_module_audit_logs_created_at 
  ON public.module_audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_module_audit_logs_module_name 
  ON public.module_audit_logs(module_name);