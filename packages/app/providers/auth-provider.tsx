"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import type { Session, User } from "@supabase/supabase-js";
import type { Profile } from "@my-app/types";
import { getSupabase } from "../utils/supabase";

// Google Sign-In is only available on native platforms
let GoogleSignin: any = null;
if (Platform.OS !== "web") {
  try {
    GoogleSignin =
      require("@react-native-google-signin/google-signin").GoogleSignin;
  } catch {}
}

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    username: string,
    displayName: string
  ) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = getSupabase();

  // Configure Google Sign-In on native platforms
  useEffect(() => {
    if (GoogleSignin) {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      });
    }
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data as Profile | null);
  };

  useEffect(() => {
    // Recuperer la session existante
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      }
      setLoading(false);
    });

    // Ecouter les changements d'auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error?.message ?? null };
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    displayName: string
  ) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    // Mettre a jour le profil cree par le trigger handle_new_user()
    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ username, display_name: displayName })
        .eq("id", data.user.id);
      if (profileError) return { error: profileError.message };
    }

    return { error: null };
  };

  const signInWithGoogle = async () => {
    // Web: use Supabase OAuth redirect flow
    if (Platform.OS === "web") {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          },
        });
        return { error: error?.message ?? null };
      } catch (err: any) {
        return { error: err?.message ?? "Erreur Google Sign-In" };
      }
    }

    // Native: use Google Sign-In SDK
    if (!GoogleSignin) {
      return { error: "Google Sign-In n'est pas disponible sur cette plateforme" };
    }
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response?.data?.idToken;
      if (!idToken) {
        return { error: "Impossible de recuperer le token Google" };
      }
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });
      return { error: error?.message ?? null };
    } catch (err: any) {
      // User cancelled the sign-in flow
      if (err?.code === "SIGN_IN_CANCELLED") {
        return { error: null };
      }
      return { error: err?.message ?? "Erreur Google Sign-In" };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
