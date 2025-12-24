-- Create table for AI-generated feature instructions
CREATE TABLE public.feature_instructions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_name TEXT NOT NULL,
  feature_category TEXT NOT NULL,
  feature_path TEXT,
  instruction_content JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', feature_name || ' ' || feature_category || ' ' || COALESCE(feature_path, ''))
  ) STORED
);

-- Create index for search
CREATE INDEX idx_feature_instructions_search ON public.feature_instructions USING gin(search_vector);
CREATE INDEX idx_feature_instructions_category ON public.feature_instructions(feature_category);
CREATE INDEX idx_feature_instructions_status ON public.feature_instructions(status);

-- Enable RLS
ALTER TABLE public.feature_instructions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view all instructions"
  ON public.feature_instructions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create instructions"
  ON public.feature_instructions
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') AND auth.uid() = created_by);

CREATE POLICY "Admins can update instructions"
  ON public.feature_instructions
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete instructions"
  ON public.feature_instructions
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Create table for instruction feedback
CREATE TABLE public.instruction_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instruction_id UUID NOT NULL REFERENCES public.feature_instructions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for feedback
ALTER TABLE public.instruction_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view feedback"
  ON public.instruction_feedback
  FOR SELECT
  USING (true);

CREATE POLICY "Users can submit feedback"
  ON public.instruction_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_feature_instructions_updated_at
  BEFORE UPDATE ON public.feature_instructions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();