import { useRouter } from "expo-router";
import { ProfileScreen } from "@repo/app/profile/profile-screen";

export default function Profile() {
  const router = useRouter();

  return (
    <ProfileScreen
      onNavigateEdit={() => router.push("/(app)/edit-profile")}
    />
  );
}
