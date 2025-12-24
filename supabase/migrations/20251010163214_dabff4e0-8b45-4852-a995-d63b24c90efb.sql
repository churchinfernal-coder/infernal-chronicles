-- Grant admin role to user
INSERT INTO public.user_roles (user_id, role)
VALUES ('b3feb8ad-9a29-41ee-884b-ff5e636693ef', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;