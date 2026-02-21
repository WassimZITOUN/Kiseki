"use client";

import { useRouter, useParams } from "next/navigation";
import { GroupDetailScreen, useAuth } from "@repo/app";
import { useEffect } from "react";
import { WebShell } from "../../web-shell";

export default function GroupDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user]);

  if (loading || !user) return null;

  return (
    <WebShell variant="wide">
      <GroupDetailScreen
        groupId={id}
        onLeft={() => router.replace("/")}
        onBack={() => router.back()}
      />
    </WebShell>
  );
}
