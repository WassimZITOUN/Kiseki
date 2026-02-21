-- ============================================================
-- Kiseki – Enforce fixed schedule
-- Questions at 09:00, results at 20:00
-- Migration 010
-- ============================================================

-- Normalize existing groups to the fixed schedule.
UPDATE public.groups
SET
  question_time = TIME '09:00',
  reveal_time = TIME '20:00'
WHERE question_time <> TIME '09:00'
   OR reveal_time <> TIME '20:00';

-- Prevent any future drift from fixed schedule values.
ALTER TABLE public.groups
  DROP CONSTRAINT IF EXISTS groups_question_time_fixed_check;

ALTER TABLE public.groups
  ADD CONSTRAINT groups_question_time_fixed_check
  CHECK (question_time = TIME '09:00');

ALTER TABLE public.groups
  DROP CONSTRAINT IF EXISTS groups_reveal_time_fixed_check;

ALTER TABLE public.groups
  ADD CONSTRAINT groups_reveal_time_fixed_check
  CHECK (reveal_time = TIME '20:00');

-- Keep API compatibility, but force inserted values to the fixed schedule.
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
  v_name text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non authentifie';
  END IF;

  v_name := btrim(p_name);

  IF v_name IS NULL OR char_length(v_name) = 0 THEN
    RAISE EXCEPTION 'Le nom du groupe est obligatoire';
  END IF;

  IF char_length(v_name) > 28 THEN
    RAISE EXCEPTION 'Le nom du groupe ne doit pas depasser 28 caracteres';
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
    v_name,
    auth.uid(),
    p_max_members,
    TIME '09:00',
    TIME '20:00',
    p_allowed_intensities
  )
  RETURNING * INTO v_group;

  PERFORM public.generate_future_slots(v_group.id);

  RETURN v_group;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_group(text, int, time, time, text[]) TO authenticated;
