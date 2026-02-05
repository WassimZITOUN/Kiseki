-- ============================================================
-- Kiseki (qui c'est qui) – Script SQL complet
-- Migration 001 : schema, RLS, triggers, indexes, tags, question_bank
-- ============================================================

-- =========================
-- Extensions
-- =========================
create extension if not exists "pgcrypto";
create extension if not exists "pg_cron";

-- =========================
-- 1. TABLES
-- =========================

-- -------------------------------------------------------
-- profiles : miroir public de auth.users
-- -------------------------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique not null,
  display_name    text,
  avatar_url      text,
  expo_push_token text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- -------------------------------------------------------
-- tags : traits associes aux questions (~30 predefinies)
-- -------------------------------------------------------
create table public.tags (
  id    uuid primary key default gen_random_uuid(),
  name  text unique not null,   -- slug: "charismatique", "gourmand", "autre"
  label text not null,          -- display: "Charismatique", "Gourmand", "Autre"
  emoji text                    -- optionnel: emoji associe
);

alter table public.tags enable row level security;

-- -------------------------------------------------------
-- groups : groupes de joueurs
-- -------------------------------------------------------
create table public.groups (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  invite_code           text unique not null default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  created_by            uuid not null references public.profiles(id) on delete cascade,
  max_members           int not null default 20,
  question_time         time not null default '09:00',
  reveal_time           time not null default '20:00',
  allowed_intensities   text[] not null default '{normal,epice}',
  created_at            timestamptz not null default now()
);

alter table public.groups enable row level security;

-- -------------------------------------------------------
-- group_members : appartenance aux groupes
-- -------------------------------------------------------
create table public.group_members (
  id        uuid primary key default gen_random_uuid(),
  group_id  uuid not null references public.groups(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

alter table public.group_members enable row level security;

-- -------------------------------------------------------
-- question_bank : banque de questions globales
-- -------------------------------------------------------
create table public.question_bank (
  id        uuid primary key default gen_random_uuid(),
  question  text unique not null,
  category  text not null default 'general',
  intensity text not null default 'normal' check (intensity in ('normal', 'epice')),
  tag_id    uuid references public.tags(id),
  is_active boolean not null default true
);

alter table public.question_bank enable row level security;

-- -------------------------------------------------------
-- user_questions : questions creees par les joueurs
-- -------------------------------------------------------
create table public.user_questions (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  question   text not null,
  category   text not null default 'custom',
  intensity  text not null default 'normal' check (intensity in ('normal', 'epice')),
  tag_id     uuid references public.tags(id),
  used_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.user_questions enable row level security;

-- -------------------------------------------------------
-- daily_questions : questions quotidiennes par groupe
-- -------------------------------------------------------
create table public.daily_questions (
  id              uuid primary key default gen_random_uuid(),
  group_id        uuid not null references public.groups(id) on delete cascade,
  question        text not null,
  status          text not null default 'active' check (status in ('active', 'revealed')),
  source_type     text not null default 'bank' check (source_type in ('bank', 'user')),
  source_id       uuid,
  intensity       text check (intensity in ('normal', 'epice')),
  tag_id          uuid references public.tags(id),
  created_at      timestamptz not null default now(),
  revealed_at     timestamptz
);

alter table public.daily_questions enable row level security;

-- -------------------------------------------------------
-- votes : votes des joueurs sur une question
-- -------------------------------------------------------
create table public.votes (
  id              uuid primary key default gen_random_uuid(),
  question_id     uuid not null references public.daily_questions(id) on delete cascade,
  voter_id        uuid not null references public.profiles(id) on delete cascade,
  target_user_id  uuid not null references public.profiles(id) on delete cascade,
  context_note    text check (char_length(context_note) <= 140),
  created_at      timestamptz not null default now(),
  unique (question_id, voter_id)
);

alter table public.votes enable row level security;

-- =========================
-- 2. INDEXES
-- =========================

create index idx_group_members_group    on public.group_members(group_id);
create index idx_group_members_user     on public.group_members(user_id);
create index idx_daily_questions_group  on public.daily_questions(group_id);
create index idx_daily_questions_status on public.daily_questions(group_id, status);
create index idx_daily_questions_date   on public.daily_questions(group_id, created_at desc);
create index idx_daily_questions_tag    on public.daily_questions(tag_id);
create index idx_votes_question         on public.votes(question_id);
create index idx_votes_voter            on public.votes(voter_id);
create index idx_votes_target           on public.votes(target_user_id);
create index idx_groups_invite_code     on public.groups(invite_code);
create index idx_user_questions_group   on public.user_questions(group_id);
create index idx_question_bank_tag      on public.question_bank(tag_id);
create index idx_question_bank_intensity on public.question_bank(intensity);

-- =========================
-- 3. RLS POLICIES
-- =========================

-- -------------------------------------------------------
-- profiles
-- -------------------------------------------------------
create policy "profiles_select"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- -------------------------------------------------------
-- tags : lecture pour tout authentifie
-- -------------------------------------------------------
create policy "tags_select"
  on public.tags for select
  to authenticated
  using (true);

-- -------------------------------------------------------
-- groups
-- -------------------------------------------------------
-- Membres voient leurs groupes
create policy "groups_select_member"
  on public.groups for select
  to authenticated
  using (
    id in (select group_id from public.group_members where user_id = auth.uid())
  );

-- Lookup par invite_code pour rejoindre (tout authentifie)
create policy "groups_select_by_invite"
  on public.groups for select
  to authenticated
  using (true);

create policy "groups_insert"
  on public.groups for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "groups_update_admin"
  on public.groups for update
  to authenticated
  using (
    id in (select group_id from public.group_members where user_id = auth.uid() and role = 'admin')
  );

create policy "groups_delete_admin"
  on public.groups for delete
  to authenticated
  using (
    id in (select group_id from public.group_members where user_id = auth.uid() and role = 'admin')
  );

-- -------------------------------------------------------
-- group_members
-- -------------------------------------------------------
create policy "group_members_select"
  on public.group_members for select
  to authenticated
  using (
    group_id in (select group_id from public.group_members where user_id = auth.uid())
  );

create policy "group_members_insert"
  on public.group_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "group_members_delete"
  on public.group_members for delete
  to authenticated
  using (
    user_id = auth.uid()
    or group_id in (
      select group_id from public.group_members where user_id = auth.uid() and role = 'admin'
    )
  );

-- -------------------------------------------------------
-- question_bank : lecture seule
-- -------------------------------------------------------
create policy "question_bank_select"
  on public.question_bank for select
  to authenticated
  using (is_active = true);

-- -------------------------------------------------------
-- user_questions : membres du groupe peuvent lire et creer
-- -------------------------------------------------------
create policy "user_questions_select"
  on public.user_questions for select
  to authenticated
  using (
    group_id in (select group_id from public.group_members where user_id = auth.uid())
  );

create policy "user_questions_insert"
  on public.user_questions for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and group_id in (select group_id from public.group_members where user_id = auth.uid())
  );

create policy "user_questions_delete_own"
  on public.user_questions for delete
  to authenticated
  using (created_by = auth.uid());

-- -------------------------------------------------------
-- daily_questions : visibilite groupe
-- -------------------------------------------------------
create policy "daily_questions_select"
  on public.daily_questions for select
  to authenticated
  using (
    group_id in (select group_id from public.group_members where user_id = auth.uid())
  );

create policy "daily_questions_insert_admin"
  on public.daily_questions for insert
  to authenticated
  with check (
    group_id in (
      select group_id from public.group_members where user_id = auth.uid() and role = 'admin'
    )
  );

create policy "daily_questions_update_admin"
  on public.daily_questions for update
  to authenticated
  using (
    group_id in (
      select group_id from public.group_members where user_id = auth.uid() and role = 'admin'
    )
  );

-- -------------------------------------------------------
-- votes : anti-triche + transparence totale apres reveal
-- -------------------------------------------------------
-- INSERT : membre du groupe, question active, voter_id = soi-meme
create policy "votes_insert_member"
  on public.votes for insert
  to authenticated
  with check (
    voter_id = auth.uid()
    and question_id in (
      select dq.id from public.daily_questions dq
      join public.group_members gm on gm.group_id = dq.group_id
      where gm.user_id = auth.uid() and dq.status = 'active'
    )
  );

-- SELECT : transparence totale apres reveal (on voit voter_id, target_user_id)
-- Avant reveal : un voteur peut voir son propre vote uniquement
create policy "votes_select"
  on public.votes for select
  to authenticated
  using (
    -- Son propre vote (toujours visible)
    voter_id = auth.uid()
    or
    -- Tous les votes apres reveal (transparence totale)
    question_id in (
      select dq.id from public.daily_questions dq
      join public.group_members gm on gm.group_id = dq.group_id
      where gm.user_id = auth.uid() and dq.status = 'revealed'
    )
  );

-- UPDATE : peut changer son vote tant que la question est active
create policy "votes_update_own"
  on public.votes for update
  to authenticated
  using (voter_id = auth.uid())
  with check (
    voter_id = auth.uid()
    and question_id in (
      select dq.id from public.daily_questions dq
      where dq.status = 'active'
    )
  );

-- =========================
-- 4. TRIGGERS & FUNCTIONS
-- =========================

-- -------------------------------------------------------
-- Auto-creation du profil lors du signup
-- -------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8)),
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- -------------------------------------------------------
-- Auto-ajout en tant qu'admin lors de la creation d'un groupe
-- -------------------------------------------------------
create or replace function public.handle_new_group()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.created_by, 'admin');
  return new;
