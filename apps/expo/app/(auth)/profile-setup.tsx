import { useRouter } from "expo-router";
import { ProfileSetupScreen } from "@repo/app/auth/profile-setup-screen";
import { usePushNotifications } from "@repo/app";

export default function ProfileSetup() {
  const router = useRouter();
  const { registerForPushNotifications } = usePushNotifications();

  const handleComplete = () => {
    router.replace("/(app)");
    // Demande la permission apres la creation de compte — moment de plus forte
    // intention. Le delai laisse l'animation de navigation se terminer d'abord.
    setTimeout(() => {
      registerForPushNotifications();
    }, 1500);
  };

  return <ProfileSetupScreen onComplete={handleComplete} />;
}
