-- ============================================================
-- Kiseki – Create group via RPC (bypass RLS safely)
-- Migration 005
-- ============================================================

create or replace function public.create_group(
  p_name text,
  p_max_members int default 12,
  p_question_time time default '09:00',
  p_reveal_time time default '20:00',
  p_allowed_intensities text[] default '{normal}'
)
returns public.groups
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_group public.groups;
begin
  if auth.uid() is null then
    raise exception 'Non authentifie';
  end if;

  insert into public.groups (name, created_by, max_members, question_time, reveal_time, allowed_intensities)
  values (p_name, auth.uid(), p_max_members, p_question_time, p_reveal_time, p_allowed_intensities)
  returning * into v_group;

  return v_group;
end;
$$;

grant execute on function public.create_group(text, int, time, time, text[]) to authenticated;
