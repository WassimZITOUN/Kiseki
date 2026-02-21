import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fonction SQL pour voyager dans le temps (injectée dynamiquement)
 *
 * ATTENTION : Cette fonction modifie directement les timestamps dans la base de données
 * pour simuler le passage du temps. Elle ne doit JAMAIS être déployée en production.
 */
const TIME_TRAVEL_FUNCTION_SQL = `
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

  -- Désactiver temporairement RLS
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

  -- Avancer created_at dans daily_questions
  UPDATE public.daily_questions
  SET created_at = created_at + v_interval::interval,
      revealed_at = CASE
        WHEN revealed_at IS NOT NULL THEN revealed_at + v_interval::interval
        ELSE NULL
      END
  WHERE id IS NOT NULL;

  -- Avancer activated_at dans daily_slots
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

GRANT EXECUTE ON FUNCTION public.test_advance_time(int) TO authenticated, service_role;
`;

/**
 * Fonction pour nettoyer la fonction de time-travel
 */
const CLEANUP_TIME_TRAVEL_SQL = `
DROP FUNCTION IF EXISTS public.test_advance_time(int);
`;

/**
 * Injecte la fonction test_advance_time dans la base de données locale
 */
export async function setupTimeTravel(client: SupabaseClient): Promise<void> {
  const { error } = await client.rpc("exec_sql" as any, {
    sql: TIME_TRAVEL_FUNCTION_SQL,
  });

  // Si exec_sql n'existe pas, utiliser une requête SQL directe
  if (error && error.message.includes("exec_sql")) {
    const { error: directError } = await client
      .from("_test_setup" as any)
      .select("*")
      .limit(0);

    // Fallback : exécution directe via le client
    try {
      const response = await fetch(`${client.supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: client.supabaseKey,
          Authorization: `Bearer ${client.supabaseKey}`,
        },
        body: JSON.stringify({ sql: TIME_TRAVEL_FUNCTION_SQL }),
      });

      if (!response.ok) {
        // Dernier fallback : utiliser une transaction SQL directe
        console.warn("exec_sql RPC not available, injecting function via raw SQL...");
        // Note : Cela nécessite une connexion PostgreSQL directe
        // Pour les tests locaux, on peut supposer que la fonction est déjà injectée manuellement
      }
    } catch (fetchError) {
      console.error("Failed to inject time-travel function:", fetchError);
      throw new Error(
        "Could not inject time-travel function. Please run the SQL manually:\n" +
        TIME_TRAVEL_FUNCTION_SQL
      );
    }
  } else if (error) {
    throw new Error(`Failed to setup time-travel: ${error.message}`);
  }
}

/**
 * Nettoie la fonction test_advance_time de la base de données
 */
export async function cleanupTimeTravel(client: SupabaseClient): Promise<void> {
  // Supprimer la fonction via SQL
  const { error } = await client.rpc("exec_sql" as any, {
    sql: CLEANUP_TIME_TRAVEL_SQL,
  });

  if (error && !error.message.includes("exec_sql")) {
    console.warn(`Failed to cleanup time-travel function: ${error.message}`);
  }
}

/**
 * Avance le temps de N jours dans la base de données de test
 */
export async function advanceTime(client: SupabaseClient, days: number): Promise<void> {
  const { error } = await client.rpc("test_advance_time", { days });

  if (error) {
    throw new Error(`Failed to advance time: ${error.message}`);
  }

  console.log(`✅ Time advanced by ${days} day(s)`);
}

/**
 * Helper pour obtenir la date actuelle simulée (basée sur les slots)
 */
export async function getCurrentSimulatedDate(client: SupabaseClient): Promise<Date> {
  const { data, error } = await client
    .from("daily_slots")
    .select("target_date")
    .order("target_date", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    // Fallback : date actuelle réelle
    return new Date();
  }

  return new Date(data.target_date);
}
