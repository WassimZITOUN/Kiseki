import { useRouter } from "expo-router";
import { ProfileSetupScreen } from "@repo/app/auth/profile-setup-screen";

export default function ProfileSetup() {
  const router = useRouter();

  return (
    <ProfileSetupScreen
      onComplete={() => router.replace("/(app)")}
    />
  );
}
