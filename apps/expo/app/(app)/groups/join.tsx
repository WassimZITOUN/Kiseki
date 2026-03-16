import { useRouter } from "expo-router";
import { JoinGroupScreen, usePushNotifications } from "@repo/app";

export default function JoinGroup() {
  const router = useRouter();
  const { registerForPushNotifications } = usePushNotifications();

  const handleGroupJoined = (id: string) => {
    router.replace(`/(app)/groups/${id}`);
    // L'utilisateur vient de rejoindre un groupe — il est activement engage.
    // C'est le moment ideal pour demander les notifs (high-intent moment).
    setTimeout(() => {
      registerForPushNotifications();
    }, 2000);
  };

  return (
    <JoinGroupScreen
      onGroupJoined={handleGroupJoined}
      onBack={() => router.back()}
    />
  );
}
