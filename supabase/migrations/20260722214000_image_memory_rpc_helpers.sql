-- Self-sufficient image_memory bootstrap and RPC helpers.

create extension if not exists vector;

create table if not exists public.image_memory (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  style text not null default 'gothic',
  source_project_id uuid not null default '00000000-0000-0000-0000-000000000000'::uuid,
  book_id uuid,
  cover_prompt text not null default '',
  embedding vector(1536),
  critic_score numeric(5,2),
  critic_notes text,
  source_function text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.image_memory add column if not exists source_project_id uuid;
alter table if exists public.image_memory add column if not exists book_id uuid;
alter table if exists public.image_memory add column if not exists cover_prompt text;
alter table if exists public.image_memory add column if not exists embedding vector(1536);
alter table if exists public.image_memory add column if not exists critic_score numeric(5,2);
alter table if exists public.image_memory add column if not exists critic_notes text;
alter table if exists public.image_memory add column if not exists source_function text;
alter table if exists public.image_memory add column if not exists updated_at timestamptz not null default now();

update public.image_memory
set source_project_id = '00000000-0000-0000-0000-000000000000'::uuid
where source_project_id is null;

alter table public.image_memory
  alter column source_project_id set default '00000000-0000-0000-0000-000000000000'::uuid;

alter table public.image_memory
  alter column source_project_id set not null;

alter table public.image_memory
  alter column cover_prompt set default '';

create unique index if not exists image_memory_symbol_style_project_key
  on public.image_memory (symbol, style, source_project_id);

create index if not exists idx_image_memory_project_created
  on public.image_memory (source_project_id, created_at desc);

create index if not exists idx_image_memory_symbol
  on public.image_memory (symbol);

create index if not exists idx_image_memory_style
  on public.image_memory (style);

create index if not exists idx_image_memory_embedding
  on public.image_memory
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace function public.update_image_memory_updated_at()
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

drop trigger if exists trg_image_memory_updated_at on public.image_memory;
create trigger trg_image_memory_updated_at
before update on public.image_memory
for each row
execute function public.update_image_memory_updated_at();

create or replace function public.match_image_memory_semantic(
  query_embedding vector(1536),
  match_count integer default 8,
  project_filter uuid default null
)
returns table (
  id uuid,
  symbol text,
  style text,
  source_project_id uuid,
  cover_prompt text,
  similarity double precision
)
language sql
stable
as $$
  select
    im.id,
    im.symbol,
    im.style,
    im.source_project_id,
    im.cover_prompt,
    1 - (im.embedding <=> query_embedding) as similarity
  from public.image_memory im
  where im.embedding is not null
    and (project_filter is null or im.source_project_id = project_filter)
  order by im.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

create or replace function public.upsert_image_memory_entry(
  _symbol text,
  _style text,
  _source_project_id uuid,
  _book_id uuid,
  _cover_prompt text,
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
  insert into public.image_memory (
    symbol,
    style,
    source_project_id,
    book_id,
    cover_prompt,
    embedding,
    critic_score,
    critic_notes,
    source_function
  ) values (
    _symbol,
    coalesce(nullif(trim(_style), ''), 'gothic'),
    coalesce(_source_project_id, '00000000-0000-0000-0000-000000000000'::uuid),
    _book_id,
    _cover_prompt,
    _embedding,
    _critic_score,
    _critic_notes,
    _source_function
  )
  on conflict (symbol, style, source_project_id)
  do update set
    book_id = excluded.book_id,
    cover_prompt = excluded.cover_prompt,
    embedding = excluded.embedding,
    critic_score = excluded.critic_score,
    critic_notes = excluded.critic_notes,
    source_function = excluded.source_function,
    updated_at = now()
  returning id into inserted_id;

  return inserted_id;
end;
$$;

grant execute on function public.upsert_image_memory_entry(text, text, uuid, uuid, text, vector, numeric, text, text) to service_role;

create or replace function public.count_image_memory_entries(
  _source_project_id uuid default null,
  _symbol text default null,
  _style text default null
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.image_memory
  where (_source_project_id is null or source_project_id = _source_project_id)
    and (_symbol is null or symbol = _symbol)
    and (_style is null or style = _style);
$$;

grant execute on function public.count_image_memory_entries(uuid, text, text) to service_role;

alter table public.image_memory enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'image_memory'
      and policyname = 'Admins can view image memory'
  ) then
    create policy "Admins can view image memory"
      on public.image_memory
      for select
      using (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'image_memory'
      and policyname = 'Admins can insert image memory'
  ) then
    create policy "Admins can insert image memory"
      on public.image_memory
      for insert
      with check (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'image_memory'
      and policyname = 'Admins can update image memory'
  ) then
    create policy "Admins can update image memory"
      on public.image_memory
      for update
      using (public.has_role(auth.uid(), 'admin'));
  end if;
end $$;
