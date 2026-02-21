import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
export const SHARE_CARD_FUNCTION_NAME = process.env.EXPO_PUBLIC_SHARE_CARD_FUNCTION ?? "share-card";
/**
 * Adaptateur SecureStore pour persister la session Supabase sur mobile.
 * Importé dynamiquement pour ne pas crasher côté web.
 */
const ExpoSecureStoreAdapter = {
    getItem: async (key) => {
        const SecureStore = require("expo-secure-store");
        return SecureStore.getItemAsync(key);
    },
    setItem: async (key, value) => {
        const SecureStore = require("expo-secure-store");
        await SecureStore.setItemAsync(key, value);
    },
    removeItem: async (key) => {
        const SecureStore = require("expo-secure-store");
        await SecureStore.deleteItemAsync(key);
    },
};
/**
 * Crée un client Supabase adapté à la plateforme :
 * - Mobile (iOS/Android) : session persistée dans expo-secure-store
 * - Web (client-side) : stockage par défaut (localStorage)
 */
export function createSupabaseClient() {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
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
let _supabase = null;
export function getSupabase() {
    if (!_supabase) {
        _supabase = createSupabaseClient();
    }
    return _supabase;
}
