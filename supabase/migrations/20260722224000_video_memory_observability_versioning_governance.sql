-- Observability, versioning, adaptive weighting, and governance for video_memory.

alter table if exists public.video_memory
  add column if not exists motif_weight numeric(8,3) not null default 1,
  add column if not exists project_recurrence integer not null default 1;

create table if not exists public.video_memory_versions (
  id uuid primary key default gen_random_uuid(),
  video_memory_id uuid not null references public.video_memory(id) on delete cascade,
  version_number integer not null,
  symbol text not null,
  style text not null,
  narrative_theme text not null,
  source_project_id uuid not null,
  video_prompt text not null,
  duration_seconds numeric(10,2) not null,
  video_format text not null,
  narrative_beats jsonb not null,
  motif_weight numeric(8,3) not null default 1,
  project_recurrence integer not null default 1,
  embedding vector(1536),
  critic_score numeric(5,2),
  critic_notes text,
  source_function text,
  actor_id uuid,
  actor_role text,
  actor_type text not null default 'system',
  change_reason text,
  changed_at timestamptz not null default now(),
  unique (video_memory_id, version_number)
);

create index if not exists idx_video_memory_versions_memory
  on public.video_memory_versions (video_memory_id, version_number desc);

create table if not exists public.video_memory_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_role text,
  actor_type text not null default 'system' check (actor_type in ('admin', 'system', 'function')),
  action text not null,
  source_function text,
  source_project_id uuid,
  memory_id uuid references public.video_memory(id) on delete set null,
  request_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_video_memory_audit_project
  on public.video_memory_audit_logs (source_project_id, created_at desc);

create index if not exists idx_video_memory_audit_action
  on public.video_memory_audit_logs (action, created_at desc);

create or replace function public.set_video_memory_actor_context(
  _actor_id uuid,
  _actor_role text,
  _actor_type text,
  _change_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.actor_id', coalesce(_actor_id::text, ''), true);
  perform set_config('app.actor_role', coalesce(_actor_role, ''), true);
  perform set_config('app.actor_type', coalesce(_actor_type, 'system'), true);
  perform set_config('app.change_reason', coalesce(_change_reason, ''), true);
end;
$$;

grant execute on function public.set_video_memory_actor_context(uuid, text, text, text) to service_role;

drop function if exists public.match_video_memory_semantic(vector, integer, uuid);

create or replace function public.match_video_memory_semantic(
  query_embedding vector(1536),
  match_count integer default 8,
  project_filter uuid default null
)
returns table (
  id uuid,
  symbol text,
  style text,
  narrative_theme text,
  source_project_id uuid,
  video_prompt text,
  motif_weight numeric,
  project_recurrence integer,
  similarity double precision
)
language sql
stable
as $$
  select
    vm.id,
    vm.symbol,
    vm.style,
    vm.narrative_theme,
    vm.source_project_id,
    vm.video_prompt,
    vm.motif_weight,
    vm.project_recurrence,
    1 - (vm.embedding <=> query_embedding) as similarity
  from public.video_memory vm
  where vm.embedding is not null
    and (project_filter is null or vm.source_project_id = project_filter)
  order by vm.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

create or replace function public.snapshot_video_memory_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_version integer;
begin
  select coalesce(max(version_number), 0) + 1
    into next_version
  from public.video_memory_versions
  where video_memory_id = new.id;

  insert into public.video_memory_versions (
    video_memory_id,
    version_number,
    symbol,
    style,
    narrative_theme,
    source_project_id,
    video_prompt,
    duration_seconds,
    video_format,
    narrative_beats,
    motif_weight,
    project_recurrence,
    embedding,
    critic_score,
    critic_notes,
    source_function,
    actor_id,
    actor_role,
    actor_type,
    change_reason
  ) values (
    new.id,
    next_version,
    new.symbol,
    new.style,
    new.narrative_theme,
    new.source_project_id,
    new.video_prompt,
    new.duration_seconds,
    new.video_format,
    new.narrative_beats,
    new.motif_weight,
    new.project_recurrence,
    new.embedding,
    new.critic_score,
    new.critic_notes,
    new.source_function,
    nullif(current_setting('app.actor_id', true), '')::uuid,
    nullif(current_setting('app.actor_role', true), ''),
    coalesce(nullif(current_setting('app.actor_type', true), ''), 'system'),
    nullif(current_setting('app.change_reason', true), '')
  );

  return new;
end;
$$;

drop trigger if exists trg_video_memory_version_snapshot on public.video_memory;
create trigger trg_video_memory_version_snapshot
after insert or update on public.video_memory
for each row
execute function public.snapshot_video_memory_version();

create or replace function public.recalculate_video_memory_weights(
  _symbol text,
  _style text default null,
  _narrative_theme text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  total_count integer;
  project_count integer;
  updated_rows integer;
  computed_weight numeric(8,3);
begin
  if _symbol is null or trim(_symbol) = '' then
    return 0;
  end if;

  select count(*), count(distinct source_project_id)
    into total_count, project_count
  from public.video_memory
  where symbol = _symbol
    and (_style is null or style = _style)
    and (_narrative_theme is null or narrative_theme = _narrative_theme);

  computed_weight := round((1 + ln(total_count + 1) + (project_count * 0.25))::numeric, 3);

  update public.video_memory
  set
    project_recurrence = greatest(project_count, 1),
    motif_weight = greatest(computed_weight, 1),
    updated_at = now()
  where symbol = _symbol
    and (_style is null or style = _style)
    and (_narrative_theme is null or narrative_theme = _narrative_theme);

  get diagnostics updated_rows = row_count;
  return updated_rows;
end;
$$;

grant execute on function public.recalculate_video_memory_weights(text, text, text) to service_role;

create or replace function public.log_video_memory_audit(
  _actor_id uuid,
  _actor_role text,
  _actor_type text,
  _action text,
  _source_function text,
  _source_project_id uuid,
  _memory_id uuid,
  _request_id text,
  _metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_id uuid;
begin
  insert into public.video_memory_audit_logs (
    actor_id,
    actor_role,
    actor_type,
    action,
    source_function,
    source_project_id,
    memory_id,
    request_id,
    metadata
  ) values (
    _actor_id,
    _actor_role,
    coalesce(nullif(trim(_actor_type), ''), 'system'),
    _action,
    _source_function,
    _source_project_id,
    _memory_id,
    _request_id,
    coalesce(_metadata, '{}'::jsonb)
  )
  returning id into inserted_id;

  return inserted_id;
end;
$$;

grant execute on function public.log_video_memory_audit(uuid, text, text, text, text, uuid, uuid, text, jsonb) to service_role;

alter table public.video_memory_versions enable row level security;
alter table public.video_memory_audit_logs enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'video_memory_versions'
      and policyname = 'Admins can view video memory versions'
  ) then
    create policy "Admins can view video memory versions"
      on public.video_memory_versions
      for select
      using (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'video_memory_audit_logs'
      and policyname = 'Admins can view video memory audit logs'
  ) then
    create policy "Admins can view video memory audit logs"
      on public.video_memory_audit_logs
      for select
      using (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'video_memory_audit_logs'
      and policyname = 'Admins can insert video memory audit logs'
  ) then
    create policy "Admins can insert video memory audit logs"
      on public.video_memory_audit_logs
      for insert
      with check (public.has_role(auth.uid(), 'admin'));
  end if;
end $$;