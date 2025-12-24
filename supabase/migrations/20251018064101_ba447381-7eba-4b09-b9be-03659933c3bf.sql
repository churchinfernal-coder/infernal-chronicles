-- Grant admin role to the logged-in developer so SuperAdmin AI Engine can access data under RLS
-- Using user id observed in recent auth logs
INSERT INTO public.user_roles (user_id, role)
SELECT 'b3feb8ad-9a29-41ee-884b-ff5e636693ef'::uuid, 'admin'::app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = 'b3feb8ad-9a29-41ee-884b-ff5e636693ef'::uuid
    AND role = 'admin'::app_role
);
