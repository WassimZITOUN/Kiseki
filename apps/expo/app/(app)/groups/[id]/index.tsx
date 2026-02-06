import { useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { GroupDetailScreen } from "@repo/app";

export default function GroupDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    console.log("[GroupDetail] MOUNTED, id:", id);
    return () => console.log("[GroupDetail] UNMOUNTED");
  }, [id]);

  console.log("[GroupDetail] RENDER, id:", id);

  return (
    <GroupDetailScreen
      groupId={id!}
      onLeft={() => router.replace("/(app)/")}
      onBack={() => router.back()}
    />
  );
}
