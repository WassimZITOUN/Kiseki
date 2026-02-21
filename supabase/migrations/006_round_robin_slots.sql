-- ============================================================
-- Kiseki – Round-Robin Daily Slots
-- Migration 006 : daily_slots, user_submissions, rotation logic
-- ============================================================

-- =========================
-- 1.1 Helper functions (dropped by migration 003)
-- =========================

CREATE OR REPLACE FUNCTION public.is_member_of(_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id AND user_id = auth.uid() AND role = 'admin'
  );
$$;

-- =========================
-- 1.2 ALTER existing tables
-- =========================

-- group_members: track when a member becomes eligible for the cycle
ALTER TABLE public.group_members
  ADD COLUMN IF NOT EXISTS cycle_eligible_at date NOT NULL DEFAULT CURRENT_DATE;

-- groups: track current cycle number
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS current_cycle int NOT NULL DEFAULT 0;

-- =========================
-- 1.3 New table: daily_slots
-- =========================

CREATE TABLE public.daily_slots (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id           uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  assigned_user_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_date        date NOT NULL,
  slot_order         int NOT NULL,
  cycle_number       int NOT NULL DEFAULT 1,
  status             text NOT NULL DEFAULT 'scheduled'
                     CHECK (status IN ('scheduled', 'live', 'revealed', 'fallback')),
  final_question_text text,
  source_type        text CHECK (source_type IN ('submission', 'bank')),
  source_id          uuid,
  daily_question_id  uuid REFERENCES public.daily_questions(id),
  admin_replaced_at  timestamptz,
  admin_replaced_by  uuid REFERENCES public.profiles(id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  activated_at       timestamptz,

  UNIQUE (group_id, target_date)
);

ALTER TABLE public.daily_slots ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_daily_slots_group_date ON public.daily_slots(group_id, target_date);
CREATE INDEX idx_daily_slots_assigned_user ON public.daily_slots(assigned_user_id);
CREATE INDEX idx_daily_slots_status ON public.daily_slots(status);

-- =========================
-- 1.4 New table: user_submissions
-- =========================

CREATE TABLE public.user_submissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id         uuid NOT NULL REFERENCES public.daily_slots(id) ON DELETE CASCADE UNIQUE,
  group_id        uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  submitted_by    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_text   text,
  choose_bank     boolean NOT NULL DEFAULT false,
  intensity       text NOT NULL DEFAULT 'normal' CHECK (intensity IN ('normal', 'epice')),
  tag_id          uuid REFERENCES public.tags(id),
  submitted_at    timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_submissions_input_check CHECK (
    (choose_bank = true AND question_text IS NULL)
    OR
    (choose_bank = false AND question_text IS NOT NULL AND char_length(question_text) BETWEEN 10 AND 200)
  )
);

ALTER TABLE public.user_submissions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_user_submissions_slot ON public.user_submissions(slot_id);
CREATE INDEX idx_user_submissions_group ON public.user_submissions(group_id);

-- =========================
-- 1.5 RLS Policies
-- =========================

-- daily_slots: SELECT for group members
CREATE POLICY "daily_slots_select_member"
  ON public.daily_slots FOR SELECT
  TO authenticated
  USING (public.is_member_of(group_id));

-- No INSERT/UPDATE/DELETE policies — all mutations via security definer RPCs

-- user_submissions: SELECT own or admin
CREATE POLICY "user_submissions_select"
  ON public.user_submissions FOR SELECT
  TO authenticated
  USING (
    submitted_by = auth.uid()
    OR public.is_group_admin(group_id)
  );

-- user_submissions: INSERT own + member + slot assigned to user + slot scheduled
CREATE POLICY "user_submissions_insert"
  ON public.user_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND public.is_member_of(group_id)
    AND EXISTS (
      SELECT 1 FROM public.daily_slots ds
      WHERE ds.id = slot_id
        AND ds.assigned_user_id = auth.uid()
        AND ds.status = 'scheduled'
    )
  );

-- No UPDATE / DELETE policy:
-- a submission is immutable once sent (hidden and locked until next cycle)

-- =========================
-- 1.6 SQL Functions
-- =========================

