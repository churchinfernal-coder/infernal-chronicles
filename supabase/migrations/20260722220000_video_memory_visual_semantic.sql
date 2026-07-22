-- Self-sufficient video_memory bootstrap and RPC helpers.

create extension if not exists vector;

create table if not exists public.video_memory (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  style text not null default 'cinematic',
  narrative_theme text not null default 'ritual',
  source_project_id uuid not null default '00000000-0000-0000-0000-000000000000'::uuid,
  video_prompt text not null default '',
  duration_seconds numeric(10,2) not null default 0,
  video_format text not null default 'mp4',
  narrative_beats jsonb not null default '[]'::jsonb,
  embedding vector(1536),
  critic_score numeric(5,2),
  critic_notes text,
  source_function text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.video_memory add column if not exists source_project_id uuid;
alter table if exists public.video_memory add column if not exists video_prompt text;
alter table if exists public.video_memory add column if not exists duration_seconds numeric(10,2);
alter table if exists public.video_memory add column if not exists video_format text;
alter table if exists public.video_memory add column if not exists narrative_beats jsonb;
alter table if exists public.video_memory add column if not exists embedding vector(1536);
alter table if exists public.video_memory add column if not exists critic_score numeric(5,2);
alter table if exists public.video_memory add column if not exists critic_notes text;
alter table if exists public.video_memory add column if not exists source_function text;
alter table if exists public.video_memory add column if not exists updated_at timestamptz not null default now();

update public.video_memory
set source_project_id = '00000000-0000-0000-0000-000000000000'::uuid
where source_project_id is null;

alter table public.video_memory
  alter column source_project_id set default '00000000-0000-0000-0000-000000000000'::uuid;

alter table public.video_memory
  alter column source_project_id set not null;

alter table public.video_memory
  alter column video_prompt set default '';

alter table public.video_memory
  alter column duration_seconds set default 0;

alter table public.video_memory
  alter column video_format set default 'mp4';

alter table public.video_memory
  alter column narrative_beats set default '[]'::jsonb;

create unique index if not exists video_memory_symbol_style_theme_project_key
  on public.video_memory (symbol, style, narrative_theme, source_project_id);

create index if not exists idx_video_memory_project_created
  on public.video_memory (source_project_id, created_at desc);

create index if not exists idx_video_memory_symbol
  on public.video_memory (symbol);

create index if not exists idx_video_memory_style
  on public.video_memory (style);

create index if not exists idx_video_memory_theme
  on public.video_memory (narrative_theme);

create index if not exists idx_video_memory_embedding
  on public.video_memory
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace function public.update_video_memory_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_video_memory_updated_at on public.video_memory;
create trigger trg_video_memory_updated_at
before update on public.video_memory
for each row
execute function public.update_video_memory_updated_at();

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
    1 - (vm.embedding <=> query_embedding) as similarity
  from public.video_memory vm
  where vm.embedding is not null
    and (project_filter is null or vm.source_project_id = project_filter)
  order by vm.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

create or replace function public.upsert_video_memory_entry(
  _symbol text,
  _style text,
  _narrative_theme text,
  _source_project_id uuid,
  _video_prompt text,
  _duration_seconds numeric(10,2) default 0,
  _video_format text default 'mp4',
  _narrative_beats jsonb default '[]'::jsonb,
  _embedding vector(1536) default null,
  _critic_score numeric(5,2) default null,
  _critic_notes text default null,
  _source_function text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_id uuid;
begin
  insert into public.video_memory (
    symbol,
    style,
    narrative_theme,
    source_project_id,
    video_prompt,
    duration_seconds,
    video_format,
    narrative_beats,
    embedding,
    critic_score,
    critic_notes,
    source_function
  ) values (
    _symbol,
    coalesce(nullif(trim(_style), ''), 'cinematic'),
    coalesce(nullif(trim(_narrative_theme), ''), 'ritual'),
    coalesce(_source_project_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(_video_prompt, ''),
    coalesce(_duration_seconds, 0),
    coalesce(nullif(trim(_video_format), ''), 'mp4'),
    coalesce(_narrative_beats, '[]'::jsonb),
    _embedding,
    _critic_score,
    _critic_notes,
    _source_function
  )
  on conflict (symbol, style, narrative_theme, source_project_id)
  do update set
    video_prompt = excluded.video_prompt,
    duration_seconds = excluded.duration_seconds,
    video_format = excluded.video_format,
    narrative_beats = excluded.narrative_beats,
    embedding = excluded.embedding,
    critic_score = excluded.critic_score,
    critic_notes = excluded.critic_notes,
    source_function = excluded.source_function,
    updated_at = now()
  returning id into inserted_id;

  return inserted_id;
end;
$$;

grant execute on function public.upsert_video_memory_entry(text, text, text, uuid, text, numeric, text, jsonb, vector, numeric, text, text) to service_role;

create or replace function public.count_video_memory_entries(
  _source_project_id uuid default null,
  _symbol text default null,
  _style text default null,
  _narrative_theme text default null
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.video_memory
  where (_source_project_id is null or source_project_id = _source_project_id)
    and (_symbol is null or symbol = _symbol)
    and (_style is null or style = _style)
    and (_narrative_theme is null or narrative_theme = _narrative_theme);
$$;

grant execute on function public.count_video_memory_entries(uuid, text, text, text) to service_role;

create or replace function public.bulk_upsert_video_memory_entries(
  _entries jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer := 0;
  entry jsonb;
begin
  if _entries is null then
    return 0;
  end if;

  for entry in select * from jsonb_array_elements(_entries)
  loop
    perform public.upsert_video_memory_entry(
      entry->>'symbol',
      entry->>'style',
      entry->>'narrative_theme',
      nullif(entry->>'source_project_id', '')::uuid,
      coalesce(entry->>'video_prompt', ''),
      nullif(entry->>'duration_seconds', '')::numeric,
      coalesce(entry->>'video_format', 'mp4'),
      coalesce(entry->'narrative_beats', '[]'::jsonb),
      null,
      nullif(entry->>'critic_score', '')::numeric,
      entry->>'critic_notes',
      entry->>'source_function'
    );
    inserted_count := inserted_count + 1;
  end loop;

  return inserted_count;
end;
$$;

grant execute on function public.bulk_upsert_video_memory_entries(jsonb) to service_role;

alter table public.video_memory enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'video_memory'
      and policyname = 'Admins can view video memory'
  ) then
    create policy "Admins can view video memory"
      on public.video_memory
      for select
      using (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'video_memory'
      and policyname = 'Admins can insert video memory'
  ) then
    create policy "Admins can insert video memory"
      on public.video_memory
      for insert
      with check (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'video_memory'
      and policyname = 'Admins can update video memory'
  ) then
    create policy "Admins can update video memory"
      on public.video_memory
      for update
      using (public.has_role(auth.uid(), 'admin'));
  end if;
end $$;