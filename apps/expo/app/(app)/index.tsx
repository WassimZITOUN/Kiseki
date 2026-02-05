import { useRouter } from "expo-router";
import { HomeScreen, useAuth } from "@repo/app";

export default function Home() {
  const router = useRouter();
  const { profile } = useAuth();

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
