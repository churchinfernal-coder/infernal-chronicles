-- Create ai_instructions table
CREATE TABLE IF NOT EXISTS public.ai_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT NOT NULL,
  category TEXT NOT NULL,
  feature_path TEXT,
  code_context TEXT,
  instructions TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_instructions ENABLE ROW LEVEL SECURITY;

-- Policies: Admins manage everything
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ai_instructions' AND policyname = 'Admins can manage ai_instructions'
  ) THEN
    CREATE POLICY "Admins can manage ai_instructions"
    ON public.ai_instructions
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Create instruction_feedback table used by the UI
CREATE TABLE IF NOT EXISTS public.instruction_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instruction_id UUID NOT NULL REFERENCES public.ai_instructions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instruction_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'instruction_feedback' AND policyname = 'Users can insert their feedback'
  ) THEN
    CREATE POLICY "Users can insert their feedback"
    ON public.instruction_feedback
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Users can view their own feedback
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'instruction_feedback' AND policyname = 'Users can view their feedback'
  ) THEN
    CREATE POLICY "Users can view their feedback"
    ON public.instruction_feedback
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Admins can view all feedback
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'instruction_feedback' AND policyname = 'Admins can view all feedback'
  ) THEN
    CREATE POLICY "Admins can view all feedback"
    ON public.instruction_feedback
    FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;