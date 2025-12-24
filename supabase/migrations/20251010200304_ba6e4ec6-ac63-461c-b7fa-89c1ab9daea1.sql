-- Create table for storing user public keys
CREATE TABLE IF NOT EXISTS public.user_encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_encryption_keys ENABLE ROW LEVEL SECURITY;

-- Public keys are viewable by everyone (needed for encryption)
CREATE POLICY "Public keys are viewable by everyone"
ON public.user_encryption_keys
FOR SELECT
USING (true);

-- Users can insert their own public key
CREATE POLICY "Users can insert their own public key"
ON public.user_encryption_keys
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own public key
CREATE POLICY "Users can update their own public key"
ON public.user_encryption_keys
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_encryption_keys_updated_at
BEFORE UPDATE ON public.user_encryption_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();