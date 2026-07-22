-- Proactive autonomy, adaptive evolution (decay/emergence), and dashboard RPCs for video_memory.

alter table if exists public.video_memory
  add column if not exists text_signal_count integer not null default 0,
  add column if not exists image_signal_count integer not null default 0,
  add column if not exists video_signal_count integer not null default 0,
  add column if not exists emergence_score numeric(8,3) not null default 0,
  add column if not exists last_reinforced_at timestamptz not null default now(),
  add column if not exists decay_half_life_days numeric(8,3) not null default 21;

create table if not exists public.video_memory_autonomy_candidates (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  style text not null default 'cinematic',
  narrative_theme text not null default 'ritual',
  source_project_id uuid not null default '00000000-0000-0000-0000-000000000000'::uuid,
  source_type text not null default 'inferred' check (source_type in ('inferred', 'external', 'cross_modal', 'semantic_network')),
  reason text,
  confidence numeric(5,2) not null default 0.50,
  accepted boolean not null default false,
  created_by_function text,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  accepted_by uuid
);

create index if not exists idx_video_memory_autonomy_candidates_project
  on public.video_memory_autonomy_candidates (source_project_id, created_at desc);

create index if not exists idx_video_memory_autonomy_candidates_symbol
  on public.video_memory_autonomy_candidates (symbol);