-- -------------------------------------------------------
-- generate_future_slots(p_group_id)
-- Generates one cycle of daily slots for the group
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_future_slots(p_group_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cycle int;
  v_start_date date;
  v_members uuid[];
  v_count int;
  v_seed double precision;
  v_i int;
  v_j int;
  v_tmp uuid;
BEGIN
  -- Lock group row to prevent concurrent generation
  SELECT current_cycle INTO v_cycle
  FROM public.groups
  WHERE id = p_group_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Group not found';
  END IF;

  -- Increment cycle
  v_cycle := v_cycle + 1;
  UPDATE public.groups SET current_cycle = v_cycle WHERE id = p_group_id;

  -- Get eligible members, ordered deterministically
  SELECT array_agg(user_id ORDER BY joined_at, user_id)
  INTO v_members
  FROM public.group_members
  WHERE group_id = p_group_id
    AND cycle_eligible_at <= CURRENT_DATE;

  IF v_members IS NULL OR array_length(v_members, 1) IS NULL THEN
    RETURN;
  END IF;

  v_count := array_length(v_members, 1);
  -- Cap at 12
  IF v_count > 12 THEN
    v_count := 12;
    v_members := v_members[1:12];
  END IF;

  -- Deterministic shuffle (Fisher-Yates) using group_id + cycle as seed
  v_seed := abs(('x' || substr(md5(p_group_id::text || v_cycle::text), 1, 8))::bit(32)::int)
            / 2147483647.0;
  PERFORM setseed(v_seed);

  FOR v_i IN REVERSE v_count .. 2 LOOP
    v_j := 1 + floor(random() * v_i)::int;
    IF v_j <> v_i THEN
      v_tmp := v_members[v_i];
      v_members[v_i] := v_members[v_j];
      v_members[v_j] := v_tmp;
    END IF;
  END LOOP;

  -- Compute start date: day after last scheduled slot, or tomorrow
  SELECT MAX(target_date) + 1 INTO v_start_date
  FROM public.daily_slots
  WHERE group_id = p_group_id;

  IF v_start_date IS NULL OR v_start_date <= CURRENT_DATE THEN
    v_start_date := CURRENT_DATE + 1;
  END IF;

  -- Insert slots with consecutive dates
  FOR v_i IN 1 .. v_count LOOP
    INSERT INTO public.daily_slots (
      group_id, assigned_user_id, target_date, slot_order, cycle_number, status
    ) VALUES (
      p_group_id,
      v_members[v_i],
      v_start_date + (v_i - 1),
      v_i - 1,
      v_cycle,
      'scheduled'
    )
    ON CONFLICT (group_id, target_date) DO NOTHING;
  END LOOP;
END;
$$;

-- -------------------------------------------------------
-- activate_daily_slots()
-- Called by pg_cron every 5 min — activates today's slots
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.activate_daily_slots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  r_group record;
  v_slot record;
  v_sub record;
  v_question_text text;
  v_source_type text;
  v_source_id uuid;
  v_tag_id uuid;
  v_intensity text;
  v_dq_id uuid;
  v_allowed text[];
  v_cycle_submission_count int;
BEGIN
  -- For each group whose question_time has passed today
  FOR r_group IN (
    SELECT g.id AS group_id, g.question_time, g.allowed_intensities
    FROM public.groups g
    WHERE current_time >= g.question_time
      AND EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = g.id)
      -- Skip groups that already have a live/revealed/fallback slot today
      AND NOT EXISTS (
        SELECT 1 FROM public.daily_slots ds
        WHERE ds.group_id = g.id
          AND ds.target_date = CURRENT_DATE
          AND ds.status IN ('live', 'revealed', 'fallback')
      )
  ) LOOP
    v_allowed := r_group.allowed_intensities;

    -- Try to grab today's scheduled slot
    SELECT * INTO v_slot
    FROM public.daily_slots
    WHERE group_id = r_group.group_id
      AND target_date = CURRENT_DATE
      AND status = 'scheduled'
    FOR UPDATE SKIP LOCKED;

    -- If no slot exists, try generating a new cycle
    IF NOT FOUND THEN
      -- Check if there are any future scheduled slots
      IF NOT EXISTS (
        SELECT 1 FROM public.daily_slots
        WHERE group_id = r_group.group_id
          AND target_date > CURRENT_DATE
          AND status = 'scheduled'
      ) THEN
        PERFORM public.generate_future_slots(r_group.group_id);
      END IF;

      -- Re-try after generation
      SELECT * INTO v_slot
      FROM public.daily_slots
      WHERE group_id = r_group.group_id
        AND target_date = CURRENT_DATE
        AND status = 'scheduled'
      FOR UPDATE SKIP LOCKED;

      IF NOT FOUND THEN
        CONTINUE; -- No slot possible today (e.g. generation started tomorrow)
      END IF;
    END IF;

    -- Guardrail: the game starts only when at least 2 members have submitted for this cycle
    SELECT COUNT(*) INTO v_cycle_submission_count
    FROM public.user_submissions us
    INNER JOIN public.daily_slots ds ON ds.id = us.slot_id
    WHERE ds.group_id = r_group.group_id
      AND ds.cycle_number = v_slot.cycle_number;

    IF v_cycle_submission_count < 2 THEN
      CONTINUE;
    END IF;

    -- Check for user submission
    SELECT * INTO v_sub
    FROM public.user_submissions
    WHERE slot_id = v_slot.id;

    IF FOUND THEN
      IF COALESCE(v_sub.choose_bank, false) = true THEN
        -- User opted for bank auto-pick
        SELECT qb.question, qb.id, qb.tag_id, qb.intensity
        INTO v_question_text, v_source_id, v_tag_id, v_intensity
        FROM public.question_bank qb
        WHERE qb.is_active = true
          AND qb.intensity = v_sub.intensity
          AND qb.intensity = ANY(v_allowed)
          AND qb.question NOT IN (
            SELECT dq.question FROM public.daily_questions dq
            WHERE dq.group_id = r_group.group_id
              AND dq.created_at > now() - interval '30 days'
          )
        ORDER BY random()
        LIMIT 1;

        IF v_question_text IS NULL THEN
          SELECT qb.question, qb.id, qb.tag_id, qb.intensity
          INTO v_question_text, v_source_id, v_tag_id, v_intensity
          FROM public.question_bank qb
          WHERE qb.is_active = true
            AND qb.intensity = ANY(v_allowed)
          ORDER BY random()
          LIMIT 1;
        END IF;

        IF v_question_text IS NULL THEN
          CONTINUE;
        END IF;

        v_source_type := 'bank';

        UPDATE public.daily_slots
        SET status = 'live',
            final_question_text = v_question_text,
            source_type = 'bank',
            source_id = v_source_id,
            activated_at = now()
        WHERE id = v_slot.id;
      ELSE
        -- Use the user's own submission
        v_question_text := v_sub.question_text;
        v_source_type := 'submission';
        v_source_id := v_sub.id;
        v_tag_id := v_sub.tag_id;
        v_intensity := v_sub.intensity;

        UPDATE public.daily_slots
        SET status = 'live',
            final_question_text = v_question_text,
            source_type = 'submission',
            source_id = v_sub.id,
            activated_at = now()
        WHERE id = v_slot.id;
      END IF;
    ELSE
      -- Fallback: pick from question_bank (avoid 30-day duplicates)
      SELECT qb.question, qb.id, qb.tag_id, qb.intensity
      INTO v_question_text, v_source_id, v_tag_id, v_intensity
      FROM public.question_bank qb
      WHERE qb.is_active = true
        AND qb.intensity = ANY(v_allowed)
        AND qb.question NOT IN (
          SELECT dq.question FROM public.daily_questions dq
          WHERE dq.group_id = r_group.group_id
            AND dq.created_at > now() - interval '30 days'
        )
      ORDER BY random()
      LIMIT 1;

      IF v_question_text IS NULL THEN
        -- Absolute fallback: any active question
        SELECT qb.question, qb.id, qb.tag_id, qb.intensity
        INTO v_question_text, v_source_id, v_tag_id, v_intensity
        FROM public.question_bank qb
        WHERE qb.is_active = true
          AND qb.intensity = ANY(v_allowed)
        ORDER BY random()
        LIMIT 1;
      END IF;

      IF v_question_text IS NULL THEN
        CONTINUE; -- No questions available at all
      END IF;

      v_source_type := 'bank';

      UPDATE public.daily_slots
      SET status = 'fallback',
          final_question_text = v_question_text,
          source_type = 'bank',
          source_id = v_source_id,
          activated_at = now()
      WHERE id = v_slot.id;
    END IF;

    -- Insert into daily_questions (preserves existing contract)
    INSERT INTO public.daily_questions (
      group_id, question, status, source_type, source_id, tag_id, intensity
    ) VALUES (
      r_group.group_id,
      v_question_text,
      'active',
      CASE WHEN v_source_type = 'submission' THEN 'user' ELSE 'bank' END,
      v_source_id,
      v_tag_id,
      v_intensity
    )
    RETURNING id INTO v_dq_id;

    -- Link slot to daily_question
    UPDATE public.daily_slots
    SET daily_question_id = v_dq_id
    WHERE id = v_slot.id;
  END LOOP;
