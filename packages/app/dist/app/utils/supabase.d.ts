import { type SupabaseClient } from "@supabase/supabase-js";
export declare const SHARE_CARD_FUNCTION_NAME: any;
/**
 * Crée un client Supabase adapté à la plateforme :
 * - Mobile (iOS/Android) : session persistée dans expo-secure-store
 * - Web (client-side) : stockage par défaut (localStorage)
 */
export declare function createSupabaseClient(): SupabaseClient;
export declare function getSupabase(): SupabaseClient;
