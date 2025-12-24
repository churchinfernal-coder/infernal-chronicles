-- Drop existing conflicting columns if they exist
ALTER TABLE public.messages DROP COLUMN IF EXISTS encrypted CASCADE;
ALTER TABLE public.messages DROP COLUMN IF EXISTS tone CASCADE;

-- Add new required columns to messages table
ALTER TABLE public.messages
ADD COLUMN encrypted BOOLEAN DEFAULT TRUE,
ADD COLUMN tone TEXT DEFAULT 'neutral',
ADD COLUMN encryption_key_id TEXT,
ADD COLUMN moderation_flag TEXT,
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;

-- Update visibility to use proper enum if not already
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_visibility') THEN
    CREATE TYPE message_visibility AS ENUM ('public', 'private', 'coven');
  END IF;
END $$;

-- Safely add visibility column if doesn't exist, otherwise alter it
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.messages ADD COLUMN message_visibility message_visibility DEFAULT 'public';
  EXCEPTION
    WHEN duplicate_column THEN
      -- Column exists, just change type
      ALTER TABLE public.messages ALTER COLUMN message_visibility TYPE message_visibility 
        USING message_visibility::message_visibility;
  END;
END $$;

-- Create chat_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Enable RLS on chat_logs
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

-- Chat logs policies
DROP POLICY IF EXISTS "Admins can view all logs" ON public.chat_logs;
CREATE POLICY "Admins can view all logs"
  ON public.chat_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "System can create logs" ON public.chat_logs;
CREATE POLICY "System can create logs"
  ON public.chat_logs
  FOR INSERT
  WITH CHECK (TRUE);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_logs_user_id ON public.chat_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_timestamp ON public.chat_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_encryption ON public.messages(encrypted);
CREATE INDEX IF NOT EXISTS idx_messages_tone ON public.messages(tone);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Enable realtime for chat_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_logs;
ALTER TABLE public.chat_logs REPLICA IDENTITY FULL;

-- Function to log chat events
CREATE OR REPLACE FUNCTION public.log_chat_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.chat_logs (user_id, message_id, action_type, metadata)
  VALUES (
    auth.uid(),
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    jsonb_build_object(
      'conversation_id', COALESCE(NEW.conversation_id, OLD.conversation_id),
      'visibility', COALESCE(NEW.visibility, OLD.visibility),
      'encrypted', COALESCE(NEW.encrypted, OLD.encrypted)
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for audit logging
DROP TRIGGER IF EXISTS messages_audit_trigger ON public.messages;
CREATE TRIGGER messages_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.log_chat_event();