"use client";

import { useRouter } from "next/navigation";
import { EditProfileScreen, useAuth } from "@repo/app";
import { useEffect } from "react";
import { WebShell } from "../../web-shell";

export default function EditProfilePage() {
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
      <EditProfileScreen
        onComplete={() => router.push("/profile")}
        onCancel={() => router.back()}
      />
    </WebShell>
  );
}
