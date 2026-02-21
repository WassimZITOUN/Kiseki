"use client";

import { useRouter } from "next/navigation";
import { SignupScreen, useAuth } from "@repo/app";
import { useEffect } from "react";
import { WebShell } from "../web-shell";

export default function SignupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user]);

  if (loading || user) return null;

  return (
    <WebShell variant="auth">
      <SignupScreen
        onNavigateLogin={() => router.push("/login")}
        onSignupSuccess={() => router.replace("/")}
      />
    </WebShell>
  );
}
