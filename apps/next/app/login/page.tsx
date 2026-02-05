"use client";

import { useRouter } from "next/navigation";
import { LoginScreen, useAuth } from "@repo/app";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user]);

  if (loading || user) return null;

  return <LoginScreen onNavigateSignup={() => router.push("/signup")} />;
}
