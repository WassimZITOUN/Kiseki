"use client";

import { useRouter } from "next/navigation";
import { EditProfileScreen, useAuth } from "@repo/app";
import { useEffect } from "react";

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
    <EditProfileScreen
      onComplete={() => router.push("/profile")}
      onCancel={() => router.back()}
    />
  );
}