create or replace function public.propose_video_memory_candidate(
  _symbol text,
  _style text,
  _narrative_theme text,
  _source_project_id uuid,
  _source_type text,
  _reason text,
  _confidence numeric(5,2),
  _created_by_function text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_id uuid;
begin
  insert into public.video_memory_autonomy_candidates (
    symbol,
    style,
    narrative_theme,
    source_project_id,
    source_type,
    reason,
    confidence,
    created_by_function
  )
  values (
    _symbol,
    coalesce(nullif(trim(_style), ''), 'cinematic'),
    coalesce(nullif(trim(_narrative_theme), ''), 'ritual'),
    coalesce(_source_project_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(nullif(trim(_source_type), ''), 'inferred'),
    _reason,
    greatest(least(coalesce(_confidence, 0.5), 1), 0),
    _created_by_function
  )
  returning id into inserted_id;

  return inserted_id;
end;
$$;

grant execute on function public.propose_video_memory_candidate(text, text, text, uuid, text, text, numeric, text) to service_role;

create or replace function public.apply_video_memory_decay(
  _as_of timestamptz default now(),
  _project_filter uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_rows integer;
begin
  update public.video_memory vm
  set
    motif_weight = greatest(
      0.25,
      round(
        (
          vm.motif_weight * exp(
            -greatest(extract(epoch from (_as_of - vm.last_reinforced_at)) / 86400.0, 0)
            / greatest(vm.decay_half_life_days, 1)
          )
        )::numeric,
        3
      )
    ),
    last_reinforced_at = _as_of,
    updated_at = now()
  where (_project_filter is null or vm.source_project_id = _project_filter);

  get diagnostics updated_rows = row_count;
  return updated_rows;
end;
$$;

grant execute on function public.apply_video_memory_decay(timestamptz, uuid) to service_role;

create or replace function public.reinforce_video_memory_entry(
  _memory_id uuid,
  _text_signal boolean default false,
  _image_signal boolean default false,
  _video_signal boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  touched_id uuid;
begin
  update public.video_memory vm
  set
    text_signal_count = vm.text_signal_count + case when _text_signal then 1 else 0 end,
    image_signal_count = vm.image_signal_count + case when _image_signal then 1 else 0 end,
    video_signal_count = vm.video_signal_count + case when _video_signal then 1 else 0 end,
    emergence_score = round(
      (
        ln(
          1 +
          (vm.text_signal_count + case when _text_signal then 1 else 0 end) +
          (vm.image_signal_count + case when _image_signal then 1 else 0 end) +
          (vm.video_signal_count + case when _video_signal then 1 else 0 end)
        ) +
        (
          (
            (case when (_text_signal or vm.text_signal_count > 0) then 1 else 0 end) +
            (case when (_image_signal or vm.image_signal_count > 0) then 1 else 0 end) +
            (case when (_video_signal or vm.video_signal_count > 0) then 1 else 0 end)
          ) * 0.35
        )
      )::numeric,
      3
    ),
    motif_weight = round(
      (
        greatest(vm.motif_weight, 0.25) +
        (
          ln(
            1 +
            (vm.text_signal_count + case when _text_signal then 1 else 0 end) +
            (vm.image_signal_count + case when _image_signal then 1 else 0 end) +
            (vm.video_signal_count + case when _video_signal then 1 else 0 end)
          ) * 0.08
        )
      )::numeric,
      3
    ),
    last_reinforced_at = now(),
    updated_at = now()
  where vm.id = _memory_id
  returning vm.id into touched_id;

  return touched_id;
end;
$$;

grant execute on function public.reinforce_video_memory_entry(uuid, boolean, boolean, boolean) to service_role;

create or replace function public.video_memory_motif_stats(
  _project_filter uuid default null,
  _limit_count integer default 20
)
returns table (
  symbol text,
  style text,
  narrative_theme text,
  frequency bigint,
  avg_weight numeric,
  max_recurrence integer,
  avg_emergence numeric,
  last_reinforced_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    vm.symbol,
    vm.style,
    vm.narrative_theme,
    count(*)::bigint as frequency,
    round(avg(vm.motif_weight)::numeric, 3) as avg_weight,
    max(vm.project_recurrence) as max_recurrence,
    round(avg(vm.emergence_score)::numeric, 3) as avg_emergence,
    max(vm.last_reinforced_at) as last_reinforced_at
  from public.video_memory vm
  where (_project_filter is null or vm.source_project_id = _project_filter)
  group by vm.symbol, vm.style, vm.narrative_theme
  order by avg_weight desc, frequency desc
  limit greatest(_limit_count, 1);
$$;

grant execute on function public.video_memory_motif_stats(uuid, integer) to service_role;

create or replace function public.video_memory_evolution_timeline(
  _project_filter uuid default null,
  _days_back integer default 30
)
returns table (
  day date,
  writes bigint,
  avg_critic_score numeric,
  avg_weight numeric,
  avg_emergence numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    date_trunc('day', vv.changed_at)::date as day,
    count(*)::bigint as writes,
    round(avg(vv.critic_score)::numeric, 2) as avg_critic_score,
    round(avg(vv.motif_weight)::numeric, 3) as avg_weight,
    round(avg(vv.emergence_score)::numeric, 3) as avg_emergence
  from public.video_memory_versions vv
  where vv.changed_at >= now() - make_interval(days => greatest(_days_back, 1))
    and (_project_filter is null or vv.source_project_id = _project_filter)
  group by date_trunc('day', vv.changed_at)::date
  order by day desc;
$$;

grant execute on function public.video_memory_evolution_timeline(uuid, integer) to service_role;

create or replace function public.video_memory_audit_summary(
  _project_filter uuid default null
)
returns table (
  total_reads bigint,
  total_writes bigint,
  total_critic bigint,
  total_change_events bigint,
  last_event timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with logs as (
    select *
    from public.video_memory_audit_logs
    where (_project_filter is null or source_project_id = _project_filter)
  )
  select
    count(*) filter (where action = 'memory_read')::bigint as total_reads,
    count(*) filter (where action = 'memory_write')::bigint as total_writes,
    count(*) filter (where action = 'critic_pass')::bigint as total_critic,
    count(*)::bigint as total_change_events,
    max(created_at) as last_event
  from logs;
$$;

grant execute on function public.video_memory_audit_summary(uuid) to service_role;

alter table public.video_memory_autonomy_candidates enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'video_memory_autonomy_candidates'
      and policyname = 'Admins can view video memory autonomy candidates'
  ) then
    create policy "Admins can view video memory autonomy candidates"
      on public.video_memory_autonomy_candidates
      for select
      using (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'video_memory_autonomy_candidates'
      and policyname = 'Admins can insert video memory autonomy candidates'
  ) then
    create policy "Admins can insert video memory autonomy candidates"
      on public.video_memory_autonomy_candidates
      for insert
      with check (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'video_memory_autonomy_candidates'
      and policyname = 'Admins can update video memory autonomy candidates'
  ) then
    create policy "Admins can update video memory autonomy candidates"
      on public.video_memory_autonomy_candidates
      for update
      using (public.has_role(auth.uid(), 'admin'));
  end if;
end $$;