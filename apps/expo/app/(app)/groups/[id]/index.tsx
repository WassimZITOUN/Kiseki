import { useRouter, useLocalSearchParams } from "expo-router";
import { GroupDetailScreen } from "@repo/app";

export default function GroupDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <GroupDetailScreen
      groupId={id!}
      onLeft={() => router.replace("/(app)/")}
      onBack={() => router.back()}
    />
  );
}