end;
$$;

create trigger on_group_created
  after insert on public.groups
  for each row
  execute function public.handle_new_group();

-- -------------------------------------------------------
-- updated_at auto-refresh
-- -------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profiles_updated
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- -------------------------------------------------------
-- Reveler une question
-- -------------------------------------------------------
create or replace function public.reveal_question(p_question_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.daily_questions
  set status = 'revealed', revealed_at = now()
  where id = p_question_id
    and status = 'active';
end;
$$;

-- -------------------------------------------------------
-- Rejoindre un groupe par invite_code
-- -------------------------------------------------------
create or replace function public.join_group_by_code(p_invite_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
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

-- -------------------------------------------------------
-- Assigner les questions quotidiennes (pg_cron)
-- Pioche dans bank + user_questions, filtre par intensites autorisees
-- -------------------------------------------------------
create or replace function public.assign_daily_questions()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  v_question text;
  v_source_type text;
  v_source_id uuid;
  v_tag_id uuid;
  v_intensity text;
  v_allowed text[];
begin
  for r in (
    select g.id as group_id, g.allowed_intensities
    from public.groups g
    where exists (select 1 from public.group_members gm where gm.group_id = g.id)
  ) loop
    v_allowed := r.allowed_intensities;

    -- Pool combine : bank + user_questions du groupe
    -- Filtre par intensites autorisees du groupe
    select q.question, q.source_type, q.source_id, q.tag_id, q.intensity
    into v_question, v_source_type, v_source_id, v_tag_id, v_intensity
    from (
      -- Questions de la banque globale
      select question, 'bank'::text as source_type, id as source_id, tag_id, intensity
      from public.question_bank
      where is_active = true
        and intensity = any(v_allowed)
      union all
      -- Questions custom du groupe
      select question, 'user'::text as source_type, id as source_id, tag_id, intensity
      from public.user_questions
      where group_id = r.group_id
        and intensity = any(v_allowed)
    ) q
    -- Eviter de reposer une question recente (30 derniers jours)
    where q.question not in (
      select dq.question from public.daily_questions dq
      where dq.group_id = r.group_id
        and dq.created_at > now() - interval '30 days'
    )
    order by random()
    limit 1;

    if v_question is not null then
      insert into public.daily_questions (group_id, question, status, source_type, source_id, tag_id, intensity)
      values (r.group_id, v_question, 'active', v_source_type, v_source_id, v_tag_id, v_intensity);

      -- Incrementer used_count si c'est une question user
      if v_source_type = 'user' then
        update public.user_questions set used_count = used_count + 1 where id = v_source_id;
      end if;
    end if;
  end loop;
end;
$$;

-- -------------------------------------------------------
-- Reveler toutes les questions dont l'heure est passee
-- -------------------------------------------------------
create or replace function public.reveal_due_questions()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.daily_questions dq
  set status = 'revealed', revealed_at = now()
  from public.groups g
  where dq.group_id = g.id
    and dq.status = 'active'
    and dq.created_at::date = current_date
    and current_time >= g.reveal_time;
end;
$$;

-- =========================
-- 5. SEED DATA – Tags
-- =========================
insert into public.tags (name, label, emoji) values
  ('charismatique', 'Charismatique', '✨'),
  ('gourmand', 'Gourmand', '🍕'),
  ('radin', 'Radin', '💰'),
  ('tete-a-claque', 'Tete a claque', '👊'),
  ('drole', 'Drole', '😂'),
  ('creatif', 'Creatif', '🎨'),
  ('courageux', 'Courageux', '🦁'),
  ('optimiste', 'Optimiste', '☀️'),
  ('leader', 'Leader', '👑'),
  ('bavard', 'Bavard', '🗣️'),
  ('geek', 'Geek', '🖥️'),
  ('sportif', 'Sportif', '💪'),
  ('fetard', 'Fetard', '🎉'),
  ('loyal', 'Loyal', '🤝'),
  ('maladroit', 'Maladroit', '🤦'),
  ('romantique', 'Romantique', '❤️'),
  ('mysterieux', 'Mysterieux', '🕵️'),
  ('tetu', 'Tetu', '🐂'),
  ('genereux', 'Genereux', '🎁'),
  ('paresseux', 'Paresseux', '😴'),
  ('intelligent', 'Intelligent', '🧠'),
  ('aventurier', 'Aventurier', '🧭'),
  ('sensible', 'Sensible', '🥺'),
  ('bruyant', 'Bruyant', '📢'),
  ('discret', 'Discret', '🤫'),
  ('charmeur', 'Charmeur', '😏'),
  ('rebelle', 'Rebelle', '🤘'),
  ('sage', 'Sage', '🧘'),
  ('dramaqueen', 'Dramaqueen', '🎭'),
  ('autre', 'Autre', '❓')
on conflict (name) do nothing;

-- =========================
-- 6. SEED DATA – Question Bank (10 questions de test)
-- =========================
-- Les vraies questions seront ajoutees manuellement plus tard
insert into public.question_bank (question, category, intensity, tag_id) values
  -- NORMAL
  ('Qui va vivre le plus longtemps ?', 'general', 'normal',
    (select id from public.tags where name = 'sage')),
  ('Qui se mariera le dernier ?', 'general', 'normal',
    (select id from public.tags where name = 'romantique')),
  ('Qui cache le plus de choses ?', 'general', 'normal',
    (select id from public.tags where name = 'mysterieux')),
  ('Qui est le plus susceptible de devenir celebre ?', 'general', 'normal',
    (select id from public.tags where name = 'charismatique')),
  -- EPICE
  ('Qui meurt le premier dans une apocalypse de zombies ?', 'general', 'epice',
    (select id from public.tags where name = 'maladroit')),
  ('Qui a le plus de chance de faire un coming out ?', 'general', 'epice',
    (select id from public.tags where name = 'mysterieux')),
  ('Si vous deviez mettre un coup de poing a quelqu un du groupe, qui choisiriez-vous ?', 'general', 'epice',
    (select id from public.tags where name = 'tete-a-claque')),
  ('Qui va divorcer le plus vite ?', 'general', 'epice',
    (select id from public.tags where name = 'dramaqueen')),
  ('Qui a le plus de chance d aller en prison ?', 'general', 'epice',
    (select id from public.tags where name = 'rebelle')),
  ('Qui est le plus susceptible de rire a un enterrement ?', 'general', 'epice',
    (select id from public.tags where name = 'drole'))
on conflict (question) do nothing;

-- =========================
-- 7. CRON JOBS (decommenter apres activation de pg_cron)
-- =========================

-- Assigner les questions quotidiennes a 08:00 UTC
-- select cron.schedule(
--   'kiseki-assign-daily-questions',
--   '0 8 * * *',
--   $$ select public.assign_daily_questions(); $$
-- );

-- Reveler les questions dues toutes les 5 minutes
-- (verifie si l'heure de reveal du groupe est passee)
-- select cron.schedule(
--   'kiseki-reveal-due-questions',
--   '*/5 * * * *',
--   $$ select public.reveal_due_questions(); $$
-- );

-- Weekly recap notification trigger (dimanche 18:00 UTC)
-- L'envoi des notifications se fait via Edge Function
-- select cron.schedule(
--   'kiseki-weekly-recap',
--   '0 18 * * 0',
--   $$ select net.http_post(
--     url := 'https://YOUR_PROJECT.supabase.co/functions/v1/send-weekly-recap',
--     headers := '{"Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb
--   ); $$
-- );
