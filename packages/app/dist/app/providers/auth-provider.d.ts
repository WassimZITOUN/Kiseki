import React from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { Profile } from "@my-app/types";
type AuthContextType = {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{
        error: string | null;
    }>;
    signUp: (email: string, password: string, username: string, displayName: string) => Promise<{
        error: string | null;
    }>;
    signInWithGoogle: () => Promise<{
        error: string | null;
    }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
};
export declare function AuthProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useAuth(): AuthContextType;
export {};
