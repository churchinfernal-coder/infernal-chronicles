-- Superadmin AI Engine Database Schema

-- Error logs table
CREATE TABLE IF NOT EXISTS public.ai_error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  module_name TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'analyzing', 'fixed', 'ignored')),
  fix_applied TEXT,
  actor_type TEXT CHECK (actor_type IN ('ai', 'admin', 'system')),
  actor_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Error memory for learning engine
CREATE TABLE IF NOT EXISTS public.ai_error_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_signature TEXT NOT NULL,
  error_pattern JSONB NOT NULL,
  fix_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  success_rate DECIMAL(5,2) DEFAULT 0.0,
  occurrence_count INTEGER DEFAULT 1,
  last_occurrence TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Code modifications tracking
CREATE TABLE IF NOT EXISTS public.ai_code_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_log_id UUID REFERENCES public.ai_error_logs(id),
  module_path TEXT NOT NULL,
  modification_type TEXT NOT NULL CHECK (modification_type IN ('fix', 'optimization', 'feature', 'security')),
  original_code TEXT NOT NULL,
  modified_code TEXT NOT NULL,
  diff_data JSONB,
  ai_reasoning TEXT,
  applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMPTZ,
  applied_by UUID,
  rollback_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deployment history
CREATE TABLE IF NOT EXISTS public.ai_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modification_id UUID REFERENCES public.ai_code_modifications(id),
  deployment_type TEXT NOT NULL CHECK (deployment_type IN ('hotfix', 'patch', 'update')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'deploying', 'deployed', 'failed', 'rolled_back')),
  git_commit_hash TEXT,
  rollback_point UUID,
  deployed_by UUID,
  deployment_log JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deployed_at TIMESTAMPTZ
);

-- Test results
CREATE TABLE IF NOT EXISTS public.ai_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modification_id UUID REFERENCES public.ai_code_modifications(id),
  test_type TEXT NOT NULL CHECK (test_type IN ('unit', 'ui', 'database', 'security', 'performance')),
  test_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'skipped')),
  duration_ms INTEGER,
  error_message TEXT,
  test_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance metrics
CREATE TABLE IF NOT EXISTS public.ai_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metric_type TEXT NOT NULL,
  module_name TEXT,
  value DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User feedback
CREATE TABLE IF NOT EXISTS public.ai_user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  error_description TEXT NOT NULL,
  module_name TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  screenshot_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'resolved', 'false_positive')),
  ai_analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- AI analysis cache
CREATE TABLE IF NOT EXISTS public.ai_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_type TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  result JSONB NOT NULL,
  confidence_score DECIMAL(5,2),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Module vulnerability heatmap
CREATE TABLE IF NOT EXISTS public.ai_module_vulnerability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name TEXT NOT NULL,
  error_frequency INTEGER DEFAULT 0,
  critical_errors INTEGER DEFAULT 0,
  last_error_at TIMESTAMPTZ,
  vulnerability_score DECIMAL(5,2) DEFAULT 0.0,
  recommendations JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_error_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_code_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_module_vulnerability ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admins only
CREATE POLICY "Admins can view all error logs" ON public.ai_error_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert error logs" ON public.ai_error_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update error logs" ON public.ai_error_logs FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view error memory" ON public.ai_error_memory FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can manage error memory" ON public.ai_error_memory FOR ALL USING (true);

CREATE POLICY "Admins can view code modifications" ON public.ai_code_modifications FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view deployments" ON public.ai_deployments FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view test results" ON public.ai_test_results FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert performance metrics" ON public.ai_performance_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view performance metrics" ON public.ai_performance_metrics FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can submit feedback" ON public.ai_user_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their feedback" ON public.ai_user_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all feedback" ON public.ai_user_feedback FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage analysis cache" ON public.ai_analysis_cache FOR ALL USING (true);

CREATE POLICY "Admins can view vulnerabilities" ON public.ai_module_vulnerability FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_error_logs_timestamp ON public.ai_error_logs(timestamp DESC);
CREATE INDEX idx_error_logs_module ON public.ai_error_logs(module_name);
CREATE INDEX idx_error_logs_status ON public.ai_error_logs(status);
CREATE INDEX idx_error_memory_signature ON public.ai_error_memory(error_signature);
CREATE INDEX idx_performance_timestamp ON public.ai_performance_metrics(timestamp DESC);
CREATE INDEX idx_module_vuln_score ON public.ai_module_vulnerability(vulnerability_score DESC);

-- Trigger for updating error memory
CREATE OR REPLACE FUNCTION update_error_memory_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_ai_error_memory_updated_at
BEFORE UPDATE ON public.ai_error_memory
FOR EACH ROW
EXECUTE FUNCTION update_error_memory_timestamp();