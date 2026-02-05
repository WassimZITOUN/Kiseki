"use client";

import { useRouter } from "next/navigation";
import { JoinGroupScreen, useAuth } from "@repo/app";
import { useEffect } from "react";

export default function JoinGroupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user]);

  if (loading || !user) return null;

  return (
    <JoinGroupScreen
      onGroupJoined={(id) => router.replace(`/groups/${id}`)}
      onBack={() => router.back()}
    />
  );
}
