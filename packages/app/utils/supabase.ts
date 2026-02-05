import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

/**
 * Adaptateur SecureStore pour persister la session Supabase sur mobile.
 * Importé dynamiquement pour ne pas crasher côté web.
 */
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const SecureStore = require("expo-secure-store");
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    const SecureStore = require("expo-secure-store");
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    const SecureStore = require("expo-secure-store");
    await SecureStore.deleteItemAsync(key);
  },
};

/**
 * Crée un client Supabase adapté à la plateforme :
 * - Mobile (iOS/Android) : session persistée dans expo-secure-store
 * - Web (client-side) : stockage par défaut (localStorage)
 */
export function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
  const isNative = Platform.OS !== "web";

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      ...(isNative
        ? {
            storage: ExpoSecureStoreAdapter,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          }
        : {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
          }),
    },
  });
}

/**
 * Singleton lazy : instance créée au premier accès, pas au moment de l'import.
 * Évite les erreurs "supabaseUrl is required" pendant le build SSG de Next.js.
 * Pour le SSR Next.js, utiliser @supabase/ssr dans apps/next à la place.
 */
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createSupabaseClient();
  }
  return _supabase;
}
