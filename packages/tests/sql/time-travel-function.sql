-- ============================================================
-- Kiseki Test Suite - Time-Travel Function
-- ============================================================
--
-- Cette fonction permet de simuler le passage du temps dans
-- les tests E2E en modifiant directement les timestamps.
--
-- ⚠️ ATTENTION : Cette fonction ne doit JAMAIS être déployée
-- en production. Elle est strictement réservée aux tests locaux.
--
-- Usage dans les tests :
--   SELECT public.test_advance_time(1);  -- Avancer de 1 jour
--   SELECT public.test_advance_time(7);  -- Avancer de 7 jours
--
-- Pour supprimer la fonction après les tests :
--   DROP FUNCTION IF EXISTS public.test_advance_time(int);
-- ============================================================

CREATE OR REPLACE FUNCTION public.test_advance_time(days int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_interval interval;
BEGIN
  -- Calculer l'intervalle
  v_interval := days || ' days';

  -- Désactiver temporairement RLS pour permettre les UPDATE sans WHERE
  ALTER TABLE public.daily_slots DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
  ALTER TABLE public.daily_questions DISABLE ROW LEVEL SECURITY;

  -- Avancer target_date dans daily_slots
  -- Pour éviter les collisions de unique constraint (group_id, target_date),
  -- on déplace d'abord vers le futur lointain, puis on ramène à la bonne date
  UPDATE public.daily_slots
  SET target_date = target_date + interval '10000 days'
  WHERE id IS NOT NULL;

  UPDATE public.daily_slots
  SET target_date = target_date - interval '10000 days' + v_interval::interval
  WHERE id IS NOT NULL;

  -- Avancer cycle_eligible_at dans group_members
  UPDATE public.group_members
  SET cycle_eligible_at = cycle_eligible_at + v_interval::interval
  WHERE id IS NOT NULL;

  -- Avancer created_at et revealed_at dans daily_questions
  UPDATE public.daily_questions
  SET created_at = created_at + v_interval::interval,
      revealed_at = CASE
        WHEN revealed_at IS NOT NULL THEN revealed_at + v_interval::interval
        ELSE NULL
      END
  WHERE id IS NOT NULL;

  -- Avancer activated_at et admin_replaced_at dans daily_slots
  UPDATE public.daily_slots
  SET activated_at = CASE
        WHEN activated_at IS NOT NULL THEN activated_at + v_interval::interval
        ELSE NULL
      END,
      admin_replaced_at = CASE
        WHEN admin_replaced_at IS NOT NULL THEN admin_replaced_at + v_interval::interval
        ELSE NULL
      END
  WHERE id IS NOT NULL;

  -- Réactiver RLS
  ALTER TABLE public.daily_slots ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.daily_questions ENABLE ROW LEVEL SECURITY;

  -- Log pour débogage
  RAISE NOTICE 'Advanced time by % days', days;
END;
$$;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.test_advance_time(int) TO authenticated, service_role;

-- ============================================================
-- Fonction de cleanup (à exécuter après les tests)
-- ============================================================

-- Décommenter pour supprimer la fonction :
-- DROP FUNCTION IF EXISTS public.test_advance_time(int);
