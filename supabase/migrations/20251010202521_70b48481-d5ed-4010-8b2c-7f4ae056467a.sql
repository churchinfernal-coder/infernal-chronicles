-- Fix RLS policies for regular user message insertion
-- Drop conflicting policies
DROP POLICY IF EXISTS "Conversation participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can inject system messages" ON public.messages;

-- Allow conversation participants to send regular messages
CREATE POLICY "Conversation participants can send messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id 
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id 
      AND cp.user_id = auth.uid()
    )
    AND (admin_injected = FALSE OR admin_injected IS NULL)
    AND (is_system_message = FALSE OR is_system_message IS NULL)
  );

-- Allow admins to inject system messages
CREATE POLICY "Admins can inject system messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    AND auth.uid() = sender_id
    AND admin_injected = TRUE
    AND is_system_message = TRUE
  );