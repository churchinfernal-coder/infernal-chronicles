-- Phase 4: safe, metadata-only database inspector used by the admin
-- DatabaseInspector UI. Returns only schema/aggregate information — never row
-- data / PII — so an admin cannot exfiltrate user data through it. Free-form
-- SQL is intentionally not supported here.
CREATE OR REPLACE FUNCTION public.admin_db_inspect(_action text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF _action = 'view_all_tables' THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('table_name', t.table_name) ORDER BY t.table_name), '[]'::jsonb)
    INTO result
    FROM information_schema.tables t
    WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE';

  ELSIF _action = 'database_statistics' THEN
    SELECT jsonb_build_array(jsonb_build_object(
      'tables', (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'),
      'profiles', (SELECT count(*) FROM public.profiles),
      'user_roles', (SELECT count(*) FROM public.user_roles),
      'occult_library_books', (SELECT count(*) FROM public.occult_library_books)
    ))
    INTO result;

  ELSIF _action = 'view_active_sessions' THEN
    SELECT jsonb_build_array(jsonb_build_object(
      'active_sessions', (SELECT count(*) FROM auth.sessions WHERE not_after IS NULL OR not_after > now()),
      'distinct_users', (SELECT count(DISTINCT user_id) FROM auth.sessions WHERE not_after IS NULL OR not_after > now())
    ))
    INTO result;

  ELSIF _action = 'view_recent_queries' THEN
    -- Aggregate connection state only; never expose query text (may contain data).
    SELECT COALESCE(jsonb_agg(jsonb_build_object('state', s.state, 'count', s.count)), '[]'::jsonb)
    INTO result
    FROM (
      SELECT state, count(*) AS count
      FROM pg_stat_activity
      WHERE datname = current_database()
      GROUP BY state
    ) s;

  ELSE
    RAISE EXCEPTION 'Unknown inspector action: %', _action;
  END IF;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Only admins may execute the inspector (defense in depth; the edge function
-- also enforces this, and revokes public execution).
REVOKE ALL ON FUNCTION public.admin_db_inspect(text) FROM PUBLIC;