END;
$$;

-- -------------------------------------------------------
-- reveal_due_questions() — updated to also update daily_slots
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reveal_due_questions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Reveal daily_questions as before
  UPDATE public.daily_questions dq
  SET status = 'revealed', revealed_at = now()
  FROM public.groups g
  WHERE dq.group_id = g.id
    AND dq.status = 'active'
    AND dq.created_at::date = CURRENT_DATE
    AND current_time >= g.reveal_time;

  -- Also update linked daily_slots to 'revealed'
  UPDATE public.daily_slots ds
  SET status = 'revealed'
  FROM public.daily_questions dq
  WHERE ds.daily_question_id = dq.id
    AND ds.status IN ('live', 'fallback')
    AND dq.status = 'revealed';
END;
$$;

-- -------------------------------------------------------
-- get_my_next_slot(p_group_id) — returns upcoming slot info
-- Does NOT expose target_date or slot_order (rotation hidden)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_next_slot(p_group_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_slot record;
  v_sub record;
  v_result jsonb;
BEGIN
  -- Find the next scheduled slot for this user in this group
  SELECT ds.id AS slot_id
  INTO v_slot
  FROM public.daily_slots ds
  WHERE ds.group_id = p_group_id
    AND ds.assigned_user_id = auth.uid()
    AND ds.status = 'scheduled'
    AND ds.target_date >= CURRENT_DATE
  ORDER BY ds.target_date
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('has_upcoming_slot', false);
  END IF;

  -- Check for existing submission
  SELECT us.id, us.question_text, us.choose_bank, us.intensity, us.tag_id, us.updated_at
  INTO v_sub
  FROM public.user_submissions us
  WHERE us.slot_id = v_slot.slot_id;

  IF FOUND THEN
    v_result := jsonb_build_object(
      'has_upcoming_slot', true,
      'slot_id', v_slot.slot_id,
      'has_submission', true,
      'submission', jsonb_build_object(
        'id', v_sub.id,
        'question_text', v_sub.question_text,
        'choose_bank', v_sub.choose_bank,
        'intensity', v_sub.intensity,
        'tag_id', v_sub.tag_id,
        'updated_at', v_sub.updated_at
      )
    );
  ELSE
    v_result := jsonb_build_object(
      'has_upcoming_slot', true,
      'slot_id', v_slot.slot_id,
      'has_submission', false,
      'submission', null
    );
  END IF;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_next_slot(uuid) TO authenticated;

-- -------------------------------------------------------
-- admin_replace_question(p_group_id, p_daily_question_id)
-- Admin can replace active question once per day
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_replace_question(
  p_group_id uuid,
  p_daily_question_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_admin boolean;
  v_replace_count int;
  v_dq record;
  v_new_question text;
  v_new_source_id uuid;
  v_new_tag_id uuid;
  v_new_intensity text;
  v_allowed text[];
BEGIN
  -- Check admin
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Non autorise : admin uniquement';
  END IF;

  -- Check limit: 1 replacement per day per group
  SELECT COUNT(*) INTO v_replace_count
  FROM public.daily_slots
  WHERE group_id = p_group_id
    AND admin_replaced_at::date = CURRENT_DATE;

  IF v_replace_count >= 1 THEN
    RAISE EXCEPTION 'Limite atteinte : 1 remplacement par jour';
  END IF;

  -- Verify the daily question is active
  SELECT * INTO v_dq
  FROM public.daily_questions
  WHERE id = p_daily_question_id
    AND group_id = p_group_id
    AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question non trouvee ou deja revelee';
  END IF;

  -- Get allowed intensities
  SELECT allowed_intensities INTO v_allowed
  FROM public.groups WHERE id = p_group_id;

  -- Pick replacement from question_bank (different question, avoid 30-day duplicates)
  SELECT qb.question, qb.id, qb.tag_id, qb.intensity
  INTO v_new_question, v_new_source_id, v_new_tag_id, v_new_intensity
  FROM public.question_bank qb
  WHERE qb.is_active = true
    AND qb.intensity = ANY(v_allowed)
    AND qb.question <> v_dq.question
    AND qb.question NOT IN (
      SELECT dq.question FROM public.daily_questions dq
      WHERE dq.group_id = p_group_id
        AND dq.created_at > now() - interval '30 days'
    )
  ORDER BY random()
  LIMIT 1;

  IF v_new_question IS NULL THEN
    RAISE EXCEPTION 'Aucune question de remplacement disponible';
  END IF;

  -- Update daily_questions in-place
  UPDATE public.daily_questions
  SET question = v_new_question,
      source_type = 'bank',
      source_id = v_new_source_id,
      tag_id = v_new_tag_id,
      intensity = v_new_intensity
  WHERE id = p_daily_question_id;

  -- Update daily_slots
  UPDATE public.daily_slots
  SET admin_replaced_at = now(),
      admin_replaced_by = auth.uid(),
      final_question_text = v_new_question,
      source_type = 'bank',
      source_id = v_new_source_id
  WHERE daily_question_id = p_daily_question_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_replace_question(uuid, uuid) TO authenticated;

-- -------------------------------------------------------
-- join_group_by_code — updated with cycle_eligible_at waitlist
-- -------------------------------------------------------
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
BEGIN
  -- Find the group
  SELECT id, max_members INTO v_group_id, v_max_members
  FROM public.groups
  WHERE invite_code = p_invite_code;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Code invitation invalide';
  END IF;

  -- Check member count
  SELECT COUNT(*) INTO v_member_count
  FROM public.group_members
  WHERE group_id = v_group_id;

  IF v_member_count >= v_max_members THEN
    RAISE EXCEPTION 'Le groupe est plein';
  END IF;

  -- Calculate cycle_eligible_at: day after last scheduled slot, or today
  SELECT MAX(target_date) + 1 INTO v_eligible_at
  FROM public.daily_slots
  WHERE group_id = v_group_id
    AND status = 'scheduled'
    AND target_date >= CURRENT_DATE;

  IF v_eligible_at IS NULL THEN
    v_eligible_at := CURRENT_DATE;
  END IF;

  -- Add member with waitlist date
  INSERT INTO public.group_members (group_id, user_id, role, cycle_eligible_at)
  VALUES (v_group_id, auth.uid(), 'member', v_eligible_at)
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN v_group_id;
END;
$$;

-- =========================
-- 1.7 pg_cron updates
-- =========================

-- Remove old assign job (si il existe)
-- SELECT cron.unschedule('kiseki-assign-daily-questions');

-- Create new activate-daily-slots job (every 5 min)
SELECT cron.schedule(
  'kiseki-activate-daily-slots',
  '*/5 * * * *',
  $$ SELECT public.activate_daily_slots(); $$
);

-- kiseki-reveal-due-questions stays unchanged (already running)

-- =========================
-- 1.8 Bootstrap: generate slots for existing groups
-- =========================

DO $$
DECLARE
  v_gid uuid;
BEGIN
  FOR v_gid IN (
    SELECT g.id FROM public.groups g
    WHERE EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = g.id)
  ) LOOP
    PERFORM public.generate_future_slots(v_gid);
  END LOOP;
END;
$$;
