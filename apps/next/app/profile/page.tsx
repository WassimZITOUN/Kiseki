"use client";

import { useRouter } from "next/navigation";
import { ProfileScreen, useAuth } from "@repo/app";
import { useEffect } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user]);

  if (loading || !user) return null;

  return (
    <ProfileScreen onNavigateEdit={() => router.push("/profile/edit")} />
  );
}
