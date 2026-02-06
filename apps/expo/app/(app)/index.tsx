import { useEffect } from "react";
import { useRouter } from "expo-router";
import { HomeScreen, useAuth } from "@repo/app";

export default function Home() {
  const router = useRouter();
  const { profile } = useAuth();

  useEffect(() => {
    console.log("[Home] MOUNTED");
    return () => console.log("[Home] UNMOUNTED");
  }, []);

  console.log("[Home] RENDER");

  return (
    <HomeScreen
      profile={profile}
      onNavigateProfile={() => router.push("/(app)/profile")}
      onNavigateGroup={(id) => router.push(`/(app)/groups/${id}`)}
      onNavigateCreate={() => router.push("/(app)/groups/create")}
      onNavigateJoin={() => router.push("/(app)/groups/join")}
    />
  );
}
