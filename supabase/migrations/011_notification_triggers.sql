-- ============================================================
-- Kiseki – Push Notification Infrastructure
-- Migration 011 : pg_net extension, pg_cron jobs, row triggers
-- ============================================================

-- =========================
-- 1. Extension pg_net (HTTP async depuis PostgreSQL)
-- =========================
-- pg_cron est deja active dans migration 001.
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA extensions;

-- =========================
-- 2. pg_cron Jobs — Notifications quotidiennes
-- =========================
-- Chaque job appelle l'Edge Function send-notifications via net.http_post.
-- L'URL utilise le project ref Supabase.
-- Le service_role_key est lu depuis un GUC custom configure dans le Dashboard :
--   Database > Settings > Custom Config : app.settings.service_role_key

-- 2a. Question du matin — 09:05 UTC (5 min apres activate_daily_slots pour eviter la race)
DO $$
BEGIN
  PERFORM cron.unschedule('kiseki-notify-morning');
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

SELECT cron.schedule(
  'kiseki-notify-morning',
  '5 9 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://avjarksbgtltfmaqqwvd.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body    := '{"type":"daily_question"}'::jsonb
  );
  $$
);

-- 2b. Rappel "Derniere chance" — 19:00 UTC (1h avant reveal)
-- Cible uniquement les membres qui n'ont pas encore vote
DO $$
BEGIN
  PERFORM cron.unschedule('kiseki-notify-reminder');
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

SELECT cron.schedule(
  'kiseki-notify-reminder',
  '0 19 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://avjarksbgtltfmaqqwvd.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body    := '{"type":"vote_reminder"}'::jsonb
  );
  $$
);

-- 2c. Reveal — 20:00 UTC (meme heure que reveal_due_questions)
-- A 20:00, les questions sont soit deja revealed (cron toutes 5 min) soit le seront
-- dans les minutes suivantes. Le message invite a "venir voir" et l'app affiche l'etat reel.
DO $$
BEGIN
  PERFORM cron.unschedule('kiseki-notify-reveal');
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

SELECT cron.schedule(
  'kiseki-notify-reveal',
  '0 20 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://avjarksbgtltfmaqqwvd.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body    := '{"type":"results_reveal"}'::jsonb
  );
  $$
);

-- =========================
-- 3. Trigger : Social Proof (votes INSERT)
-- =========================
-- Quand quelqu'un vote pour un membre, on notifie la CIBLE uniquement.
-- On ne revele JAMAIS l'identite du votant — la curiosite ("qui a vote pour moi ?")
-- est la mecanique de retention la plus puissante (cf. BeReal, Slay, NGL).

CREATE OR REPLACE FUNCTION public.notify_on_vote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_group_id uuid;
BEGIN
  -- Resout le groupe pour le deep-link dans le payload de la notif
  SELECT group_id INTO v_group_id
  FROM public.daily_questions
  WHERE id = NEW.question_id;

  -- Fire-and-forget : net.http_post est asynchrone.
  -- On passe target_user_id (la personne votee) mais PAS voter_id.
  PERFORM net.http_post(
    url     := 'https://avjarksbgtltfmaqqwvd.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body    := jsonb_build_object(
      'type',           'vote',
      'target_user_id', NEW.target_user_id,
      'group_id',       v_group_id,
      'question_id',    NEW.question_id
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Si le call HTTP echoue (GUC manquant, pg_net down...), on ne bloque
  -- pas l'INSERT du vote. Les notifications sont best-effort.
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_vote_inserted ON public.votes;

CREATE TRIGGER on_vote_inserted
  AFTER INSERT ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_vote();

-- =========================
-- 4. Trigger : Nouveau Membre (group_members INSERT)
-- =========================
-- Notifie tous les membres EXISTANTS du groupe (pas le nouvel arrivant).
-- Le message "Fresh meat" cree de l'anticipation sociale.

CREATE OR REPLACE FUNCTION public.notify_on_member_joined()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_group_name text;
  v_joiner_name text;
BEGIN
  SELECT name INTO v_group_name
  FROM public.groups
  WHERE id = NEW.group_id;

  SELECT COALESCE(display_name, username) INTO v_joiner_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  PERFORM net.http_post(
    url     := 'https://avjarksbgtltfmaqqwvd.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body    := jsonb_build_object(
      'type',         'member_joined',
      'group_id',     NEW.group_id,
      'new_user_id',  NEW.user_id,
      'joiner_name',  v_joiner_name,
      'group_name',   v_group_name
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Best-effort : ne pas bloquer le join si la notif echoue
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_group_member_inserted ON public.group_members;

CREATE TRIGGER on_group_member_inserted
  AFTER INSERT ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_member_joined();
