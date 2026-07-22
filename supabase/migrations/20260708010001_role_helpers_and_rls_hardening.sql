-- Phase 1b + Phase 3: role helpers, superadmin seed, self-escalation guard,
-- and RLS hardening of over-permissive policies.

-- 1. Role helper functions (superadmin implies admin).
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'superadmin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'superadmin'
  );
$$;

-- 2. Seed the designated superadmin (also grant admin so existing
--    has_role(..., 'admin') policies apply to them too).
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'superadmin'::public.app_role
FROM auth.users u
WHERE lower(u.email) = lower('CHURCHINFERNAL@GMAIL.COM')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) = lower('CHURCHINFERNAL@GMAIL.COM')
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Prevent privilege self-escalation: only superadmins may grant/modify the
--    superadmin role; admins may manage all other roles.
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Superadmins manage all roles"
  ON public.user_roles FOR ALL
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Admins manage non-superadmin roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin(auth.uid()) AND role <> 'superadmin')
  WITH CHECK (public.is_admin(auth.uid()) AND role <> 'superadmin');

-- 4. Harden over-permissive AI-table policies.
--    Server-side writers use the service role, which bypasses RLS, so these
--    tightened policies do not break the AI engine's own logging.

-- ai_error_logs: only authenticated users may insert (no anonymous poisoning).
DROP POLICY IF EXISTS "System can insert error logs" ON public.ai_error_logs;
CREATE POLICY "Authenticated users can insert error logs"
  ON public.ai_error_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ai_performance_metrics: only authenticated users may insert.
DROP POLICY IF EXISTS "System can insert performance metrics" ON public.ai_performance_metrics;
CREATE POLICY "Authenticated users can insert performance metrics"
  ON public.ai_performance_metrics FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ai_error_memory: admin-only from any client; service role still bypasses.
DROP POLICY IF EXISTS "System can manage error memory" ON public.ai_error_memory;
CREATE POLICY "Admins can manage error memory"
  ON public.ai_error_memory FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ai_analysis_cache: admin-only from any client; service role still bypasses.
DROP POLICY IF EXISTS "System can manage analysis cache" ON public.ai_analysis_cache;
CREATE POLICY "Admins can manage analysis cache"
  ON public.ai_analysis_cache FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
