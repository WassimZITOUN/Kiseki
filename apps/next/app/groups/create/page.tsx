"use client";

import { useRouter } from "next/navigation";
import { CreateGroupScreen, useAuth } from "@repo/app";
import { useEffect } from "react";

export default function CreateGroupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user]);

  if (loading || !user) return null;

  return (
    <CreateGroupScreen
      onGroupCreated={(id) => router.replace(`/groups/${id}`)}
      onBack={() => router.back()}
    />
  );
}
