import { useRouter } from "expo-router";
import { SignupScreen } from "@repo/app";

export default function Signup() {
  const router = useRouter();

  return (
    <SignupScreen
      onNavigateLogin={() => router.back()}
      onSignupSuccess={() => router.push("/(auth)/profile-setup")}
    />
  );
}
