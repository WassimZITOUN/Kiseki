-- ============================================================
-- Kiseki – Backfill pregame member slots after legacy cleanup
-- Migration 008
-- ============================================================

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
