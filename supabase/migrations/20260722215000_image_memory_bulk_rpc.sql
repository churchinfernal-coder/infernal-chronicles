-- Bulk image_memory ingestion helper for scaling tests and batch feedback writes.

create or replace function public.bulk_upsert_image_memory_entries(
  _entries jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer := 0;
begin
  with entries as (
    select *
    from jsonb_to_recordset(coalesce(_entries, '[]'::jsonb)) as x(
      symbol text,
      style text,
      source_project_id uuid,
      book_id uuid,
      cover_prompt text,
      critic_score numeric(5,2),
      critic_notes text,
      source_function text
    )
  ), upserted as (
    insert into public.image_memory (
      symbol,
      style,
      source_project_id,
      book_id,
      cover_prompt,
      critic_score,
      critic_notes,
      source_function
    )
    select
      symbol,
      coalesce(nullif(trim(style), ''), 'gothic'),
      coalesce(source_project_id, '00000000-0000-0000-0000-000000000000'::uuid),
      book_id,
      coalesce(cover_prompt, ''),
      critic_score,
      critic_notes,
      source_function
    from entries
    on conflict (symbol, style, source_project_id)
    do update set
      book_id = excluded.book_id,
      cover_prompt = excluded.cover_prompt,
      critic_score = excluded.critic_score,
      critic_notes = excluded.critic_notes,
      source_function = excluded.source_function,
      updated_at = now()
    returning 1
  )
  select count(*) into inserted_count from upserted;

  return inserted_count;
end;
$$;

grant execute on function public.bulk_upsert_image_memory_entries(jsonb) to service_role;
