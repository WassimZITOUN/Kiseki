-- ============================================================
-- Kiseki – RLS hardening + anti-triche + helpers
-- Migration 002
-- ============================================================

-- =========================
-- Pre-drop policies (unlock function changes)
-- =========================
drop policy if exists "groups_select_member" on public.groups;
drop policy if exists "groups_select_by_invite" on public.groups;
drop policy if exists "groups_insert" on public.groups;
drop policy if exists "groups_update_admin" on public.groups;
drop policy if exists "groups_delete_admin" on public.groups;

drop policy if exists "group_members_select" on public.group_members;
drop policy if exists "group_members_insert" on public.group_members;
drop policy if exists "group_members_delete" on public.group_members;

drop policy if exists "user_questions_select" on public.user_questions;
drop policy if exists "user_questions_insert" on public.user_questions;
drop policy if exists "user_questions_delete_own" on public.user_questions;

drop policy if exists "daily_questions_select" on public.daily_questions;
drop policy if exists "daily_questions_insert_admin" on public.daily_questions;
drop policy if exists "daily_questions_update_admin" on public.daily_questions;

drop policy if exists "votes_insert_member" on public.votes;
drop policy if exists "votes_select" on public.votes;
drop policy if exists "votes_update_own" on public.votes;

-- =========================
-- Helpers (STABLE)
-- =========================
drop function if exists public.is_member_of(uuid);
drop function if exists public.is_group_admin(uuid);
drop function if exists public.is_member_of_question(uuid);
drop function if exists public.is_question_revealed(uuid);
drop function if exists public.is_question_active(uuid);
drop function if exists public.is_member_of_user_in_question(uuid, uuid);

create or replace function public.is_member_of(_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.group_members gm
    where gm.group_id = _group_id
      and gm.user_id = auth.uid()
  );
$$;

create or replace function public.is_group_admin(_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.group_members gm
    where gm.group_id = _group_id
      and gm.user_id = auth.uid()
      and gm.role = 'admin'
  );
$$;

create or replace function public.is_member_of_question(_question_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.daily_questions dq
    where dq.id = _question_id
      and public.is_member_of(dq.group_id)
  );
$$;

create or replace function public.is_question_revealed(_question_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.daily_questions dq
    where dq.id = _question_id
      and dq.status = 'revealed'
  );
$$;

create or replace function public.is_question_active(_question_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.daily_questions dq
    where dq.id = _question_id
      and dq.status = 'active'
  );
$$;

create or replace function public.is_member_of_user_in_question(
  _user_id uuid,
  _question_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.daily_questions dq
    join public.group_members gm on gm.group_id = dq.group_id
    where dq.id = _question_id
      and gm.user_id = _user_id
  );
$$;

-- =========================
-- Indexes (helper perf)
-- =========================
create index if not exists idx_group_members_user_group on public.group_members(user_id, group_id);

-- =========================
-- Harden reveal_question
-- =========================
create or replace function public.reveal_question(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group_id uuid;
begin
  select dq.group_id into v_group_id
  from public.daily_questions dq
  where dq.id = p_question_id;

  if v_group_id is null then
    raise exception 'Question introuvable';
  end if;

  if auth.role() <> 'service_role' and not public.is_group_admin(v_group_id) then
    raise exception 'Non autorise';
  end if;

  update public.daily_questions
  set status = 'revealed', revealed_at = now()
  where id = p_question_id
    and status = 'active';
end;
$$;

-- =========================
-- VIEW: public_votes_status (uses SECURITY DEFINER function)
-- =========================
drop view if exists public.public_votes_status;
drop function if exists public.votes_status_for_member();

create or replace function public.votes_status_for_member()
returns table(
  question_id uuid,
  voter_id uuid,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select
    v.question_id,
    v.voter_id,
    v.created_at
  from public.votes v
  join public.daily_questions dq on dq.id = v.question_id
  join public.group_members gm on gm.group_id = dq.group_id
  where gm.user_id = auth.uid();
$$;

create or replace view public.public_votes_status
with (security_barrier = true)
as
select *
from public.votes_status_for_member();

grant select on public.public_votes_status to authenticated;

-- =========================
-- RLS policy refactor
-- =========================

-- groups
create policy "groups_select_member"
  on public.groups for select
  to authenticated
  using (public.is_member_of(id));

create policy "groups_insert"
  on public.groups for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "groups_update_admin"
  on public.groups for update
  to authenticated
  using (public.is_group_admin(id));

create policy "groups_delete_admin"
  on public.groups for delete
  to authenticated
  using (public.is_group_admin(id));

-- group_members
create policy "group_members_select"
  on public.group_members for select
  to authenticated
  using (public.is_member_of(group_id));

create policy "group_members_delete"
  on public.group_members for delete
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_group_admin(group_id)
  );

-- user_questions
create policy "user_questions_select"
  on public.user_questions for select
  to authenticated
  using (public.is_member_of(group_id));

create policy "user_questions_insert"
  on public.user_questions for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and public.is_member_of(group_id)
  );

create policy "user_questions_delete_own"
  on public.user_questions for delete
  to authenticated
  using (created_by = auth.uid());

-- daily_questions
create policy "daily_questions_select"
  on public.daily_questions for select
  to authenticated
  using (public.is_member_of(group_id));

create policy "daily_questions_insert_admin"
  on public.daily_questions for insert
  to authenticated
  with check (public.is_group_admin(group_id));

create policy "daily_questions_update_admin"
  on public.daily_questions for update
  to authenticated
  using (public.is_group_admin(group_id));

-- votes
create policy "votes_insert_member"
  on public.votes for insert
  to authenticated
  with check (
    voter_id = auth.uid()
    and public.is_member_of_question(question_id)
    and public.is_question_active(question_id)
    and public.is_member_of_user_in_question(target_user_id, question_id)
  );

create policy "votes_select"
  on public.votes for select
  to authenticated
  using (
    voter_id = auth.uid()
    or (
      public.is_member_of_question(question_id)
      and public.is_question_revealed(question_id)
    )
  );

create policy "votes_update_own"
  on public.votes for update
  to authenticated
  using (
    voter_id = auth.uid()
    and public.is_member_of_question(question_id)
    and public.is_question_active(question_id)
  )
  with check (
    voter_id = auth.uid()
    and public.is_member_of_question(question_id)
    and public.is_question_active(question_id)
    and public.is_member_of_user_in_question(target_user_id, question_id)
  );
