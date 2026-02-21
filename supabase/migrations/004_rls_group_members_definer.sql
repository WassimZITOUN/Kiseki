-- ============================================================
-- Kiseki – Allow security definer group member inserts
-- Migration 004
-- ============================================================

-- Auto-ajout en tant qu'admin lors de la creation d'un groupe
create or replace function public.handle_new_group()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.created_by, 'admin');
  return new;
end;
$$;

-- Rejoindre un groupe par invite_code
create or replace function public.join_group_by_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  v_group_id uuid;
  v_member_count int;
  v_max_members int;
begin
  -- Trouver le groupe
  select id, max_members into v_group_id, v_max_members
  from public.groups
  where invite_code = p_invite_code;

  if v_group_id is null then
    raise exception 'Code invitation invalide';
  end if;

  -- Verifier le nombre de membres
  select count(*) into v_member_count
  from public.group_members
  where group_id = v_group_id;

  if v_member_count >= v_max_members then
    raise exception 'Le groupe est plein';
  end if;

  -- Ajouter le membre
  insert into public.group_members (group_id, user_id, role)
  values (v_group_id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  return v_group_id;
end;
$$;
