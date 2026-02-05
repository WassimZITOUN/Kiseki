"use client";

import { useRouter } from "next/navigation";
import { HomeScreen, useAuth } from "@repo/app";
import { ActivityIndicator, View } from "react-native";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!user) return null;

  return (
    <HomeScreen
      profile={profile}
      onNavigateProfile={() => router.push("/profile")}
      onNavigateGroup={(id) => router.push(`/groups/${id}`)}
      onNavigateCreate={() => router.push("/groups/create")}
      onNavigateJoin={() => router.push("/groups/join")}
    />
  );
}
