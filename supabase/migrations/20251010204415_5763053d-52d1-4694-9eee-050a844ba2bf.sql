-- Create camera_logs table and storage bucket + policies
-- 1) camera_logs table
CREATE TABLE IF NOT EXISTS public.camera_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- e.g., open, permission_granted, permission_denied, capture_snapshot, record_start, record_stop, upload_success, upload_error
  status TEXT NOT NULL,      -- success | error | info
  reason TEXT,               -- optional details for errors (permission denied, device not found, etc.)
  path TEXT,                 -- uploaded storage path if any
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.camera_logs ENABLE ROW LEVEL SECURITY;

-- Policies: users can insert their own logs; view their own; admins can view all
DROP POLICY IF EXISTS "Users can insert their own camera logs" ON public.camera_logs;
CREATE POLICY "Users can insert their own camera logs"
ON public.camera_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own camera logs" ON public.camera_logs;
CREATE POLICY "Users can view their own camera logs"
ON public.camera_logs FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all camera logs" ON public.camera_logs;
CREATE POLICY "Admins can view all camera logs"
ON public.camera_logs FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_camera_logs_user_created ON public.camera_logs(user_id, created_at DESC);

-- 2) Create a private storage bucket for camera media
INSERT INTO storage.buckets (id, name, public)
VALUES ('camera-media', 'camera-media', false)
ON CONFLICT (id) DO NOTHING;

-- 3) Storage policies for camera-media
-- Allow users to upload into a folder named by their user_id
DROP POLICY IF EXISTS "Users can upload their camera media" ON storage.objects;
CREATE POLICY "Users can upload their camera media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'camera-media'
  AND (auth.uid()::text = (storage.foldername(name))[1])
);

-- Allow users to update objects they own (optional; to replace recordings)
DROP POLICY IF EXISTS "Users can update their camera media" ON storage.objects;
CREATE POLICY "Users can update their camera media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'camera-media'
  AND (auth.uid()::text = (storage.foldername(name))[1])
)
WITH CHECK (
  bucket_id = 'camera-media'
  AND (auth.uid()::text = (storage.foldername(name))[1])
);

-- Allow users to view their own media
DROP POLICY IF EXISTS "Users can view their camera media" ON storage.objects;
CREATE POLICY "Users can view their camera media"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'camera-media'
  AND (auth.uid()::text = (storage.foldername(name))[1])
);
