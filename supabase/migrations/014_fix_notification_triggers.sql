-- ============================================================
-- Kiseki – Fix Notification Triggers + Security
-- Migration 014 : Use config table instead of GUC in triggers,
--                  drop overly permissive RLS policy
-- ============================================================

-- =========================
-- 1. Fix notify_on_vote() — replace current_setting GUC with config table
-- =========================
CREATE OR REPLACE FUNCTION public.notify_on_vote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_group_id uuid;
BEGIN
  SELECT group_id INTO v_group_id
  FROM public.daily_questions
  WHERE id = NEW.question_id;

  PERFORM net.http_post(
    url     := 'https://avjarksbgtltfmaqqwvd.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || public.get_notification_service_key()
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
  RETURN NEW;
END;
$$;

-- =========================
-- 2. Fix notify_on_member_joined() — same fix
-- =========================
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
      'Authorization', 'Bearer ' || public.get_notification_service_key()
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
  RETURN NEW;
END;
$$;

-- =========================
-- 3. Drop overly permissive RLS policy
-- =========================
-- The policy allowed any authenticated user to read the service_role_key
-- via the REST API. The get_notification_service_key() function is
-- SECURITY DEFINER and doesn't need RLS to access the table.
DROP POLICY IF EXISTS "service_key_read" ON public.notification_config;
