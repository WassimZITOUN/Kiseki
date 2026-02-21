-- ============================================================
-- Kiseki – Pregame flow fixes
-- Migration 007
-- ============================================================

-- 1) Prevent legacy auto-question creation on group insert
DROP TRIGGER IF EXISTS on_group_created_assign_question ON public.groups;

-- 2) Helper: ensure a member has one scheduled slot in a group
CREATE OR REPLACE FUNCTION public.ensure_member_scheduled_slot(
  p_group_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_existing_slot uuid;
  v_cycle int;
  v_next_order int;
  v_next_date date;
BEGIN
  SELECT ds.id
  INTO v_existing_slot
  FROM public.daily_slots ds
  WHERE ds.group_id = p_group_id
    AND ds.assigned_user_id = p_user_id
    AND ds.status = 'scheduled'
    AND ds.target_date >= CURRENT_DATE
  ORDER BY ds.target_date
  LIMIT 1;

  IF v_existing_slot IS NOT NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(MAX(ds.cycle_number), GREATEST((SELECT g.current_cycle FROM public.groups g WHERE g.id = p_group_id), 1))
  INTO v_cycle
  FROM public.daily_slots ds
  WHERE ds.group_id = p_group_id
    AND ds.status = 'scheduled';

  IF v_cycle IS NULL THEN
    v_cycle := 1;
  END IF;

  SELECT COALESCE(MAX(ds.slot_order), -1) + 1
  INTO v_next_order
  FROM public.daily_slots ds
  WHERE ds.group_id = p_group_id
    AND ds.status = 'scheduled'
    AND ds.cycle_number = v_cycle;

  SELECT COALESCE(MAX(ds.target_date), CURRENT_DATE) + 1
  INTO v_next_date
  FROM public.daily_slots ds
  WHERE ds.group_id = p_group_id
    AND ds.status = 'scheduled'
    AND ds.target_date >= CURRENT_DATE;

  WHILE EXISTS (
    SELECT 1 FROM public.daily_slots ds
    WHERE ds.group_id = p_group_id
      AND ds.target_date = v_next_date
  ) LOOP
    v_next_date := v_next_date + 1;
  END LOOP;

  INSERT INTO public.daily_slots (
    group_id,
    assigned_user_id,
    target_date,
    slot_order,
    cycle_number,
    status
  )
  VALUES (
    p_group_id,
    p_user_id,
    v_next_date,
    v_next_order,
    v_cycle,
    'scheduled'
  )
  ON CONFLICT (group_id, target_date) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_member_scheduled_slot(uuid, uuid) TO authenticated;

-- 3) create_group: generate slots immediately so creator sees submission form
CREATE OR REPLACE FUNCTION public.create_group(
  p_name text,
  p_max_members int DEFAULT 12,
  p_question_time time DEFAULT '09:00',
  p_reveal_time time DEFAULT '20:00',
  p_allowed_intensities text[] DEFAULT '{normal}'
)
RETURNS public.groups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
SET row_security = 'off'
AS $$
DECLARE
  v_group public.groups;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non authentifie';
  END IF;

  INSERT INTO public.groups (
    name,
    created_by,
    max_members,
    question_time,
    reveal_time,
    allowed_intensities
  )
  VALUES (
    p_name,
    auth.uid(),
    p_max_members,
    p_question_time,
    p_reveal_time,
    p_allowed_intensities
  )
  RETURNING * INTO v_group;

  -- on_group_created trigger inserts creator into group_members
  PERFORM public.generate_future_slots(v_group.id);

  RETURN v_group;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_group(text, int, time, time, text[]) TO authenticated;

-- 4) join_group_by_code: immediate eligibility during pregame
CREATE OR REPLACE FUNCTION public.join_group_by_code(p_invite_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_group_id uuid;
  v_member_count int;
  v_max_members int;
  v_eligible_at date;
  v_is_pregame boolean;
BEGIN
  SELECT g.id, g.max_members
  INTO v_group_id, v_max_members
  FROM public.groups g
  WHERE g.invite_code = p_invite_code;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Code invitation invalide';
  END IF;

  SELECT COUNT(*) INTO v_member_count
  FROM public.group_members gm
  WHERE gm.group_id = v_group_id;

  IF v_member_count >= v_max_members THEN
    RAISE EXCEPTION 'Le groupe est plein';
  END IF;

  SELECT NOT EXISTS (
    SELECT 1
    FROM public.daily_questions dq
    WHERE dq.group_id = v_group_id
  )
  INTO v_is_pregame;

  IF v_is_pregame THEN
    v_eligible_at := CURRENT_DATE;
  ELSE
    SELECT MAX(ds.target_date) + 1
    INTO v_eligible_at
    FROM public.daily_slots ds
    WHERE ds.group_id = v_group_id
      AND ds.status = 'scheduled'
      AND ds.target_date >= CURRENT_DATE;

    IF v_eligible_at IS NULL THEN
      v_eligible_at := CURRENT_DATE;
    END IF;
  END IF;

  INSERT INTO public.group_members (group_id, user_id, role, cycle_eligible_at)
  VALUES (v_group_id, auth.uid(), 'member', v_eligible_at)
  ON CONFLICT (group_id, user_id) DO NOTHING;

  IF v_is_pregame THEN
    PERFORM public.ensure_member_scheduled_slot(v_group_id, auth.uid());
  END IF;

  RETURN v_group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_group_by_code(text) TO authenticated;

-- 5) Backfill: members in pregame groups without slot should get one
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN (
    SELECT gm.group_id, gm.user_id
    FROM public.group_members gm
    WHERE NOT EXISTS (
      SELECT 1 FROM public.daily_questions dq
      WHERE dq.group_id = gm.group_id
    )
      AND NOT EXISTS (
        SELECT 1 FROM public.daily_slots ds
        WHERE ds.group_id = gm.group_id
          AND ds.assigned_user_id = gm.user_id
          AND ds.status = 'scheduled'
          AND ds.target_date >= CURRENT_DATE
      )
  ) LOOP
    PERFORM public.ensure_member_scheduled_slot(r.group_id, r.user_id);
  END LOOP;
END;
$$;

-- 6) Cleanup legacy auto-created daily questions (safe conditions)
WITH legacy AS (
  SELECT dq.id
  FROM public.daily_questions dq
  INNER JOIN public.groups g ON g.id = dq.group_id
  LEFT JOIN public.daily_slots ds ON ds.daily_question_id = dq.id
  WHERE dq.status = 'active'
    AND dq.source_type = 'bank'
    AND dq.created_at = g.created_at
    AND ds.id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.votes v
      WHERE v.question_id = dq.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.user_submissions us
      WHERE us.group_id = dq.group_id
    )
)
DELETE FROM public.daily_questions dq
USING legacy l
WHERE dq.id = l.id;
