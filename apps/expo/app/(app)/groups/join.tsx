import { useRouter } from "expo-router";
import { JoinGroupScreen } from "@repo/app";

export default function JoinGroup() {
  const router = useRouter();

  return (
    <JoinGroupScreen
      onGroupJoined={(id) => router.replace(`/(app)/groups/${id}`)}
      onBack={() => router.back()}
    />
  );
}
