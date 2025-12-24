-- Create ai_engine_errors table
CREATE TABLE IF NOT EXISTS public.ai_engine_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name TEXT NOT NULL,
  error_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_engine_fixes table
CREATE TABLE IF NOT EXISTS public.ai_engine_fixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_id UUID REFERENCES public.ai_engine_errors(id) ON DELETE CASCADE,
  fix_description TEXT NOT NULL,
  script_reference TEXT,
  applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create ai_engine_instructions table (if not exists from previous migration)
CREATE TABLE IF NOT EXISTS public.ai_engine_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT NOT NULL,
  category TEXT NOT NULL,
  feature_path TEXT,
  code_context TEXT,
  instructions TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_engine_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_engine_fixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_engine_instructions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_engine_errors
CREATE POLICY "Admins can view all errors"
  ON public.ai_engine_errors FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert errors"
  ON public.ai_engine_errors FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update errors"
  ON public.ai_engine_errors FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for ai_engine_fixes
CREATE POLICY "Admins can view all fixes"
  ON public.ai_engine_fixes FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert fixes"
  ON public.ai_engine_fixes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update fixes"
  ON public.ai_engine_fixes FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for ai_engine_instructions
CREATE POLICY "Admins can manage instructions"
  ON public.ai_engine_instructions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_engine_errors_status ON public.ai_engine_errors(status);
CREATE INDEX IF NOT EXISTS idx_ai_engine_errors_severity ON public.ai_engine_errors(severity);
CREATE INDEX IF NOT EXISTS idx_ai_engine_errors_module ON public.ai_engine_errors(module_name);
CREATE INDEX IF NOT EXISTS idx_ai_engine_fixes_error_id ON public.ai_engine_fixes(error_id);
CREATE INDEX IF NOT EXISTS idx_ai_engine_fixes_applied ON public.ai_engine_fixes(applied);