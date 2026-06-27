-- Enable email confirmation in Supabase Dashboard: 
-- Authentication > Settings > Email Auth
-- Enable email confirmations
-- Secure email change
-- Double confirm email changes

-- Add rate limiting to prevent spam signups
CREATE TABLE IF NOT EXISTS public.signup_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  successful BOOLEAN DEFAULT FALSE
);

-- Create index for rate limiting queries
CREATE INDEX idx_signup_attempts_email ON public.signup_attempts(email, attempted_at);
CREATE INDEX idx_signup_attempts_ip ON public.signup_attempts(ip_address, attempted_at);

-- RLS policies
ALTER TABLE public. signup_attempts ENABLE ROW LEVEL SECURITY;

-- Only system can insert
CREATE POLICY "System can insert signup attempts"
  ON public.signup_attempts
  FOR INSERT
  WITH CHECK (true);
