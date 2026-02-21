"use client";

import { useRouter } from "next/navigation";
import { CreateGroupScreen, useAuth } from "@repo/app";
import { useEffect } from "react";
import { WebShell } from "../../web-shell";

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
    <WebShell>
      <CreateGroupScreen
        onGroupCreated={(id) => router.replace(`/groups/${id}`)}
        onBack={() => router.back()}
      />
    </WebShell>
  );
}
