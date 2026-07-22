-- Server-side timing probe for database gate latency validation.
-- Measures execution time of the subscription lookup query directly in Postgres.

create or replace function public.measure_subscription_lookup_ms(_user_id text)
returns double precision
language plpgsql
security definer
set search_path = public
as $$
declare
  started_at timestamptz;
  elapsed_ms double precision;
begin
  started_at := clock_timestamp();

  perform id
  from public.occult_subscriptions
  where user_id = _user_id
    and status = 'active'
    and expires_at >= now()
  limit 1;

  elapsed_ms := extract(epoch from (clock_timestamp() - started_at)) * 1000.0;
  return elapsed_ms;
end;
$$;

grant execute on function public.measure_subscription_lookup_ms(text) to service_role;
