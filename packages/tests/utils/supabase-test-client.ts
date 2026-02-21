import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Client Supabase avec clé SERVICE_ROLE pour les opérations d'administration
 * (setup, nettoyage, time-travel)
 */
export function getServiceRoleClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Client Supabase avec clé ANON pour simuler un utilisateur authentifié
 */
export function getAnonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Crée un utilisateur de test et retourne un client authentifié
 */
export async function createTestUser(
  email: string,
  password: string
): Promise<{ client: SupabaseClient; userId: string }> {
  const adminClient = getServiceRoleClient();

  // Supprimer l'utilisateur s'il existe déjà (cleanup des tests précédents)
  const { data: existingUsers } = await adminClient.auth.admin.listUsers();
  const existingUser = existingUsers?.users.find((u) => u.email === email);
  if (existingUser) {
    await adminClient.auth.admin.deleteUser(existingUser.id);
    // Attendre que la suppression soit propagée
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Créer l'utilisateur via Auth Admin API
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    throw new Error(`Failed to create test user: ${authError?.message}`);
  }

  // Le profil est créé automatiquement par le trigger on_auth_user_created
  // Attendons que le trigger se termine
  await new Promise(resolve => setTimeout(resolve, 300));

  // Utiliser UPSERT pour garantir que le profil existe
  const username = email.split("@")[0];
  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert({
      id: authData.user.id,
      username: username,
      display_name: username,
    }, {
      onConflict: 'id',
    });

  if (profileError) {
    throw new Error(`Failed to upsert profile: ${profileError.message}`);
  }

  // Créer un client authentifié pour cet utilisateur
  const userClient = getAnonClient();
  const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signInData.user) {
    throw new Error(`Failed to sign in test user: ${signInError?.message}`);
  }

  return {
    client: userClient,
    userId: authData.user.id,
  };
}

/**
 * Nettoie tous les utilisateurs de test (emails contenant "test-")
 */
export async function cleanupTestUsers(): Promise<void> {
  const adminClient = getServiceRoleClient();

  // Récupérer tous les utilisateurs de test
  const { data: users, error: listError } = await adminClient.auth.admin.listUsers();

  if (listError) {
    console.error("Failed to list users:", listError);
    return;
  }

  const testUsers = users.users.filter((u) => u.email?.includes("test-"));

  // Supprimer chaque utilisateur de test
  for (const user of testUsers) {
    await adminClient.auth.admin.deleteUser(user.id);
  }
}

/**
 * Nettoie toutes les données de test dans les tables principales
 */
export async function cleanupTestData(): Promise<void> {
  const adminClient = getServiceRoleClient();

  // Supprimer dans l'ordre inverse des dépendances
  await adminClient.from("votes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await adminClient.from("user_submissions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await adminClient.from("daily_questions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await adminClient.from("daily_slots").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await adminClient.from("group_members").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await adminClient.from("groups").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Nettoyer les utilisateurs de test
  await cleanupTestUsers();
}
