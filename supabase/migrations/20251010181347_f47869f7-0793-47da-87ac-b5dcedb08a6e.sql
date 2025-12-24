-- Secure function to create or reuse a conversation between the current user and another user
create or replace function public.start_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  conv_id uuid;
begin
  if other_user_id is null or other_user_id = auth.uid() then
    raise exception 'Invalid other_user_id';
  end if;

  -- If a conversation already exists between the two users, return it
  select cp.conversation_id
    into conv_id
  from public.conversation_participants cp
  join public.conversation_participants cp2
    on cp2.conversation_id = cp.conversation_id
  where cp.user_id = auth.uid()
    and cp2.user_id = other_user_id
  limit 1;

  if conv_id is not null then
    return conv_id;
  end if;

  -- Create a new conversation
  insert into public.conversations default values returning id into conv_id;

  -- Add current user as participant
  insert into public.conversation_participants (conversation_id, user_id)
  values (conv_id, auth.uid());

  -- Add the other user as participant
  insert into public.conversation_participants (conversation_id, user_id)
  values (conv_id, other_user_id);

  return conv_id;
end;
$$;

-- Allow authenticated users to call this function
grant execute on function public.start_conversation(uuid) to authenticated;