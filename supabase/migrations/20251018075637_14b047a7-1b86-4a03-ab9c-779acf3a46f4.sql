-- Create AI usage log table for monetization tracking
CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_name TEXT NOT NULL,
  action TEXT NOT NULL,
  credits_used INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own usage logs"
  ON public.ai_usage_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage logs"
  ON public.ai_usage_log
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert usage logs"
  ON public.ai_usage_log
  FOR INSERT
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user_id ON public.ai_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_timestamp ON public.ai_usage_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_module ON public.ai_usage_log(module_name);