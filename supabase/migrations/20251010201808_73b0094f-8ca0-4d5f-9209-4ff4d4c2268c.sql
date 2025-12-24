-- Add spirit tone and visibility fields to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS spirit_tone TEXT DEFAULT 'neutral',
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'visible',
ADD COLUMN IF NOT EXISTS is_system_message BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_injected BOOLEAN DEFAULT FALSE;

-- Create index for better performance on visibility queries
CREATE INDEX IF NOT EXISTS idx_messages_visibility ON public.messages(visibility);
CREATE INDEX IF NOT EXISTS idx_messages_admin ON public.messages(admin_injected);

-- Update RLS policies to allow admins to inject messages
DROP POLICY IF EXISTS "Admins can inject system messages" ON public.messages;
CREATE POLICY "Admins can inject system messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) AND admin_injected = TRUE
  );

DROP POLICY IF EXISTS "Admins can update message visibility" ON public.messages;
CREATE POLICY "Admins can update message visibility"
  ON public.messages
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete any message" ON public.messages;
CREATE POLICY "Admins can delete any message"
  ON public.messages
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));