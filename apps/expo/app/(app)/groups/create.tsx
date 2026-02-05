import { useRouter } from "expo-router";
import { CreateGroupScreen } from "@repo/app";

export default function CreateGroup() {
  const router = useRouter();

  return (
    <CreateGroupScreen
      onGroupCreated={(id) => router.replace(`/(app)/groups/${id}`)}
      onBack={() => router.back()}
    />
  );
}
