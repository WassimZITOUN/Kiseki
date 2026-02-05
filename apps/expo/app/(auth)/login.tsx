import { useRouter } from "expo-router";
import { LoginScreen } from "@repo/app";

export default function Login() {
  const router = useRouter();

  return (
    <LoginScreen
      onNavigateSignup={() => router.push("/(auth)/signup")}
    />
  );
}
